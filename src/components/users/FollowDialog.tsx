"use client";

import { useState, useEffect, useRef } from "react";
import { useInfiniteQuery } from "@tanstack/react-query";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { getFollowers, getFollowing, UserSearchHit } from "@/features/users/api";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import Link from "next/link";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { useInView } from "react-intersection-observer";

interface FollowDialogProps {
    userId: string;
    isOpen: boolean;
    onClose: () => void;
    initialTab?: "followers" | "following";
}

export function FollowDialog({
    userId,
    isOpen,
    onClose,
    initialTab = "followers",
}: FollowDialogProps) {
    const [activeTab, setActiveTab] = useState<"followers" | "following">(initialTab);

    // Reset active tab to initialTab when dialog opens
    useEffect(() => {
        if (isOpen) {
            setActiveTab(initialTab);
        }
    }, [isOpen, initialTab]);

    const {
        data: followersData,
        fetchNextPage: fetchNextFollowers,
        hasNextPage: hasMoreFollowers,
        isFetchingNextPage: isFetchingFollowersNext,
        isLoading: isLoadingFollowers,
    } = useInfiniteQuery({
        queryKey: ["user-followers", userId],
        queryFn: ({ pageParam = 0 }) => getFollowers(userId, pageParam),
        initialPageParam: 0,
        getNextPageParam: (lastPage) => (lastPage.hasMore ? lastPage.nextOffset : undefined),
        enabled: isOpen && activeTab === "followers",
    });

    const {
        data: followingData,
        fetchNextPage: fetchNextFollowing,
        hasNextPage: hasMoreFollowing,
        isFetchingNextPage: isFetchingFollowingNext,
        isLoading: isLoadingFollowing,
    } = useInfiniteQuery({
        queryKey: ["user-following", userId],
        queryFn: ({ pageParam = 0 }) => getFollowing(userId, pageParam),
        initialPageParam: 0,
        getNextPageParam: (lastPage) => (lastPage.hasMore ? lastPage.nextOffset : undefined),
        enabled: isOpen && activeTab === "following",
    });

    const allFollowers = followersData?.pages.flatMap((page) => page.items) ?? [];
    const allFollowing = followingData?.pages.flatMap((page) => page.items) ?? [];

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="gap-0 sm:max-w-[425px] p-0 sm:p-0 overflow-hidden bg-card/95 backdrop-blur-xl border-white/10">
                <DialogHeader className="p-6 pb-2">
                    <DialogTitle className="text-xl font-bold tracking-tight">Social Network</DialogTitle>
                </DialogHeader>

                <Tabs
                    value={activeTab}
                    onValueChange={(val) => setActiveTab(val as "followers" | "following")}
                    className="w-full"
                >
                    <TabsList className="w-full justify-start rounded-none border-b border-white/5 bg-transparent px-6 h-12">
                        <TabsTrigger
                            value="followers"
                            className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-4 font-semibold"
                        >
                            Followers
                        </TabsTrigger>
                        <TabsTrigger
                            value="following"
                            className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-4 font-semibold"
                        >
                            Following
                        </TabsTrigger>
                    </TabsList>

                    <TabsContent value="followers" className="mt-0">
                        <UserList
                            users={allFollowers}
                            isLoading={isLoadingFollowers}
                            isFetchingNext={isFetchingFollowersNext}
                            hasNext={hasMoreFollowers}
                            fetchNext={fetchNextFollowers}
                            onClose={onClose}
                        />
                    </TabsContent>

                    <TabsContent value="following" className="mt-0">
                        <UserList
                            users={allFollowing}
                            isLoading={isLoadingFollowing}
                            isFetchingNext={isFetchingFollowingNext}
                            hasNext={hasMoreFollowing}
                            fetchNext={fetchNextFollowing}
                            onClose={onClose}
                        />
                    </TabsContent>
                </Tabs>
            </DialogContent>
        </Dialog>
    );
}

function UserList({
    users,
    isLoading,
    isFetchingNext,
    hasNext,
    fetchNext,
    onClose
}: {
    users: UserSearchHit[],
    isLoading: boolean,
    isFetchingNext: boolean,
    hasNext: boolean,
    fetchNext: () => void,
    onClose: () => void
}) {
    const { ref, inView } = useInView();

    useEffect(() => {
        if (inView && hasNext && !isFetchingNext) {
            fetchNext();
        }
    }, [inView, hasNext, isFetchingNext, fetchNext]);

    if (isLoading) {
        return (
            <div className="p-4 space-y-4">
                {[1, 2, 3, 4, 5].map((i) => (
                    <div key={i} className="flex items-center gap-3">
                        <Skeleton className="h-10 w-10 rounded-full" />
                        <div className="space-y-2">
                            <Skeleton className="h-4 w-32" />
                            <Skeleton className="h-3 w-20" />
                        </div>
                    </div>
                ))}
            </div>
        );
    }

    if (users.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
                <p className="text-sm text-muted-foreground">No users found.</p>
            </div>
        );
    }

    return (
        <ScrollArea className="h-[400px]">
            <div className="p-2">
                {users.map((user) => (
                    <Link
                        key={user.id}
                        href={`/users/${user.id}`}
                        onClick={onClose}
                        className="flex items-center gap-3 p-3 rounded-xl hover:bg-white/5 transition-colors group"
                    >
                        <Avatar className="h-10 w-10 ring-1 ring-white/10 group-hover:ring-primary/50 transition-all">
                            <AvatarImage src={user.avatar ?? undefined} alt={user.displayName} />
                            <AvatarFallback className="bg-background text-xs">
                                {user.displayName?.[0] || user.username?.[0] || "?"}
                            </AvatarFallback>
                        </Avatar>
                        <div className="flex flex-col min-w-0">
                            <span className="text-sm font-semibold truncate group-hover:text-primary transition-colors">
                                {user.displayName}
                            </span>
                            <span className="text-xs text-muted-foreground truncate">
                                @{user.username}
                            </span>
                        </div>
                    </Link>
                ))}

                {/* Intersection Observer target */}
                <div ref={ref} className="h-4 w-full" />

                {isFetchingNext && (
                    <div className="p-4 flex justify-center">
                        <Skeleton className="h-8 w-8 rounded-full animate-pulse" />
                    </div>
                )}
            </div>
        </ScrollArea>
    );
}
