"use client";

import {
  trackAnalysisShare,
  trackError,
} from "@/components/analytics/analytics";
import { Message } from "@/components/custom/main/tiles/viralclips/types";
import { Button } from "@/components/ui/button";
import { useGeneralInfo } from "@/lib/contexts/general-info";
import { cn } from "@/lib/utils";
import html2canvas from "html2canvas";
import { useTheme } from "next-themes";
import React, { useEffect, useRef, useState } from "react";
import { ClipEditorPreview } from "./ClipEditorPreview";

interface ClipData {
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
}

interface ClipEditorProps {
  clips: ClipData[];
  chatCategories: Record<string, string>;
}

export const ClipEditor: React.FC<ClipEditorProps> = ({
  clips,
  chatCategories,
}) => {
  const { users, setUsers } = useGeneralInfo();
  const [selectedClip, setSelectedClip] = useState<ClipData | null>(null);
  const [previewClip, setPreviewClip] = useState<ClipData | null>(null);
  const [isEditingMessages, setIsEditingMessages] = useState(false);
  const [selectedMessageIndices, setSelectedMessageIndices] = useState<
    number[]
  >([]);
  const { theme } = useTheme();
  const isDark = theme?.includes("dark");
  const messageContainerRef = useRef<HTMLDivElement>(null);
  const [isAnonymized, setIsAnonymized] = useState(false);

  // Update users whenever a clip is selected
  useEffect(() => {
    if (selectedClip && selectedClip.clip.messages.length > 0) {
      const messages = selectedClip.clip.messages;
      const uniqueUsers = Array.from(
        new Set(messages.map((msg) => msg.user))
      ).slice(0, 2);

      if (uniqueUsers.length === 2) {
        setUsers(
          uniqueUsers.map((username, index) => ({
            username,
            name: username,
            isMe: index === 0,
            edited: false,
          }))
        );
      }
    }
  }, [selectedClip, setUsers]);

  // Initialize selected messages and preview when a clip is selected
  useEffect(() => {
    if (selectedClip) {
      const indices = selectedClip.clip.messages.map((_, idx) => idx);
      setSelectedMessageIndices(indices);
      setPreviewClip(selectedClip);
    }
  }, [selectedClip]);

  const handleClipSelect = (clip: ClipData) => {
    setIsEditingMessages(false);
    setSelectedClip(clip);
  };

  const handleMessageSelect = (index: number) => {
    if (selectedMessageIndices.includes(index)) {
      const newIndices = selectedMessageIndices.filter((i) => i !== index);
      setSelectedMessageIndices(newIndices);
      updatePreview(newIndices);
    } else if (selectedMessageIndices.length < 20) {
      const newIndices = [...selectedMessageIndices, index];
      setSelectedMessageIndices(newIndices);
      updatePreview(newIndices);
    }
  };

  const updatePreview = (indices: number[]) => {
    if (!selectedClip) return;

    const selectedMessages = indices
      .sort((a, b) => a - b)
      .map((idx) => selectedClip.clip.messages[idx]);

    setPreviewClip({
      ...selectedClip,
      clip: {
        ...selectedClip.clip,
        messages: selectedMessages,
      },
    });
  };

  const handleSaveMessageSelection = () => {
    if (previewClip) {
      setSelectedClip(previewClip);
    }
    setIsEditingMessages(false);
  };

  const handleCancelMessageSelection = () => {
    if (selectedClip) {
      setPreviewClip(selectedClip);
      const indices = selectedClip.clip.messages.map((_, idx) => idx);
      setSelectedMessageIndices(indices);
    }
    setIsEditingMessages(false);
  };

  const captureImage = async (ref: HTMLDivElement): Promise<Blob> => {
    try {
      await document.fonts.ready;

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
      Object.assign(clonedRef.style, {
        position: "fixed",
        top: "0",
        left: "0",
        width: `${rect.width}px`,
        height: `${rect.height}px`,
        transform: "none",
        maxHeight: "none",
        overflow: "visible",
      });
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
    if (!messageContainerRef.current || !selectedClip) return;

    try {
      const blob = await captureImage(messageContainerRef.current);
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${selectedClip.clip.title
        .toLowerCase()
        .replace(/\s+/g, "-")}.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      trackAnalysisShare("viral_clip_download");
    } catch (error) {
      console.error("Error downloading image:", error);
      trackError("viral_clip_share", "Download failed");
      alert("Failed to download the image. Please try again.");
    }
  };

  const handleShare = async () => {
    if (!messageContainerRef.current || !selectedClip) return;

    try {
      if (!navigator.share || !navigator.canShare) {
        alert(
          "Sharing is not supported on your device. Try downloading instead."
        );
        return;
      }

      const blob = await captureImage(messageContainerRef.current);
      const file = new File([blob], "viral-clip.png", { type: "image/png" });

      const shareData = {
        title: selectedClip.clip.title,
        text: selectedClip.clip.social_share_caption,
        files: [file],
      };

      if (!navigator.canShare(shareData)) {
        alert(
          "Your device doesn't support sharing this type of content. Try downloading instead."
        );
        return;
      }

      await navigator.share(shareData);
      trackAnalysisShare("viral_clip_native_share");
    } catch (error) {
      console.error("Error sharing image:", error);
      trackError("viral_clip_share", "Share failed");

      if (error instanceof Error && error.name === "AbortError") {
        return;
      }

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
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-[calc(100vh-12rem)]">
      {/* Left column: Preview/Editor */}
      <div
        className={cn(
          "rounded-xl shadow-md overflow-auto",
          "bg-card border border-border",
          isDark ? "dark" : ""
        )}
        data-theme={theme}
      >
        {selectedClip && users && users.length >= 2 ? (
          <ClipEditorPreview
            key={`${selectedClip.hash}-${selectedClip.clip.start_index}`}
            title={previewClip?.clip.title || selectedClip.clip.title}
            messages={previewClip?.clip.messages || selectedClip.clip.messages}
            socialShareCaption={
              previewClip?.clip.social_share_caption ||
              selectedClip.clip.social_share_caption
            }
            startIndex={
              previewClip?.clip.start_index || selectedClip.clip.start_index
            }
            endIndex={
              previewClip?.clip.end_index || selectedClip.clip.end_index
            }
            allMessages={selectedClip.clip.messages}
            initialPlatform="WhatsApp"
            isAnonymized={false}
            onEdit={() => {
              setIsEditingMessages(true);
            }}
          />
        ) : (
          <div className="h-full flex items-center justify-center text-muted-foreground">
            <p>Select a clip to edit</p>
          </div>
        )}
      </div>

      {/* Right column: Clips list or Message selector */}
      <div
        className={cn(
          "rounded-xl shadow-md overflow-hidden flex flex-col",
          "bg-card border border-border",
          isDark ? "dark" : ""
        )}
        data-theme={theme}
      >
        {isEditingMessages && selectedClip ? (
          <>
            <div className="p-6 border-b border-border flex items-center justify-between bg-muted/50">
              <h2 className="text-sm font-semibold text-foreground">
                Select Messages
              </h2>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleCancelMessageSelection}
                >
                  Cancel
                </Button>
                <Button size="sm" onClick={handleSaveMessageSelection}>
                  Save
                </Button>
              </div>
            </div>
            <div className="flex-1 overflow-y-auto">
              <div className="p-4 text-sm text-muted-foreground mb-2">
                {selectedMessageIndices.length} / 20 messages selected
              </div>
              <div className="space-y-2 px-4">
                {selectedClip.clip.messages.map((msg, idx) => (
                  <div
                    key={idx}
                    className={cn(
                      "p-3 rounded cursor-pointer border transition-colors",
                      selectedMessageIndices.includes(idx)
                        ? "bg-primary/10 border-primary text-primary-foreground"
                        : "hover:bg-muted border-transparent text-foreground"
                    )}
                    onClick={() => handleMessageSelect(idx)}
                  >
                    <div className="font-medium">{msg.user || "Unknown"}</div>
                    <div className="text-sm text-muted-foreground">
                      {msg.message}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </>
        ) : (
          <>
            <div className="p-6 border-b border-border bg-muted/50">
              <h2 className="text-sm font-semibold text-foreground">
                Your Clips
              </h2>
            </div>
            <div className="flex-1 overflow-y-auto">
              {clips.map((clip) => (
                <button
                  key={`${clip.hash}-${clip.clip.title}-${clip.clip.start_index}`}
                  onClick={() => handleClipSelect(clip)}
                  className={cn(
                    "w-full text-left p-4 border-b border-border",
                    clip === selectedClip
                      ? "bg-primary/5 hover:bg-primary/10"
                      : "hover:bg-muted",
                    "transition-colors"
                  )}
                >
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-medium text-foreground text-lg">
                      {clip.clip.title}
                    </h3>
                    <span className="text-sm px-2 py-1 bg-primary/10 text-primary rounded-full">
                      Score: {clip.clip.viral_score}
                    </span>
                  </div>
                  <div className="space-y-2 text-sm font-mono">
                    {clip.clip.messages.slice(0, 4).map((msg, i) => (
                      <div key={i} className="text-muted-foreground">
                        {msg.user || "Unknown"}: {msg.message}
                      </div>
                    ))}
                  </div>
                  {clip === selectedClip && (
                    <div className="mt-3 text-sm text-muted-foreground bg-muted p-3 rounded-lg">
                      {chatCategories[clip.hash] || "General Chat"}
                    </div>
                  )}
                </button>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
};
