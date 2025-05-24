import { Card } from "@/components/ui/card";
import React from "react";
import BaseInstructionsLayout from "../BaseInstructionsLayout";

interface AndroidInstructionsProps {
  onClose: () => void;
  onBack: () => void;
  onUploadSuccess?: (chatId: string) => void;
}

const AndroidInstructionsComponent: React.FC<AndroidInstructionsProps> = ({
  onClose,
  onBack,
}) => {
  return (
    <BaseInstructionsLayout
      currentStep={1}
      totalSteps={1}
      onStepChange={() => {}}
      leftContent={
        <Card className="h-full flex items-center justify-center p-8">
          <div className="text-center space-y-4">
            <h3 className="text-2xl font-semibold bg-gradient-to-r from-[hsl(var(--primary))] to-[hsl(var(--primary)_/_0.8)] bg-clip-text text-transparent">
              Coming Soon
            </h3>
            <p className="text-muted-foreground">
              Android SMS analysis support is coming soon. Check back later!
            </p>
          </div>
        </Card>
      }
      stepTitles={["Coming Soon"]}
      currentStepTitle="Coming Soon"
      onClose={onClose}
      onBack={onBack}
    >
      <div className="min-h-[300px] flex items-center justify-center">
        <p className="text-muted-foreground text-center">
          We're working on adding support for Android SMS analysis. Please check
          back later!
        </p>
      </div>
    </BaseInstructionsLayout>
  );
};

export default AndroidInstructionsComponent;
