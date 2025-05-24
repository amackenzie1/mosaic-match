import { withFileUploadAndParse } from "@/components/custom/general/FileUploadAndParse";
import { Card } from "@/components/ui/card";
import React, { useState } from "react";
import VideoContainer from "../../FileUploadInstructions/VideoContainer";
import BaseInstructionsLayout from "../BaseInstructionsLayout";
import UploadArea from "../UploadArea";

interface WhatsAppDesktopInstructionsProps {
  onClose: () => void;
  onBack: () => void;
  onUploadSuccess?: (chatId: string) => void;
}

const stepTitles = ["Open Chat", "More Options", "Export", "Media", "Upload"];

const steps = [
  {
    title: "Open Chat",
    description: "Open the chat you wish to export",
  },
  {
    title: "Access More Options",
    description: "Tap More options > More > Export chat",
  },
  {
    title: "Export Settings",
    description: "Choose 'Export chat' from the menu options",
  },
  {
    title: "Choose Media Option",
    description: {
      media: "Tap 'Without media' to export only messages",
      save: "Save to downloads. For mobile devices you can message, email, or airdrop the file to yourself.",
    },
  },
  {
    title: "Upload Chat File",
    description:
      "Click the Upload File button below (can also drag and drop files into the button from mail/messages) and select your file!",
  },
];

const WhatsAppDesktopInstructionsComponent: React.FC<
  WhatsAppDesktopInstructionsProps & {
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
        <VideoContainer selectedFileType="WhatsApp (Desktop)" />
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

export default withFileUploadAndParse(WhatsAppDesktopInstructionsComponent);
