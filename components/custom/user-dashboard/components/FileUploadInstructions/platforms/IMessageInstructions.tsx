import { withFileUploadAndParse } from "@/components/custom/general/FileUploadAndParse";
import { Card } from "@/components/ui/card";
import React from "react";
import BaseInstructionsLayout from "../BaseInstructionsLayout";
import UploadArea from "../UploadArea";
import VideoContainer from "../VideoContainer";

interface IMessageInstructionsProps {
  onClose: () => void;
  onBack: () => void;
  onUploadSuccess?: (chatId: string) => void;
}

const IMessageInstructionsComponent: React.FC<
  IMessageInstructionsProps & {
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
  return (
    <BaseInstructionsLayout
      currentStep={1}
      totalSteps={1}
      onStepChange={() => {}}
      leftContent={
        <Card className="h-full w-full overflow-hidden flex items-center justify-center">
          <div className="w-full h-full max-h-full flex items-center justify-center">
            <VideoContainer selectedFileType="iMessage (Mac)" />
          </div>
        </Card>
      }
      stepTitles={["Export iMessage Chat"]}
      currentStepTitle="Export and Upload iMessage Chat"
      onClose={onClose}
      onBack={onBack}
    >
      <div className="space-y-6">
        <div className="space-y-4">
          <div className="rounded-lg bg-amber-100 dark:bg-amber-950 border border-amber-300 dark:border-amber-800 p-4 mb-4">
            <p className="font-semibold text-amber-800 dark:text-amber-300">
              ⚠️ Important: Mac Required
            </p>
            <p className="text-amber-700 dark:text-amber-400 leading-relaxed">
              This process only works on a Mac laptop or desktop. You cannot
              export iMessage chats from an iPhone or iPad alone.
            </p>
          </div>

          <div className="space-y-2">
            <p className="font-medium">Follow these steps:</p>
            <ol className="list-decimal list-inside space-y-3">
              <li className="text-muted-foreground leading-relaxed">
                Copy this path:{" "}
                <code className="bg-muted px-2 py-1 rounded">
                  ~/Library/Messages
                </code>
              </li>
              <li className="text-muted-foreground leading-relaxed">
                Click the upload area below
              </li>
              <li className="text-muted-foreground leading-relaxed">
                Hold{" "}
                <code className="bg-muted px-2 py-1 rounded">
                  Command + Shift + G
                </code>{" "}
                on your keyboard
              </li>
              <li className="text-muted-foreground leading-relaxed">
                Paste the path and select the first option that appears {">"}
                {" Library > Messages"}
              </li>
              <li className="text-muted-foreground leading-relaxed">
                Select the{" "}
                <code className="bg-muted px-2 py-1 rounded">chat.db</code> file
              </li>
            </ol>
          </div>

          <div className="rounded-lg bg-muted/50 p-3">
            <p className="text-muted-foreground leading-relaxed">
              Note: This process might take a minute depending on how much you
              use iMessage
            </p>
          </div>
        </div>

        <UploadArea
          onFileUpload={onFileUpload}
          isLoading={isLoading}
          error={error}
          fileInputRef={fileInputRef}
          uploadProgress={uploadProgress}
        />
      </div>
    </BaseInstructionsLayout>
  );
};

export default withFileUploadAndParse(IMessageInstructionsComponent);
