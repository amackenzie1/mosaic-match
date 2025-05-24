"use client";

import { useIsMobile } from "@/components/ui/use-mobile";
import { useMosaicMatch } from "@/components/mosaic-match/hooks/use-mosaic-match";
import { canUserParticipateInMatching } from "@/components/mosaic-match/services/api-client";
import { fetchAuthSession } from "aws-amplify/auth";
import { useTheme } from "next-themes";
import { useRouter } from "next/navigation";
import React, { useCallback, useEffect, useState } from "react";
import CustomDrawer from "../custom/user-dashboard/CustomDrawer";
import Footer from "../custom/user-dashboard/Footer";
import Header from "../custom/user-dashboard/Header";
import MatchBackground from "./components/MatchBackground";
import MatchIntroduction from "./components/MatchIntroduction";
import MatchWaitingState from "./components/MatchWaitingState";


const MatchBoard: React.FC = () => {
  const [user, setUser] = useState<any>(null);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const router = useRouter();
  const isMobile = useIsMobile();
  const { theme } = useTheme();
  const isDark = theme?.includes("dark");
  const currentScheme =
    theme?.replace("dark-", "").replace("light-", "") || "default";

  // Use our MosaicMatch hook for managing match status
  const {
    status,
    matchingStatus,
    currentMatch,
    isLoading,
    isEligible,
    isProcessing,
    isWaiting,
    isMatched,
    waitTimeMinutes,
    optIn,
    optOut,
    refreshStatus,
  } = useMosaicMatch(true); // Enable auto-refresh

  const loadUserData = useCallback(async () => {
    try {
      const { tokens } = await fetchAuthSession();
      if (!tokens || !tokens.accessToken) {
        console.log("No access token available");
        return;
      }

      // Store user information
      setUser(tokens.accessToken);

      // Store userId in localStorage for components to access
      if (tokens.accessToken.payload.sub) {
        localStorage.setItem("userId", tokens.accessToken.payload.sub);
      }

      // Check eligibility for MosaicMatch
      await canUserParticipateInMatching();
      
      // Initial status refresh will be done by the hook
    } catch (error) {
      console.error("Error loading user data:", error);
    } finally {
      setIsInitialLoading(false);
    }
  }, []);

  useEffect(() => {
    loadUserData();
  }, [loadUserData]);

  const handleFindYourTile = useCallback(async () => {
    // Call the opt-in function from our hook
    await optIn();
    // Status will be updated automatically via useMosaicMatch auto-refresh
  }, [optIn]);

  const handleGoBack = useCallback(async () => {
    // Opt out and go back to introduction screen
    await optOut();
  }, [optOut]);

  const handleSignOut = useCallback(async () => {
    try {
      router.push("/");
    } catch (error) {
      console.error("Error signing out:", error);
    }
  }, [router]);

  const toggleDrawer = useCallback(
    (open: boolean) => (event: React.KeyboardEvent | React.MouseEvent) => {
      if (
        event.type === "keydown" &&
        ((event as React.KeyboardEvent).key === "Tab" ||
          (event as React.KeyboardEvent).key === "Shift")
      ) {
        return;
      }
      setDrawerOpen(open);
    },
    []
  );

  // Determine if this is the first time viewing the board based on
  // backend status rather than localStorage
  // A user is considered new if they are eligible but have never opted in
  const isFirstTimeUser = isEligible && (!matchingStatus || matchingStatus.hasNeverOptedIn);

  // Show loading state while initializing
  if (isInitialLoading || isLoading) {
    return (
      <MatchBackground isDark={isDark} currentScheme={currentScheme}>
        <div className="h-screen w-full flex flex-col items-center justify-center">
          <div className="animate-spin h-8 w-8 rounded-full border-4 border-primary border-t-transparent" />
          <p className="text-muted-foreground mt-4">
            Loading your dashboard...
          </p>
        </div>
      </MatchBackground>
    );
  }

  return (
    <MatchBackground isDark={isDark} currentScheme={currentScheme}>
      <div className="min-h-screen flex flex-col">
        <Header
          user={user}
          toggleDrawer={toggleDrawer}
          handleSignOut={handleSignOut}
          isMobile={isMobile}
        />
        <CustomDrawer
          drawerOpen={drawerOpen}
          toggleDrawer={toggleDrawer}
          handleSignOut={handleSignOut}
          currentPage="match-board"
        />

        <main className="flex-1">
          <div className="w-full">
            {isFirstTimeUser ? (
              <MatchIntroduction onFindYourTile={handleFindYourTile} />
            ) : (
              <MatchWaitingState
                userId={user?.payload?.sub || ""}
                onGoBack={handleGoBack}
                status={status}
                waitTimeMinutes={waitTimeMinutes}
                matchingStatus={matchingStatus}
                currentMatch={currentMatch}
              />
            )}
          </div>
        </main>

        <Footer isMobile={isMobile} />
      </div>
    </MatchBackground>
  );
};

export default MatchBoard;