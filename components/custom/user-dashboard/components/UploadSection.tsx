import {
  trackChatProcessing,
  trackChatUpload,
  trackError,
  trackJourneyStep,
} from "@/components/analytics/analytics";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";
import Cookies from "js-cookie";
import { Upload } from "lucide-react";
import React, { useEffect, useState } from "react";
import { withFileUploadAndParse } from "../../general/FileUploadAndParse";
import DashboardFileUploadInstructions from "./DashboardFileUploadInstructions";
import FileUploadInstructions from "./FileUploadPopup";

interface UploadSectionProps {
  onUploadSuccess: (chatId: string) => void;
  isMobile?: boolean;
}

const AuthenticatedUploadComponent: React.FC<any> = ({
  onFileUpload,
  isLoading,
  error,
  fileInputRef,
  useDetailedInstructions,
  onDetailedUploadClick,
}) => {
  const handleDrop = async (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
    const files = event.dataTransfer.files;
    if (files && files.length > 0) {
      const file = files[0];
      const startTime = Date.now();
      try {
        // Track journey step - Upload Started
        trackJourneyStep("Chat Upload Started", 3, { method: "drag_and_drop" });

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
        throw error; // Re-throw to let the HOC handle error display
      }
    }
  };

  const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
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
  };

  const determinePlatform = (fileName: string): string => {
    // Check file extension first
    const extension = fileName.toLowerCase().split(".").pop();

    if (extension === "db") {
      return "imessage";
    }

    if (extension === "json") {
      // For JSON files, we'll let the universal parser determine the platform
      // It will check the actual message format
      return "json";
    }

    if (extension === "txt" || extension === "zip") {
      // For text files, we'll let the universal parser determine the format
      // through its regex patterns or LLM analysis
      return "text";
    }

    return "unknown";
  };

  const handleClick = () => {
    if (useDetailedInstructions) {
      onDetailedUploadClick();
    } else {
      fileInputRef.current?.click();
    }
  };

  return (
    <div
      onClick={handleClick}
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      className={cn(
        "relative p-8 rounded-xl text-center cursor-pointer transition-all",
        "min-h-[300px] w-full max-w-[800px] mx-auto",
        "flex flex-col items-center justify-center gap-4",
        "bg-gradient-to-b from-background/50 to-background",
        "border-2 border-dashed",
        useDetailedInstructions
          ? [
              "border-[hsl(var(--primary)_/_0.3)]",
              "shadow-[0_0_15px_-10px_hsl(var(--primary))]",
              "hover:shadow-[0_0_25px_-5px_hsl(var(--primary))]",
              "hover:border-[hsl(var(--primary)_/_0.5)]",
              "after:bg-gradient-to-br after:from-[hsl(var(--primary)_/_0.1)] after:to-transparent",
            ]
          : [
              "border-[hsl(var(--chart-1)_/_0.3)]",
              "shadow-[0_0_15px_-10px_hsl(var(--chart-1))]",
              "hover:shadow-[0_0_25px_-5px_hsl(var(--chart-1))]",
              "hover:border-[hsl(var(--chart-1)_/_0.5)]",
              "after:bg-gradient-to-br after:from-[hsl(var(--chart-1)_/_0.1)] after:to-transparent",
            ],
        "after:absolute after:inset-0 after:rounded-xl",
        "after:opacity-0 hover:after:opacity-100",
        "after:transition-opacity after:duration-500"
      )}
    >
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        className="hidden"
        accept=".txt,.zip,.json,.db"
      />
      <div className="relative z-10 flex flex-col items-center">
        {isLoading ? (
          <>
            <div
              className={cn(
                "relative w-16 h-16 mb-4",
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
                "text-lg font-semibold",
                "bg-gradient-to-r",
                useDetailedInstructions
                  ? "from-[hsl(var(--primary))] to-[hsl(var(--primary)_/_0.8)]"
                  : "from-[hsl(var(--chart-1))] to-[hsl(var(--chart-2))]",
                "bg-clip-text text-transparent"
              )}
            >
              Uploading...
            </h3>
          </>
        ) : (
          <>
            <div
              className={cn(
                "w-16 h-16 mb-4 rounded-xl",
                "bg-gradient-to-br",
                useDetailedInstructions
                  ? "from-[hsl(var(--primary)_/_0.1)] to-[hsl(var(--primary)_/_0.05)]"
                  : "from-[hsl(var(--chart-1)_/_0.1)] to-[hsl(var(--chart-2)_/_0.05)]",
                "flex items-center justify-center",
                "transition-transform group-hover:scale-110"
              )}
            >
              <Upload
                className={cn(
                  "w-8 h-8",
                  useDetailedInstructions
                    ? "text-[hsl(var(--primary))]"
                    : "text-[hsl(var(--chart-1))]"
                )}
              />
            </div>
            <h3
              className={cn(
                "text-lg font-semibold mb-2",
                "bg-gradient-to-r",
                useDetailedInstructions
                  ? "from-[hsl(var(--primary))] to-[hsl(var(--primary)_/_0.8)]"
                  : "from-[hsl(var(--chart-1))] to-[hsl(var(--chart-2))]",
                "bg-clip-text text-transparent"
              )}
            >
              {useDetailedInstructions
                ? "Click for guided upload"
                : "Click or drag file to upload"}
            </h3>
            <p className="text-sm text-muted-foreground">
              {useDetailedInstructions
                ? "Step-by-step instructions for each platform"
                : "Supports .txt, .zip, .json, and .db files"}
            </p>
            {error && (
              <p className="text-sm mt-2 text-destructive bg-destructive/10 px-3 py-1 rounded-full">
                {error}
              </p>
            )}
          </>
        )}
      </div>
    </div>
  );
};

const EnhancedUploadComponent = withFileUploadAndParse(
  AuthenticatedUploadComponent
);

const UploadSection: React.FC<UploadSectionProps> = ({ onUploadSuccess }) => {
  const [showExportInstructions, setShowExportInstructions] = useState(false);
  const [selectedFileType, setSelectedFileType] = useState<string | null>(null);
  const [sampleFileVisible, setSampleFileVisible] = useState(false);

  // Initialize from cookie or default to true if no cookie exists
  const [useDetailedInstructions, setUseDetailedInstructions] = useState(() => {
    // Only run on client-side
    if (typeof window !== "undefined") {
      const savedValue = Cookies.get("useDetailedInstructions");
      return savedValue !== undefined ? savedValue === "true" : true;
    }
    return true;
  });

  const [showDetailedPopup, setShowDetailedPopup] = useState(false);

  // Save to cookie whenever the value changes
  useEffect(() => {
    Cookies.set("useDetailedInstructions", useDetailedInstructions.toString(), {
      expires: 365,
    });
  }, [useDetailedInstructions]);

  const handleFileTypeSelect = (fileType: string) => {
    setSelectedFileType(fileType);
  };

  const handleTryItOutClick = () => {
    setSampleFileVisible(!sampleFileVisible);
  };

  const handleFileUpload = async (file: File) => {
    try {
      const EnhancedComponent = withFileUploadAndParse(() => null);
      const result = await new (EnhancedComponent as any)({}).processFile(file);
      if (result?.chatId) {
        onUploadSuccess(result.chatId);
      }
    } catch (error) {
      console.error("Error processing file:", error);
      throw error;
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-center gap-6">
        <Button
          variant="link"
          onClick={() => setShowExportInstructions(!showExportInstructions)}
          className="text-sm"
        >
          {showExportInstructions
            ? "Hide export instructions"
            : "How to export"}
        </Button>

        <div className="flex items-center gap-2">
          <Switch
            id="detailed-mode"
            checked={useDetailedInstructions}
            onCheckedChange={setUseDetailedInstructions}
          />
          <label
            htmlFor="detailed-mode"
            className="text-sm text-muted-foreground cursor-pointer"
          >
            Detailed Instructions
          </label>
        </div>
      </div>

      {showExportInstructions && (
        <div className="mt-2 max-w-2xl mx-auto">
          <DashboardFileUploadInstructions
            onFileTypeSelect={handleFileTypeSelect}
            onTryItOutClick={handleTryItOutClick}
            sampleFileVisible={sampleFileVisible}
            onSampleFileDragStart={() => {}}
            showTryItOut={false}
          />
        </div>
      )}

      <div className="space-y-4">
        <h2 className="text-2xl font-semibold text-center">
          Upload a New Chat
        </h2>
        <EnhancedUploadComponent
          onUploadSuccess={onUploadSuccess}
          useDetailedInstructions={useDetailedInstructions}
          onDetailedUploadClick={() => setShowDetailedPopup(true)}
        />
      </div>

      <FileUploadInstructions
        isOpen={showDetailedPopup}
        onClose={() => setShowDetailedPopup(false)}
        onFileUpload={handleFileUpload}
      />
    </div>
  );
};

export default UploadSection;
