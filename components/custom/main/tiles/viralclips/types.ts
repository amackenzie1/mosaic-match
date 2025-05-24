import { ChatMessage } from "@/lib/types";

export interface Message extends ChatMessage {
  sender?: "user" | "other";
  date: Date;
  displayName?: string;
}

export type Platform =
  | "iMessage"
  | "WhatsApp"
  | "Instagram"
  | "Messenger"
  | "Android"
  | "Space";

export interface ClipCardProps {
  title: string;
  messages: Message[];
  socialShareCaption: string;
  startIndex: number;
  endIndex: number;
  allMessages: ChatMessage[];
  initialPlatform?: Platform;
  isAnonymized?: boolean;
  isEditorView?: boolean;
}

export interface PlatformDesignProps {
  messages: Message[];
  platform: Platform;
  containerRef?: React.RefObject<HTMLDivElement>;
  user1Name: string;
  user2Name: string;
  user1Username: string;
  isAnonymized?: boolean;
  onSwitchUsers?: () => void;
}

export const PLATFORM_STYLES = {
  WhatsApp: {
    // ... existing WhatsApp styles ...
  },
  iMessage: {
    sent: "bg-[#007AFF] text-white rounded-[20px] rounded-tr-[5px]",
    received: "bg-[#E9E9EB] text-black rounded-[20px] rounded-tl-[5px]",
    timestamp: "text-[#8E8E93]",
    // ... other styles
  },
  Instagram: {
    sent: "bg-[#0095F6] text-white rounded-[22px] rounded-tr-[5px]",
    received: "bg-[#F3F3F3] text-[#262626] rounded-[22px] rounded-tl-[5px]",
    timestamp: "text-[#8E8E8E]",
    // ... other styles
  },
  // ... update other platform styles similarly
};
