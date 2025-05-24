import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/use-toast";
import {
  getPreferredUsername,
  updatePreferredUsername,
} from "@/lib/utils/cognitoUpdater";
import { Menu } from "lucide-react";
import React, { useEffect, useState } from "react";

interface HeaderProps {
  user: any;
  toggleDrawer: (
    open: boolean
  ) => (event: React.KeyboardEvent | React.MouseEvent) => void;
  handleSignOut: () => void;
  boardType?: string;
  isMobile?: boolean;
}

const Header: React.FC<HeaderProps> = ({
  user,
  toggleDrawer,
  handleSignOut,
  boardType = "HomeBoard",
  isMobile = false,
}) => {
  const [preferredUsername, setPreferredUsername] = useState<string | null>(
    null
  );
  const [openModal, setOpenModal] = useState(false);
  const [newUsername, setNewUsername] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    const fetchPreferredUsername = async () => {
      try {
        const username = await getPreferredUsername();
        setPreferredUsername(username);

        // Only show modal for Google users without a preferred username
        const isGoogleUsername = /^google_\d+$/.test(user?.payload?.username);
        if (isGoogleUsername && !username) {
          setOpenModal(true);
        }
      } catch (error) {
        console.error("Error fetching preferred username:", error);
        setPreferredUsername(null);
      } finally {
        setIsLoading(false);
      }
    };

    fetchPreferredUsername();
  }, [user?.payload?.username]); // Re-run when user changes

  const handleUpdateUsername = async () => {
    if (!newUsername) return;

    setIsLoading(true);
    setError(null);

    try {
      const result = await updatePreferredUsername(newUsername);
      if (result.success) {
        setPreferredUsername(newUsername);
        setOpenModal(false);
        setNewUsername("");
        toast({
          title: "Success",
          description: "Your username has been updated.",
        });
      } else {
        setError(result.error || "Failed to update username");
        toast({
          variant: "destructive",
          title: "Error",
          description: result.error || "Failed to update username",
        });
      }
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "An unexpected error occurred";
      setError(message);
      toast({
        variant: "destructive",
        title: "Error",
        description: message,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleUsernameClick = () => {
    setError(null);
    setNewUsername(preferredUsername || "");
    setOpenModal(true);
  };

  if (isLoading) {
    return <div className="h-16" />;
  }

  const displayName = preferredUsername || user?.payload?.username || "";
  const isGoogleUsername = /^google_\d+$/.test(displayName);
  const finalDisplayName = isGoogleUsername ? "User" : displayName;

  return (
    <>
      <header className="flex justify-between items-center p-4 bg-background border-b">
        <Button
          variant="ghost"
          size="icon"
          onClick={toggleDrawer(true)}
          className="mr-2 text-gray-700 hover:text-gray-900 hover:bg-gray-100"
        >
          <Menu className="h-6 w-6" />
        </Button>

        <h1
          onClick={handleUsernameClick}
          className={`absolute left-1/2 -translate-x-1/2 font-bold cursor-pointer font-['Comfortaa'] hover:opacity-80 transition-opacity text-primary whitespace-nowrap
            ${isMobile ? 'text-xl' : 'text-[2.125rem]'}`}
        >
          {finalDisplayName}&apos;s {isMobile ? '' : boardType}
        </h1>
      </header>

      <Dialog
        open={openModal}
        onOpenChange={(open) => {
          if (!open) {
            setError(null);
          }
          setOpenModal(open);
        }}
      >
        <DialogContent onInteractOutside={(e) => e.preventDefault()}>
          <DialogHeader>
            <DialogTitle className="text-foreground">
              Choose Your Username
            </DialogTitle>
            <DialogDescription className="text-foreground">
              Please choose a preferred username for your account
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <Input
              value={newUsername}
              onChange={(e) => setNewUsername(e.target.value)}
              placeholder="Preferred Username"
              className={`${error ? "border-red-500" : ""} text-foreground`}
            />
            {error && <p className="text-sm text-red-500 -mt-2">{error}</p>}
            <Button
              onClick={handleUpdateUsername}
              disabled={!newUsername || isLoading}
              className="w-full"
            >
              {isLoading ? "Saving..." : "Save Username"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default Header;
