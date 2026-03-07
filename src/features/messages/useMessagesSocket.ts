import { useEffect, useRef, useCallback } from "react";
import type { Message, TypingEvent, ReadEvent, OnlineEvent } from "@/types/messages";
import { useMessages } from "./MessagesContext";

interface UseMessagesSocketOptions {
  onNewMessage?: (msg: Message) => void;
  onTyping?: (event: TypingEvent) => void;
  onRead?: (event: ReadEvent) => void;
  onUserOnline?: (event: OnlineEvent) => void;
  onUserOffline?: (event: OnlineEvent) => void;
}

export function useMessagesSocket(options: UseMessagesSocketOptions = {}) {
  const { socket, connected } = useMessages();
  const optionsRef = useRef(options);
  optionsRef.current = options;

  useEffect(() => {
    if (!socket) return;

    const onNewMessage = (msg: Message) => optionsRef.current.onNewMessage?.(msg);
    const onTyping = (event: TypingEvent) => optionsRef.current.onTyping?.(event);
    const onRead = (event: ReadEvent) => optionsRef.current.onRead?.(event);
    const onUserOnline = (event: OnlineEvent) => optionsRef.current.onUserOnline?.(event);
    const onUserOffline = (event: OnlineEvent) => optionsRef.current.onUserOffline?.(event);

    socket.on("messages:new", onNewMessage);
    socket.on("messages:typing", onTyping);
    socket.on("messages:read", onRead);
    socket.on("user:online", onUserOnline);
    socket.on("user:offline", onUserOffline);

    return () => {
      socket.off("messages:new", onNewMessage);
      socket.off("messages:typing", onTyping);
      socket.off("messages:read", onRead);
      socket.off("user:online", onUserOnline);
      socket.off("user:offline", onUserOffline);
    };
  }, [socket]);

  const sendMessage = useCallback(
    (conversationId: string, content: string) => {
      socket?.emit("messages:send", { conversationId, content });
    },
    [socket],
  );

  const sendTyping = useCallback(
    (conversationId: string, typing: boolean) => {
      socket?.emit("messages:typing", { conversationId, typing });
    },
    [socket],
  );

  const sendRead = useCallback((conversationId: string) => {
    socket?.emit("messages:read", { conversationId });
  }, [socket]);

  const joinConversation = useCallback((conversationId: string) => {
    socket?.emit("messages:join", { conversationId });
  }, [socket]);

  return { connected, sendMessage, sendTyping, sendRead, joinConversation };
}
