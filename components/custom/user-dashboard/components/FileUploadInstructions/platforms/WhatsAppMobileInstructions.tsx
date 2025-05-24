import { withFileUploadAndParse } from "@/components/custom/general/FileUploadAndParse";
import { Card } from "@/components/ui/card";
import React, { useState } from "react";
import VideoContainer from "../../FileUploadInstructions/VideoContainer";
import BaseInstructionsLayout from "../BaseInstructionsLayout";
import UploadArea from "../UploadArea";

interface WhatsAppMobileInstructionsProps {
  onClose: () => void;
  onBack: () => void;
  onUploadSuccess?: (chatId: string) => void;
}

const stepTitles = ["Select Chat", "Settings", "Export", "Transfer", "Upload"];

const steps = [
  {
    title: "Select Chat",
    description: "Open WhatsApp and navigate to the chat you want to analyze",
  },
  {
    title: "Access Settings",
    description: {
      ios: "Tap the chat title at the top to access settings",
      android: "Tap the three dots ⋮ in the top right, then tap 'More'",
    },
  },
  {
    title: "Export Chat",
    description: {
      export: "Select 'Export chat' from the menu",
      media: "When prompted, choose 'Without media' for faster processing",
    },
  },
  {
    title: "Transfer Options",
    description: {
      desktop: "Email the chat to yourself to access on your computer",
      mobile: "Save to Files app if you want to analyze directly on your phone",
    },
  },
  {
    title: "Upload Chat File",
    description:
      "If using a computer, download the file from your email. Then drag and drop the file here, or click to browse.",
  },
];

const WhatsAppMobileInstructionsComponent: React.FC<
  WhatsAppMobileInstructionsProps & {
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
          zipFiles={[]}
          isZipDialogOpen={false}
          handleZipFileSelection={() => {}}
          setIsZipDialogOpen={() => {}}
        />
      );
    }

    return (
      <Card className="h-full w-full overflow-hidden flex items-center justify-center p-0">
        <VideoContainer selectedFileType="WhatsApp (Mobile)" />
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

export default withFileUploadAndParse(WhatsAppMobileInstructionsComponent);
