"use client";

import React from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getCommentsByCapsule, createComment, addCommentReaction, removeCommentReaction, updateComment, deleteComment } from "@/features/comments/api";
import { getCapsule } from "@/features/capsules/api";
import { Comment } from "@/types/comments";
import { CommentInput } from "./CommentInput";
import { CommentItem } from "./CommentItem";
import { MessageSquare, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/features/auth/AuthContext";
import { useNotifications } from "@/features/notifications/NotificationsContext";

interface CommentSectionProps {
    capsuleId: string;
    isInline?: boolean;
    onCommentCountChange?: (delta: number) => void;
}

export function CommentSection({ capsuleId, isInline = false, onCommentCountChange }: CommentSectionProps) {
    const queryClient = useQueryClient();
    const { user } = useAuth();
    const { joinCapsule, leaveCapsule } = useNotifications();

    // Fetch capsule to get ownerId
    const { data: capsule } = useQuery({
        queryKey: ["capsule", capsuleId],
        queryFn: () => getCapsule(capsuleId),
        enabled: !!capsuleId,
    });

    const [showAll, setShowAll] = React.useState(false);

    React.useEffect(() => {
        joinCapsule(capsuleId);
        return () => leaveCapsule(capsuleId);
    }, [capsuleId, joinCapsule, leaveCapsule]);

    const { data: comments = [], isLoading } = useQuery({
        queryKey: ["comments", capsuleId],
        queryFn: () => getCommentsByCapsule(capsuleId),
    });

    const recursiveUpdate = (nodes: any[], id: string, updater: (node: any) => any | null): any[] => {
        return nodes.map(node => {
            if (node.id === id) {
                return updater(node);
            }
            if (node.replies && node.replies.length > 0) {
                return { ...node, replies: recursiveUpdate(node.replies, id, updater).filter(Boolean) };
            }
            return node;
        }).filter(Boolean);
    };

    const createMutation = useMutation({
        mutationFn: createComment,
        onMutate: async (newCommentInput) => {
            await queryClient.cancelQueries({ queryKey: ["comments", capsuleId] });
            const previousComments = queryClient.getQueryData<Comment[]>(["comments", capsuleId]);

            if (!newCommentInput.parentId) {
                onCommentCountChange?.(1);
            }

            const tempComment: any = {
                id: `temp-${Date.now()}`,
                content: newCommentInput.content,
                userId: user?.id || "",
                user: user as any,
                capsuleId,
                parentId: newCommentInput.parentId || null,
                reactions: [],
                replies: [],
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
            };

            if (newCommentInput.parentId) {
                queryClient.setQueryData<Comment[]>(["comments", capsuleId], (old) => {
                    if (!old) return [tempComment];
                    return old.map(c => {
                        if (c.id === newCommentInput.parentId) {
                            return { ...c, replies: [...(c.replies || []), tempComment] };
                        }
                        return c;
                    });
                });
            } else {
                queryClient.setQueryData<Comment[]>(["comments", capsuleId], (old) => [tempComment, ...(old || [])]);
            }

            return { previousComments };
        },
        onError: (_err, newComment, context) => {
            queryClient.setQueryData(["comments", capsuleId], context?.previousComments);
            if (!newComment.parentId) {
                onCommentCountChange?.(-1);
            }
            toast.error("Could not post comment");
        },
        onSuccess: () => {
            toast.success("Comment posted!");
        },
        onSettled: () => {
            void queryClient.invalidateQueries({ queryKey: ["comments", capsuleId] });
            void queryClient.invalidateQueries({ queryKey: ["capsules"] });
            void queryClient.invalidateQueries({ queryKey: ["capsule", capsuleId] });
            void queryClient.invalidateQueries({ queryKey: ["feed", "timeline"] });
        },
    });

    const reactMutation = useMutation({
        mutationFn: ({ id, type, isRemove }: { id: string, type: string, isRemove: boolean }) =>
            isRemove ? removeCommentReaction(id, type) : addCommentReaction(id, type),
        onMutate: async ({ id, type, isRemove }) => {
            await queryClient.cancelQueries({ queryKey: ["comments", capsuleId] });
            const previousComments = queryClient.getQueryData<Comment[]>(["comments", capsuleId]);

            queryClient.setQueryData<Comment[]>(["comments", capsuleId], (old) => {
                if (!old) return [];
                return recursiveUpdate(old, id, (node) => {
                    const reactions = isRemove
                        ? node.reactions.filter(r => !(r.userId === user?.id && r.type === type))
                        : [...node.reactions, { type, userId: user?.id || "" }];
                    return { ...node, reactions };
                });
            });

            return { previousComments };
        },
        onError: (_err, _variables, context) => {
            queryClient.setQueryData(["comments", capsuleId], context?.previousComments);
        },
        onSettled: () => {
            void queryClient.invalidateQueries({ queryKey: ["comments", capsuleId] });
        },
    });

    const editMutation = useMutation({
        mutationFn: ({ id, content }: { id: string, content: string }) => updateComment(id, content),
        onMutate: async ({ id, content }) => {
            await queryClient.cancelQueries({ queryKey: ["comments", capsuleId] });
            const previousComments = queryClient.getQueryData<Comment[]>(["comments", capsuleId]);

            queryClient.setQueryData<Comment[]>(["comments", capsuleId], (old) => {
                if (!old) return [];
                return recursiveUpdate(old, id, (node) => ({ ...node, content, updatedAt: new Date().toISOString() }));
            });

            return { previousComments };
        },
        onError: (_err, _variables, context) => {
            queryClient.setQueryData(["comments", capsuleId], context?.previousComments);
            toast.error("Could not update comment");
        },
        onSuccess: () => {
            toast.success("Comment updated");
        },
        onSettled: () => {
            void queryClient.invalidateQueries({ queryKey: ["comments", capsuleId] });
        },
    });

    const deleteMutation = useMutation({
        mutationFn: deleteComment,
        onMutate: async (id) => {
            await queryClient.cancelQueries({ queryKey: ["comments", capsuleId] });
            const previousComments = queryClient.getQueryData<Comment[]>(["comments", capsuleId]);

            queryClient.setQueryData<Comment[]>(["comments", capsuleId], (old) => {
                if (!old) return [];
                return recursiveUpdate(old, id, () => null as any);
            });

            return { previousComments };
        },
        onError: (_err, _variables, context) => {
            queryClient.setQueryData(["comments", capsuleId], context?.previousComments);
            toast.error("Could not delete comment");
        },
        onSuccess: () => {
            toast.success("Comment deleted");
        },
        onSettled: () => {
            void queryClient.invalidateQueries({ queryKey: ["comments", capsuleId] });
            void queryClient.invalidateQueries({ queryKey: ["capsules"] });
            void queryClient.invalidateQueries({ queryKey: ["capsule", capsuleId] });
            void queryClient.invalidateQueries({ queryKey: ["feed", "timeline"] });
        },
    });

    const handleCreateComment = (content: string) => {
        if (!user) {
            toast.error("You must be logged in to comment");
            return;
        }
        createMutation.mutate({ content, capsuleId });
    };

    const handleReply = (content: string, parentId: string) => {
        if (!user) {
            toast.error("You must be logged in to reply");
            return;
        }
        createMutation.mutate({ content, capsuleId, parentId });
    };

    const handleReact = (commentId: string, type: string) => {
        if (!user) {
            toast.error("You must be logged in to react");
            return;
        }

        const findCommentRecursive = (nodes: any[], id: string): any | undefined => {
            for (const node of nodes) {
                if (node.id === id) return node;
                if (node.replies && node.replies.length > 0) {
                    const found = findCommentRecursive(node.replies, id);
                    if (found) return found;
                }
            }
            return undefined;
        };

        const comment = findCommentRecursive(comments, commentId);

        if (!comment) return;

        const hasAlreadyReacted = comment.reactions?.some((r: any) => r.userId === user.id && r.type === type);
        reactMutation.mutate({ id: commentId, type, isRemove: !!hasAlreadyReacted });
    };

    const handleEdit = (id: string, content: string) => {
        editMutation.mutate({ id, content });
    };

    const handleDelete = (id: string) => {
        deleteMutation.mutate(id);
    };

    const displayedComments = isInline && !showAll ? comments.slice(0, 3) : comments;

    return (
        <div className={isInline ? "mt-4" : "mt-12 py-8 border-t border-border w-full md:w-10/12"}>
            {!isInline && (
                <div className="flex items-center gap-2 mb-8">
                    <MessageSquare className="w-5 h-5 text-primary" />
                    <h2 className="text-xl font-display font-semibold">Comments</h2>
                    <span className="text-sm text-muted-foreground ml-1">({comments.length})</span>
                </div>
            )}

            <div className={isInline ? `${comments.length > 0 && "mb-4"}` : "mb-10"}>
                <CommentInput
                    onSubmit={handleCreateComment}
                    placeholder={isInline ? "Write a comment..." : "Share your thoughts on this capsule..."}
                    isSmall={isInline}
                />
            </div>

            {isLoading ? (
                <div className="flex flex-col items-center justify-center py-6 gap-3 text-muted-foreground">
                    <Loader2 className="w-5 h-5 animate-spin text-primary" />
                    <p className="text-xs">Loading comments...</p>
                </div>
            ) : comments.length === 0 ? (
                !isInline && (
                    <div className="text-center py-12 border-2 border-dashed border-border rounded-2xl bg-muted/30">
                        <p className="text-sm text-muted-foreground">Be the first to comment on this capsule!</p>
                    </div>
                )
            ) : (
                <div className="flex flex-col">
                    <div className="flex flex-col divide-y divide-border/20">
                        {displayedComments.map((comment) => (
                            <CommentItem
                                key={comment.id}
                                comment={comment}
                                onReply={handleReply}
                                onReact={handleReact}
                                onEdit={handleEdit}
                                onDelete={handleDelete}
                                isSmall={isInline}
                                capsuleOwnerId={(capsule as any)?.userId}
                            />
                        ))}
                    </div>

                    {isInline && comments.length > 3 && (
                        <button
                            onClick={() => setShowAll(!showAll)}
                            className="text-xs text-primary font-medium mt-3 hover:underline text-left px-4"
                        >
                            {showAll ? "Show less" : `Show more comments (${comments.length - 3} more)`}
                        </button>
                    )}
                </div>
            )}
        </div>
    );
}
