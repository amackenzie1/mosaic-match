import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useGeneralInfo } from "@/lib/contexts/general-info";
import { detectClips } from "@/lib/utils/clipDetection";
import { useS3Fetcher } from "@/lib/utils/fetcher";
import { uploadJsonToS3 } from "@amackenzie1/mosaic-lib";
import { AlertCircle, Film, Loader2 } from "lucide-react";
import React, { useState } from "react";
import { ClipCard } from "./ClipCard";
import { Message } from "./types";

interface ClipWithMessages {
  title: string;
  start_index: number;
  end_index: number;
  social_share_caption: string;
  messages: Message[];
}

interface ClipsData {
  clips: ClipWithMessages[];
}

// Generator function to handle both detection and message mapping
const generateClips = async (parsedData: any[]) => {
  if (!parsedData?.length) {
    return { clips: [] };
  }

  console.log("Generating clips from parsed data:", parsedData.length);
  const newClips = await detectClips(parsedData);

  // Transform clips to include messages
  const clipsWithMessages = newClips.clips.map((clip) => {
    const clipMessages = parsedData
      .filter((m) => m.index >= clip.start_index && m.index <= clip.end_index)
      .map((m) => ({
        user: m.user,
        message: m.message,
        date: m.date,
        index: m.index,
      }));

    return {
      ...clip,
      messages: clipMessages,
    };
  });

  console.log("Generated clips with messages:", clipsWithMessages);
  return { clips: clipsWithMessages };
};
export const ClipGrid: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const { parsedData, hash, users } = useGeneralInfo();

  // Use S3 fetcher with automatic generation
  const {
    data: clipsData,
    isLoading,
    error: s3Error,
    mutate,
  } = useS3Fetcher<ClipsData>({
    cachePath: `chat/${hash}/viral-clips.json`,
    generator: () => generateClips(parsedData || []),
  });

  const handleCreateClip = async (selectedMessages: Message[]) => {
    if (selectedMessages.length === 0) {
      setIsCreating(false);
      return;
    }

    try {
      const sortedMessages = [...selectedMessages].sort(
        (a, b) => a.index - b.index
      );

      const newClip = {
        title: "Custom Clip",
        start_index: sortedMessages[0].index,
        end_index: sortedMessages[sortedMessages.length - 1].index,
        social_share_caption: "Custom clip created by user",
        messages: sortedMessages,
      };

      const updatedClips = {
        clips: [...(clipsData?.clips || []), newClip],
      };

      if (hash) {
        await uploadJsonToS3(`chat/${hash}/viral-clips.json`, updatedClips);
        mutate();
      }
    } catch (error) {
      console.error("Error saving custom clip:", error);
      setError("Failed to save custom clip");
    }

    setIsCreating(false);
  };

  const handleRegenerateClips = async () => {
    try {
      const newClipsData = await generateClips(parsedData || []);
      if (hash) {
        await uploadJsonToS3(`chat/${hash}/viral-clips.json`, newClipsData);
        mutate();
      }
    } catch (error) {
      console.error("Error regenerating clips:", error);
      setError("Failed to regenerate clips");
    }
  };

  if (!users || users.length < 2) return null;

  return (
    <>
      <Button
        variant="outline"
        size="lg"
        className="font-semibold"
        onClick={() => setIsOpen(true)}
      >
        {isLoading ? (
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        ) : (
          <Film className="mr-2 h-4 w-4" />
        )}
        View Clips
      </Button>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-7xl w-[95vw] max-h-[90vh] overflow-auto">
          <DialogHeader>
            <div className="flex items-center">
              <DialogTitle className="flex items-center gap-2">
                <Film className="h-5 w-5" />
                Chat Clips
              </DialogTitle>
            </div>
          </DialogHeader>

          {isLoading ? (
            <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="text-sm text-muted-foreground">Loading clips...</p>
            </div>
          ) : s3Error ? (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>Failed to load clips</AlertDescription>
            </Alert>
          ) : !clipsData?.clips?.length ? (
            <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
              <p className="text-sm text-muted-foreground">
                No clips found in this chat.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 p-6">
              {clipsData.clips.map((clip, index) => (
                <ClipCard
                  key={index}
                  title={clip.title}
                  messages={clip.messages || []}
                  socialShareCaption={clip.social_share_caption}
                  startIndex={clip.start_index}
                  endIndex={clip.end_index}
                  allMessages={parsedData || []}
                />
              ))}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
};
