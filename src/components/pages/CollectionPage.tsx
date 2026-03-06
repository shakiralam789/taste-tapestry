"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useRouter } from "nextjs-toploader/app";
import {
    useInfiniteQuery,
    useQuery,
    useMutation,
    useQueryClient,
    keepPreviousData,
} from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FullScreenLoader } from "@/components/ui/full-screen-loader";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
    getFavoritesPage,
    deleteFavorite,
    updateFavorite,
} from "@/features/favorites/api";
import { getPublicFavoritesPage, getPublicProfile } from "@/features/users/api";
import { getAlbums, updateAlbum } from "@/features/albums/api";
import { CATEGORY_TABS } from "@/features/albums/constants";
import { useAuth } from "@/features/auth/AuthContext";
import { ProfilePostCard } from "@/components/profile/ProfilePostCard";
import { AddToAlbumDropdown } from "@/components/albums/AddToAlbumDropdown";
import { toast } from "sonner";
import type { Favorite } from "@/types/wishbook";
import {
    ArrowLeft,
    Loader2,
    MoreHorizontal,
    Search,
    Lock,
    Globe,
    Trash2,
    Images,
    Plus,
    PenIcon,
    ArrowUpDown,
    Check,
} from "lucide-react";
import { ClientOnly } from "@/components/common/ClientOnly";

const SEARCH_DEBOUNCE_MS = 300;

// ── Sort options ───────────────────────────────────────────────────────────────
type SortKey = 'newest' | 'oldest' | 'rating_desc' | 'rating_asc';

const SORT_OPTIONS: { value: SortKey; label: string }[] = [
    { value: 'newest', label: 'Newest first' },
    { value: 'oldest', label: 'Oldest first' },
    { value: 'rating_desc', label: 'Rating: High → Low' },
    { value: 'rating_asc', label: 'Rating: Low → High' },
];

// ── Props ─────────────────────────────────────────────────────────────────────
// No props  → own profile mode (owner actions enabled)
// userId    → viewing another user's public collection (read-only)
type CollectionPageProps = { userId?: string };

function CollectionPageInner({ userId }: CollectionPageProps) {
    const isOwnProfile = !userId;

    const queryClient = useQueryClient();
    const searchParams = useSearchParams();
    const { user: authUser } = useAuth();
    const router = useRouter();

    const [activeTab, setActiveTab] =
        useState<(typeof CATEGORY_TABS)[number]["value"]>("all");
    const [searchInput, setSearchInput] = useState("");
    const [debouncedSearch, setDebouncedSearch] = useState("");
    const [sortKey, setSortKey] = useState<SortKey>("newest");
    const [favoriteToDelete, setFavoriteToDelete] = useState<Favorite | null>(
        null,
    );
    const [albumPickerOpen, setAlbumPickerOpen] = useState(false);
    const [albumPickerFavorite, setAlbumPickerFavorite] =
        useState<Favorite | null>(null);
    const loadMoreRef = useRef<HTMLDivElement>(null);

    // ── Sync tab from URL ──────────────────────────────────────────────────────
    const categoryFromUrl = searchParams?.get("category") ?? null;
    useEffect(() => {
        if (
            categoryFromUrl &&
            CATEGORY_TABS.some((t) => t.value === categoryFromUrl)
        ) {
            setActiveTab(categoryFromUrl as (typeof CATEGORY_TABS)[number]["value"]);
        }
    }, [categoryFromUrl]);

    // ── Search debounce ────────────────────────────────────────────────────────
    useEffect(() => {
        const t = setTimeout(() => {
            setDebouncedSearch(searchInput.trim());
        }, SEARCH_DEBOUNCE_MS);
        return () => clearTimeout(t);
    }, [searchInput]);

    const categoryParam = activeTab === "all" ? undefined : activeTab;

    // ── Other user's public profile (for display name) ─────────────────────────
    const { data: publicProfile } = useQuery({
        queryKey: ["user-profile", userId],
        queryFn: () => getPublicProfile(userId!),
        enabled: !isOwnProfile && !!userId,
    });

    const displayName =
        publicProfile?.displayName?.trim() ||
        publicProfile?.username?.trim() ||
        "User";

    // ── Own infinite query ─────────────────────────────────────────────────────
    const ownQuery = useInfiniteQuery({
        queryKey: ['favorites-page', activeTab, debouncedSearch, sortKey],
        queryFn: ({ pageParam }) =>
            getFavoritesPage(
                pageParam as number,
                categoryParam,
                debouncedSearch || undefined,
                sortKey,
            ),
        getNextPageParam: (lastPage) =>
            lastPage.hasMore ? lastPage.nextOffset : undefined,
        initialPageParam: 0,
        enabled: isOwnProfile,
        placeholderData: keepPreviousData,
    });

    // ── Other user's infinite query ────────────────────────────────────────────
    const userQuery = useInfiniteQuery({
        queryKey: ['user-favorites-page', userId, activeTab, debouncedSearch, sortKey],
        queryFn: ({ pageParam }) =>
            getPublicFavoritesPage(
                userId!,
                pageParam as number,
                categoryParam,
                debouncedSearch || undefined,
                sortKey,
            ),
        getNextPageParam: (lastPage) =>
            lastPage.hasMore ? lastPage.nextOffset : undefined,
        initialPageParam: 0,
        enabled: !isOwnProfile && !!userId,
        placeholderData: keepPreviousData,
    });

    const activeQuery = isOwnProfile ? ownQuery : userQuery;
    const { isLoading, fetchNextPage, hasNextPage, isFetchingNextPage } =
        activeQuery;
    const allItems = activeQuery.data?.pages.flatMap((p) => p.items) ?? [];

    // ── Intersection observer for infinite scroll ──────────────────────────────
    useEffect(() => {
        const el = loadMoreRef.current;
        if (!el || !hasNextPage || isFetchingNextPage) return;
        const observer = new IntersectionObserver(
            (entries) => {
                if (entries[0]?.isIntersecting) void fetchNextPage();
            },
            { rootMargin: "200px", threshold: 0.1 },
        );
        observer.observe(el);
        return () => observer.disconnect();
    }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

    // ── Albums (own profile only) ──────────────────────────────────────────────
    const { data: albums = [] } = useQuery({
        queryKey: ["albums"],
        queryFn: getAlbums,
        enabled: isOwnProfile,
    });

    // ── Mutations (own profile only) ───────────────────────────────────────────
    const addToAlbumMutation = useMutation({
        mutationFn: async (args: { albumId: string; favoriteId: string }) => {
            const album = albums.find((a) => a.id === args.albumId);
            if (!album) throw new Error("Album not found");
            const nextIds = [...(album.favoriteIds ?? []), args.favoriteId];
            return updateAlbum(args.albumId, { favoriteIds: nextIds });
        },
        onSuccess: () => {
            void queryClient.invalidateQueries({ queryKey: ["albums"] });
            void queryClient.invalidateQueries({ queryKey: ["favorites-page"] });
            toast.success("Added to album");
        },
        onError: () => toast.error("Could not add to album"),
    });

    const deleteFavoriteMutation = useMutation({
        mutationFn: deleteFavorite,
        onSuccess: () => {
            void queryClient.invalidateQueries({ queryKey: ["favorites"] });
            void queryClient.invalidateQueries({ queryKey: ["favorites-page"] });
            void queryClient.invalidateQueries({ queryKey: ["albums"] });
            toast.success("Item deleted");
            setFavoriteToDelete(null);
        },
        onError: () => toast.error("Could not delete item"),
    });

    const toggleVisibilityMutation = useMutation({
        mutationFn: ({ id, isPublic }: { id: string; isPublic: boolean }) =>
            updateFavorite(id, { isPublic }),
        onSuccess: (_, { isPublic }) => {
            void queryClient.invalidateQueries({ queryKey: ["favorites"] });
            void queryClient.invalidateQueries({ queryKey: ["favorites-page"] });
            toast.success(isPublic ? "Item is now public" : "Item is now private");
        },
        onError: () => toast.error("Could not update visibility"),
    });

    // ── Tab change ─────────────────────────────────────────────────────────────
    const handleTabChange = useCallback((value: string) => {
        setActiveTab(value as (typeof CATEGORY_TABS)[number]["value"]);
        const url = new URL(window.location.href);
        if (value === "all") url.searchParams.delete("category");
        else url.searchParams.set("category", value);
        window.history.replaceState({}, "", url.pathname + url.search);
    }, []);

    // ── Empty-state wording ────────────────────────────────────────────────────
    const emptyText = (search: string) => {
        if (search) return "No items match your search.";
        if (activeTab === "all")
            return isOwnProfile
                ? "No items in your collection yet."
                : "No items in their collection yet.";
        const label =
            CATEGORY_TABS.find((c) => c.value === activeTab)?.label ?? activeTab;
        return isOwnProfile
            ? `No ${label} in your collection.`
            : `No ${label} in their collection.`;
    };

    if (isLoading && allItems.length === 0) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <FullScreenLoader />
            </div>
        );
    }

    return (
        <>
            <div className="min-h-screen py-8 sm:px-4">
                <div className="container mx-auto px-4">
                    {/* Header ──────────────────────────────────────────────────────── */}
                    <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
                        <div className="flex flex-wrap items-center gap-4">
                            {/* Back button */}
                            <Link href={isOwnProfile ? "/profile" : `/users/${userId}`}>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="rounded-full border border-border/60 shadow-sm"
                                    aria-label="Back to profile"
                                >
                                    <ArrowLeft className="w-4 h-4" />
                                </Button>
                            </Link>

                            {/* Title */}
                            <div className="flex-1 min-w-0">
                                <h1 className="font-display text-2xl md:text-3xl font-bold">
                                    {isOwnProfile ? "Collection" : `${displayName}'s Collection`}
                                </h1>
                                <p className="text-muted-foreground text-sm mt-0.5">
                                    {isOwnProfile
                                        ? "All your favorites with filters and search"
                                        : "All their favorites with filters and search"}
                                </p>
                            </div>
                        </div>

                        {/* Right-side actions */}
                        <div className="flex flex-wrap items-center gap-2">
                            {isOwnProfile && (
                                <Link href="/add-favorite">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        className="rounded-full gap-2 border-dashed"
                                    >
                                        <Plus className="w-4 h-4" />
                                        Add new
                                    </Button>
                                </Link>
                            )}
                            <Link href={isOwnProfile ? "/albums" : `/users/${userId}/albums`}>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    className="rounded-full gap-2"
                                >
                                    <Images className="w-4 h-4" />
                                    View albums
                                </Button>
                            </Link>
                        </div>
                    </div>

                    {/* Search + Sort ─────────────────────────────────────────────── */}
                    <div className="flex items-center gap-2 mb-4">
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                            <Input
                                type="search"
                                placeholder="Search by title..."
                                value={searchInput}
                                onChange={(e) => setSearchInput(e.target.value)}
                                className="pl-9 rounded-full bg-muted/50 border-white/10"
                                aria-label="Search collection"
                            />
                        </div>

                        {/* Sort dropdown */}
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    className="h-10 rounded-full gap-1.5 shrink-0 border-white/10 bg-muted/50 text-xs"
                                    aria-label="Sort"
                                >
                                    <ArrowUpDown className="w-3.5 h-3.5" />
                                    <span className="hidden sm:inline">
                                        {SORT_OPTIONS.find((o) => o.value === sortKey)?.label ?? "Sort"}
                                    </span>
                                    <span className="sm:hidden">Sort</span>
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-48 text-sm">
                                {SORT_OPTIONS.map((opt) => (
                                    <DropdownMenuItem
                                        key={opt.value}
                                        className="flex items-center justify-between gap-2 cursor-pointer"
                                        onSelect={() => setSortKey(opt.value)}
                                    >
                                        {opt.label}
                                        {sortKey === opt.value && (
                                            <Check className="w-3.5 h-3.5 text-primary" />
                                        )}
                                    </DropdownMenuItem>
                                ))}
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>

                    {/* Tabs ────────────────────────────────────────────────────────── */}
                    <Tabs
                        value={activeTab}
                        onValueChange={handleTabChange}
                        className="w-full"
                    >
                        <TabsList className="bg-background/80 backdrop-blur-sm sticky top-16 z-10 w-full justify-start flex-wrap border-b border-white/10 p-0 h-auto rounded-none gap-0">
                            {CATEGORY_TABS.map((tab) => {
                                const Icon = "icon" in tab ? tab.icon : undefined;
                                return (
                                    <TabsTrigger
                                        key={tab.value}
                                        value={tab.value}
                                        className="rounded-none border-b-2 border-transparent px-0 py-4 mr-3 sm:mr-6 data-[state=active]:bg-transparent data-[state=active]:border-primary data-[state=active]:text-primary data-[state=active]:shadow-none hover:text-primary transition-colors text-sm gap-1.5"
                                    >
                                        <span className="px-3 sm:px-0">
                                            {Icon ? <Icon className="w-4 h-4" /> : null}
                                        </span>
                                        <span className="hidden sm:block">{tab.label}</span>
                                    </TabsTrigger>
                                );
                            })}
                        </TabsList>

                        <TabsContent value={activeTab} className="mt-6">
                            {allItems.length === 0 ? (
                                <div className="rounded-2xl border border-dashed border-white/10 bg-card/20 p-12 text-center text-muted-foreground text-sm">
                                    {emptyText(debouncedSearch)}
                                </div>
                            ) : (
                                <>
                                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                                        {allItems.map((favorite) => (
                                            <div key={favorite.id} className="relative group">
                                                <ProfilePostCard
                                                    favorite={favorite}
                                                    variant="grid"
                                                    onTitleClick={() =>
                                                        router.push(`/favorites/${favorite.id}`)
                                                    }
                                                />

                                                {/* Owner actions — only shown on own profile */}
                                                {isOwnProfile && authUser && (
                                                    <div className="absolute top-2 right-2">
                                                        <DropdownMenu>
                                                            <DropdownMenuTrigger asChild>
                                                                <button
                                                                    type="button"
                                                                    className="inline-flex items-center justify-center size-8 rounded-full bg-background/95 border border-white/20 shadow-sm text-muted-foreground hover:text-foreground hover:bg-muted/80 backdrop-blur-sm"
                                                                    onClick={(e) => {
                                                                        e.preventDefault();
                                                                        e.stopPropagation();
                                                                    }}
                                                                    aria-label="Item actions"
                                                                >
                                                                    <MoreHorizontal className="w-4 h-4" />
                                                                </button>
                                                            </DropdownMenuTrigger>
                                                            <DropdownMenuContent
                                                                align="end"
                                                                className="w-40 text-sm"
                                                                onClick={(e) => e.stopPropagation()}
                                                            >
                                                                <DropdownMenuItem
                                                                    className="flex items-center gap-2 cursor-pointer"
                                                                    onSelect={(e) => {
                                                                        e.preventDefault();
                                                                        setAlbumPickerFavorite(favorite);
                                                                        setAlbumPickerOpen(true);
                                                                    }}
                                                                >
                                                                    <Images className="w-4 h-4" />
                                                                    Add to album
                                                                </DropdownMenuItem>
                                                                <DropdownMenuItem
                                                                    className="flex items-center gap-2 cursor-pointer"
                                                                    onSelect={(e) => {
                                                                        e.preventDefault();
                                                                        router.push(
                                                                            `/favorites/${favorite.id}/edit`,
                                                                        );
                                                                    }}
                                                                >
                                                                    <PenIcon className="w-4 h-4" />
                                                                    Edit
                                                                </DropdownMenuItem>
                                                                <DropdownMenuItem
                                                                    className="flex items-center gap-2 cursor-pointer"
                                                                    onSelect={(e) => {
                                                                        e.preventDefault();
                                                                        if (toggleVisibilityMutation.isPending)
                                                                            return;
                                                                        toggleVisibilityMutation.mutate({
                                                                            id: favorite.id,
                                                                            isPublic: !(favorite.isPublic ?? true),
                                                                        });
                                                                    }}
                                                                >
                                                                    {(favorite.isPublic ?? true) ? (
                                                                        <>
                                                                            <Lock className="w-4 h-4" />
                                                                            Make private
                                                                        </>
                                                                    ) : (
                                                                        <>
                                                                            <Globe className="w-4 h-4" />
                                                                            Make public
                                                                        </>
                                                                    )}
                                                                </DropdownMenuItem>
                                                                <DropdownMenuItem
                                                                    className="flex items-center gap-2 cursor-pointer text-destructive focus:text-destructive focus:bg-destructive/10"
                                                                    onSelect={(e) => {
                                                                        e.preventDefault();
                                                                        if (deleteFavoriteMutation.isPending)
                                                                            return;
                                                                        setFavoriteToDelete(favorite);
                                                                    }}
                                                                >
                                                                    <Trash2 className="w-4 h-4" />
                                                                    Delete
                                                                </DropdownMenuItem>
                                                            </DropdownMenuContent>
                                                        </DropdownMenu>
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                    <div
                                        ref={loadMoreRef}
                                        className="min-h-12 flex items-center justify-center py-6"
                                    >
                                        {isFetchingNextPage && (
                                            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                                        )}
                                    </div>
                                </>
                            )}
                        </TabsContent>
                    </Tabs>
                </div>
            </div>

            {/* Add-to-album dialog (own profile only) ──────────────────────────── */}
            {isOwnProfile && (
                <>
                    <Dialog
                        open={albumPickerOpen}
                        onOpenChange={(open) => {
                            setAlbumPickerOpen(open);
                            if (!open) setAlbumPickerFavorite(null);
                        }}
                    >
                        <DialogContent className="sm:max-w-md overflow-visible">
                            <DialogHeader>
                                <DialogTitle className="text-base">Add to album</DialogTitle>
                            </DialogHeader>
                            {albums.length === 0 ? (
                                <div className="space-y-3 text-sm text-muted-foreground">
                                    <p>You don&apos;t have any albums yet.</p>
                                    <Link href="/albums">
                                        <Button size="sm" className="rounded-full">
                                            <Plus className="w-4 h-4 mr-1" />
                                            Go to Albums
                                        </Button>
                                    </Link>
                                </div>
                            ) : !albumPickerFavorite ? (
                                <p className="text-sm text-muted-foreground">
                                    Select a favorite to add to an album.
                                </p>
                            ) : (
                                <div className="space-y-3">
                                    <p className="text-xs text-muted-foreground">
                                        Choose an album for{" "}
                                        <span className="font-medium">
                                            {albumPickerFavorite.title}
                                        </span>
                                    </p>
                                    <AddToAlbumDropdown
                                        albums={albums}
                                        favoriteId={albumPickerFavorite.id}
                                        onSelect={(albumId) => {
                                            addToAlbumMutation.mutate({
                                                albumId,
                                                favoriteId: albumPickerFavorite.id,
                                            });
                                            setAlbumPickerOpen(false);
                                            setAlbumPickerFavorite(null);
                                        }}
                                        disabled={addToAlbumMutation.isPending}
                                        loading={false}
                                        placeholder="Search albums..."
                                    />
                                </div>
                            )}
                        </DialogContent>
                    </Dialog>

                    <AlertDialog
                        open={!!favoriteToDelete}
                        onOpenChange={(open) => {
                            if (!open) setFavoriteToDelete(null);
                        }}
                    >
                        <AlertDialogContent>
                            <AlertDialogHeader>
                                <AlertDialogTitle>Delete this item?</AlertDialogTitle>
                                <AlertDialogDescription>
                                    This will remove it from your collection and from any albums.
                                    This action cannot be undone.
                                </AlertDialogDescription>
                            </AlertDialogHeader>
                            {favoriteToDelete && (
                                <div className="flex items-center gap-3 rounded-xl border border-white/10 bg-card/40 p-3 mt-2">
                                    <div className="w-12 h-16 rounded-lg overflow-hidden bg-muted flex-shrink-0">
                                        {favoriteToDelete.image ? (
                                            <img
                                                src={favoriteToDelete.image}
                                                alt={favoriteToDelete.title}
                                                className="w-full h-full object-cover"
                                            />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center text-[10px] text-muted-foreground px-1 text-center">
                                                {favoriteToDelete.title}
                                            </div>
                                        )}
                                    </div>
                                    <div className="min-w-0">
                                        <p className="text-sm font-medium truncate">
                                            {favoriteToDelete.title}
                                        </p>
                                    </div>
                                </div>
                            )}
                            <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction
                                    onClick={() =>
                                        favoriteToDelete &&
                                        deleteFavoriteMutation.mutate(favoriteToDelete.id)
                                    }
                                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                >
                                    Delete
                                </AlertDialogAction>
                            </AlertDialogFooter>
                        </AlertDialogContent>
                    </AlertDialog>
                </>
            )}
        </>
    );
}

// ── Default export ─────────────────────────────────────────────────────────────
export default function CollectionPage(props: CollectionPageProps) {
    return (
        <ClientOnly>
            <CollectionPageInner {...props} />
        </ClientOnly>
    );
}
