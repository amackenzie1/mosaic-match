import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import {
  EFFECTIVE_DATE,
  TERMS_OF_SERVICE_SECTIONS,
} from "@/lib/content/terms-of-service";
import React from "react";

interface TermsOfServiceProps {
  open?: boolean;
  onClose?: () => void;
}

const TermsOfService: React.FC<TermsOfServiceProps> = ({ open, onClose }) => {
  const content = (
    <>
      <h1 className="text-3xl font-bold text-primary mb-2">
        Mosaic Terms of Service
      </h1>
      <p className="text-sm text-muted-foreground mb-4">
        Effective Date: {EFFECTIVE_DATE}
      </p>

      <Separator className="my-4" />

      {TERMS_OF_SERVICE_SECTIONS.map((section, index) => (
        <div key={index} className="mb-6">
          <h2 className="text-xl font-bold text-foreground mb-3">
            {section.title}
          </h2>
          <p className="text-muted-foreground whitespace-pre-line">
            {section.content}
          </p>
          {index < TERMS_OF_SERVICE_SECTIONS.length - 1 && (
            <Separator className="my-4" />
          )}
        </div>
      ))}
    </>
  );

  if (open !== undefined && onClose) {
    return (
      <Dialog open={open} onOpenChange={onClose}>
        <DialogContent className="max-w-[800px] max-h-[90vh] overflow-y-auto p-6">
          {content}
          <div className="mt-6 flex justify-start">
            <Button onClick={onClose}>I Understand and Accept</Button>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return <Card className="p-6">{content}</Card>;
};

export default TermsOfService;
