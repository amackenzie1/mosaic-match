"use client";

import { Message } from "@/components/custom/main/tiles/viralclips/types";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import React from "react";

interface SimpleClipCardProps {
  title: string;
  messages: Message[];
  socialShareCaption: string;
  viralScore: number;
  chatType?: string;
  chatTitle?: string;
  onClick?: () => void;
  className?: string;
  isDark?: boolean;
}

export const SimpleClipCard: React.FC<SimpleClipCardProps> = ({
  title,
  messages = [],
  chatType,
  onClick,
  className,
  isDark,
}) => {
  const getBorderColor = (type?: string) => {
    const normalizedType = type?.toLowerCase();
    switch (normalizedType) {
      case "friendship":
      case "friend":
        return "border-blue-400 dark:border-blue-500";
      case "professional":
      case "business":
        return "border-zinc-900 dark:border-zinc-100";
      case "romance":
      case "romantic":
        return "border-red-400 dark:border-red-500";
      case "family":
        return "border-green-400 dark:border-green-500";
      default:
        return "border-muted";
    }
  };

  // Only create scrolling messages if we have messages
  const scrollingMessages = messages?.length ? [...messages, ...messages] : [];

  return (
    <Card
      className={cn(
        "h-[160px] flex flex-col hover:shadow-lg transition-all cursor-pointer group relative overflow-hidden",
        "bg-card hover:bg-accent",
        chatType && `border-l-4 ${getBorderColor(chatType)}`,
        className,
        isDark ? "hover:border-primary/50" : "hover:border-primary/30"
      )}
      onClick={onClick}
    >
      <CardContent className="p-3 flex flex-col h-full">
        {/* Title ticker - continuous loop */}
        <div className="relative overflow-hidden h-6 mb-2">
          <div className="flex animate-ticker whitespace-nowrap">
            {/* First set */}
            <p className="text-xs font-medium inline-block pr-4 text-foreground">
              {title}
            </p>
            {/* Duplicate set for seamless loop */}
            <p className="text-xs font-medium inline-block pr-4 text-foreground">
              {title}
            </p>
            <p className="text-xs font-medium inline-block pr-4 text-foreground">
              {title}
            </p>
          </div>
        </div>

        {/* Messages scroll container - smooth vertical scroll */}
        <div className="relative overflow-hidden flex-1">
          <div className="absolute w-full animate-smooth-scroll">
            {/* First set of messages with padding at end */}
            <div>
              {messages.map((message, index) => {
                const isFirstUser =
                  index === 0 ? true : message.user === messages[0].user;
                return (
                  <div
                    key={`first-${index}`}
                    className={cn(
                      "text-sm py-2 border-b last:border-b-0",
                      "bg-muted/50 text-foreground",
                      isFirstUser
                        ? "text-left ml-0 mr-4"
                        : "text-right ml-4 mr-0"
                    )}
                  >
                    {message.message}
                  </div>
                );
              })}
              {/* Add padding space at the end */}
              <div className="h-16" />
            </div>
            {/* Duplicate set */}
            <div>
              {messages.map((message, index) => {
                const isFirstUser =
                  index === 0 ? true : message.user === messages[0].user;
                return (
                  <div
                    key={`second-${index}`}
                    className={cn(
                      "text-sm py-2 border-b last:border-b-0",
                      "bg-muted/50 text-foreground",
                      isFirstUser
                        ? "text-left ml-0 mr-4"
                        : "text-right ml-4 mr-0"
                    )}
                  >
                    {message.message}
                  </div>
                );
              })}
              {/* Add padding space at the end */}
              <div className="h-16" />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
