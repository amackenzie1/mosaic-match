import {
  trackChatProcessing,
  trackChatUpload,
  trackError,
  trackJourneyStep,
} from "@/components/analytics/analytics";
import { withFileUploadAndParse } from "@/components/custom/general/FileUploadAndParse";
import { useIsMobile } from "@/components/ui/use-mobile";
import { cn } from "@/lib/utils";
import { ArrowUpFromLine, FileText } from "lucide-react";
import React, { useCallback } from "react";

// Define the accepted file types as a constant
const ACCEPTED_FILE_TYPES = ".txt,.zip,.json,.db";

interface UploadAreaProps {
  onUploadSuccess?: (chatId: string) => void;
  useDetailedInstructions?: boolean;
  onDetailedUploadClick?: () => void;
}

const UploadAreaComponent: React.FC<
  UploadAreaProps & {
    onFileUpload: (file: File) => void;
    isLoading: boolean;
    error: string | null;
    fileInputRef: React.RefObject<HTMLInputElement>;
    uploadProgress: number;
    zipFiles: any[];
    isZipDialogOpen: boolean;
    handleZipFileSelection: (fileName: string) => void;
    setIsZipDialogOpen: (isOpen: boolean) => void;
    isProcessing?: boolean;
  }
> = ({
  onFileUpload,
  isLoading,
  error,
  fileInputRef,
  uploadProgress,
  useDetailedInstructions = false,
  onDetailedUploadClick,
  // We don't use these props, but they're passed from withFileUploadAndParse
  zipFiles,
  isZipDialogOpen,
  handleZipFileSelection,
  setIsZipDialogOpen,
}) => {
  const isMobile = useIsMobile();
  
  const handleDrop = useCallback(
    async (event: React.DragEvent<HTMLDivElement>) => {
      event.preventDefault();
      event.stopPropagation();
      const files = event.dataTransfer.files;
      if (files && files.length > 0) {
        const file = files[0];
        const startTime = Date.now();
        try {
          // Track journey step - Upload Started
          trackJourneyStep("Chat Upload Started", 3, {
            method: "drag_and_drop",
          });

          // Track upload start
          const platform = determinePlatform(file.name);
          trackChatUpload(platform, 0, file.size, 0, "started");

          // Process file
          await onFileUpload(file);

          // Track successful upload
          const duration = Date.now() - startTime;
          trackChatUpload(platform, 0, file.size, duration, "success");

          // Track journey step - Upload Success
          trackJourneyStep("Chat Upload Success", 4, {
            platform,
            file_size: file.size,
            duration,
          });

          // Track processing
          trackChatProcessing(platform, "parse", duration, "success");
        } catch (error) {
          const errorMessage =
            error instanceof Error ? error.message : "Unknown upload error";
          const duration = Date.now() - startTime;
          const platform = determinePlatform(file.name);

          trackChatUpload(
            platform,
            0,
            file.size,
            duration,
            "failed",
            errorMessage
          );
          trackError("chat_upload", errorMessage);
          throw error;
        }
      }
    },
    [onFileUpload]
  );

  const handleDragOver = useCallback(
    (event: React.DragEvent<HTMLDivElement>) => {
      event.preventDefault();
      event.stopPropagation();
    },
    []
  );

  const handleFileChange = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files && e.target.files[0]) {
        const file = e.target.files[0];
        const startTime = Date.now();
        try {
          // Track journey step - Upload Started
          trackJourneyStep("Chat Upload Started", 3, { method: "file_select" });

          // Track upload start
          const platform = determinePlatform(file.name);
          trackChatUpload(platform, 0, file.size, 0, "started");

          // Process file
          await onFileUpload(file);

          // Track successful upload
          const duration = Date.now() - startTime;
          trackChatUpload(platform, 0, file.size, duration, "success");

          // Track journey step - Upload Success
          trackJourneyStep("Chat Upload Success", 4, {
            platform,
            file_size: file.size,
            duration,
          });

          // Track processing
          trackChatProcessing(platform, "parse", duration, "success");
        } catch (error) {
          const errorMessage =
            error instanceof Error ? error.message : "Unknown upload error";
          const duration = Date.now() - startTime;
          const platform = determinePlatform(file.name);

          trackChatUpload(
            platform,
            0,
            file.size,
            duration,
            "failed",
            errorMessage
          );
          trackError("chat_upload", errorMessage);
          throw error;
        }
      }
    },
    [onFileUpload]
  );

  const determinePlatform = (fileName: string): string => {
    const extension = fileName.toLowerCase().split(".").pop() || "";

    if (extension === "db") {
      return "imessage";
    }

    if (extension === "json") {
      return "json";
    }

    if (extension === "txt" || extension === "zip") {
      return "text";
    }

    return "unknown";
  };

  const handleClick = useCallback(() => {
    if (useDetailedInstructions && onDetailedUploadClick) {
      onDetailedUploadClick();
    } else if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  }, [useDetailedInstructions, onDetailedUploadClick, fileInputRef]);

  // Create upload message based on mobile state
  const uploadInstructions = isMobile
    ? "Tap to browse files or drag and drop a chat export file."
    : "Your chat export is ready to be analyzed. Simply drag and drop the JSON file into the upload area, or click to browse your files.";

  return (
    <div
      onClick={handleClick}
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      className={cn(
        "relative p-3 sm:p-4 md:p-8 rounded-xl text-center cursor-pointer transition-all",
        "min-h-[150px] sm:min-h-[200px] md:min-h-[250px] w-full max-w-[800px] mx-auto",
        "flex flex-col items-center justify-center gap-2 sm:gap-4",
        "bg-gradient-to-b from-background/50 to-background",
        "border-2 border-dashed",
        useDetailedInstructions
          ? [
              "border-[hsl(var(--primary)_/_0.3)]",
              "shadow-[0_0_15px_-10px_hsl(var(--primary))]",
              "hover:shadow-[0_0_25px_-5px_hsl(var(--primary))]",
              "hover:border-[hsl(var(--primary)_/_0.5)]",
              "active:shadow-[0_0_15px_-5px_hsl(var(--primary))]",
              "after:bg-gradient-to-br after:from-[hsl(var(--primary)_/_0.1)] after:to-transparent",
            ]
          : [
              "border-[hsl(var(--chart-1)_/_0.3)]",
              "shadow-[0_0_15px_-10px_hsl(var(--chart-1))]",
              "hover:shadow-[0_0_25px_-5px_hsl(var(--chart-1))]",
              "hover:border-[hsl(var(--chart-1)_/_0.5)]",
              "active:shadow-[0_0_15px_-5px_hsl(var(--chart-1))]",
              "after:bg-gradient-to-br after:from-[hsl(var(--chart-1)_/_0.1)] after:to-transparent",
            ],
        "after:absolute after:inset-0 after:rounded-xl",
        "after:opacity-0 hover:after:opacity-100 active:after:opacity-100",
        "after:transition-opacity after:duration-500",
        "touch-action-manipulation"
      )}
    >
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        className="hidden"
        accept={ACCEPTED_FILE_TYPES}
      />
      <div className="relative z-10 flex flex-col items-center">
        {isLoading ? (
          <>
            <div
              className={cn(
                "relative w-10 h-10 sm:w-12 sm:h-12 md:w-16 md:h-16 mb-2 sm:mb-4",
                "before:absolute before:inset-0",
                "before:rounded-full before:border-2",
                useDetailedInstructions
                  ? "before:border-[hsl(var(--primary)_/_0.3)]"
                  : "before:border-[hsl(var(--chart-1)_/_0.3)]",
                "after:absolute after:inset-0",
                "after:rounded-full after:border-2",
                "after:border-t-transparent",
                useDetailedInstructions
                  ? "after:border-[hsl(var(--primary))]"
                  : "after:border-[hsl(var(--chart-1))]",
                "after:animate-spin"
              )}
            />
            <h3
              className={cn(
                "text-base sm:text-lg font-semibold",
                "bg-gradient-to-r",
                useDetailedInstructions
                  ? "from-[hsl(var(--primary))] to-[hsl(var(--primary)_/_0.8)]"
                  : "from-[hsl(var(--chart-1))] to-[hsl(var(--chart-2))]",
                "bg-clip-text text-transparent"
              )}
            >
              Uploading...
            </h3>
            {uploadProgress > 0 && (
              <div className="w-full max-w-xs mt-2">
                <div className="h-2 bg-secondary rounded-full overflow-hidden">
                  <div
                    className={cn(
                      "h-full transition-all duration-300",
                      useDetailedInstructions
                        ? "bg-primary"
                        : "bg-[hsl(var(--chart-1))]"
                    )}
                    style={{ width: `${Math.round(uploadProgress)}%` }}
                  />
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {Math.round(uploadProgress)}%
                </p>
              </div>
            )}
          </>
        ) : error ? (
          <>
            <div className="w-10 h-10 sm:w-12 sm:h-12 md:w-16 md:h-16 rounded-full bg-destructive/10 flex items-center justify-center mb-2 sm:mb-4">
              <FileText className="h-5 w-5 sm:h-6 sm:w-6 text-destructive" />
            </div>
            <h3 className="text-base sm:text-lg font-semibold text-destructive mb-1">
              Upload Failed
            </h3>
            <p className="text-xs sm:text-sm text-muted-foreground max-w-xs">
              {error}
            </p>
            <button
              className="mt-4 text-sm text-primary hover:underline"
              onClick={(e) => {
                e.stopPropagation();
                if (fileInputRef.current) {
                  fileInputRef.current.click();
                }
              }}
            >
              Try Again
            </button>
          </>
        ) : (
          <>
            <div className="w-10 h-10 sm:w-12 sm:h-12 md:w-16 md:h-16 rounded-full flex items-center justify-center mb-2 sm:mb-4 bg-muted/50">
              <ArrowUpFromLine
                className={cn(
                  "h-5 w-5 sm:h-6 sm:w-6",
                  useDetailedInstructions
                    ? "text-primary"
                    : "text-[hsl(var(--chart-1))]"
                )}
              />
            </div>
            <h3
              className={cn(
                "text-sm sm:text-base md:text-lg font-semibold mb-1 sm:mb-2",
                useDetailedInstructions ? "text-primary" : "text-foreground"
              )}
            >
              Upload Chat File
            </h3>
            <p className="text-xs sm:text-sm max-w-[250px] sm:max-w-xs text-muted-foreground">
              {uploadInstructions}
            </p>
            <div className="mt-2 sm:mt-4 text-xs text-muted-foreground">
              Supported formats:{" "}
              <span className="font-medium">.txt .zip .json .db</span>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default withFileUploadAndParse(UploadAreaComponent);
