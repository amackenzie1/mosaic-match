"use client";

import {
  trackAnalysisShare,
  trackError,
} from "@/components/analytics/analytics";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useGeneralInfo } from "@/lib/contexts/general-info";
import { cn } from "@/lib/utils";
import { getToken, getTokenThroughAuth } from "@/lib/utils/hashAuthentication";
import { Check, Copy, Loader2, Send } from "lucide-react";
import React, { useCallback, useState } from "react";

export const useShareFunctionality = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [shareUrl, setShareUrl] = useState("");
  const [error, setError] = useState("");

  const handleShare = async (hash?: string | null, file?: File | null) => {
    if (!hash) return;
    setIsLoading(true);
    setError("");
    try {
      const token = file
        ? await getToken(hash, file, 60 * 60 * 24)
        : await getTokenThroughAuth(hash, 60 * 60 * 24);

      const baseUrl = `${window.location.protocol}//${window.location.host}`;
      setShareUrl(`${baseUrl}/?hash=${hash}&token=${token}`);
      setIsModalOpen(true);
      trackAnalysisShare("dashboard");
    } catch (err) {
      setError("Unauthorized: Unable to generate share link");
      trackError(
        "share_generation",
        "Unauthorized: Unable to generate share link"
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleCloseModal = (open: boolean) => {
    setIsModalOpen(open);
  };

  // Exportable share action
  const shareAction = (hash?: string | null, file?: File | null) => {
    handleShare(hash, file);
  };

  const CopyButton = React.memo(({ url }: { url: string }) => {
    const [copied, setCopied] = useState(false);

    const handleCopyLink = useCallback(() => {
      navigator.clipboard.writeText(url);
      setCopied(true);
      trackAnalysisShare("link_copy");
      setTimeout(() => setCopied(false), 2000);
    }, [url]);

    return (
      <button
        onClick={handleCopyLink}
        className={cn(
          "shrink-0 inline-flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors",
          copied
            ? "bg-green-500/10 text-green-500 hover:bg-green-500/20"
            : "bg-primary/10 text-primary hover:bg-primary/20"
        )}
      >
        {copied ? (
          <>
            <Check className="h-4 w-4" />
            Copied!
          </>
        ) : (
          <>
            <Copy className="h-4 w-4" />
            Copy
          </>
        )}
      </button>
    );
  });

  const ShareModal = () => (
    <Dialog open={isModalOpen} onOpenChange={handleCloseModal}>
      {/* 
        Increase shadow with `shadow-xl` 
        Use `max-h-[90vh] overflow-auto` in case content gets tall.
      */}
      <DialogContent 
        className="sm:max-w-[500px] w-[95vw] max-h-[90vh] overflow-auto shadow-xl bg-background"
        style={{ zIndex: 1000 }} // Ensure high z-index to appear above other elements
      >
        <DialogHeader>
          <DialogTitle className="text-lg font-semibold tracking-tight text-foreground">
            {error ? "Error Generating Link" : "Share Link"}
          </DialogTitle>

          {!error && (
            <DialogDescription className="text-muted-foreground">
              Please review the information below before sharing.
            </DialogDescription>
          )}
        </DialogHeader>

        {error ? (
          <p className="mt-4 text-sm text-destructive">{error}</p>
        ) : (
          <>
            <Alert
              variant="destructive"
              className="my-4 border-destructive/50 bg-destructive/10 text-destructive"
            >
              <AlertTitle className="font-medium">
                WARNING: SENSITIVE DATA
              </AlertTitle>
              <AlertDescription className="text-destructive/90">
                This feature is in beta and does not currently mask any aspects
                of your dashboard. All visible data will be accessible to anyone
                using the link.
              </AlertDescription>
            </Alert>

            <p className="mb-4 text-sm font-semibold text-foreground">
              <strong>Note:</strong> For security purposes and to prevent
              unwanted dissemination of your information, the share link will
              only work for <span className="underline">one day</span>.
            </p>

            <div className="rounded-md bg-secondary p-3">
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2">
                <div className="min-w-0 flex-1 w-full">
                  <div
                    className="truncate text-sm text-muted-foreground"
                    title={shareUrl}
                  >
                    {shareUrl.slice(0, 40)}...
                  </div>
                </div>
                <CopyButton url={shareUrl} />
              </div>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );

  return {
    isLoading,
    shareAction,
    ShareModal,
  };
};

const ShareIconButton: React.FC = () => {
  const { isLoading, shareAction, ShareModal } = useShareFunctionality();
  const { hash, file } = useGeneralInfo();

  return (
    <>
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              onClick={() => shareAction(hash, file)}
              className="inline-flex cursor-pointer items-center text-primary hover:text-primary/80"
              disabled={isLoading}
              aria-label="Share"
            >
              {isLoading ? (
                <Loader2 className="h-6 w-6 animate-spin" />
              ) : (
                <Send className="h-6 w-6" />
              )}
            </button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Share</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>

      <ShareModal />
    </>
  );
};

export default ShareIconButton;
