import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { ChatMessage } from "@/lib/types";
import { cn } from "@/lib/utils";
import { useVirtualizer } from "@tanstack/react-virtual";
import { ArrowUpDown, Eye, EyeOff, Search } from "lucide-react";
import React, { useEffect, useMemo, useRef, useState } from "react";
import { MessagePreview } from "./MessagePreview";
import { PLATFORM_STYLES } from "./PlatformDesign";
import { Message, Platform } from "./types";

interface ClipEditorProps {
  allMessages: ChatMessage[];
  startIndex: number;
  endIndex: number;
  onSave: (
    messages: Message[],
    platform: Platform,
    isAnonymized: boolean,
    isUsersSwapped: boolean
  ) => void;
  onCancel: () => void;
  user1Name: string;
  user2Name: string;
  user1Username: string;
  initialPlatform?: Platform;
}

export const ClipEditor: React.FC<ClipEditorProps> = ({
  allMessages,
  startIndex,
  endIndex,
  onSave,
  onCancel,
  user1Name,
  user2Name,
  user1Username,
  initialPlatform = "WhatsApp",
}) => {
  const [selectedIndices, setSelectedIndices] = useState<number[]>([]);
  const [lastSelectedIndex, setLastSelectedIndex] = useState<number | null>(
    null
  );
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedPlatform, setSelectedPlatform] =
    useState<Platform>(initialPlatform);
  const [isAnonymized, setIsAnonymized] = useState(false);
  const parentRef = useRef<HTMLDivElement>(null);

  // Maintain separate state for user names like in ClipCard
  const [currentUser1Name, setCurrentUser1Name] = useState(user1Name);
  const [currentUser2Name, setCurrentUser2Name] = useState(user2Name);
  const [isSwapped, setIsSwapped] = useState(false);

  // Determine if we're in clip-only mode (no full chat context)
  const isClipOnlyMode = useMemo(() => {
    // If allMessages length is close to the range of the clip, we're likely in clip-only mode
    return allMessages.length <= endIndex - startIndex + 20; // Add buffer for safety
  }, [allMessages.length, startIndex, endIndex]);

  // Initialize selection with validated indices
  useEffect(() => {
    const initialIndices = [];
    if (isClipOnlyMode) {
      // In clip-only mode, we select all messages initially
      for (let i = 0; i < allMessages.length; i++) {
        initialIndices.push(i);
      }
    } else {
      // In full chat mode, we select the specified range
      const validStartIndex = Math.max(
        0,
        Math.min(startIndex, allMessages.length - 1)
      );
      const validEndIndex = Math.max(
        0,
        Math.min(endIndex, allMessages.length - 1)
      );
      for (let i = validStartIndex; i <= validEndIndex; i++) {
        initialIndices.push(i);
      }
    }
    setSelectedIndices(initialIndices);
    setLastSelectedIndex(initialIndices[0] ?? null);
  }, [startIndex, endIndex, allMessages.length, isClipOnlyMode]);

  // Process messages with proper indices
  const processedMessages = useMemo(() => {
    const processMessage = (msg: ChatMessage, idx: number) => ({
      ...msg,
      displayIndex: idx,
      message: msg.message || "",
      user: msg.user || "",
      // Display name in the list matches the current state
      displayName: isSwapped
        ? msg.user === user1Username
          ? currentUser2Name
          : currentUser1Name
        : msg.user === user1Username
        ? currentUser1Name
        : currentUser2Name,
      date: msg.date instanceof Date ? msg.date : new Date(msg.date),
      index: isClipOnlyMode ? idx : msg.index ?? idx,
    });

    return allMessages.map((msg, idx) => processMessage(msg, idx));
  }, [
    allMessages,
    isClipOnlyMode,
    isSwapped,
    user1Username,
    currentUser1Name,
    currentUser2Name,
  ]);

  // Filter messages based on search
  const visibleMessages = useMemo(() => {
    return processedMessages.filter((msg) =>
      msg.message.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [processedMessages, searchQuery]);

  // Preview messages transformation
  const previewMessages = useMemo(() => {
    return processedMessages
      .filter((msg) => selectedIndices.includes(msg.displayIndex))
      .sort((a, b) => a.index - b.index)
      .map((msg): Message => {
        const isUser1Message = msg.user === user1Username;

        return {
          ...msg,
          // Swap the sender side based on isSwapped
          sender: isSwapped
            ? isUser1Message
              ? "other" // When swapped, user1's messages move to other side
              : "user" // When swapped, user2's messages move to user side
            : isUser1Message
            ? "user" // Normally, user1's messages are on user side
            : "other", // Normally, user2's messages are on other side
          // Keep original user reference for proper tracking
          user: isSwapped
            ? isUser1Message
              ? user2Name // When swapped, user1's messages are attributed to user2
              : user1Name // When swapped, user2's messages are attributed to user1
            : isUser1Message
            ? user1Name // Normally, user1's messages stay with user1
            : user2Name, // Normally, user2's messages stay with user2
          // Display name matches the current state
          displayName: isSwapped
            ? isUser1Message
              ? currentUser2Name
              : currentUser1Name
            : isUser1Message
            ? currentUser1Name
            : currentUser2Name,
          date: msg.date,
          index: isClipOnlyMode ? msg.displayIndex : msg.index,
          message: msg.message,
        };
      });
  }, [
    processedMessages,
    selectedIndices,
    isSwapped,
    user1Username,
    user1Name,
    user2Name,
    currentUser1Name,
    currentUser2Name,
    isClipOnlyMode,
  ]);

  const rowVirtualizer = useVirtualizer({
    count: visibleMessages.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 64,
    overscan: 5,
  });

  const handleMessageClick = (messageIndex: number, shiftKey: boolean) => {
    if (shiftKey && lastSelectedIndex !== null) {
      // Handle shift-click for range selection
      const start = Math.min(lastSelectedIndex, messageIndex);
      const end = Math.max(lastSelectedIndex, messageIndex);
      const newIndices = [];
      for (let i = start; i <= end; i++) {
        newIndices.push(i);
      }

      // Ensure we don't exceed 20 messages
      if (newIndices.length <= 20) {
        setSelectedIndices(newIndices);
        setLastSelectedIndex(messageIndex);
      }
    } else {
      // Handle single click
      if (selectedIndices.includes(messageIndex)) {
        // Deselect if already selected
        setSelectedIndices(selectedIndices.filter((i) => i !== messageIndex));
      } else if (selectedIndices.length < 20) {
        // Select if under limit
        setSelectedIndices([...selectedIndices, messageIndex]);
      }
      setLastSelectedIndex(messageIndex);
    }
  };

  // Single switch function that handles both name swap and position swap
  const handleUserSwitch = () => {
    setIsSwapped((prev) => !prev);
    // Swap the display names
    const tempName = currentUser1Name;
    setCurrentUser1Name(currentUser2Name);
    setCurrentUser2Name(tempName);
  };

  // Save function that preserves the swapped state
  const handleSave = () => {
    try {
      // The messages already have the correct sender and user assignments from previewMessages
      onSave(previewMessages, selectedPlatform, isAnonymized, isSwapped);
    } catch (error) {
      console.error("Error saving edit:", error);
    }
  };

  return (
    <div className="flex gap-4 h-[calc(100vh-200px)] max-h-[800px] relative overflow-hidden">
      <div className="w-1/2 flex flex-col">
        <div className="relative mb-2">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search messages..."
            className="w-full pl-8 pr-4 py-2 text-sm bg-muted rounded-md"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div className="text-sm text-muted-foreground mb-2">
          {selectedIndices.length} / 20 messages selected
        </div>
        <div
          ref={parentRef}
          className="flex-grow border rounded-lg overflow-auto"
        >
          <div
            style={{
              height: `${rowVirtualizer.getTotalSize()}px`,
              width: "100%",
              position: "relative",
            }}
          >
            {rowVirtualizer.getVirtualItems().map((virtualRow) => {
              const message = visibleMessages[virtualRow.index];
              const isSelected = selectedIndices.includes(message.displayIndex);

              return (
                <div
                  key={virtualRow.index}
                  data-index={virtualRow.index}
                  ref={rowVirtualizer.measureElement}
                  className={cn(
                    "absolute top-0 left-0 w-full",
                    "transition-all duration-200"
                  )}
                  style={{
                    transform: `translateY(${virtualRow.start}px)`,
                  }}
                >
                  <button
                    className={cn(
                      "w-full text-left p-3 relative",
                      "before:absolute before:inset-0 before:transition-opacity before:rounded-md",
                      "before:bg-gradient-to-b before:from-background/10 before:to-background/5",
                      "hover:bg-muted/50 transition-colors",
                      "focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-1",
                      isSelected && [
                        "bg-primary/10",
                        "before:bg-gradient-to-b",
                        "before:from-primary/20",
                        "before:to-primary/10",
                        "before:opacity-100",
                      ]
                    )}
                    onClick={(e) =>
                      handleMessageClick(message.displayIndex, e.shiftKey)
                    }
                  >
                    <div className="relative z-10">
                      <div className="font-medium text-sm">
                        {message.displayName}
                      </div>
                      <div className="text-sm text-muted-foreground truncate">
                        {message.message}
                      </div>
                    </div>
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <Separator orientation="vertical" />

      <div className="w-1/2 flex flex-col">
        <div className="mb-2 flex items-center gap-2">
          <h4 className="font-medium">Preview</h4>
          <div className="flex items-center gap-2 ml-auto">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsAnonymized(!isAnonymized)}
              className={cn("h-8 w-8", isAnonymized && "text-primary")}
              title={isAnonymized ? "Show Names" : "Hide Names"}
            >
              {isAnonymized ? (
                <EyeOff className="h-4 w-4" />
              ) : (
                <Eye className="h-4 w-4" />
              )}
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleUserSwitch}
              className="h-8 w-8"
              title="Switch Users"
            >
              <ArrowUpDown className="h-4 w-4" />
            </Button>
            <div className="flex gap-2">
              {(Object.keys(PLATFORM_STYLES) as Platform[])
                .filter((p) => p === "WhatsApp" || p === "iMessage")
                .map((p) => (
                  <button
                    key={p}
                    onClick={() => setSelectedPlatform(p)}
                    className={cn(
                      "px-2 py-1 rounded text-xs transition-colors",
                      selectedPlatform === p
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted text-muted-foreground hover:text-foreground"
                    )}
                  >
                    {p}
                  </button>
                ))}
            </div>
          </div>
        </div>
        <div className="flex-grow border rounded-lg overflow-hidden">
          <div className="h-full overflow-auto flex justify-center">
            <MessagePreview
              messages={previewMessages}
              platform={selectedPlatform}
              isAnonymized={isAnonymized}
              user1Name={currentUser1Name}
              user2Name={currentUser2Name}
              user1Username={user1Username}
              onSwitchUsers={handleUserSwitch}
            />
          </div>
        </div>
      </div>

      <div className="fixed bottom-4 right-4 flex justify-end gap-2 p-4 bg-background border rounded-lg shadow-lg z-10">
        <Button variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button onClick={handleSave}>Save</Button>
      </div>
    </div>
  );
};
