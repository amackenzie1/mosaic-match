"use client";

import SignUp from "@/components/custom/signin/SignUp";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useGeneralInfo } from "@/lib/contexts/general-info";
import { useUserColors } from "@/lib/hooks/useUserColors";
import { ChatUser } from "@/lib/types";
import { cn } from "@/lib/utils";
import { amIAuthedOwner } from "@/lib/utils/hashAuthentication";
import { mutateS3Cache } from "@/lib/utils/mutateS3Cache";
import { uploadJsonToS3 } from "@amackenzie1/mosaic-lib";
import { fetchAuthSession } from "aws-amplify/auth";
import { Comfortaa } from "next/font/google";
import { useRouter } from "next/navigation";
import React, { useCallback, useEffect, useState } from "react";
import SignIn from "../../signin/SignIn";
import UserNameAndIdentityDialog from "../../user-dashboard/components/UserNameAndIdentityDialog";
import MetricSwitcher from "./MetricSwitcher";
import ShareIconButton from "./ShareIconButton";
import { useIsMobile } from "@/components/ui/use-mobile";
const comfortaa = Comfortaa({
  subsets: ["latin"],
  weight: ["700"],
});

const Title: React.FC = () => {
  const router = useRouter();
  const { getUserColors } = useUserColors();
  const isMobile = useIsMobile();
  const [showSignUp, setShowSignUp] = useState(false);
  const [showSignIn, setShowSignIn] = useState(false);

  const { hash, file, users, setUsers, setHash, setToken } = useGeneralInfo();

  const [isScrolled, setIsScrolled] = useState(false);
  const [showNames, setShowNames] = useState(false);
  const [showMetricSwitcher, setShowMetricSwitcher] = useState(false);
  const [showWelcome, setShowWelcome] = useState(false);

  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [amIOwner, setAmIOwner] = useState(Boolean(file));
  const [isNameEditModalOpen, setIsNameEditModalOpen] = useState(false);

  // Check ownership
  useEffect(() => {
    if (file) {
      setAmIOwner(true);
    } else if (hash) {
      amIAuthedOwner(hash).then(setAmIOwner);
    }
  }, [hash, file]);

  // Detect scroll
  const handleScroll = useCallback(() => {
    const scrollThreshold = 80;
    setIsScrolled(window.scrollY > scrollThreshold);
  }, []);

  useEffect(() => {
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [handleScroll]);

  // Intro animations and auth check
  useEffect(() => {
    let namesTimer: ReturnType<typeof setTimeout>;
    let metricSwitcherTimer: ReturnType<typeof setTimeout>;
    let welcomeTimer: ReturnType<typeof setTimeout>;
    (async () => {
      // Check authentication status
      try {
        const session = await fetchAuthSession();
        setIsAuthenticated(!!session.tokens);
      } catch (error) {
        console.error("Error checking auth:", error);
        setIsAuthenticated(false);
      }
    })();

    // Staggered reveals
    namesTimer = setTimeout(() => setShowNames(true), 800);
    metricSwitcherTimer = setTimeout(() => setShowMetricSwitcher(true), 1600);
    welcomeTimer = setTimeout(() => setShowWelcome(true), 2400);

    return () => {
      clearTimeout(namesTimer);
      clearTimeout(metricSwitcherTimer);
      clearTimeout(welcomeTimer);
    };
  }, []);

  // Handlers
  const handleAuthClick = () => {
    setShowSignUp(true);
  };

  const handleAnalyzeAnotherChat = () => {
    setHash("");
    setToken("");
    router.push("/");
  };

  const handleNameChange = (updatedUsers: ChatUser[]) => {
    if (!hash) return;
    if (users) {
      setUsers([...updatedUsers]);
      uploadJsonToS3(`chat/${hash}/people.json`, updatedUsers);
      mutateS3Cache(hash, `chat/:hash:/people.json`);
    }
  };

  return (
    <>
      <div className="sticky top-0 z-10">
        <Card
          className={cn(
            "relative border-b bg-background/90 backdrop-blur-md transition-all duration-300",
            isScrolled ? "h-14 sm:h-16" : isMobile ? "h-20 sm:h-24" : "h-28"
          )}
        >
          <div className="relative h-full">
            {/* Mosaic logo (fades/shrinks out on scroll) */}
            <h1
              onClick={() => router.replace("/user-dashboard")}
              className={cn(
                comfortaa.className,
                "absolute left-2 cursor-pointer transition-all duration-300",
                isScrolled
                  ? "opacity-0 pointer-events-none scale-95"
                  : "opacity-100 scale-100",
                "bg-gradient-to-r from-blue-500 via-cyan-400 to-blue-400 bg-clip-text text-transparent font-bold",
                isMobile ? "text-xl top-2 sm:text-2xl sm:top-3" : "text-4xl top-4"
              )}
            >
              Mosaic
            </h1>

            {/* Owner share button OR "Analyze another chat" (top-right) */}
            {amIOwner ? (
              <div
                className={cn(
                  "absolute right-2 transition-all duration-300",
                  isScrolled ? "opacity-0 pointer-events-none" : "opacity-100",
                  isMobile ? "top-2 sm:top-3" : "top-4"
                )}
              >
                <ShareIconButton />
              </div>
            ) : (
              <Button
                onClick={handleAnalyzeAnotherChat}
                className={cn(
                  "absolute right-2 px-2 sm:px-3 py-1 text-xs transition-all duration-300",
                  isScrolled ? "opacity-0 pointer-events-none" : "opacity-100",
                  isMobile ? "top-2 sm:top-3" : "top-4"
                )}
                variant="default"
                size="sm"
              >
                {isMobile ? "New Chat" : "Analyze another chat"}
              </Button>
            )}

            {/* Sign In / Welcome (stacked below in non-scrolled, moves up on scroll) */}
            {showWelcome && (
              <div
                className={cn(
                  "absolute right-2 transition-all duration-300 pointer-events-auto",
                  isScrolled 
                    ? isMobile ? "top-3" : "top-4" 
                    : isMobile ? "top-10 sm:top-12" : "top-16",
                  "opacity-100"
                )}
              >
                {isAuthenticated ? (
                  <div
                    className={cn(
                      "inline-flex items-center h-6 sm:h-8 px-2 sm:px-3 text-xs sm:text-sm leading-tight rounded-md bg-muted/50 shadow-sm",
                      "text-muted-foreground"
                    )}
                  >
                    {isMobile ? "Chat insights!" : "Welcome to your chat insights!"}
                  </div>
                ) : (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleAuthClick}
                    className="text-blue-500 text-xs sm:text-sm px-2 sm:px-3 h-6 sm:h-8"
                  >
                    {isMobile ? "Sign In" : "Sign In / Sign Up"}
                  </Button>
                )}
              </div>
            )}

            {/* User Names (start at bottom-left, slide up on scroll) */}
            {showNames && users && users.length > 1 && (
              <div
                onClick={() => setIsNameEditModalOpen(true)}
                className={cn(
                  "absolute left-2 inline-flex items-center h-6 sm:h-8 px-2 sm:px-3 text-xs leading-tight rounded-md bg-muted/50 shadow-sm cursor-pointer transition-all duration-500",
                  isScrolled
                    ? "top-1/2 -translate-y-1/2"
                    : "bottom-2 sm:bottom-4 translate-y-0",
                  isMobile && !isScrolled ? "max-w-[120px] truncate" : ""
                )}
              >
                <span 
                  style={{ color: getUserColors(users[0]).primary }}
                  className={cn(isMobile && "max-w-[40px] sm:max-w-[60px] truncate block")}
                >
                  {users[0].name}
                </span>
                <span className="mx-1 text-muted-foreground">&amp;</span>
                <span 
                  style={{ color: getUserColors(users[1]).primary }}
                  className={cn(isMobile && "max-w-[40px] sm:max-w-[60px] truncate block")}
                >
                  {users[1].name}
                </span>
              </div>
            )}

            {/* Metric Switcher (bottom-center, moves to center on scroll) */}
            {showMetricSwitcher && (
              <div
                className={cn(
                  "absolute inline-flex items-center h-6 sm:h-8 px-2 sm:px-3 text-xs leading-tight rounded-md bg-muted/50 shadow-sm transition-all duration-500",
                  isScrolled
                    ? "top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"
                    : "bottom-2 sm:bottom-4 left-1/2 -translate-x-1/2"
                )}
              >
                <MetricSwitcher />
              </div>
            )}
          </div>
        </Card>

        {/* Modal for editing user names */}
        {users && users.length > 1 && (
          <UserNameAndIdentityDialog
            key={users.map((u) => u.name + u.username + u.isMe).join(",")}
            open={isNameEditModalOpen}
            users={users}
            onClose={() => setIsNameEditModalOpen(false)}
            onNameChange={handleNameChange}
          />
        )}
      </div>

      {showSignUp && (
        <SignUp
          open={showSignUp}
          onClose={() => setShowSignUp(false)}
          onSignInClick={() => {
            setShowSignIn(true);
            setShowSignUp(false);
          }}
          onAuthSuccess={async () => {
            setShowSignUp(false);
            const { tokens } = await fetchAuthSession();
            console.log("tokens", tokens);
          }}
        />
      )}
      {showSignIn && (
        <SignIn
          open={showSignIn}
          onClose={() => setShowSignIn(false)}
          onSignUpClick={() => {
            setShowSignUp(true);
            setShowSignIn(false);
          }}
          onAuthSuccess={async () => {
            setShowSignIn(false);
            const { tokens } = await fetchAuthSession();
            console.log("tokens", tokens);
          }}
        />
      )}
    </>
  );
};
export default Title;
