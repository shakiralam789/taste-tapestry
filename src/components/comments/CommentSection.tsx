"use client";

import React from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getCommentsByCapsule, createComment, addCommentReaction, removeCommentReaction } from "@/features/comments/api";
import { CommentInput } from "./CommentInput";
import { CommentItem } from "./CommentItem";
import { MessageSquare, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/features/auth/AuthContext";
import { useNotifications } from "@/features/notifications/NotificationsContext";

interface CommentSectionProps {
    capsuleId: string;
    isInline?: boolean;
}

export function CommentSection({ capsuleId, isInline = false }: CommentSectionProps) {
    const queryClient = useQueryClient();
    const { user } = useAuth();
    const { joinCapsule, leaveCapsule } = useNotifications();

    const [showAll, setShowAll] = React.useState(false);

    React.useEffect(() => {
        joinCapsule(capsuleId);
        return () => leaveCapsule(capsuleId);
    }, [capsuleId, joinCapsule, leaveCapsule]);

    const { data: comments = [], isLoading } = useQuery({
        queryKey: ["comments", capsuleId],
        queryFn: () => getCommentsByCapsule(capsuleId),
    });

    const createMutation = useMutation({
        mutationFn: createComment,
        onSuccess: () => {
            void queryClient.invalidateQueries({ queryKey: ["comments", capsuleId] });
            // Also invalidate capsules to update count
            void queryClient.invalidateQueries({ queryKey: ["capsules"] });
            void queryClient.invalidateQueries({ queryKey: ["capsule", capsuleId] });
            toast.success("Comment posted!");
        },
        onError: () => toast.error("Could not post comment"),
    });

    const reactMutation = useMutation({
        mutationFn: ({ id, type, isRemove }: { id: string, type: string, isRemove: boolean }) =>
            isRemove ? removeCommentReaction(id, type) : addCommentReaction(id, type),
        onSuccess: () => {
            void queryClient.invalidateQueries({ queryKey: ["comments", capsuleId] });
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
        const comment = comments.find(c => c.id === commentId) ||
            comments.flatMap(c => c.replies || []).find(r => r.id === commentId);

        if (!comment) return;

        const hasAlreadyReacted = comment.reactions?.some(r => r.userId === user.id && r.type === type);
        reactMutation.mutate({ id: commentId, type, isRemove: !!hasAlreadyReacted });
    };

    const displayedComments = isInline && !showAll ? comments.slice(0, 3) : comments;

    return (
        <div className={isInline ? "mt-4" : "mt-12 py-8 border-t border-border"}>
            {!isInline && (
                <div className="flex items-center gap-2 mb-8">
                    <MessageSquare className="w-5 h-5 text-primary" />
                    <h2 className="text-xl font-display font-semibold">Comments</h2>
                    <span className="text-sm text-muted-foreground ml-1">({comments.length})</span>
                </div>
            )}

            <div className={isInline ? "mb-4" : "mb-10"}>
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
                                isSmall={isInline}
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
