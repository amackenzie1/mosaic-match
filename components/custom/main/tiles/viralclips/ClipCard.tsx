"use client";

import {
  trackAnalysisShare,
  trackError,
} from "@/components/analytics/analytics";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { PhoneFrame } from "@/components/ui/phone-frame";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useGeneralInfo } from "@/lib/contexts/general-info";
import html2canvas from "html2canvas";
import { Copy, Download, Edit2, Send } from "lucide-react";
import React, { useRef, useState } from "react";
import { ClipEditor } from "./ClipEditor";
import { PlatformDesign } from "./PlatformDesign";
import { ClipCardProps, Message, Platform } from "./types";

export const ClipCard: React.FC<ClipCardProps> = ({
  title,
  messages = [],
  socialShareCaption,
  startIndex,
  endIndex,
  allMessages = [],
  initialPlatform = "WhatsApp",
  isAnonymized = false,
  isEditorView = false,
}) => {
  const [platform, setPlatform] = useState<Platform>(initialPlatform);
  const [currentMessages, setCurrentMessages] = useState<Message[]>(messages);
  const [isEditing, setIsEditing] = useState(false);
  const [currentIsAnonymized, setCurrentIsAnonymized] = useState(isAnonymized);
  const messageContainerRef = useRef<HTMLDivElement>(null);
  const phoneRef = useRef<HTMLDivElement>(null);
  const { users } = useGeneralInfo();

  // Early return if no users
  if (!users || users.length < 2) {
    return (
      <Card className="overflow-hidden bg-card">
        <div className="p-6 text-center">
          <p className="text-muted-foreground">
            Unable to display messages. Please ensure you're logged in and have
            access to this chat.
          </p>
        </div>
      </Card>
    );
  }

  if (isEditorView) {
    return (
      <div className="flex flex-col h-full">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="h-3 w-3 rounded-full bg-green-500"></div>
            <span className="text-sm font-medium text-gray-600">
              Live Preview
            </span>
          </div>
          <Select
            value={platform}
            onValueChange={(value: Platform) => setPlatform(value)}
          >
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Platform" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="WhatsApp">WhatsApp</SelectItem>
              <SelectItem value="iMessage">iMessage</SelectItem>
              <SelectItem value="Instagram">Instagram</SelectItem>
              <SelectItem value="Messenger">Messenger</SelectItem>
              <SelectItem value="Android">Android</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div
          ref={phoneRef}
          className="relative flex-1 min-h-0 flex items-center justify-center"
        >
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-[320px] h-[660px] bg-gradient-to-b from-transparent to-gray-100 opacity-50 pointer-events-none rounded-[40px]"></div>
          </div>
          <PhoneFrame>
            <PlatformDesign
              messages={currentMessages}
              platform={platform}
              user2Name={users[1].name}
              user1Username={users[0].name.toLowerCase()}
              isAnonymized={currentIsAnonymized}
            />
          </PhoneFrame>
        </div>
      </div>
    );
  }

  // Early return if no messages
  if (!currentMessages.length) {
    return (
      <Card className="overflow-hidden bg-card">
        <div className="p-6 text-center">
          <p className="text-muted-foreground">
            No messages available to display
          </p>
        </div>
      </Card>
    );
  }

  const [user1, user2] = users;
  const [currentUser1Name, setCurrentUser1Name] = useState(user1.name);
  const [currentUser2Name, setCurrentUser2Name] = useState(user2.name);
  const currentUser1Username = user1.username;

  // Convert dates in messages
  const processedMessages = currentMessages.map((message) => ({
    ...message,
    date: message.date instanceof Date ? message.date : new Date(message.date),
  }));

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

      // Check if the Clipboard API is supported
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
    }
  };

  const handleShare = async () => {
    if (!messageContainerRef.current) return;

    try {
      // First check if the Web Share API is available
      if (!navigator.share || !navigator.canShare) {
        alert(
          "Sharing is not supported on your device. Try downloading instead."
        );
        return;
      }

      const blob = await captureImage(messageContainerRef.current);
      const file = new File([blob], "viral-clip.png", { type: "image/png" });

      const shareData = {
        title: title,
        text: socialShareCaption,
        files: [file],
      };

      // Then check if we can share this specific data
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

      // Check if it's a user abort
      if (error instanceof Error && error.name === "AbortError") {
        // User cancelled sharing - no need for error message
        return;
      }

      alert("Failed to share. Try downloading instead.");
    }
  };

  const handleSaveEdit = (
    newMessages: Message[],
    newPlatform: Platform,
    anonymized: boolean,
    swapUsers: boolean
  ) => {
    try {
      console.log("Saving edit with:", {
        swapUsers,
        messageCount: newMessages.length,
        firstMessage: newMessages[0],
      });

      // Use the messages exactly as they come from the editor
      // The editor has already handled all the necessary transformations
      const updatedMessages = newMessages.map((msg) => ({
        ...msg,
        // Preserve the sender and user assignments from the editor
        sender: msg.sender,
        user: msg.user,
        date: msg.date instanceof Date ? msg.date : new Date(msg.date),
        index: msg.index,
      }));

      console.log("Updated messages:", updatedMessages);

      // Update all state
      setPlatform(newPlatform);
      setCurrentMessages(updatedMessages);
      setCurrentIsAnonymized(anonymized);

      // Update the user names if swapped
      if (swapUsers) {
        console.log("Swapping users:", {
          current1: currentUser1Name,
          current2: currentUser2Name,
        });
        const tempName = currentUser1Name;
        setCurrentUser1Name(currentUser2Name);
        setCurrentUser2Name(tempName);
      }

      setIsEditing(false);
    } catch (error) {
      console.error("Error saving edit:", error);
      setIsEditing(false);
    }
  };

  return (
    <>
      <Card className="overflow-hidden bg-card">
        {/* Title with edit button */}
        <div className="p-3 border-b bg-card flex justify-between items-center">
          <div className="space-y-1">
            <h3 className="font-medium text-lg text-card-foreground">
              {title}
            </h3>
            <p className="text-sm text-muted-foreground">
              {socialShareCaption}
            </p>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsEditing(true)}
            className="text-muted-foreground hover:text-card-foreground"
          >
            <Edit2 className="h-4 w-4" />
          </Button>
        </div>

        {/* Message thread */}
        <div className="relative flex justify-center" ref={messageContainerRef}>
          <PlatformDesign
            messages={processedMessages}
            platform={platform}
            user1Name={currentUser1Name}
            user2Name={currentUser2Name}
            user1Username={currentUser1Username}
            isAnonymized={currentIsAnonymized}
          />
        </div>

        {/* Share options */}
        <div className="p-3 bg-card border-t flex justify-end items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleCopyToClipboard}
            className="text-muted-foreground hover:text-card-foreground"
          >
            <Copy className="h-4 w-4 mr-2" />
            Copy Image
          </Button>

          <Button
            variant="ghost"
            size="sm"
            onClick={handleShare}
            className="text-muted-foreground hover:text-card-foreground"
          >
            <Send className="h-4 w-4 mr-2" />
            Send
          </Button>

          <Button
            variant="ghost"
            size="sm"
            onClick={handleDownload}
            className="text-muted-foreground hover:text-card-foreground"
          >
            <Download className="h-4 w-4 mr-2" />
            Download
          </Button>
        </div>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={isEditing} onOpenChange={setIsEditing}>
        <DialogContent className="max-w-5xl h-[80vh]">
          <DialogHeader>
            <DialogTitle>Edit Clip</DialogTitle>
          </DialogHeader>

          <ClipEditor
            allMessages={allMessages}
            startIndex={startIndex}
            endIndex={endIndex}
            onSave={handleSaveEdit}
            onCancel={() => setIsEditing(false)}
            user1Name={currentUser1Name}
            user2Name={currentUser2Name}
            user1Username={currentUser1Username}
            initialPlatform={platform}
          />
        </DialogContent>
      </Dialog>
    </>
  );
};
