"use client";

import { fetchAuthSession, signOut } from "aws-amplify/auth";
import { useRouter } from "next/navigation";
import React, { useCallback, useEffect, useState } from "react";
import WelcomePopup from "../popups/WelcomePopup";
import CustomDrawer from "./CustomDrawer";
import Footer from "./Footer";
import Header from "./Header";
import MainContent from "./MainContent";
import { DashboardBackground } from "./components/UserBackground";
import { useIsMobile } from "@/components/ui/use-mobile";

interface Chat {
  id: string;
  name: string;
  date: string;
  category: string;
}

const UserDashboard: React.FC = () => {
  const [chats, setChats] = useState<Chat[]>([]);
  const [user, setUser] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [welcomePopupOpen, setWelcomePopupOpen] = useState(false);
  const router = useRouter();
  const isMobile = useIsMobile();

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
      // This is a simplified approach - in a production app, this would be handled
      // through a more secure context provider or state management solution
      if (tokens.accessToken.payload.sub) {
        localStorage.setItem('userId', tokens.accessToken.payload.sub);
      }

      // Updated mock chats with categories
      setChats([
        {
          id: "1",
          name: "Chat 1",
          date: new Date().toISOString(),
          category: "nature",
        },
        {
          id: "2",
          name: "Chat 2",
          date: new Date().toISOString(),
          category: "fantasy",
        },
        {
          id: "3",
          name: "Chat 3",
          date: new Date().toISOString(),
          category: "sci-fi",
        },
      ]);
    } catch (error) {
      console.error("Error loading user data:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadUserData();
  }, [loadUserData]);

  const handleUploadSuccess = (
    chatId: string,
    category: string = "default"
  ) => {
    const newChat: Chat = {
      id: chatId,
      name: `Chat ${chats.length + 1}`,
      date: new Date().toISOString(),
      category: category,
    };
    setChats([...chats, newChat]);
  };

  const handleSignOut = async () => {
    try {
      await signOut();
      localStorage.setItem("showWelcomePopup", "true");
      router.push("/");
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

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

  if (isLoading) {
    return (
      <DashboardBackground>
        <div className="h-screen w-full flex flex-col items-center justify-center">
          <div className="animate-spin h-8 w-8 rounded-full border-4 border-primary border-t-transparent" />
          <p className="text-muted-foreground mt-4">
            Loading your dashboard...
          </p>
        </div>
      </DashboardBackground>
    );
  }

  return (
    <DashboardBackground>
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
        />
        <MainContent 
          chats={chats} 
          handleUploadSuccess={handleUploadSuccess} 
          isMobile={isMobile}
          userId={user?.payload?.sub || ''}
        />
        <Footer isMobile={isMobile} />
        <WelcomePopup
          open={welcomePopupOpen}
          onClose={() => setWelcomePopupOpen(false)}
        />
      </div>
    </DashboardBackground>
  );
};

export default UserDashboard;
