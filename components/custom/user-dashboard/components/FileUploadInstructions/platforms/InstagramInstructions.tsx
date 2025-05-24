import { withFileUploadAndParse } from "@/components/custom/general/FileUploadAndParse";
import { Card } from "@/components/ui/card";
import React, { useState } from "react";
import VideoContainer from "../../FileUploadInstructions/VideoContainer";
import BaseInstructionsLayout from "../BaseInstructionsLayout";
import UploadArea from "../UploadArea";

interface InstagramInstructionsProps {
  onClose: () => void;
  onBack: () => void;
  onUploadSuccess?: (chatId: string) => void;
}

const stepTitles = ["Profile", "Activity", "Download", "Format", "Upload"];

const steps = [
  {
    title: "Access Profile",
    description: [
      "Open Instagram and click on your profile",
      "Navigate to Settings and Activity (the three bars in the top right of your profile page)",
    ],
  },
  {
    title: "Your Activity",
    description: "Select Your Activity",
  },
  {
    title: "Download Information",
    description: [
      "Scroll all the way down and click Download Your Information",
      "Press the Download or transfer information button",
      "Choose your account and select Some of your Information",
    ],
  },
  {
    title: "Format Settings",
    description: {
      search: "Search Messages and select Download to Device",
      range: "Select 'All Time' for completeness",
      format: "Click on 'Format', select 'JSON', and 'Low Quality'",
      email:
        "Input your email to receive your file. It will take some time for instagram to prepare your data, so make sure to check back to this window every few hours as the email sometimes does not send.",
    },
  },
  {
    title: "Upload Chat File",
    description:
      "Download the file from your Instagram app and transfer it to your computer (email, messages, airdrop etc.), then upload it here.",
  },
];

const InstagramInstructionsComponent: React.FC<
  InstagramInstructionsProps & {
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
        <VideoContainer selectedFileType="Instagram" />
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
              {currentStep === 1 && (
                <div className="mt-3 p-3 bg-yellow-500/10 rounded-lg border border-yellow-500/20">
                  <p className="text-sm text-yellow-500 font-medium">
                    Please Note:
                  </p>
                  <p className="text-sm text-yellow-500/90 mt-1">
                    Instagram needs several hours to prepare your data for
                    download. Start this process when you have time to wait.
                  </p>
                </div>
              )}
              {currentStep === 5 && (
                <div className="mt-3 p-3 bg-blue-500/10 rounded-lg border border-blue-500/20">
                  <p className="text-sm text-blue-500/90">
                    You can close this window and come back later. Instagram
                    will email you when your data is ready to download.
                  </p>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </BaseInstructionsLayout>
  );
};

export default withFileUploadAndParse(InstagramInstructionsComponent);
