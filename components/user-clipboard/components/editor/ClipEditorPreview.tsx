"use client";

import {
  trackAnalysisShare,
  trackError,
} from "@/components/analytics/analytics";
import { PlatformDesign } from "@/components/custom/main/tiles/viralclips/PlatformDesign";
import {
  Message,
  Platform,
} from "@/components/custom/main/tiles/viralclips/types";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useGeneralInfo } from "@/lib/contexts/general-info";
import { cn } from "@/lib/utils";
import html2canvas from "html2canvas";
import { ArrowUpDown, Copy, Download, Edit2, Send, UserX } from "lucide-react";
import React, { useEffect, useRef, useState } from "react";

interface ClipEditorPreviewProps {
  title: string;
  messages: Message[];
  socialShareCaption: string;
  startIndex: number;
  endIndex: number;
  allMessages: Message[];
  initialPlatform?: Platform;
  isAnonymized?: boolean;
  onEdit?: (messages: Message[]) => void;
}

export const ClipEditorPreview: React.FC<ClipEditorPreviewProps> = ({
  title,
  messages = [],
  socialShareCaption,
  startIndex,
  endIndex,
  allMessages = [],
  initialPlatform = "WhatsApp",
  isAnonymized = false,
  onEdit,
}) => {
  const { users, setUsers } = useGeneralInfo();
  const [platform, setPlatform] = useState<Platform>(() => {
    // Try to get the saved platform from localStorage, fallback to initialPlatform
    const savedPlatform = localStorage.getItem("selectedPlatform");
    return (savedPlatform as Platform) || "Space";
  });
  const [currentMessages, setCurrentMessages] = useState<Message[]>(messages);
  const [currentIsAnonymized, setCurrentIsAnonymized] = useState(isAnonymized);
  const [currentUser1Name, setCurrentUser1Name] = useState("");
  const [currentUser2Name, setCurrentUser2Name] = useState("");
  const [currentUser1Username, setCurrentUser1Username] = useState("");
  const messageContainerRef = useRef<HTMLDivElement>(null);
  const phoneRef = useRef<HTMLDivElement>(null);
  const [isDownloading, setIsDownloading] = useState(false);

  // Save platform to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem("selectedPlatform", platform);
  }, [platform]);

  // Update user names when users change
  useEffect(() => {
    if (users && users.length >= 2) {
      const [user1, user2] = users;
      setCurrentUser1Name(user1.name);
      setCurrentUser2Name(user2.name);
      setCurrentUser1Username(user1.username);
    }
  }, [users]);

  // Update messages when prop changes
  useEffect(() => {
    setCurrentMessages(messages);
  }, [messages]);

  // Guard against truly missing user context (e.g., auth issue)
  // but allow rendering if messages are explicitly empty (sanitized clip).
  // If `messages` is an empty array, it implies the clip is valid for display
  // but has no content, and `users` might be null as a consequence.
  if ((!users || users.length < 2) && messages.length > 0) {
    // This case means we have messages, but the user context is invalid for them.
    // This could be a genuine issue if messages exist but users couldn't be derived.
    return (
      <div className="h-full flex items-center justify-center text-muted-foreground">
        <p>
          Unable to determine users for these messages. Please check chat data.
        </p>
      </div>
    );
  }
  // If `messages.length === 0`, we proceed to render the editor frame with empty messages,
  // even if `users` is null (which it would be if derived from these empty messages).
  // The `PlatformDesign` component should handle empty `currentUser1Name`, `currentUser2Name` gracefully.

  // Convert dates in messages and ensure required fields
  const processedMessages = currentMessages.map((message) => ({
    ...message,
    user: message.user || "Unknown",
    message: message.message || "",
    date: message.date instanceof Date ? message.date : new Date(message.date),
  }));

  // Calculate container dimensions for Space view
  const getSpaceViewDimensions = () => {
    if (platform !== "Space") return { width: 320, height: 660 };

    const messageCount = processedMessages.length;
    const minHeight = 400;
    const maxHeight = 660;

    // For Space view, calculate height based on message count
    // Base height: 48px for container padding (24px top + 24px bottom)
    // Per message: ~32px minimum (15px text + 10px padding + 7px margin)
    const baseHeight = 48;
    const messageHeight = Math.min(
      40,
      Math.max(32, Math.floor((maxHeight - baseHeight) / messageCount))
    );
    const estimatedHeight = Math.min(
      maxHeight,
      Math.max(minHeight, baseHeight + messageCount * messageHeight)
    );

    return {
      width: 320,
      height: estimatedHeight,
    };
  };

  const dimensions = getSpaceViewDimensions();

  const captureImage = async (ref: HTMLDivElement): Promise<Blob> => {
    try {
      // Wait for fonts and preload images
      await document.fonts.ready;

      // Pre-load images first
      const loadImage = async (src: string): Promise<string> => {
        const img = new Image();
        img.crossOrigin = "anonymous";
        return new Promise((resolve, reject) => {
          img.onload = () => {
            const canvas = document.createElement("canvas");
            canvas.width = img.width;
            canvas.height = img.height;
            const ctx = canvas.getContext("2d");
            if (!ctx) {
              reject(new Error("Could not get canvas context"));
              return;
            }
            ctx.drawImage(img, 0, 0);
            resolve(canvas.toDataURL());
          };
          img.onerror = reject;
          img.src = src;
        });
      };

      // Load all required images first
      const [patternUrl, faviconUrl] = await Promise.all([
        loadImage("/whatsapp-pattern.png"),
        loadImage("/favicon.png"),
      ]);

      await new Promise((resolve) => setTimeout(resolve, 300));

      // Get the chat content element (not the phone frame)
      const chatContent = ref.querySelector(".flex.flex-col.h-full");
      if (!chatContent) {
        throw new Error("Chat content not found");
      }

      const rect = chatContent.getBoundingClientRect();
      const scale = 2;

      // Create the canvas with the correct dimensions
      const canvas = document.createElement("canvas");
      canvas.width = rect.width * scale;
      canvas.height = rect.height * scale;
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        throw new Error("Could not get canvas context");
      }

      // Step 1: Create and fill the background pattern
      const pattern = new Image();
      pattern.src = patternUrl;
      await new Promise((resolve) => {
        pattern.onload = resolve;
        pattern.onerror = resolve;
      });

      const patternObj = ctx.createPattern(pattern, "repeat");
      if (patternObj) {
        // Fill the entire canvas with pattern
        ctx.fillStyle = patternObj;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      }

      // Step 2: Add the cloned content with styles
      const clonedRef = chatContent.cloneNode(true) as HTMLDivElement;
      clonedRef.style.position = "fixed";
      clonedRef.style.top = "0";
      clonedRef.style.left = "0";
      clonedRef.style.width = `${rect.width}px`;
      clonedRef.style.height = `${rect.height}px`;
      clonedRef.style.transform = "none";
      clonedRef.style.maxHeight = "none";
      clonedRef.style.overflow = "visible";
      document.body.appendChild(clonedRef);

      try {
        const contentCanvas = await html2canvas(clonedRef, {
          backgroundColor: null,
          scale: scale,
          useCORS: true,
          allowTaint: true,
          logging: false,
          width: rect.width,
          height: rect.height,
          windowWidth: rect.width,
          windowHeight: rect.height,
          x: 0,
          y: 0,
          scrollX: 0,
          scrollY: 0,
          foreignObjectRendering: true,
          removeContainer: false,
          onclone: (clonedDoc) => {
            const style = clonedDoc.createElement("style");
            style.textContent = `
              /* Remove ALL backgrounds except message container */
              *, *::before, *::after {
                background: transparent !important;
                background-color: transparent !important;
                background-image: none !important;
              }

              /* Keep only message bubbles and header */
              .bg-\\[#DCF8C6\\] {
                background-color: #DCF8C6 !important;
              }
              .bg-white {
                background-color: white !important;
              }
              .bg-\\[#075E54\\] {
                background-color: #075E54 !important;
              }
              .bg-\\[#007AFF\\] {
                background-color: #007AFF !important;
              }
              .bg-\\[#E9E9EB\\] {
                background-color: #E9E9EB !important;
              }
              .bg-\\[#F2F2F7\\] {
                background-color: #F2F2F7 !important;
              }

              /* Keep text colors */
              .text-white {
                color: white !important;
              }

              /* Remove all other backgrounds */
              .bg-\\[#F0F2F5\\],
              .bg-\\[#E9EDEF\\],
              .bg-\\[#DFE5E7\\],
              .bg-\\[#D9D9D9\\],
              .bg-\\[#E5DDD5\\],
              .bg-card,
              .bg-black,
              .flex-1[class*="bg-"],
              .flex.items-center.justify-between {
                background: transparent !important;
                background-color: transparent !important;
                background-image: none !important;
              }

              /* Clean up favicon area */
              img[src$="favicon.png"] {
                opacity: 0 !important;
              }

              /* Ensure proper clipping */
              .flex.flex-col.h-full.relative {
                overflow: hidden !important;
                border-radius: 0 !important;
              }

              /* Platform-specific message container styles */
              [class*="messageContainer"] {
                background-color: transparent !important;
              }

              /* WhatsApp pattern only in WhatsApp message container */
              .bg-\\[url\\(\\'\\\/whatsapp-pattern\\.png\\'\\)\\] {
                background-image: url("/whatsapp-pattern.png") !important;
                background-repeat: repeat !important;
                background-size: 350px auto !important;
                background-color: #E5DDD5 !important;
              }

              /* iMessage specific styles */
              .bg-\\[#F2F2F7\\] {
                background-color: #F2F2F7 !important;
              }
            `;
            clonedDoc.head.appendChild(style);
          },
        });

        // Draw the content on top of the background
        ctx.drawImage(contentCanvas, 0, 0);

        // Step 3: Add favicon
        const favicon = new Image();
        favicon.src = faviconUrl;
        await new Promise((resolve) => {
          favicon.onload = resolve;
          favicon.onerror = resolve;
        });

        // Find favicon elements and replace their content
        const faviconElements = clonedRef.querySelectorAll(
          'img[src$="favicon.png"]'
        );
        faviconElements.forEach((element) => {
          const rect = (element as HTMLElement).getBoundingClientRect();
          ctx.drawImage(
            favicon,
            rect.left * scale,
            rect.top * scale,
            rect.width * scale,
            rect.height * scale
          );
        });

        return new Promise<Blob>((resolve, reject) => {
          try {
            canvas.toBlob(
              (blob) => {
                if (blob) {
                  resolve(blob);
                } else {
                  reject(new Error("Failed to create image blob"));
                }
              },
              "image/png",
              1.0
            );
          } catch (error) {
            console.error("Error converting canvas to blob:", error);
            reject(error);
          }
        });
      } finally {
        document.body.removeChild(clonedRef);
      }
    } catch (error) {
      console.error("Error during image capture:", error);
      throw error;
    }
  };

  const handleCopyToClipboard = async () => {
    if (!messageContainerRef.current) return;

    try {
      const blob = await captureImage(messageContainerRef.current);
      if (!navigator.clipboard?.write) {
        alert(
          "Copying to clipboard is not supported in your browser. Try downloading instead."
        );
        return;
      }

      const clipboardItem = new ClipboardItem({ "image/png": blob });
      await navigator.clipboard.write([clipboardItem]);
      trackAnalysisShare("viral_clip_clipboard");
      alert("Image copied to clipboard!");
    } catch (error) {
      console.error("Error handling clipboard operation:", error);
      trackError("viral_clip_share", "Clipboard API failed");
      alert("Couldn't copy to clipboard. Try downloading instead.");
    }
  };

  const handleDownload = async () => {
    if (!messageContainerRef.current) return;

    try {
      setIsDownloading(true);
      const blob = await captureImage(messageContainerRef.current);
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${title.toLowerCase().replace(/\s+/g, "-")}.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      trackAnalysisShare("viral_clip_download");
    } catch (error) {
      console.error("Error downloading image:", error);
      trackError("viral_clip_share", "Download failed");
      alert("Failed to download the image. Please try again.");
    } finally {
      setIsDownloading(false);
    }
  };

  const handleShare = async () => {
    if (!messageContainerRef.current) return;

    try {
      if (!navigator.share || !navigator.canShare) {
        alert(
          "Sharing is not supported on your device. Try downloading instead."
        );
        return;
      }

      const blob = await captureImage(messageContainerRef.current);
      const file = new File([blob], "viral-clip.png", { type: "image/png" });
      const shareData = { title, text: socialShareCaption, files: [file] };

      if (!navigator.canShare(shareData)) {
        alert(
          "Your device doesn't support sharing this type of content. Try downloading instead."
        );
        return;
      }

      await navigator.share(shareData);
      trackAnalysisShare("viral_clip_native_share");
    } catch (error) {
      if (error instanceof Error && error.name === "AbortError") return;
      console.error("Error sharing image:", error);
      trackError("viral_clip_share", "Share failed");
      alert("Failed to share. Try downloading instead.");
    }
  };

  const handleSwapUsers = () => {
    if (!users || users.length < 2) return;
    setUsers([
      { ...users[1], isMe: true },
      { ...users[0], isMe: false },
    ]);
  };

  return (
    <div className="flex flex-col h-full">
      {/* Controls Bar - Fixed at top */}
      <div
        className={cn(
          "flex items-center justify-start gap-2 p-2 border-b sticky top-0 z-10",
          "bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60"
        )}
      >
        <Select
          value={platform}
          onValueChange={(value: Platform) => setPlatform(value)}
        >
          <SelectTrigger className="h-8 w-24 text-xs">
            <SelectValue placeholder="Platform" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="WhatsApp">WhatsApp</SelectItem>
            <SelectItem value="iMessage">iMessage</SelectItem>
            <SelectItem value="Space">Space</SelectItem>
          </SelectContent>
        </Select>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setCurrentIsAnonymized(!currentIsAnonymized)}
          className={cn(
            "h-8 w-8",
            "text-foreground hover:text-foreground hover:bg-muted"
          )}
          title="Hide Names"
        >
          <UserX className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={handleSwapUsers}
          className={cn(
            "h-8 w-8",
            "text-foreground hover:text-foreground hover:bg-muted"
          )}
          title="Swap People"
        >
          <ArrowUpDown className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => onEdit?.(currentMessages)}
          className={cn(
            "h-8 w-8",
            "text-foreground hover:text-foreground hover:bg-muted"
          )}
          title="Edit Messages"
        >
          <Edit2 className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={handleCopyToClipboard}
          className={cn(
            "h-8 w-8",
            "text-foreground hover:text-foreground hover:bg-muted"
          )}
          title="Copy"
        >
          <Copy className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={handleShare}
          className={cn(
            "h-8 w-8",
            "text-foreground hover:text-foreground hover:bg-muted"
          )}
          title="Share"
        >
          <Send className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={handleDownload}
          className={cn(
            "h-8 w-8",
            "text-foreground hover:text-foreground hover:bg-muted"
          )}
          title="Download"
          disabled={isDownloading}
        >
          {isDownloading ? (
            <div className="h-4 w-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          ) : (
            <Download className="h-4 w-4" />
          )}
        </Button>
      </div>

      {/* Phone Preview with scrollable container */}
      <div
        className={cn(
          "flex-1 p-4 flex items-center justify-center min-h-[600px] overflow-y-auto",
          "bg-background"
        )}
        ref={messageContainerRef}
      >
        <div
          ref={phoneRef}
          className="relative transform-gpu"
          style={{
            width: `${dimensions.width}px`,
            height: `${dimensions.height}px`,
          }}
        >
          <PlatformDesign
            platform={platform}
            messages={processedMessages}
            user1Name={currentUser1Name}
            user2Name={currentUser2Name}
            user1Username={currentUser1Username}
            isAnonymized={currentIsAnonymized}
          />
        </div>
      </div>
    </div>
  );
};

// Helper function to load images
const loadImage = async (src: string): Promise<string> => {
  const img = new Image();
  img.crossOrigin = "anonymous";
  return new Promise((resolve, reject) => {
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        reject(new Error("Could not get canvas context"));
        return;
      }
      ctx.drawImage(img, 0, 0);
      resolve(canvas.toDataURL());
    };
    img.onerror = reject;
    img.src = src;
  });
};

// Styles for image capture
const CAPTURE_STYLES = `
  /* Remove ALL backgrounds except message container */
  *, *::before, *::after {
    background: transparent !important;
    background-color: transparent !important;
    background-image: none !important;
  }

  /* Keep only message bubbles and header */
  .bg-\\[#DCF8C6\\] {
    background-color: #DCF8C6 !important;
  }
  .bg-white {
    background-color: white !important;
  }
  .bg-\\[#075E54\\] {
    background-color: #075E54 !important;
  }
  .bg-\\[#007AFF\\] {
    background-color: #007AFF !important;
  }
  .bg-\\[#E9E9EB\\] {
    background-color: #E9E9EB !important;
  }
  .bg-\\[#F2F2F7\\] {
    background-color: #F2F2F7 !important;
  }

  /* Keep text colors */
  .text-white {
    color: white !important;
  }

  /* Remove all other backgrounds */
  .bg-\\[#F0F2F5\\],
  .bg-\\[#E9EDEF\\],
  .bg-\\[#DFE5E7\\],
  .bg-\\[#D9D9D9\\],
  .bg-\\[#E5DDD5\\],
  .bg-card,
  .bg-black,
  .flex-1[class*="bg-"],
  .flex.items-center.justify-between {
    background: transparent !important;
    background-color: transparent !important;
    background-image: none !important;
  }

  /* Clean up favicon area */
  img[src$="favicon.png"] {
    opacity: 0 !important;
  }

  /* Ensure proper clipping */
  .flex.flex-col.h-full.relative {
    overflow: hidden !important;
    border-radius: 0 !important;
  }

  /* Platform-specific message container styles */
  [class*="messageContainer"] {
    background-color: transparent !important;
  }

  /* WhatsApp pattern only in WhatsApp message container */
  .bg-\\[url\\(\\'\\\/whatsapp-pattern\\.png\\'\\)\\] {
    background-image: url("/whatsapp-pattern.png") !important;
    background-repeat: repeat !important;
    background-size: 350px auto !important;
    background-color: #E5DDD5 !important;
  }

  /* iMessage specific styles */
  .bg-\\[#F2F2F7\\] {
    background-color: #F2F2F7 !important;
  }
`;
