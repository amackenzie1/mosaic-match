import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import Link from "next/link";
import React, { useState } from "react";
import PrivacyPolicyModal from "./Documents/PrivacyPolicy";
import TermsOfServiceModal from "./Documents/TermsOfService";

interface FooterProps {
  isMobile?: boolean;
}

const Footer: React.FC<FooterProps> = ({ isMobile = false }) => {
  const [isPrivacyModalOpen, setIsPrivacyModalOpen] = useState(false);
  const [isTermsModalOpen, setIsTermsModalOpen] = useState(false);

  return (
    <footer className={`w-full border-t bg-background ${isMobile ? 'py-3' : 'py-6'}`}>
      <div className={`container flex flex-col ${isMobile ? 'gap-2' : 'sm:flex-row gap-4'} justify-between items-center ${isMobile ? 'px-3' : 'px-6'}`}>
        <p className={`${isMobile ? 'text-xs' : 'text-sm'} text-muted-foreground`}>
          © 2024 Mosaic. All rights reserved.
        </p>
        <nav className={`flex ${isMobile ? 'gap-2' : 'gap-4'} flex-wrap justify-center`}>
          <Link
            href="mailto:contactus.mosaic@gmail.com"
            className={`${isMobile ? 'text-xs' : 'text-sm'} text-muted-foreground hover:text-foreground transition-colors`}
          >
            Contact
          </Link>
          <Link
            href="https://discord.gg/qPTWCdeUgQ"
            target="_blank"
            rel="noopener noreferrer"
            className={`${isMobile ? 'text-xs' : 'text-sm'} text-muted-foreground hover:text-foreground transition-colors`}
          >
            Discord
          </Link>
          <Button
            variant="link"
            className={`${isMobile ? 'text-xs' : 'text-sm'} text-muted-foreground p-0 h-auto`}
            onClick={() => setIsPrivacyModalOpen(true)}
          >
            Privacy
          </Button>
          <Button
            variant="link"
            className={`${isMobile ? 'text-xs' : 'text-sm'} text-muted-foreground p-0 h-auto`}
            onClick={() => setIsTermsModalOpen(true)}
          >
            Terms
          </Button>
        </nav>
      </div>

      <Dialog open={isPrivacyModalOpen} onOpenChange={setIsPrivacyModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Privacy Policy</DialogTitle>
          </DialogHeader>
          <PrivacyPolicyModal
            open={isPrivacyModalOpen}
            onClose={() => setIsPrivacyModalOpen(false)}
          />
        </DialogContent>
      </Dialog>

      <Dialog open={isTermsModalOpen} onOpenChange={setIsTermsModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Terms of Service</DialogTitle>
          </DialogHeader>
          <TermsOfServiceModal
            open={isTermsModalOpen}
            onClose={() => setIsTermsModalOpen(false)}
          />
        </DialogContent>
      </Dialog>
    </footer>
  );
};

export default Footer;
