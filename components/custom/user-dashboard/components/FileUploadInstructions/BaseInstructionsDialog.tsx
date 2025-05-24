import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { useIsMobile } from "@/components/ui/use-mobile";
import { ChevronLeft, X } from "lucide-react";
import { useTheme } from "next-themes";
import React from "react";

interface BaseInstructionsDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onBack?: () => void;
  title: string;
  children: React.ReactNode;
  showBackButton?: boolean;
}

const BaseInstructionsDialog: React.FC<BaseInstructionsDialogProps> = ({
  isOpen,
  onClose,
  onBack,
  title,
  children,
  showBackButton = false,
}) => {
  const { theme } = useTheme();
  const isMobile = useIsMobile();
  const isDark = theme?.includes("dark");
  const currentScheme =
    theme?.replace("dark-", "").replace("light-", "") || "default";

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent
        className="max-w-[95vw] sm:max-w-[90vw] w-full sm:w-[1200px] h-[95vh] sm:h-[90vh] p-0 overflow-hidden [&>button]:hidden"
        data-theme={currentScheme}
      >
        <div className="h-14 sm:h-12 px-3 border-b flex items-center justify-between sticky top-0 z-10">
          <div className="flex items-center gap-2">
            {showBackButton && onBack && (
              <Button
                variant="ghost"
                size="icon"
                onClick={onBack}
                className="h-10 w-10 sm:h-8 sm:w-8 shrink-0 rounded-full"
              >
                <ChevronLeft className="h-5 w-5 sm:h-4 sm:w-4" />
              </Button>
            )}
            <h2 className="text-base font-medium truncate">{title}</h2>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="h-10 w-10 sm:h-8 sm:w-8 shrink-0 rounded-full"
          >
            <X className="h-5 w-5 sm:h-4 sm:w-4" />
          </Button>
        </div>
        {children}
      </DialogContent>
    </Dialog>
  );
};

export default BaseInstructionsDialog;
