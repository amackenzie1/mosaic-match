import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import { useGeneralInfo } from "@/lib/contexts/general-info";
import { ChatUser } from "@/lib/types";
import { cn } from "@/lib/utils";
import { mutateS3Cache } from "@/lib/utils/mutateS3Cache";
import { deleteFile } from "@/lib/utils/s3cache";
import { uploadJsonToS3 } from "@amackenzie1/mosaic-lib";
import { Comfortaa } from "next/font/google";
import Image from "next/image";
import { useRouter } from "next/navigation";
import React, { useState } from "react";
import { useShareFunctionality } from "../../main/tiles/ShareIconButton";
import UserNameAndIdentityDialog from "./UserNameAndIdentityDialog";

const comfortaa = Comfortaa({
  subsets: ["latin"],
  weight: ["700"],
});

const categoryColors: Record<string, string> = {
  friendship: "#B3DBFF", // Light blue
  professional: "#000000", // Pure black
  romance: "#FFB3B3", // Soft pastel red/pink
  family: "#B8E6B8", // Soft pastel green
  default: "#F5F5F5", // Light grey
};

interface Chat {
  id: string;
  name: string;
  date: string;
  category: string;
  imageUrl?: string;
  hash?: string;
  uploadTimestamp?: number;
}

interface ChatsGridSectionProps {
  chats: Chat[];
  users?: Record<string, ChatUser[]>;
  onDeleteChat?: (hash: string) => void;
  onUpdateUsers?: (hash: string, users: ChatUser[]) => void;
  isMobile?: boolean;
}

const ChatCard: React.FC<{
  chat: Chat;
  users: ChatUser[];
  onContextMenu: (e: React.MouseEvent, hash: string) => void;
  onClick: () => void;
  isMobile?: boolean;
}> = ({ chat, users, onContextMenu, onClick, isMobile = false }) => {
  const [imageLoaded, setImageLoaded] = useState(!chat.imageUrl);
  const [showLabel, setShowLabel] = useState(false);
  
  // For mobile, we'll use touch events to toggle the label visibility
  const handleTouchStart = () => {
    if (isMobile) {
      setShowLabel(true);
    }
  };
  
  const handleTouchEnd = () => {
    if (isMobile) {
      // Add a small delay before hiding the label to allow for clicking
      setTimeout(() => setShowLabel(false), 1500);
    }
  };
  
  return (
    <div
      key={chat.id}
      className={cn(
        "relative cursor-pointer group",
        "rounded-lg overflow-hidden",
        "transition-all duration-300",
        isMobile ? "w-[130px]" : "w-[160px]",
        "aspect-square",
        "hover:shadow-[0_0_15px_-5px_hsl(var(--chart-1)_/_0.3)]",
        "dark:hover:shadow-[0_0_20px_-5px_hsl(var(--chart-1)_/_0.4)]"
      )}
      onClick={onClick}
      onContextMenu={(e) => chat.hash && onContextMenu(e, chat.hash)}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {chat.imageUrl ? (
        <>
          {!imageLoaded && (
            <div
              className={cn(
                "w-full h-full rounded-lg p-1 flex items-center justify-center",
                "transition-all duration-300"
              )}
              style={{
                backgroundColor: categoryColors[chat.category || "default"],
              }}
            >
              <span className="text-lg font-semibold text-foreground">
                {chat.name || "Loading..."}
              </span>
            </div>
          )}
          <img
            src={chat.imageUrl}
            alt={chat.name}
            className={cn(
              "w-full h-full object-cover p-1 rounded-lg",
              "transition-all duration-300",
              isMobile ? "" : "group-hover:scale-105 group-hover:blur-[1px]",
              !imageLoaded && "hidden"
            )}
            style={{
              backgroundColor: categoryColors[chat.category || "default"],
            }}
            onLoad={() => setImageLoaded(true)}
          />
        </>
      ) : (
        <div
          className={cn(
            "w-full h-full rounded-lg p-1",
            "flex items-center justify-center",
            "transition-all duration-300",
            isMobile ? "" : "group-hover:scale-105"
          )}
          style={{
            backgroundColor: categoryColors[chat.category || "default"],
          }}
        >
          <span className="text-lg font-semibold text-foreground">
            {chat.name}
          </span>
        </div>
      )}
      <div
        className={cn(
          "absolute inset-1 flex items-center justify-center",
          "transition-opacity duration-300 backdrop-blur-sm rounded-lg bg-black/40",
          isMobile 
            ? (showLabel ? "opacity-100" : "opacity-0")
            : "opacity-0 group-hover:opacity-100"
        )}
      >
        <span
          className={cn(
            "font-bold text-white text-center px-4 py-2",
            isMobile ? "text-sm" : "text-base md:text-lg", 
            comfortaa.className,
            "leading-tight",
            "drop-shadow-[0_2px_2px_rgba(0,0,0,0.5)]"
          )}
        >
          {users.map((user) => user.name).join(" & ")}
        </span>
      </div>
    </div>
  );
};

const ChatsGridSection: React.FC<ChatsGridSectionProps> = ({
  chats,
  users = {},
  onDeleteChat,
  onUpdateUsers,
  isMobile = false,
}) => {
  const router = useRouter();
  const { setHash, setToken } = useGeneralInfo();
  const { shareAction, ShareModal } = useShareFunctionality();
  const [contextMenu, setContextMenu] = useState<{
    mouseX: number;
    mouseY: number;
    hash: string;
  } | null>(null);
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
  const [activeHash, setActiveHash] = useState<string | null>(null);
  const [openUserModal, setOpenUserModal] = useState(false);

  const handleContextMenu = (event: React.MouseEvent, hash: string) => {
    event.preventDefault();
    setContextMenu({
      mouseX: event.clientX,
      mouseY: event.clientY,
      hash,
    });
  };

  const handleContextMenuClose = () => {
    setContextMenu(null);
  };

  const handleDeleteConfirmation = (hash: string) => {
    setActiveHash(hash);
    setConfirmDeleteOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (activeHash) {
      await deleteFile(activeHash, `chat/${activeHash}`, "fake", () =>
        Promise.resolve("fake")
      );
      onDeleteChat?.(activeHash);
    }
    setConfirmDeleteOpen(false);
    setActiveHash(null);
    handleContextMenuClose();
  };

  const handleEditNames = (updatedUsers: ChatUser[]) => {
    if (activeHash && onUpdateUsers) {
      onUpdateUsers(activeHash, updatedUsers);
      uploadJsonToS3(`chat/${activeHash}/people.json`, updatedUsers);
      mutateS3Cache(activeHash, `chat/:hash:/people.json`);
    }
    setOpenUserModal(false);
  };

  const getSpecificUsers = (hash: string): ChatUser[] => {
    return users[hash] || [];
  };

  const handleChatClick = (chat: Chat) => {
    if (chat.hash && typeof chat.hash === "string") {
      // Ensure data is ready before navigation
      Promise.all([
        // Wait for data to be set
        new Promise((resolve) => {
          setHash(chat.hash!); // We can safely use ! here because of the check above
          setToken("fake");
          resolve(true);
        }),
        // Add a small delay to ensure state updates
        new Promise((resolve) => setTimeout(resolve, 100)),
      ]).then(() => {
        router.push(`/main`);
      });
    }
  };

  return (
    <div
      className={cn(
        "rounded-lg border bg-card relative",
        "border-[hsl(var(--chart-1)_/_0.2)] hover:border-[hsl(var(--chart-1)_/_0.3)]",
        "transition-all duration-300",
        "bg-gradient-to-br from-[hsl(var(--chart-1)_/_0.05)] via-transparent to-transparent",
        isMobile ? "p-4" : "p-8"
      )}
    >
      {/* Title */}
      <h2
        className={cn(
          comfortaa.className,
          "font-bold text-center text-foreground",
          isMobile ? "text-xl mb-4" : "text-2xl mb-8"
        )}
      >
        Your Chats
      </h2>

      {/* Grid Container */}
      <div className={cn(
        "flex flex-wrap justify-center",
        isMobile ? "gap-2" : "gap-4"
      )}>
        {chats.map((chat) => (
          <ChatCard
            key={chat.id}
            chat={chat}
            users={getSpecificUsers(chat.hash || "")}
            onContextMenu={handleContextMenu}
            onClick={() => handleChatClick(chat)}
            isMobile={isMobile}
          />
        ))}
      </div>

      {/* Context Menu */}
      <DropdownMenu
        open={contextMenu !== null}
        onOpenChange={handleContextMenuClose}
      >
        <DropdownMenuContent
          className="bg-popover text-popover-foreground"
          style={{
            position: "fixed",
            top: contextMenu?.mouseY,
            left: contextMenu?.mouseX,
          }}
        >
          <DropdownMenuItem
            className="text-foreground hover:text-accent-foreground"
            onClick={() => {
              shareAction(contextMenu?.hash);
              handleContextMenuClose();
            }}
          >
            Share Dashboard
          </DropdownMenuItem>
          <DropdownMenuItem
            className="text-foreground hover:text-accent-foreground"
            onClick={() => {
              setActiveHash(contextMenu?.hash || "");
              setOpenUserModal(true);
              handleContextMenuClose();
            }}
          >
            Edit Names
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => {
              handleDeleteConfirmation(contextMenu?.hash || "");
              handleContextMenuClose();
            }}
            className="text-destructive hover:text-destructive/90"
          >
            Delete Chat
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Share Modal */}
      <ShareModal />

      {/* Delete Confirmation Dialog */}
      <Dialog open={confirmDeleteOpen} onOpenChange={setConfirmDeleteOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle className="text-lg font-semibold text-foreground">
              Confirm Delete
            </DialogTitle>
            <DialogDescription className="text-sm text-muted-foreground mt-2">
              Are you sure you want to delete this chat? This action cannot be
              undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-6 space-x-2">
            <Button
              variant="outline"
              onClick={() => setConfirmDeleteOpen(false)}
              className="text-foreground hover:text-foreground/90"
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleConfirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Names Dialog */}
      <UserNameAndIdentityDialog
        key={getSpecificUsers(activeHash || "")
          .map((u) => u.name + u.username + u.isMe)
          .join(",")}
        open={openUserModal}
        users={getSpecificUsers(activeHash || "")}
        onClose={() => setOpenUserModal(false)}
        onNameChange={handleEditNames}
      />
    </div>
  );
};

export default ChatsGridSection;
