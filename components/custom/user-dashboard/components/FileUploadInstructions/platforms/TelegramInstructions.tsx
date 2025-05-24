import { withFileUploadAndParse } from "@/components/custom/general/FileUploadAndParse";
import { Card } from "@/components/ui/card";
import React, { useState } from "react";
import VideoContainer from "../../FileUploadInstructions/VideoContainer";
import BaseInstructionsLayout from "../BaseInstructionsLayout";
import UploadArea from "../UploadArea";

interface TelegramInstructionsProps {
  onClose: () => void;
  onBack: () => void;
  onUploadSuccess?: (chatId: string) => void;
}

const stepTitles = [
  "Desktop",
  "Menu",
  "Export",
  "Format",
  "Settings",
  "Upload",
];

const steps = [
  {
    title: "Open Telegram Desktop",
    description:
      "Open Telegram Desktop on your computer. Make sure you're logged in to your account.",
  },
  {
    title: "Access Menu",
    description:
      "Click on the three dots (⋮) menu in the top-right corner of the chat window to access additional options.",
  },
  {
    title: "Export Chat History",
    description: [
      "Select 'Export chat history' from the menu",
      "Choose the chat you want to analyze",
      "Make sure you're exporting the complete chat history",
    ],
  },
  {
    title: "Choose Format",
    description: {
      format: "Select 'Machine-readable JSON' as the export format",
      media: "Uncheck 'Include media files' to make the export faster",
      size: "You can limit the export size if needed, but including all messages is recommended for better analysis",
    },
  },
  {
    title: "Export Settings",
    description: [
      "Review your export settings",
      "Make sure sensitive information is handled according to your preferences",
      "Click 'Export' to generate your chat file",
    ],
  },
  {
    title: "Upload Chat File",
    description:
      "Your chat export is ready to be analyzed. Simply drag and drop the JSON file into the upload area, or click to browse your files.",
  },
];

const TelegramInstructionsComponent: React.FC<
  TelegramInstructionsProps & {
    onFileUpload: (file: File) => void;
    isLoading: boolean;
    error: string | null;
    fileInputRef: React.RefObject<HTMLInputElement>;
    uploadProgress: number;
  }
> = ({
  onFileUpload,
  onClose,
  onBack,
  isLoading,
  error,
  fileInputRef,
  uploadProgress,
}) => {
  const [currentStep, setCurrentStep] = useState(1);

  const renderLeftContent = () => {
    if (currentStep === stepTitles.length) {
      return (
        <UploadArea
          onFileUpload={onFileUpload}
          isLoading={isLoading}
          error={error}
          fileInputRef={fileInputRef}
          uploadProgress={uploadProgress}

          useDetailedInstructions
        />
      );
    }

    return (
      <Card className="h-full overflow-hidden">
        <VideoContainer selectedFileType="Telegram" />
      </Card>
    );
  };

  return (
    <BaseInstructionsLayout
      currentStep={currentStep}
      totalSteps={stepTitles.length}
      onStepChange={setCurrentStep}
      leftContent={renderLeftContent()}
      stepTitles={stepTitles}
      currentStepTitle={steps[currentStep - 1].title}
      onClose={onClose}
      onBack={onBack}
    >
      <div className="relative min-h-[300px]">
        {steps.map((step, index) => (
          <div
            key={index}
            className={`absolute inset-0 transition-all duration-300 ${
              currentStep === index + 1
                ? "opacity-100 translate-y-0 pointer-events-auto"
                : "opacity-0 translate-y-4 pointer-events-none"
            }`}
          >
            <div className="space-y-4">
              {typeof step.description === "string" ? (
                <p className="text-muted-foreground leading-relaxed">
                  {step.description}
                </p>
              ) : Array.isArray(step.description) ? (
                <ul className="list-disc list-inside space-y-2">
                  {step.description.map((item, i) => (
                    <li
                      key={i}
                      className="text-muted-foreground leading-relaxed"
                    >
                      {item}
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="space-y-3">
                  {Object.entries(step.description).map(([key, desc]) => (
                    <div key={key} className="rounded-lg bg-muted/50 p-3">
                      <p className="font-medium capitalize mb-1">{key}</p>
                      <p className="text-muted-foreground leading-relaxed">
                        {desc}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </BaseInstructionsLayout>
  );
};

export default withFileUploadAndParse(TelegramInstructionsComponent);
