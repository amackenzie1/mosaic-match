"use client";

import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { ThemeSwitcher } from "@/components/ui/theme-switcher";
import { cn } from "@/lib/utils";
import { Film, Home, LogOut, ShoppingBag, User, PieChart } from "lucide-react";
import { useTheme } from "next-themes";
import { useRouter } from "next/navigation";
import React from "react";

interface DrawerProps {
  drawerOpen: boolean;
  toggleDrawer: (
    open: boolean
  ) => (event: React.KeyboardEvent | React.MouseEvent) => void;
  handleSignOut: () => void;
  currentPage?: string;
}

const CustomDrawer: React.FC<DrawerProps> = ({
  drawerOpen,
  toggleDrawer,
  handleSignOut,
  currentPage = '',
}) => {
  const router = useRouter();
  const { theme } = useTheme();
  const isDark = theme?.includes("dark");
  const currentScheme =
    theme?.replace("dark-", "").replace("light-", "") || "default";

  const handleHomeClick = () => {
    router.push("/user-dashboard");
    toggleDrawer(false)({} as React.MouseEvent);
  };

  const handleClipGalleryClick = () => {
    router.push("/user-clipboard");
    toggleDrawer(false)({} as React.MouseEvent);
  };

  const handleMatchBoardClick = () => {
    router.push("/match-board");
    toggleDrawer(false)({} as React.MouseEvent);
  };

  return (
    <Sheet
      open={drawerOpen}
      onOpenChange={(open) => toggleDrawer(open)({} as React.MouseEvent)}
    >
      <SheetContent
        side="left"
        className={cn(
          "w-[280px] p-0 border-r shadow-lg bg-background",
          isDark ? "dark" : ""
        )}
        data-theme={currentScheme}
      >
        <SheetHeader className="p-4 border-b bg-muted">
          <SheetTitle className="text-lg font-semibold text-foreground">
            Menu
          </SheetTitle>
        </SheetHeader>
        <nav className="flex flex-col p-2">
          <Button
            variant="ghost"
            className={`justify-start h-12 px-4 py-2 text-base font-medium w-full truncate hover:bg-muted ${currentPage === 'home' ? 'bg-muted' : 'text-foreground'}`}
            onClick={handleHomeClick}
          >
            <Home className="mr-3 h-5 w-5 flex-shrink-0" />
            <span className="truncate">Home</span>
          </Button>
          <Button
            variant="ghost"
            className={`justify-start h-12 px-4 py-2 text-base font-medium w-full truncate hover:bg-muted ${currentPage === 'user-clipboard' ? 'bg-muted' : 'text-foreground'}`}
            onClick={handleClipGalleryClick}
          >
            <Film className="mr-3 h-5 w-5 flex-shrink-0" />
            <span className="truncate">Clip Gallery</span>
          </Button>
          <Button
            variant="ghost"
            className={`justify-start h-12 px-4 py-2 text-base font-medium w-full truncate hover:bg-muted ${currentPage === 'match-board' ? 'bg-muted' : 'text-foreground'}`}
            onClick={handleMatchBoardClick}
          >
            <PieChart className="mr-3 h-5 w-5 flex-shrink-0" />
            <span className="truncate">Match Board</span>
          </Button>
          <Button
            variant="ghost"
            className="justify-start h-12 px-4 py-2 text-base font-medium w-full truncate text-muted-foreground"
            disabled
          >
            <User className="mr-3 h-5 w-5 flex-shrink-0" />
            <span className="truncate">Community Board (Coming Soon)</span>
          </Button>
          <Button
            variant="ghost"
            className="justify-start h-12 px-4 py-2 text-base font-medium w-full truncate text-muted-foreground"
            disabled
          >
            <ShoppingBag className="mr-3 h-5 w-5 flex-shrink-0" />
            <span className="truncate">Shop (Coming Soon)</span>
          </Button>
        </nav>
        <div className="absolute bottom-4 left-4 right-4 space-y-2">
          <ThemeSwitcher />
          <Button
            variant="outline"
            className="w-full h-10 justify-start gap-3 font-medium border border-border text-foreground hover:bg-muted"
            onClick={handleSignOut}
          >
            <LogOut className="h-5 w-5" />
            Sign Out
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default CustomDrawer;
