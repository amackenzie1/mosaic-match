"use client";

import React from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Hourglass, Check, XCircle, Loader2 } from "lucide-react";
import Typewriter from "./Typewriter";
import { MatchPair, MatchingStatus } from "@/components/mosaic-match/types";
import { MatchingUIStatus } from "@/components/mosaic-match/hooks/use-mosaic-match";

interface MatchWaitingStateProps {
  userId: string;
  onGoBack: () => void;
  status: MatchingUIStatus;
  waitTimeMinutes: number;
  matchingStatus: MatchingStatus | null;
  currentMatch: MatchPair | null;
}

const MatchWaitingState: React.FC<MatchWaitingStateProps> = ({ 
  userId, 
  onGoBack, 
  status, 
  waitTimeMinutes, 
  matchingStatus, 
  currentMatch 
}) => {
  // Different status messages based on the current status
  const getStatusIcon = () => {
    switch (status) {
      case 'processing':
        return <Loader2 className="size-5 animate-spin" />;
      case 'waiting':
        return <Hourglass className="size-5" />;
      case 'matched':
        return <Check className="size-5" />;
      case 'not-eligible':
        return <XCircle className="size-5" />;
      default:
        return <Hourglass className="size-5" />;
    }
  };

  const getStatusTitle = () => {
    switch (status) {
      case 'processing':
        return "Processing your profile";
      case 'waiting':
        return "Finding your match";
      case 'matched':
        return "Match found!";
      case 'not-eligible':
        return "Not eligible for matching";
      default:
        return "Finding your match";
    }
  };

  const getStatusSubtitle = () => {
    switch (status) {
      case 'processing':
        return "We're analyzing your conversation patterns";
      case 'waiting':
        return "You're in the queue for the next matching cycle";
      case 'matched':
        return "You've been matched with a compatible user";
      case 'not-eligible':
        return "We need more data to find good matches for you";
      default:
        return "We're analyzing your conversation patterns";
    }
  };

  // Different typing messages based on the current status
  const getTypingMessages = () => {
    switch (status) {
      case 'processing':
        return [
          "Analyzing your communication styles...",
          "Identifying key traits from your chats...",
          "Creating your matching profile...",
          "Preparing for the matching queue...",
        ];
      case 'waiting':
        return [
          "Analyzing your communication styles...",
          "Identifying matching patterns...",
          "Calculating compatibility scores...",
          "Searching for your ideal match...",
          "Processing relationship dynamics...",
        ];
      case 'matched':
        return [
          "Match found! Opening communication channel...",
          "Setting up your connection...",
          "Ready to start communicating!",
        ];
      case 'not-eligible':
        return [
          "Analyzing available data...",
          "More conversation data needed...",
          "Continue using the app to qualify for matching...",
        ];
      default:
        return [
          "Analyzing your communication styles...",
          "Identifying matching patterns...",
          "Calculating compatibility scores...",
          "Searching for your ideal match...",
        ];
    }
  };

  // Format the wait time in a human-readable format
  const formatWaitTime = () => {
    if (waitTimeMinutes < 1) {
      return "Less than a minute";
    } else if (waitTimeMinutes < 60) {
      return `${waitTimeMinutes} minute${waitTimeMinutes === 1 ? '' : 's'}`;
    } else {
      const hours = Math.floor(waitTimeMinutes / 60);
      const minutes = waitTimeMinutes % 60;
      return `${hours} hour${hours === 1 ? '' : 's'}${minutes > 0 ? ` ${minutes} minute${minutes === 1 ? '' : 's'}` : ''}`;
    }
  };

  return (
    <div className="w-full max-w-3xl mx-auto px-4 py-12">
      {/* Status card with header, progress bar and status message */}
      <div className="bg-card dark:bg-card border border-border rounded-lg shadow-sm p-8 mb-6">
        <div className="flex flex-col gap-6">
          {/* Header with status icon */}
          <div className="flex items-center gap-3">
            <div className="size-9 rounded-full bg-primary/10 dark:bg-primary/20 flex items-center justify-center text-primary dark:text-primary-foreground">
              {getStatusIcon()}
            </div>
            <div>
              <h2 className="text-lg font-medium text-foreground">{getStatusTitle()}</h2>
              <p className="text-sm text-muted-foreground">{getStatusSubtitle()}</p>
            </div>
          </div>

          {/* Progress bar animation - only show for processing/waiting states */}
          {(status === 'processing' || status === 'waiting') && (
            <div className="w-full bg-primary/10 h-2 rounded-full overflow-hidden">
              <motion.div 
                className="h-full bg-primary"
                initial={{ width: "15%" }}
                animate={{ width: ["15%", "90%", "40%", "75%", "55%"] }}
                transition={{ 
                  duration: 30, 
                  times: [0, 0.3, 0.5, 0.7, 1],
                  ease: "easeInOut",
                  repeat: Infinity,
                  repeatType: "reverse"
                }}
              />
            </div>
          )}

          {/* For matched state, show static full progress bar */}
          {status === 'matched' && (
            <div className="w-full bg-primary/10 h-2 rounded-full overflow-hidden">
              <div className="h-full bg-primary w-full" />
            </div>
          )}

          {/* Status message */}
          <div className="min-h-[3rem] flex items-center">
            <Typewriter
              messages={getTypingMessages()}
              typingSpeed={50}
              deletingSpeed={30}
              pauseDuration={2000}
            />
          </div>
        </div>
      </div>

      {/* Details card with match information */}
      <div className="bg-card dark:bg-card border border-border rounded-lg shadow-sm overflow-hidden mb-6">
        <div className="p-5 border-b border-border">
          <h3 className="font-medium">Match Details</h3>
        </div>
        <div className="divide-y divide-border">
          <div className="p-5 flex justify-between items-center">
            <span className="text-sm text-muted-foreground">Status</span>
            <span className="font-medium">{status.charAt(0).toUpperCase() + status.slice(1)}</span>
          </div>
          <div className="p-5 flex justify-between items-center">
            <span className="text-sm text-muted-foreground">Wait time</span>
            <span className="font-medium">{formatWaitTime()}</span>
          </div>
          <div className="p-5 flex justify-between items-center">
            <span className="text-sm text-muted-foreground">Match type</span>
            <span className="font-medium">Communication style</span>
          </div>
          <div className="p-5 flex justify-between items-center">
            <span className="text-sm text-muted-foreground">Match cycle</span>
            <span className="font-medium">Every 4 hours</span>
          </div>
          {/* Show match information if matched */}
          {status === 'matched' && currentMatch && (
            <div className="p-5 flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Match score</span>
              <span className="font-medium">{Math.round(currentMatch.score * 100)}%</span>
            </div>
          )}
          <div className="p-5 flex justify-between items-center">
            <span className="text-sm text-muted-foreground">User ID</span>
            <span className="font-mono text-xs bg-muted p-1 rounded">{userId.substring(0, 16)}...</span>
          </div>
        </div>
      </div>

      {/* Information text and return button */}
      <div className="text-center space-y-4">
        <p className="text-sm text-muted-foreground max-w-md mx-auto">
          {status === 'matched' 
            ? "You've been matched! Visit the chat section to start communicating with your match."
            : "We'll notify you when we've found your match. You can return to the introduction screen if you want to cancel."}
        </p>
        <Button variant="ghost" size="sm" onClick={onGoBack} className="gap-2">
          <ArrowLeft className="h-4 w-4" />
          <span>Return to introduction</span>
        </Button>
      </div>
    </div>
  );
};

export default MatchWaitingState;