"use client";

import { Button } from "@/components/ui/button";
import { useGeneralInfo } from "@/lib/contexts/general-info";
import { amIAuthedOwner } from "@/lib/utils/hashAuthentication";
import { Loader2, Share2, ShoppingBag } from "lucide-react";
import { useRouter } from "next/navigation";
import React, { useEffect, useState } from "react";
import { useShareFunctionality } from "./ShareIconButton";
import { ClipGrid } from "./viralclips/ClipGrid";

const DiscordAndShop: React.FC = () => {
  const router = useRouter();
  const { isLoading, shareAction, ShareModal } = useShareFunctionality();
  const { hash, file, setHash, setToken } = useGeneralInfo();
  const [amIOwner, setAmIOwner] = useState(Boolean(file));

  useEffect(() => {
    if (file) {
      setAmIOwner(true);
    } else {
      amIAuthedOwner(hash || "").then(setAmIOwner);
    }
  }, [hash]);

  const handleClick = () => {
    if (!amIOwner) {
      setHash("");
      setToken("");
      router.push("/");
    } else {
      shareAction(hash, file);
    }
  };

  return (
    <div className="flex flex-wrap gap-4 items-center justify-center relative z-[5]">
      <div className="relative group">
        <Button
          variant="secondary"
          size="lg"
          className="font-semibold pointer-events-none relative overflow-hidden"
          disabled
        >
          <div className="relative z-10 flex items-center transition-transform duration-200 group-hover:-translate-y-[200%]">
            <ShoppingBag className="mr-2 h-4 w-4" />
            Mosaic Shop
          </div>
          <div className="absolute inset-0 flex items-center justify-center transition-transform duration-200 translate-y-[200%] group-hover:translate-y-0">
            <span className="text-sm font-medium">Coming Soon!</span>
          </div>
        </Button>
      </div>

      <ClipGrid />

      <Button
        onClick={handleClick}
        variant="default"
        size="lg"
        disabled={isLoading && amIOwner}
        className="font-semibold"
      >
        {!amIOwner ? (
          <>
            <Share2 className="mr-2 h-4 w-4" />
            Analyze another chat
          </>
        ) : isLoading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Sharing...
          </>
        ) : (
          <>
            <Share2 className="mr-2 h-4 w-4" />
            Share your dashboard
          </>
        )}
      </Button>
      {amIOwner && <ShareModal />}
    </div>
  );
};

export default DiscordAndShop;
