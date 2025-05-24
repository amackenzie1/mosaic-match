import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useIsMobile } from "@/components/ui/use-mobile";
import { cn } from "@/lib/utils";
import { Check, ChevronLeft, X } from "lucide-react";
import { useTheme } from "next-themes";
import React, { ReactNode, useEffect, useState } from "react";

interface BaseInstructionsLayoutProps {
  currentStep: number;
  totalSteps: number;
  onStepChange: (step: number) => void;
  children: ReactNode;
  leftContent: ReactNode;
  stepTitles: string[];
  currentStepTitle: string;
  showSkipInstructions?: boolean;
  onClose?: () => void;
  onBack?: () => void;
}

const BaseInstructionsLayout: React.FC<BaseInstructionsLayoutProps> = ({
  currentStep,
  totalSteps,
  onStepChange,
  children,
  leftContent,
  stepTitles,
  currentStepTitle,
  showSkipInstructions,
  onClose,
  onBack,
}) => {
  const { theme } = useTheme();
  const isMobile = useIsMobile();
  const isDark = theme?.includes("dark");
  const currentScheme =
    theme?.replace("dark-", "").replace("light-", "") || "default";

  // Scroll the active step button into view when step changes on mobile
  const [stepsContainerRef, setStepsContainerRef] =
    useState<HTMLDivElement | null>(null);

  useEffect(() => {
    if (stepsContainerRef && isMobile) {
      const activeButton = stepsContainerRef.querySelector(
        `[data-step="${currentStep}"]`
      );
      if (activeButton) {
        // Scroll the active button into view with some padding
        const containerWidth = stepsContainerRef.offsetWidth;
        const buttonLeft = (activeButton as HTMLElement).offsetLeft;
        const buttonWidth = (activeButton as HTMLElement).offsetWidth;
        const scrollPosition =
          buttonLeft - containerWidth / 2 + buttonWidth / 2;

        stepsContainerRef.scrollTo({
          left: Math.max(0, scrollPosition),
          behavior: "smooth",
        });
      }
    }
  }, [currentStep, stepsContainerRef, isMobile]);

  return (
    <div
      className={cn("flex flex-col h-full bg-background", isDark ? "dark" : "")}
      data-theme={currentScheme}
    >
      {/* Header */}
      <div className="h-12 sm:h-10 px-3 border-b flex items-center justify-between sticky top-0 z-10 bg-muted/50 shrink-0">
        <div className="flex items-center gap-2">
          {onBack && (
            <Button
              variant="ghost"
              size="icon"
              onClick={onBack}
              className="h-8 w-8 shrink-0 rounded-full text-foreground hover:bg-accent hover:text-accent-foreground"
            >
              <ChevronLeft className="h-4 w-4 text-foreground" />
            </Button>
          )}
          <h2 className="text-sm font-medium text-foreground truncate">
            {currentStepTitle}
          </h2>
        </div>
        <div className="flex items-center gap-2">
          {showSkipInstructions && onClose && (
            <Button
              variant="ghost"
              onClick={onClose}
              className="text-xs text-foreground hover:bg-accent hover:text-accent-foreground hidden sm:flex h-8 px-2"
            >
              Skip instructions
            </Button>
          )}
          {onClose && (
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="h-8 w-8 shrink-0 rounded-full text-foreground hover:bg-accent hover:text-accent-foreground"
            >
              <X className="h-4 w-4 text-foreground" />
            </Button>
          )}
        </div>
      </div>

      {/* Progress steps - Scrollable on mobile */}
      <ScrollArea className="w-full border-b bg-muted/50 shrink-0 overflow-x-auto">
        <div className="px-4 py-2 sm:py-3">
          <div
            className="flex items-center justify-between w-full min-w-[320px] sm:min-w-[480px] max-w-3xl mx-auto"
            ref={setStepsContainerRef}
          >
            {stepTitles.map((stepTitle, index) => (
              <React.Fragment key={index}>
                <div className="flex flex-col items-center">
                  <button
                    onClick={() => onStepChange(index + 1)}
                    data-step={index + 1}
                    className={cn(
                      "w-8 h-8 sm:w-7 sm:h-7 rounded-full flex items-center justify-center text-xs",
                      "ring-offset-background transition-colors duration-200",
                      "hover:ring-2 hover:ring-ring hover:ring-offset-2",
                      currentStep === index + 1
                        ? "bg-primary text-primary-foreground ring-2 ring-ring ring-offset-2"
                        : index < currentStep
                        ? "bg-primary/20 text-primary hover:bg-primary/30"
                        : "bg-muted hover:bg-muted/80 text-muted-foreground"
                    )}
                  >
                    {index < currentStep ? (
                      <Check className="h-3 w-3" />
                    ) : (
                      <span>{index + 1}</span>
                    )}
                  </button>
                  <span
                    className={cn(
                      "text-[10px] mt-1 font-medium",
                      "max-w-[50px] sm:max-w-[70px] text-center truncate",
                      currentStep === index + 1
                        ? "text-foreground"
                        : "text-muted-foreground"
                    )}
                  >
                    {stepTitle}
                  </span>
                </div>
                {index < stepTitles.length - 1 && (
                  <div
                    className={cn(
                      "flex-1 h-0.5 mx-1 sm:mx-2 max-w-[30px] sm:max-w-[70px]",
                      "transition-colors duration-200",
                      index < currentStep ? "bg-primary/40" : "bg-border"
                    )}
                  />
                )}
              </React.Fragment>
            ))}
          </div>
        </div>
      </ScrollArea>

      {/* Main content */}
      <ScrollArea className="flex-1">
        <div className="p-1 sm:p-2 md:p-4">
          {isMobile ? (
            <div className="flex flex-col max-w-6xl mx-auto">
              {/* Mobile layout: Video on top - reduced height */}
              <div className="h-[320px]">
                <div className="w-full h-full flex justify-center">
                  {leftContent}
                </div>
              </div>

              {/* Instructions below video on mobile */}
              <Card className="flex-1 flex flex-col mt-2">
                <CardHeader className="border-b bg-muted/50 space-y-0 p-1 py-2">
                  <h2 className="text-sm font-semibold text-primary">
                    {stepTitles[currentStep - 1]}
                  </h2>
                </CardHeader>
                <CardContent className="flex-1 p-2">
                  <ScrollArea className="h-full max-h-[calc(100vh-400px)]">
                    {children}
                  </ScrollArea>
                </CardContent>
              </Card>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-2 sm:gap-4 max-w-6xl mx-auto">
              {/* Instructions section second on desktop */}
              <Card className="h-full flex flex-col order-first lg:order-last">
                <CardHeader className="border-b bg-muted/50 space-y-0 p-2 sm:p-3">
                  <h2 className="text-sm sm:text-base font-semibold text-primary">
                    {stepTitles[currentStep - 1]}
                  </h2>
                </CardHeader>
                <CardContent className="flex-1 p-2 sm:p-4">
                  <ScrollArea className="h-full">{children}</ScrollArea>
                </CardContent>
              </Card>

              {/* Left section - Video or Upload Area - reduced height */}
              <div className="lg:sticky lg:top-6 h-fit max-h-[320px] sm:max-h-[420px] md:max-h-[520px] lg:max-h-[calc(100vh-14rem)]">
                <div className="w-full h-full">{leftContent}</div>
              </div>
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Navigation buttons */}
      <div className="border-t bg-muted/50 px-3 py-2 sm:py-3 shrink-0">
        <div className="flex justify-between gap-2 sm:gap-4 max-w-3xl mx-auto">
          <Button
            variant="outline"
            onClick={() => onStepChange(currentStep - 1)}
            disabled={currentStep === 1}
            className="text-foreground border-border hover:bg-accent hover:text-accent-foreground h-9 px-3 text-sm"
          >
            Previous
          </Button>
          <Button
            onClick={() => onStepChange(currentStep + 1)}
            disabled={currentStep === totalSteps}
            className="h-9 px-3 text-sm"
          >
            {currentStep === totalSteps - 1 ? "Finish" : "Next"}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default BaseInstructionsLayout;
