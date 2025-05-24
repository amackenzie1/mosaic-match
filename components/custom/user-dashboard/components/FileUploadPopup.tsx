import { Dialog, DialogContent } from "@/components/ui/dialog";
import { useIsMobile } from "@/components/ui/use-mobile";
import { AnimatePresence, motion } from "framer-motion";
import React, { useEffect, useRef, useState } from "react";
import PlatformSelection from "./FileUploadInstructions/PlatformSelection";
import AndroidInstructions from "./FileUploadInstructions/platforms/AndroidInstructions";
import IMessageInstructions from "./FileUploadInstructions/platforms/IMessageInstructions";
import InstagramInstructions from "./FileUploadInstructions/platforms/InstagramInstructions";
import MessengerInstructions from "./FileUploadInstructions/platforms/MessengerInstructions";
import SnapchatInstructions from "./FileUploadInstructions/platforms/SnapchatInstructions";
import TelegramInstructions from "./FileUploadInstructions/platforms/TelegramInstructions";
import WhatsAppDesktopInstructions from "./FileUploadInstructions/platforms/WhatsAppDesktopInstructions";
import WhatsAppMobileInstructions from "./FileUploadInstructions/platforms/WhatsAppMobileInstructions";

type Step = "platform-select" | "instructions";

interface FileUploadPopupProps {
  isOpen: boolean;
  onClose: () => void;
  onFileUpload: (
    file: File,
    options?: {
      setLoading: (loading: boolean) => void;
      setError: (error: string | null) => void;
      setProgress: (progress: number) => void;
    }
  ) => Promise<void>;
}

const FileUploadPopup: React.FC<FileUploadPopupProps> = ({
  isOpen,
  onClose,
  onFileUpload,
}) => {
  const [step, setStep] = useState<Step>("platform-select");
  const [selectedPlatform, setSelectedPlatform] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setStep("platform-select");
      setSelectedPlatform(null);
      setIsLoading(false);
      setError(null);
      setUploadProgress(0);
    }
  }, [isOpen]);

  const handlePlatformSelect = (platformId: string) => {
    setSelectedPlatform(platformId);
    setStep("instructions");
  };

  const handleBack = () => {
    setStep("platform-select");
    setSelectedPlatform(null);
    setIsLoading(false);
    setError(null);
    setUploadProgress(0);
  };

  const handleClose = () => {
    onClose();
    setTimeout(() => {
      setStep("platform-select");
      setSelectedPlatform(null);
      setIsLoading(false);
      setError(null);
      setUploadProgress(0);
    }, 300);
  };

  const handleFileUploadInternal = async (file: File) => {
    setIsLoading(true);
    setError(null);
    setUploadProgress(0);
    try {
      await onFileUpload(file, {
        setLoading: setIsLoading,
        setError: setError,
        setProgress: setUploadProgress,
      });
    } catch (err) {
      console.error("Upload failed in popup:", err);
      if (!error) {
        setError(err instanceof Error ? err.message : "Upload failed");
      }
    } finally {
      if (isLoading) setIsLoading(false);
    }
  };

  const renderInstructions = () => {
    const props = {
      onFileUpload: handleFileUploadInternal,
      onClose: handleClose,
      onBack: handleBack,
      isLoading,
      error,
      fileInputRef,
      uploadProgress,
    };

    switch (selectedPlatform) {
      case "whatsapp-mobile":
        return <WhatsAppMobileInstructions {...props} />;
      case "whatsapp-desktop":
        return <WhatsAppDesktopInstructions {...props} />;
      case "telegram":
        return <TelegramInstructions {...props} />;
      case "imessage":
        return <IMessageInstructions {...props} />;
      case "instagram":
        return <InstagramInstructions {...props} />;
      case "messenger":
        return <MessengerInstructions {...props} />;
      case "snapchat":
        return <SnapchatInstructions {...props} />;
      case "android":
        return <AndroidInstructions {...props} />;
      default:
        return null;
    }
  };

  const renderContent = () => {
    const isMobile = useIsMobile();
    
    // Use different animations for mobile vs desktop
    const platformSelectAnimation = isMobile
      ? {
          initial: { opacity: 0, y: 20 },
          animate: { opacity: 1, y: 0 },
          exit: { opacity: 0, y: -20 },
          transition: { duration: 0.15 }
        }
      : {
          initial: { opacity: 0, x: -20 },
          animate: { opacity: 1, x: 0 },
          exit: { opacity: 0, x: 20 },
          transition: { duration: 0.2 }
        };
        
    const instructionsAnimation = isMobile
      ? {
          initial: { opacity: 0, y: -20 },
          animate: { opacity: 1, y: 0 },
          exit: { opacity: 0, y: 20 },
          transition: { duration: 0.15 }
        }
      : {
          initial: { opacity: 0, x: 20 },
          animate: { opacity: 1, x: 0 },
          exit: { opacity: 0, x: -20 },
          transition: { duration: 0.2 }
        };
    
    if (step === "platform-select") {
      return (
        <motion.div
          key="platform-select"
          {...platformSelectAnimation}
          className="h-full"
        >
          <PlatformSelection
            onPlatformSelect={handlePlatformSelect}
            onClose={handleClose}
          />
        </motion.div>
      );
    }

    return (
      <motion.div
        key="instructions"
        {...instructionsAnimation}
        className="h-full"
      >
        {renderInstructions()}
      </motion.div>
    );
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent
        className="max-w-[95vw] sm:max-w-[90vw] w-full md:w-[1200px] 
                  h-[95vh] sm:h-[90vh] p-0 bg-background border-none 
                  overflow-hidden rounded-lg"
      >
        <div className="h-full w-full overflow-hidden">
          <AnimatePresence mode="wait">{renderContent()}</AnimatePresence>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default FileUploadPopup;
