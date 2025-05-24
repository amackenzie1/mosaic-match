"use client";

import { ClipCard } from "@/components/custom/main/tiles/viralclips/ClipCard";
import { PlatformDesign } from "@/components/custom/main/tiles/viralclips/PlatformDesign";
import { Message } from "@/components/custom/main/tiles/viralclips/types";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useGeneralInfo } from "@/lib/contexts/general-info";
import { ChatMessage, ChatUser } from "@/lib/types";
import { cn } from "@/lib/utils";
import { Search, SlidersHorizontal } from "lucide-react";
import { useTheme } from "next-themes";
import React, { useEffect, useMemo, useState } from "react";
import { ClipEditor } from "./editor/ClipEditor";
import { SimpleClipCard } from "./ticker-preview";

interface ClipGalleryContentProps {
  clips: Array<{
    clip: {
      title: string;
      social_share_caption: string;
      messages: Message[];
      viral_score: number;
      start_index: number;
      end_index: number;
    };
    hash: string;
    chatType?: "romantic" | "friend" | "business" | "professional";
    chatTitle?: string;
  }>;
  ownedHashes: string[];
  chatCategories: Record<string, string>;
}

interface ProcessedClip {
  clip: {
    title: string;
    social_share_caption: string;
    messages: ChatMessage[];
    viral_score: number;
    start_index: number;
    end_index: number;
  };
  hash: string;
  chatType?: "romantic" | "friend" | "business" | "professional";
  chatTitle?: string;
}

type ViewMode = "gallery" | "ticker" | "editor";

export const ClipGalleryContent: React.FC<ClipGalleryContentProps> = ({
  clips,
  ownedHashes,
  chatCategories,
}) => {
  const { theme } = useTheme();
  const isDark = theme?.includes("dark");
  const currentScheme =
    theme?.replace("dark-", "").replace("light-", "") || "default";
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTypes, setSelectedTypes] = useState<Set<string>>(
    new Set(["all"])
  );
  const [selectedClip, setSelectedClip] = useState<(typeof clips)[0] | null>(
    null
  );
  const [selectedChats, setSelectedChats] = useState<Set<string>>(new Set());
  const [viewMode, setViewMode] = useState<ViewMode>("gallery");
  const { users, setUsers } = useGeneralInfo();
  const [sortOrder, setSortOrder] = useState<"desc" | "asc">("desc");
  const [showFilters, setShowFilters] = useState(false);

  // Update the chatNames memo to properly handle message access
  const chatNames = useMemo(() => {
    const names: Record<string, string> = {};
    clips.forEach((clip) => {
      // Ensure clip and clip.clip exist before trying to access messages
      if (!clip?.clip) {
        if (clip?.hash) {
          names[clip.hash] = "Unnamed Chat (Missing Clip Data)";
        }
        return;
      }

      // Default to an empty array if messages are null, undefined, or not an array
      const messages = Array.isArray(clip.clip.messages)
        ? clip.clip.messages
        : [];

      if (messages.length === 0 && clip.hash) {
        // It's valid to have a clip with no messages, but it won't have users for a typical chat name.
        // However, if messages array was originally invalid, this path is also taken.
        names[clip.hash] = "Unnamed Chat (No Messages)";
        return;
      }

      try {
        const uniqueUsers = Array.from(
          new Set(
            messages
              .filter((msg) => msg && msg.user) // Ensure valid messages
              .map((msg) => msg.user)
          )
        ).sort((a, b) => a.localeCompare(b));

        if (uniqueUsers.length === 2) {
          names[clip.hash] = uniqueUsers.join(" & ");
        } else {
          // This warning is still useful for identifying chats that don't fit the "A & B" pattern
          console.warn(
            `Invalid number of users (${uniqueUsers.length}) for chat ${clip.hash}. Expected 2 for standard naming.`
          );
          names[clip.hash] = clip.chatTitle || "Group Chat / Note"; // Use provided chatTitle or a generic fallback
        }
      } catch (error) {
        console.error(
          "Error processing chat names for hash:",
          clip.hash,
          error
        );
        names[clip.hash] = "Unnamed Chat (Error)";
      }
    });

    // Debug output
    // console.log("Generated chat names:", names);
    return names;
  }, [clips]);

  // Memoize available hashes separately
  const availableHashes = useMemo(() => {
    return Array.from(new Set(clips.map((clip) => clip.hash)));
  }, [clips]);

  // Initialize selected chats with all available hashes
  useEffect(() => {
    setSelectedChats(new Set(availableHashes));
  }, [availableHashes]);

  // Initialize users when a clip is selected
  useEffect(() => {
    if (!selectedClip?.clip?.messages) {
      setUsers(null);
      return;
    }

    const clipMessages = selectedClip.clip.messages;
    if (clipMessages.length === 0) {
      setUsers(null);
      return;
    }

    // Create users from the clip's messages
    const users = clipMessages.reduce((acc, msg) => {
      if (!acc.some((u) => u.username === msg.user)) {
        acc.push({
          username: msg.user,
          name: msg.user,
          isMe: acc.length === 0,
          edited: false,
        });
      }
      return acc;
    }, [] as ChatUser[]);
    setUsers(users);
  }, [selectedClip, setUsers]);

  // Helper function to convert Message to ChatMessage
  const ensureValidMessage = (msg: Partial<Message>): ChatMessage => ({
    message: msg.message || "",
    user: msg.user || "Unknown User", // Provide a default for user
    date: msg.date ? new Date(msg.date) : new Date(), // Ensure date is a Date object
    index: msg.index ?? 0,
  });

  // Updated filteredClips to include message content search
  const filteredClips = useMemo(() => {
    return clips
      .filter((clipData): clipData is NonNullable<typeof clipData> => {
        // Basic check for clipData and clipData.clip existence
        if (!clipData?.clip) {
          console.warn(
            "Invalid clip data: Missing clip or clip.clip object",
            clipData
          );
          return false;
        }
        // The messages array validity will be handled in the mapping step
        // No need to filter out here if messages array itself is the issue,
        // as we'll default it to [] later.
        return true;
      })
      .map((clipData): ProcessedClip | null => {
        try {
          // Ensure messages is an array, default to empty if not.
          const messages = Array.isArray(clipData.clip.messages)
            ? clipData.clip.messages.map(ensureValidMessage)
            : [];

          // If original messages were not an array, log it once.
          if (!Array.isArray(clipData.clip.messages)) {
            console.warn(
              `Clip ${clipData.hash} ('${
                clipData.clip.title || "Untitled"
              }') had invalid messages structure, defaulted to empty. Original:`,
              clipData.clip.messages
            );
          }

          const processedClipData: ProcessedClip = {
            ...clipData,
            clip: {
              ...clipData.clip,
              title: clipData.clip.title || "Untitled Clip",
              social_share_caption: clipData.clip.social_share_caption || "",
              messages: messages, // Use the sanitized messages
              viral_score: clipData.clip.viral_score || 0,
              start_index: clipData.clip.start_index || 0,
              end_index: clipData.clip.end_index || 0,
            },
          };

          // Now perform search and filter checks on the processed (sanitized) clip data
          const { clip: processedInnerClip, hash: processedHash } =
            processedClipData;

          // Explicit boolean conditions for clarity and to assist type inference
          const isEmptySearch = searchQuery === "";
          const titleMatches =
            !isEmptySearch &&
            (processedInnerClip.title || "")
              .toLowerCase()
              .includes(searchQuery.toLowerCase());
          const captionMatches =
            !isEmptySearch &&
            (processedInnerClip.social_share_caption || "")
              .toLowerCase()
              .includes(searchQuery.toLowerCase());
          const messageContentMatches =
            !isEmptySearch &&
            messages.length > 0 &&
            messages.some((msg) =>
              msg.message?.toLowerCase().includes(searchQuery.toLowerCase())
            );

          const matchesSearch =
            isEmptySearch ||
            titleMatches ||
            captionMatches ||
            messageContentMatches;

          const clipCategory = chatCategories[processedHash];
          const matchesType =
            selectedTypes.has("all") ||
            (clipCategory &&
              Array.from(selectedTypes).some((type) =>
                clipCategory.toLowerCase().includes(type.toLowerCase())
              ));

          const matchesSelectedChats = selectedChats.has(processedHash);

          if (matchesSearch && matchesType && matchesSelectedChats) {
            return processedClipData;
          }
          return null; // Filter out if it doesn't match criteria after sanitization
        } catch (error) {
          console.error(
            "Error processing and filtering clip data:",
            clipData,
            error
          );
          return null;
        }
      })
      .filter((clip): clip is ProcessedClip => clip !== null)
      .sort((a, b) =>
        sortOrder === "desc"
          ? b.clip.viral_score - a.clip.viral_score
          : a.clip.viral_score - b.clip.viral_score
      );
  }, [
    clips,
    searchQuery,
    selectedTypes,
    chatCategories,
    selectedChats,
    sortOrder,
  ]);

  const toggleChat = (hash: string) => {
    setSelectedChats((prev) => {
      const next = new Set(prev);
      if (next.has(hash)) {
        next.delete(hash);
      } else {
        next.add(hash);
      }
      return next;
    });
  };

  const toggleType = (type: string) => {
    setSelectedTypes((prev) => {
      const next = new Set(prev);
      if (type === "all") {
        return new Set(["all"]);
      }
      next.delete("all");
      if (next.has(type)) {
        next.delete(type);
        if (next.size === 0) next.add("all");
      } else {
        next.add(type);
      }
      return next;
    });
  };

  // Extract users from the clip's messages
  const getClipUsers = (messages: Message[]) => {
    if (!messages || messages.length === 0) return null;
    const uniqueUsers = Array.from(new Set(messages.map((m) => m.user)));
    if (uniqueUsers.length < 2) return null;

    return [
      {
        username: uniqueUsers[0],
        name: uniqueUsers[0],
        isMe: true,
        edited: false,
      },
      {
        username: uniqueUsers[1],
        name: uniqueUsers[1],
        isMe: false,
        edited: false,
      },
    ];
  };

  // Update the dropdown styles to use theme-aware colors
  const dropdownStyles = {
    background: isDark ? "hsl(var(--background))" : "hsl(var(--background))",
    borderColor: isDark ? "hsl(var(--border))" : "hsl(var(--border))",
  };

  // Update the card styles to use theme colors
  const cardStyles = cn(
    "transition-all duration-200",
    isDark
      ? "hover:shadow-[0_0_15px_-5px_hsl(var(--primary))]"
      : "hover:shadow-[0_0_15px_-10px_hsl(var(--primary))]"
  );

  return (
    <main
      className={cn("flex-1 py-6", isDark ? "dark" : "")}
      data-theme={currentScheme}
    >
      <div className="flex flex-col w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search clips, messages..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 bg-background border-border"
            />
          </div>

          <div className="flex items-center gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "transition-colors bg-background border-border",
                    "text-foreground",
                    isDark ? "hover:bg-muted" : "hover:bg-accent"
                  )}
                >
                  Select Chats
                  <span className="ml-2 text-xs text-muted-foreground">
                    ({selectedChats.size}/{availableHashes.length})
                  </span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                className={cn(
                  "w-56",
                  "bg-popover border border-border",
                  "shadow-md"
                )}
                data-theme={currentScheme}
              >
                <DropdownMenuLabel className="text-foreground font-semibold">
                  Filter by Chat
                </DropdownMenuLabel>
                <DropdownMenuSeparator className="bg-border" />
                {availableHashes.map((hash) => (
                  <div
                    key={hash}
                    className="flex items-center px-2 py-2 hover:bg-muted cursor-pointer"
                    onClick={() => toggleChat(hash)}
                  >
                    <Checkbox
                      id={hash}
                      checked={selectedChats.has(hash)}
                      onCheckedChange={() => toggleChat(hash)}
                      className="mr-2"
                    />
                    <label
                      htmlFor={hash}
                      className="text-sm flex-grow cursor-pointer text-foreground"
                    >
                      {chatNames[hash] || "Unnamed Chat"}
                    </label>
                  </div>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  size="icon"
                  className={cn(
                    "bg-background border-border",
                    isDark ? "hover:bg-muted" : "hover:bg-accent",
                    "text-foreground"
                  )}
                >
                  <SlidersHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                className={cn(
                  "w-56",
                  "bg-popover border border-border",
                  "shadow-md"
                )}
                data-theme={currentScheme}
              >
                <DropdownMenuLabel className="text-foreground">
                  Chat Types
                </DropdownMenuLabel>
                <DropdownMenuSeparator className="bg-border" />
                <div className="p-2 flex flex-col gap-2">
                  <div className="flex items-center">
                    <Checkbox
                      id="all"
                      checked={selectedTypes.has("all")}
                      onCheckedChange={(_checked: boolean) => toggleType("all")}
                      className="mr-2"
                    />
                    <label
                      htmlFor="all"
                      className="text-sm cursor-pointer text-foreground"
                    >
                      All Types
                    </label>
                  </div>
                  {["romantic", "friend", "business", "professional"].map(
                    (type) => (
                      <div key={type} className="flex items-center">
                        <Checkbox
                          id={type}
                          checked={selectedTypes.has(type)}
                          onCheckedChange={(_checked: boolean) =>
                            toggleType(type)
                          }
                          className="mr-2"
                        />
                        <label
                          htmlFor={type}
                          className="text-sm capitalize cursor-pointer text-foreground"
                        >
                          {type}
                        </label>
                      </div>
                    )
                  )}
                </div>
                <DropdownMenuSeparator className="bg-border" />
                <DropdownMenuLabel className="text-foreground">
                  Sort by Viral Score
                </DropdownMenuLabel>
                <div className="p-2 flex flex-col gap-2">
                  <div className="flex items-center">
                    <Checkbox
                      id="sort-desc"
                      checked={sortOrder === "desc"}
                      onCheckedChange={() => setSortOrder("desc")}
                      className="mr-2"
                    />
                    <label
                      htmlFor="sort-desc"
                      className="text-sm cursor-pointer text-foreground"
                    >
                      Highest First
                    </label>
                  </div>
                  <div className="flex items-center">
                    <Checkbox
                      id="sort-asc"
                      checked={sortOrder === "asc"}
                      onCheckedChange={() => setSortOrder("asc")}
                      className="mr-2"
                    />
                    <label
                      htmlFor="sort-asc"
                      className="text-sm cursor-pointer text-foreground"
                    >
                      Lowest First
                    </label>
                  </div>
                </div>
              </DropdownMenuContent>
            </DropdownMenu>

            <Select
              value={viewMode}
              onValueChange={(value: ViewMode) => setViewMode(value)}
            >
              <SelectTrigger
                className={cn(
                  "w-[180px] bg-background border-border",
                  isDark ? "hover:bg-muted" : "hover:bg-accent",
                  "text-foreground"
                )}
              >
                <SelectValue placeholder="Select view" />
              </SelectTrigger>
              <SelectContent
                className={cn("bg-popover border border-border", "shadow-md")}
                data-theme={currentScheme}
              >
                <SelectItem value="gallery">Gallery View</SelectItem>
                <SelectItem value="ticker">Ticker View</SelectItem>
                <SelectItem value="editor">Editor View</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {viewMode === "editor" ? (
          <ClipEditor clips={filteredClips} chatCategories={chatCategories} />
        ) : viewMode === "ticker" ? (
          <div
            className={cn(
              "grid gap-3",
              "grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6"
            )}
          >
            {filteredClips.map((clipData, index) => (
              <SimpleClipCard
                key={`${clipData.hash}-${index}`}
                title={clipData.clip.title}
                messages={clipData.clip.messages}
                socialShareCaption={clipData.clip.social_share_caption}
                viralScore={clipData.clip.viral_score}
                chatType={chatCategories[clipData.hash]}
                chatTitle={clipData.chatTitle}
                onClick={() => setSelectedClip(clipData)}
                className={cardStyles}
                isDark={isDark}
              />
            ))}
          </div>
        ) : (
          <div
            className={cn(
              "grid gap-3",
              "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-8 p-4"
            )}
          >
            {filteredClips.map((clipData, index) => {
              // Determine users and default names for PlatformDesign
              const currentClipMessages = clipData.clip.messages; // Already sanitized to [] if needed
              const clipUsersArray = getClipUsers(currentClipMessages);

              const user1Name = clipUsersArray ? clipUsersArray[0].name : "";
              const user2Name = clipUsersArray ? clipUsersArray[1].name : "";
              const user1Username = clipUsersArray
                ? clipUsersArray[0].username
                : "";

              return (
                <div
                  key={`${clipData.hash}-${index}`}
                  className="flex flex-col items-center justify-start cursor-pointer hover:opacity-90 transition-opacity aspect-[9/16] min-h-[400px] relative rounded-lg overflow-hidden"
                  onClick={() => setSelectedClip(clipData)}
                >
                  <h3 className="font-semibold text-xs text-center text-foreground p-2 w-full truncate bg-background/80 backdrop-blur-sm z-10">
                    {clipData.clip.title || "Untitled Clip"}
                  </h3>
                  <div className="flex-1 w-full h-full relative flex items-center justify-center">
                    {/* This inner div is for scaling and centering PlatformDesign */}
                    <div className="transform scale-50 origin-center absolute inset-0 flex items-center justify-center">
                      <PlatformDesign
                        messages={currentClipMessages.map(
                          (msg): Message => ({
                            ...msg,
                            // Handle sender logic carefully if user1Username is empty
                            sender:
                              user1Username && msg.user === user1Username
                                ? "user"
                                : "other",
                            date:
                              msg.date instanceof Date
                                ? msg.date
                                : new Date(msg.date),
                          })
                        )}
                        platform="WhatsApp" // TODO: Consider making this dynamic if chatCategories or clipData provides it
                        user1Name={user1Name}
                        user2Name={user2Name}
                        user1Username={user1Username}
                        isAnonymized={false}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <Dialog
          open={!!selectedClip}
          onOpenChange={() => setSelectedClip(null)}
        >
          <DialogContent
            className={cn(
              "max-w-4xl bg-background border-border",
              isDark ? "shadow-2xl" : "shadow-lg"
            )}
            data-theme={currentScheme}
          >
            {selectedClip && (!users || users.length < 2) ? (
              <div className="p-4 text-center">
                <p className="text-muted-foreground">
                  Unable to display clip editor. Please make sure you're logged
                  in and have access to this chat.
                </p>
              </div>
            ) : (
              selectedClip && (
                <div className="bg-background">
                  <ClipCard
                    title={selectedClip.clip.title}
                    messages={selectedClip.clip.messages}
                    socialShareCaption={selectedClip.clip.social_share_caption}
                    startIndex={selectedClip.clip.start_index}
                    endIndex={selectedClip.clip.end_index}
                    allMessages={selectedClip.clip.messages}
                    initialPlatform="WhatsApp"
                    isAnonymized={false}
                  />
                </div>
              )
            )}
          </DialogContent>
        </Dialog>
      </div>
    </main>
  );
};
