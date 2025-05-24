import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import {
  LAST_UPDATED_DATE,
  PRIVACY_POLICY_SECTIONS,
} from "@/lib/content/privacy-policy";
import Link from "next/link";
import React from "react";

interface PrivacyPolicyProps {
  open?: boolean;
  onClose?: () => void;
}

const PrivacyPolicy: React.FC<PrivacyPolicyProps> = ({ open, onClose }) => {
  const formatEmail = (email: string) => (
    <Link href={`mailto:${email}`} className="text-primary hover:underline">
      {email}
    </Link>
  );

  const content = (
    <>
      <h1 className="text-3xl font-bold text-primary mb-2">
        Mosaic App Privacy Policy
      </h1>
      <p className="text-sm text-muted-foreground mb-4">
        Last updated: {LAST_UPDATED_DATE}
      </p>

      <Separator className="my-4" />

      {PRIVACY_POLICY_SECTIONS.map((section, index) => (
        <div key={index} className="mb-6">
          <h2 className="text-xl font-bold text-foreground mb-3">
            {section.title}
          </h2>
          {Array.isArray(section.content) ? (
            section.content.map((subsection, subIndex) => (
              <div key={subIndex} className="mb-4">
                <h3 className="text-lg font-semibold text-muted-foreground mb-2">
                  {subsection.subtitle}
                </h3>
                <p className="text-muted-foreground whitespace-pre-line">
                  {subsection.subcontent}
                </p>
              </div>
            ))
          ) : (
            <p className="text-muted-foreground whitespace-pre-line">
              {section.content}
            </p>
          )}
          {index < 7 && <Separator className="my-4" />}
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

export default PrivacyPolicy;
