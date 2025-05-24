"use client";

import { useGeneralInfo } from "@/lib/contexts/general-info";
import React from "react";
import { PlatformDesign } from "./PlatformDesign";
import { Message, Platform } from "./types";

interface MessagePreviewProps {
  messages: Message[];
  platform: Platform;
  isAnonymized: boolean;
  user1Name: string;
  user2Name: string;
  user1Username: string;
  onSwitchUsers: () => void;
}

export const MessagePreview: React.FC<MessagePreviewProps> = ({
  messages,
  platform,
  isAnonymized,
  user1Name,
  user2Name,
  user1Username,
  onSwitchUsers,
}) => {
  const { users } = useGeneralInfo();
  if (!users || users.length < 2) return null;
  const [user1, user2] = users;

  return (
    <div data-message-container="true" className="h-full w-full">
      <PlatformDesign
        messages={messages}
        platform={platform}
        user1Name={user1Name}
        user2Name={user2Name}
        user1Username={user1Username}
        isAnonymized={isAnonymized}
        onSwitchUsers={onSwitchUsers}
      />
    </div>
  );
};
