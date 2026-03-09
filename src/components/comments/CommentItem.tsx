"use client";

import React, { useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Comment } from "@/types/comments";
import { formatDistanceToNow } from "date-fns";
import { MessageSquare, Heart, Bookmark, Smile, MoreHorizontal } from "lucide-react";
import { cn } from "@/lib/utils";
import { CommentInput } from "./CommentInput";
import { useAuth } from "@/features/auth/AuthContext";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import Link from "next/link";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";

interface CommentItemProps {
    comment: Comment;
    onReply: (content: string, parentId: string) => void;
    onReact: (commentId: string, type: string) => void;
    onEdit?: (commentId: string, content: string) => void;
    onDelete?: (commentId: string) => void;
    depth?: number;
    isSmall?: boolean;
    capsuleOwnerId?: string;
}

export function CommentItem({ comment, onReply, onReact, onEdit, onDelete, depth = 0, isSmall = false, capsuleOwnerId }: CommentItemProps) {
    const [isReplying, setIsReplying] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const { user } = useAuth();
    const maxDepth = 2;

    const renderContent = (text: string) => {
        const parts = text.split(/(@\w+)/g);
        return parts.map((part, i) => {
            if (part.startsWith("@")) {
                const username = part.slice(1);
                // Find the mention details to get the correct userID
                const mention = comment.mentions?.find(
                    (m) => m.mentionedUser.username.toLowerCase() === username.toLowerCase()
                );

                const href = mention ? `/users/${mention.mentionedUserId}` : `/users/${username}`;

                return (
                    <Link
                        key={i}
                        href={href}
                        className="text-primary font-medium hover:underline"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {part}
                    </Link>
                );
            }
            return <span key={i}>{part}</span>;
        });
    };

    const handleReplySubmit = (content: string) => {
        onReply(content, comment.id);
        setIsReplying(false);
    };

    const handleEditSubmit = (content: string) => {
        if (onEdit) {
            onEdit(comment.id, content);
        }
        setIsEditing(false);
    };

    const handleDelete = () => {
        setIsDeleting(true);
    };

    const confirmDelete = () => {
        if (onDelete) {
            onDelete(comment.id);
        }
        setIsDeleting(false);
    };

    const myReaction = comment.reactions?.find(r => r.userId === user?.id)?.type;
    const isOwner = user?.id && String(user.id) === String(comment.userId);
    const isCapsuleOwner = user?.id && capsuleOwnerId && String(user.id) === String(capsuleOwnerId);
    const canEdit = isOwner;
    const canDelete = isOwner || isCapsuleOwner;

    return (
        <div className={cn(
            "flex flex-col gap-3 py-4",
            depth > 0 && "ml-8 border-l border-border pl-4",
            isSmall && "py-2 gap-2"
        )}>
            <div className="flex gap-3">
                <Link href={`/users/${comment.user.id}`}>
                    <Avatar className={cn("shrink-0", isSmall ? "w-6 h-6" : "w-8 h-8")}>
                        <AvatarImage src={comment.user.avatar ?? undefined} />
                        <AvatarFallback>{comment.user.username[0].toUpperCase()}</AvatarFallback>
                    </Avatar>
                </Link>

                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                        <span className={cn("font-semibold", isSmall ? "text-xs" : "text-sm")}>
                            {comment.user.displayName || comment.user.username}
                        </span>
                        <span className="text-[10px] text-muted-foreground">
                            {formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true })}
                        </span>
                        {comment.updatedAt !== comment.createdAt && (
                            <span className="text-[10px] text-muted-foreground italic">
                                (edited)
                            </span>
                        )}
                    </div>

                    {isEditing ? (
                        <div className="mt-2">
                            <CommentInput
                                onSubmit={handleEditSubmit}
                                initialValue={comment.content}
                                autoFocus
                                isSmall={isSmall}
                                onCancel={() => setIsEditing(false)}
                            />
                        </div>
                    ) : (
                        <div className={cn("text-foreground/90 leading-relaxed mb-2", isSmall ? "text-xs" : "text-sm")}>
                            {renderContent(comment.content)}
                        </div>
                    )}

                    <div className="flex items-center gap-4 text-muted-foreground w-full">
                        <button
                            onClick={() => onReact(comment.id, "❤️")}
                            className={cn(
                                "flex items-center gap-1 text-[11px] font-medium transition-colors hover:text-primary",
                                myReaction === "❤️" && "text-primary"
                            )}
                        >
                            <Heart className={cn("w-3 h-3", myReaction === "❤️" && "fill-current")} />
                            <span>{comment.reactions?.length || 0}</span>
                        </button>

                        {depth < maxDepth && (
                            <button
                                onClick={() => setIsReplying(!isReplying)}
                                className="flex items-center gap-1 text-[11px] font-medium transition-colors hover:text-primary"
                            >
                                <MessageSquare className="w-3 h-3" />
                                <span>Reply</span>
                            </button>
                        )}

                        {(canEdit || canDelete) && !isEditing && (
                            <div className="ml-auto">
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <button className="p-1 hover:bg-white/5 rounded-full transition-colors text-muted-foreground hover:text-foreground">
                                            <MoreHorizontal className="w-4 h-4" />
                                        </button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end">
                                        {canEdit && (
                                            <DropdownMenuItem onClick={() => setIsEditing(true)}>
                                                Edit
                                            </DropdownMenuItem>
                                        )}
                                        {canDelete && (
                                            <DropdownMenuItem
                                                onClick={handleDelete}
                                                className="text-red-500 focus:text-red-500"
                                            >
                                                Delete
                                            </DropdownMenuItem>
                                        )}
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </div>
                        )}
                    </div>

                    {isReplying && (
                        <div className="mt-3">
                            <CommentInput
                                onSubmit={handleReplySubmit}
                                placeholder={`Replying to @${comment.user.username}...`}
                                autoFocus
                                isSmall={isSmall}
                            />
                        </div>
                    )}
                </div>
            </div>

            {comment.replies && comment.replies.length > 0 && (
                <div className="flex flex-col">
                    {comment.replies.map((reply) => (
                        <CommentItem
                            key={reply.id}
                            comment={reply}
                            onReply={onReply}
                            onReact={onReact}
                            onEdit={onEdit}
                            onDelete={onDelete}
                            depth={depth + 1}
                            isSmall={isSmall}
                            capsuleOwnerId={capsuleOwnerId}
                        />
                    ))}
                </div>
            )}

            <ConfirmDialog
                open={isDeleting}
                onOpenChange={setIsDeleting}
                title="Delete Comment"
                description="Are you sure you want to delete this comment? This action cannot be undone."
                confirmText="Delete"
                onConfirm={confirmDelete}
                variant="destructive"
            />
        </div>
    );
}
