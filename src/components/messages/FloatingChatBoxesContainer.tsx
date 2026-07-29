"use client";

import { useMessages } from "@/features/messages/MessagesContext";
import { FloatingChatBox } from "./FloatingChatBox";

export function FloatingChatBoxesContainer() {
  const { openChatBoxes, closeChatBox } = useMessages();

  if (openChatBoxes.length === 0) return null;

  return (
    <div className="fixed bottom-0 right-4 hidden sm:flex flex-row-reverse items-end gap-3 z-50 pointer-events-none">
      {openChatBoxes.map((box) => (
        <div key={box.partner.id} className="pointer-events-auto shrink-0">
          <FloatingChatBox
            partner={box.partner}
            onClose={() => closeChatBox(box.partner.id)}
          />
        </div>
      ))}
    </div>
  );
}
