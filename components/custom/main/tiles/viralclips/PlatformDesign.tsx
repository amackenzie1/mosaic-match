"use client";

import { cn } from "@/lib/utils";
import { format } from "date-fns";
import {
  ArrowLeft,
  Battery,
  Camera,
  Signal as CellSignal,
  Mic,
  MoreVertical,
  Phone,
  Plus,
  Smile,
  Video,
  Wifi,
} from "lucide-react";
import React from "react";
import { PhoneFrame } from "./PhoneFrame";
import { Message, Platform } from "./types";

interface PlatformDesignProps {
  messages: Message[];
  platform: Platform;
  containerRef?: React.RefObject<HTMLDivElement>;
  user1Name: string;
  user2Name: string;
  user1Username: string;
  isAnonymized?: boolean;
  onSwitchUsers?: () => void;
  scale?: number;
}

export const PLATFORM_STYLES = {
  WhatsApp: {
    container: "min-h-[400px] overflow-hidden flex flex-col",
    messageContainer:
      "flex-1 bg-[url('/whatsapp-pattern.png')] bg-repeat bg-[length:350px_auto] overflow-y-auto",
    sent: "bg-[#DCF8C6] text-[#111B21] rounded-lg px-2.5 py-[5px] max-w-[85%] ml-auto relative shadow-sm text-[13px] leading-[17px]",
    received:
      "bg-white text-[#111B21] rounded-lg px-2.5 py-[5px] max-w-[85%] relative shadow-sm text-[13px] leading-[17px]",
    timestamp:
      "text-[10px] text-[#667781] inline-flex items-center gap-[2px] whitespace-nowrap",
    readReceipt: "text-[#53BDEB] inline-block ml-[2px]",
    header: "bg-[#075E54] text-white shadow-sm",
    engagement: "text-[#667781] text-sm",
    userName: "text-[#1FA855] text-[12px] font-medium mb-[2px]",
    userIcon:
      "w-8 h-8 rounded-full bg-[#DFE5E7] flex items-center justify-center text-[#075E54] font-medium absolute -left-12 top-0",
  },
  iMessage: {
    container: "min-h-[400px] bg-white overflow-hidden flex flex-col",
    messageContainer: "flex-1 p-2 space-y-1 overflow-y-auto",
    sent: "bg-[#007AFF] text-white rounded-[16px] px-2.5 py-[5px] max-w-[85%] ml-auto text-[13px] leading-[17px]",
    received:
      "bg-[#E9E9EB] text-black rounded-[16px] px-2.5 py-[5px] max-w-[85%] text-[13px] leading-[17px]",
    timestamp: "text-[10px] text-[#8E8E93] text-center my-1",
    readReceipt: "text-[#8E8E93] text-[9px] mt-0.5",
    header: "bg-[#F2F2F7]",
    engagement: "text-[#8E8E93] text-xs",
    userName: "",
    userIcon: "",
  },
  Instagram: {
    container: "bg-white",
    messageContainer: "p-4 space-y-2",
    sent: "bg-[#0095F6] text-white rounded-[22px] px-4 py-2 max-w-[80%] ml-auto group",
    received:
      "bg-[#F3F3F3] text-[#262626] rounded-[22px] px-4 py-2 max-w-[80%] group",
    timestamp: "text-[11px] text-[#8E8E8E]",
    readReceipt: "text-[#8E8E8E] text-[11px]",
    header: "bg-white border-b border-[#DBDBDB]",
    engagement: "text-[#8E8E8E] text-sm",
    userName: "",
    userIcon: "",
  },
  Messenger: {
    container: "bg-white",
    messageContainer: "p-4 space-y-2",
    sent: "bg-[#0084FF] text-white rounded-[20px] px-4 py-2 max-w-[80%] ml-auto group",
    received:
      "bg-[#F0F0F0] text-[#000000] rounded-[20px] px-4 py-2 max-w-[80%] group",
    timestamp: "text-[11px] text-[#65676B]",
    readReceipt: "text-[#0084FF] text-[11px]",
    header: "bg-[#0084FF] text-white",
    engagement: "text-[#65676B] text-sm",
    userName: "",
    userIcon: "",
  },
  Android: {
    container: "bg-white",
    messageContainer: "p-4 space-y-2",
    sent: "bg-[#1A73E8] text-white rounded-lg px-4 py-2 max-w-[80%] ml-auto group",
    received:
      "bg-[#F1F3F4] text-[#202124] rounded-lg px-4 py-2 max-w-[80%] group",
    timestamp: "text-[11px] text-[#5F6368]",
    readReceipt: "text-[#1A73E8] text-[11px]",
    header: "bg-[#1A73E8] text-white",
    engagement: "text-[#5F6368] text-sm",
    userName: "",
    userIcon: "",
  },
  Space: {
    container:
      "bg-[#0A0F1E] overflow-hidden flex flex-col bg-[radial-gradient(circle_at_10%_20%,rgba(37,99,235,0.15),transparent_20%),radial-gradient(circle_at_90%_80%,rgba(37,99,235,0.1),transparent_20%)] before:content-[''] before:absolute before:inset-0 before:bg-[radial-gradient(circle_at_80%_20%,rgba(255,255,255,0.1)_2px,transparent_2px),radial-gradient(circle_at_20%_80%,rgba(255,255,255,0.1)_2px,transparent_2px)] before:bg-[length:30px_30px] before:opacity-30",
    messageContainer:
      "flex-1 px-3 py-4 flex flex-col justify-center space-y-1.5 relative z-10 overflow-y-auto",
    sent: "bg-[#2563eb] text-white rounded-lg px-2.5 py-[5px] max-w-[85%] ml-auto shadow-[0_2px_8px_rgba(37,99,235,0.25)] backdrop-blur-sm text-[13px] leading-[17px]",
    received:
      "bg-[#1F2937] text-white rounded-lg px-2.5 py-[5px] max-w-[85%] shadow-[0_2px_8px_rgba(0,0,0,0.25)] backdrop-blur-sm text-[13px] leading-[17px]",
    timestamp: "hidden",
    readReceipt: "hidden",
    header: "hidden",
    engagement: "hidden",
    userName: "hidden",
    userIcon: "hidden",
  },
};

interface HeaderProps {
  user2Name: string;
  time: string;
  isAnonymized?: boolean;
}

const RedactedName = ({ name }: { name: string }) => (
  <div className="relative inline-block">
    <span className="blur-[8px]">{name}</span>
  </div>
);

const UserInitial = ({ name }: { name: string }) => (
  <span className="text-lg">{name.charAt(0)}</span>
);

// Add a function to sanitize text for UTF-16
const sanitizeText = (text: string) => {
  return text.replace(/[\uD800-\uDFFF]/g, ""); // Remove surrogate pairs
};

// Create a common status bar component
const StatusBar = ({ time }: { time: string }) => (
  <div className="h-6 px-4 flex justify-between items-center text-black">
    <span className="text-[14px] font-medium">{time}</span>
    <div className="flex items-center gap-2">
      <CellSignal className="h-4 w-4" />
      <Wifi className="h-4 w-4" />
      <Battery className="h-4 w-4" />
    </div>
  </div>
);

// Styles for image capture
const CAPTURE_STYLES = `
  /* Reset backgrounds first */
  .flex.flex-col.h-full.relative {
    background: transparent !important;
  }

  /* Keep Space background */
  .bg-\\[#0A0F1E\\] {
    background-color: #0A0F1E !important;
  }

  /* Keep WhatsApp pattern */
  .bg-\\[url\\(\\'\\\/whatsapp-pattern\\.png\\'\\)\\] {
    background-image: url("/whatsapp-pattern.png") !important;
    background-repeat: repeat !important;
    background-size: 350px auto !important;
    background-color: #E5DDD5 !important;
  }

  /* Keep message backgrounds */
  .bg-\\[#DCF8C6\\] {
    background-color: #DCF8C6 !important;
  }
  .bg-\\[#007AFF\\] {
    background-color: #007AFF !important;
  }
  .bg-\\[#E9E9EB\\] {
    background-color: #E9E9EB !important;
  }
  .bg-\\[#075E54\\] {
    background-color: #075E54 !important;
  }
  .bg-\\[#F2F2F7\\] {
    background-color: #F2F2F7 !important;
  }
  .bg-\\[#2563eb\\] {
    background-color: #2563eb !important;
  }
  .bg-\\[#1F2937\\] {
    background-color: #1F2937 !important;
  }
  .bg-white {
    background-color: white !important;
  }

  /* Keep input field backgrounds */
  .bg-\\[#F0F2F5\\] {
    background-color: #F0F2F5 !important;
  }

  /* Keep Space background patterns */
  [class*="bg-[radial-gradient"] {
    background: radial-gradient(circle at 10% 20%, rgba(37, 99, 235, 0.15), transparent 20%),
                radial-gradient(circle at 90% 80%, rgba(37, 99, 235, 0.1), transparent 20%) !important;
  }

  /* Keep Space dot pattern */
  [class*="before\\:bg-[radial-gradient"] {
    background: radial-gradient(circle at 80% 20%, rgba(255, 255, 255, 0.1) 2px, transparent 2px),
                radial-gradient(circle at 20% 80%, rgba(255, 255, 255, 0.1) 2px, transparent 2px) !important;
    background-size: 30px 30px !important;
    opacity: 0.3 !important;
  }

  /* Keep text colors */
  .text-white {
    color: white !important;
  }
  .text-\\[#111B21\\] {
    color: #111B21 !important;
  }
  .text-\\[#8E8E93\\] {
    color: #8E8E93 !important;
  }

  /* Keep favicon */
  img[src$="favicon.png"] {
    opacity: 0.4 !important;
    display: inline-block !important;
    visibility: visible !important;
  }

  /* Ensure proper clipping */
  .flex.flex-col.h-full.relative {
    overflow: hidden !important;
    border-radius: 0 !important;
  }

  /* Keep shadows and backdrop blur */
  .shadow-\\[0_2px_8px_rgba\\(37\\,99\\,235\\,0\\.25\\)\\] {
    box-shadow: 0 2px 8px rgba(37, 99, 235, 0.25) !important;
  }
  .shadow-\\[0_2px_8px_rgba\\(0\\,0\\,0\\,0\\.25\\)\\] {
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.25) !important;
  }
  .backdrop-blur-sm {
    backdrop-filter: blur(4px) !important;
  }
`;

const PLATFORM_HEADERS = {
  WhatsApp: ({ user2Name, time, isAnonymized }: HeaderProps) => (
    <div className="flex flex-col bg-[#075E54] text-white">
      <StatusBar time={time} />
      <div className="flex items-center p-2 px-4">
        <ArrowLeft className="h-5 w-5 mr-4" />
        <div className="flex items-center flex-1">
          <div className="w-8 h-8 rounded-full bg-[#D9D9D9] flex items-center justify-center text-[#075E54] font-medium mr-3">
            <UserInitial name={user2Name} />
          </div>
          <div className="flex-1">
            <div className="font-medium">
              {isAnonymized ? <RedactedName name={user2Name} /> : user2Name}
            </div>
            <div className="text-xs opacity-80">online</div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Video className="h-5 w-5" />
          <Phone className="h-5 w-5" />
        </div>
      </div>
    </div>
  ),
  iMessage: ({ user2Name, time, isAnonymized }: HeaderProps) => (
    <div className="flex flex-col bg-[#F2F2F7]">
      <StatusBar time={time} />
      <div className="flex items-center px-2 py-1 relative">
        <ArrowLeft className="h-6 w-6 text-[#007AFF] absolute left-2" />
        <div className="flex-1 flex flex-col items-center justify-center">
          <div className="w-10 h-10 rounded-full bg-[#007AFF] flex items-center justify-center text-white font-medium">
            <UserInitial name={user2Name} />
          </div>
          <div className="text-black text-[15px] font-medium mt-0.5">
            {isAnonymized ? <RedactedName name={user2Name} /> : user2Name}
          </div>
        </div>
        <Video className="h-6 w-6 text-[#007AFF] absolute right-2" />
      </div>
    </div>
  ),
  Instagram: ({ user2Name, time, isAnonymized }: HeaderProps) => (
    <div className="flex flex-col bg-white">
      <StatusBar time={time} />
      <div className="flex items-center justify-between p-4 border-b border-[#DBDBDB]">
        <div className="flex items-center">
          <ArrowLeft className="h-5 w-5 mr-4" />
          <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-[#F58529] to-[#DD2A7B] flex items-center justify-center text-white mr-3">
            <UserInitial name={user2Name} />
          </div>
          <div className="font-medium">
            {isAnonymized ? <RedactedName name={user2Name} /> : user2Name}
          </div>
        </div>
        <div className="text-[#0095F6] font-medium">Follow</div>
      </div>
    </div>
  ),
  Messenger: ({ user2Name, time, isAnonymized }: HeaderProps) => (
    <div className="flex flex-col bg-white">
      <StatusBar time={time} />
      <div className="flex items-center p-4 bg-[#0084FF] text-white">
        <ArrowLeft className="h-5 w-5 mr-4" />
        <div className="flex items-center flex-1">
          <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center text-[#0084FF] font-medium mr-3">
            <UserInitial name={user2Name} />
          </div>
          <div className="font-medium">
            {isAnonymized ? <RedactedName name={user2Name} /> : user2Name}
          </div>
        </div>
        <div className="flex items-center gap-4">
          <Phone className="h-5 w-5" />
          <Video className="h-5 w-5" />
          <MoreVertical className="h-5 w-5" />
        </div>
      </div>
    </div>
  ),
  Android: ({ user2Name, time, isAnonymized }: HeaderProps) => (
    <div className="flex flex-col bg-white">
      <StatusBar time={time} />
      <div className="flex items-center justify-between p-4 bg-[#1A73E8] text-white">
        <div className="flex items-center">
          <ArrowLeft className="h-5 w-5 mr-4" />
          <div className="font-medium">
            {isAnonymized ? <RedactedName name={user2Name} /> : user2Name}
          </div>
        </div>
        <div className="flex items-center gap-4">
          <Phone className="h-5 w-5" />
          <Video className="h-5 w-5" />
          <MoreVertical className="h-5 w-5" />
        </div>
      </div>
    </div>
  ),
  Space: ({ user2Name, time, isAnonymized }: HeaderProps) => (
    <div className="flex items-center justify-between px-6 py-4">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center text-white font-medium">
          <UserInitial name={user2Name} />
        </div>
        <div className="font-medium text-white">
          {isAnonymized ? <RedactedName name={user2Name} /> : user2Name}
        </div>
      </div>
      <div className="text-gray-400 text-sm">{time}</div>
    </div>
  ),
};

const INPUT_FIELDS = {
  WhatsApp: (
    <div className="flex items-center gap-2 p-3 bg-[#F0F2F5] border-t border-[#E9EDEF]">
      <Smile className="h-6 w-6 text-[#54656F]" />
      <div className="flex-1 bg-white rounded-lg px-4 py-2 text-[9px] text-[#3B4A54] flex items-center justify-between">
        <span className="text-[#8696A0]">Clipped by MosaicChats.com</span>
        <img src="/favicon.png" alt="mosaic" className="h-4 w-4 opacity-50" />
      </div>
      <div className="flex items-center gap-2">
        <Camera className="h-6 w-6 text-[#54656F]" />
        <Mic className="h-6 w-6 text-[#54656F]" />
      </div>
    </div>
  ),
  iMessage: (
    <div className="flex items-center gap-2 p-3 bg-[#F2F2F7] border-t border-[#C6C6C8]">
      <button className="p-2">
        <Plus className="h-6 w-6 text-[#007AFF]" />
      </button>
      <div className="flex-1 bg-white rounded-full px-4 py-[8px] text-[9px] text-[#3B4A54] border border-[#C6C6C8] flex items-center justify-between">
        <span className="text-[#8E8E93]">Clipped by MosaicChats.com</span>
        <img src="/favicon.png" alt="mosaic" className="h-4 w-4 opacity-40" />
      </div>
      <button className="p-2">
        <Mic className="h-6 w-6 text-[#007AFF]" />
      </button>
    </div>
  ),
  Instagram: (
    <div className="flex items-center gap-2 p-3 border-t border-[#DBDBDB]">
      <Camera className="h-6 w-6 text-[#262626]" />
      <div className="flex-1 bg-[#F3F3F3] rounded-3xl px-4 py-2 text-[9px] flex items-center justify-between">
        <span className="text-[#8E8E93]">Clipped by MosaicChats.com</span>
        <img src="/favicon.png" alt="mosaic" className="h-4 w-4 opacity-40" />
      </div>
      <div className="text-[#0095F6] font-medium">Send</div>
    </div>
  ),
  Messenger: (
    <div className="flex items-center gap-2 p-3">
      <div className="flex-1 bg-[#F0F0F0] rounded-3xl px-4 py-2 text-[9px] flex items-center justify-between">
        <span className="text-[#65676B]">Clipped by MosaicChats.com</span>
        <img src="/favicon.png" alt="mosaic" className="h-4 w-4 opacity-40" />
      </div>
      <div className="flex items-center gap-2">
        <Smile className="h-6 w-6 text-[#0084FF]" />
        <Camera className="h-6 w-6 text-[#0084FF]" />
      </div>
    </div>
  ),
  Android: (
    <div className="flex items-center gap-2 p-3 bg-white border-t">
      <Smile className="h-6 w-6 text-[#5F6368]" />
      <div className="flex-1 bg-[#F1F3F4] rounded-3xl px-4 py-2 text-[9px] flex items-center justify-between">
        <span className="text-[#5F6368]">Clipped by MosaicChats.com</span>
          <img src="/favicon.png" alt="mosaic" className="h-4 w-4 opacity-40" />
      </div>
      <div className="flex items-center gap-2">
        <Camera className="h-6 w-6 text-[#1A73E8]" />
      </div>
    </div>
  ),
  Space: (
    <div className="absolute bottom-0 left-0 right-0 flex items-center gap-2 p-3 relative z-10 bg-[#0A0F1E]/80 backdrop-blur-sm">
      <div className="flex-1 bg-[#1F2937]/50 backdrop-blur-sm border border-white/10 rounded-lg px-4 py-2 text-[9px] flex items-center justify-between">
        <span className="text-white/70">Clipped by MosaicChats.com</span>
        <img src="/favicon.png" alt="mosaic" className="h-4 w-4 opacity-40" />
      </div>
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 rounded-full bg-[#2563eb]/20 backdrop-blur-sm border border-white/10 flex items-center justify-center">
          <Camera className="h-5 w-5 text-white/70" />
        </div>
      </div>
    </div>
  ),
};

// Add emoji regex pattern
const emojiRegex =
  /\p{Emoji_Presentation}|\p{Extended_Pictographic}|\p{Emoji_Modifier_Base}\p{Emoji_Modifier}?|\p{Emoji}\uFE0F/gu;

export const PlatformDesign: React.FC<PlatformDesignProps> = ({
  messages,
  platform,
  containerRef,
  user1Name,
  user2Name,
  user1Username,
  isAnonymized = false,
  onSwitchUsers,
  scale = 1,
}) => {
  const styles = PLATFORM_STYLES[platform];
  const Header = platform === "Space" ? null : PLATFORM_HEADERS[platform];
  const InputField = INPUT_FIELDS[platform];

  // Adjust text size based on message count
  const messageCount = messages.length;
  const getMessageStyle = (isUser: boolean) => {
    const baseStyle = isUser ? styles.sent : styles.received;
    let textSize = "text-[13px] leading-[17px]";

    if (messageCount > 15) {
      textSize = "text-[12px] leading-[16px]";
    }
    if (messageCount > 20) {
      textSize = "text-[11px] leading-[15px]";
    }

    return cn(baseStyle, textSize);
  };

  // Get the time from the last message, ensuring we parse the date correctly
  const lastMessage = messages[messages.length - 1];
  const currentTime = lastMessage
    ? format(new Date(lastMessage.date), "h:mm a")
    : format(new Date(), "h:mm a");

  // Convert emoji codes and handle anonymization
  const processMessage = (message: string) => {
    // First convert emoji codes and sanitize
    const processedMessage = sanitizeText(
      message.replace(/:([\w-]+):/g, (match, code) => {
        try {
          return require("emoji-dictionary").getUnicode(code) || match;
        } catch {
          return match;
        }
      })
    );

    // Then convert any remaining emoji text to actual emojis
    return processedMessage.replace(emojiRegex, (match) => match);
  };

  const shouldShowTimestamp = (currentDate: Date, prevDate: Date | null) => {
    if (platform === "Space") return false;
    if (platform === "WhatsApp") {
      if (!prevDate) return false;
      return currentDate.getTime() - prevDate.getTime() > 5 * 60 * 1000;
    }
    return false;
  };

  // Check if the last message was sent by the user
  const isLastMessageFromUser =
    messages.length > 0 && messages[messages.length - 1].user === user1Username;

  return (
    <PhoneFrame scale={scale}>
      <div className={cn("flex flex-col h-full relative", styles.container)}>
        {/* Platform-specific header */}
        {Header && (
          <Header
            user2Name={user2Name}
            time={currentTime}
            isAnonymized={isAnonymized}
          />
        )}

        {/* Messages Container */}
        <div className={styles.messageContainer}>
          {/* Add iMessage timestamp at the top */}
          {platform === "iMessage" && (
            <div className="text-[10px] text-[#8E8E93] text-center my-1">
              {format(new Date(), "EEEE h:mm a")}
            </div>
          )}

          {/* Messages Layer */}
          <div
            className={cn(
              platform === "Space" ? "space-y-1.5" : "p-2 space-y-1"
            )}
          >
            {messages.map((message, i) => {
              const isUser = message.user === user1Username;
              const messageDate = new Date(message.date);
              const prevMessage = i > 0 ? messages[i - 1] : null;
              const prevDate = prevMessage ? new Date(prevMessage.date) : null;
              const isLastMessage = i === messages.length - 1;

              const showTimestamp = shouldShowTimestamp(messageDate, prevDate);
              const messageStyle = getMessageStyle(isUser);

              return (
                <React.Fragment key={i}>
                  {showTimestamp && platform === "WhatsApp" && (
                    <div className="text-[10px] text-[#667781] text-center my-1 opacity-80">
                      {format(messageDate, "EEEE h:mm a")}
                    </div>
                  )}
                  <div
                    className={`flex ${
                      isUser ? "justify-end" : "justify-start"
                    } items-end`}
                  >
                    <div className={messageStyle}>
                      <div className="relative flex flex-col min-w-0">
                        <p className="break-words">
                          {processMessage(message.message)}
                        </p>
                        {platform === "WhatsApp" && (
                          <div
                            className={cn(
                              styles.timestamp,
                              "flex items-center justify-end mt-[2px]"
                            )}
                          >
                            {format(messageDate, "h:mm a")}
                            {isUser && (
                              <svg
                                viewBox="0 0 16 15"
                                height="11"
                                width="16"
                                preserveAspectRatio="xMidYMid meet"
                                className={styles.readReceipt}
                                fill="currentColor"
                              >
                                <path d="M15.01 3.316l-.478-.372a.365.365 0 0 0-.51.063L8.666 9.879a.32.32 0 0 1-.484.033l-.358-.325a.319.319 0 0 0-.484.032l-.378.483a.418.418 0 0 0 .036.541l1.32 1.266c.143.14.361.125.484-.033l6.272-8.048a.366.366 0 0 0-.064-.512zm-4.1 0l-.478-.372a.365.365 0 0 0-.51.063L4.566 9.879a.32.32 0 0 1-.484.033L1.891 7.769a.366.366 0 0 0-.515.006l-.423.433a.364.364 0 0 0 .006.514l3.258 3.185c.143.14.361.125.484-.033l6.272-8.048a.365.365 0 0 0-.063-.51z" />
                              </svg>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  {platform === "iMessage" && isUser && isLastMessage && (
                    <div className="text-[10px] text-[#8E8E93] text-right mt-0.5">
                      Delivered
                    </div>
                  )}
                </React.Fragment>
              );
            })}
          </div>
        </div>

        {/* Platform-specific input field */}
        {InputField}
      </div>
    </PhoneFrame>
  );
};
