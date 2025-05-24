import { Card } from "@/components/ui/card";
import { Upload } from "lucide-react";
import React, { useRef, useState } from "react";
import BaseInstructionsLayout from "../BaseInstructionsLayout";
import VideoContainer from "../VideoContainer";

interface MessengerInstructionsProps {
  onFileUpload: (file: File) => void;
  onClose: () => void;
  onBack: () => void;
}

const stepTitles = [
  "Settings",
  "Account",
  "Information",
  "Download",
  "Format",
  "Upload",
];

const steps = [
  {
    title: "Access Settings",
    description: "Open the Messenger app and go to Settings ⚙️",
  },
  {
    title: "Account Center",
    description: ["Scroll down and select See more in Accounts Center"],
  },
  {
    title: "Your Information",
    description: [
      "Select 'Your information and permissions'",
      "Then Download Your Information",
      "Press the Download or transfer information button",
      "Choose your account and select Some of your Information",
    ],
  },
  {
    title: "Download Settings",
    description: {
      search: "Search Messages and select Download to Device",
      range: "Select 'All Time' for completeness",
    },
  },
  {
    title: "Format Settings",
    description: [
      "Click on 'Format'",
      "Select 'JSON'",
      "Select 'Low Quality'",
      "Input your email to receive your file. It will take some time for facebook to prepare your data, so make sure to check back to this window every few hours as the email sometimes does not send.",
    ],
  },
  {
    title: "Upload Chat File",
    description:
      "Download the file from your Facebook app and transfer it to your computer (email, messages, airdrop etc.), then upload it here.",
  },
];

const MessengerInstructions: React.FC<MessengerInstructionsProps> = ({
  onFileUpload,
  onClose,
  onBack,
}) => {
  const [currentStep, setCurrentStep] = useState(1);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onFileUpload(file);
      onClose();
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file) {
      onFileUpload(file);
      onClose();
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
  };

  const renderLeftContent = () => {
    if (currentStep === stepTitles.length) {
      return (
        <div
          onClick={() => fileInputRef.current?.click()}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          className="h-full rounded-lg cursor-pointer transition-all flex flex-col items-center justify-center gap-4 p-12 min-h-[400px] bg-gradient-to-b from-background/50 to-background border-2 border-dashed border-primary/30 hover:border-primary/50 hover:shadow-lg"
        >
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            className="hidden"
            accept=".json"
          />
          <div className="w-16 h-16 mb-2 rounded-xl bg-primary/10 flex items-center justify-center">
            <Upload className="w-8 h-8 text-primary" />
          </div>
          <div className="text-center">
            <h3 className="text-lg font-medium mb-2">Upload Chat File</h3>
            <p className="text-sm text-muted-foreground">
              Drag and drop your JSON file here, or click to select
            </p>
          </div>
        </div>
      );
    }

    return (
      <Card className="h-full overflow-hidden">
        <VideoContainer selectedFileType="Facebook" />
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

export default MessengerInstructions;
