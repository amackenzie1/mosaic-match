import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { useGeneralInfo } from "@/lib/contexts/general-info";
import { ChatUser } from "@/lib/types";
import { mutateS3Cache } from "@/lib/utils/mutateS3Cache";
import { uploadJsonToS3 } from "@amackenzie1/mosaic-lib";
import { useEffect, useState } from "react";

/**
 * Extract traits from a chat for a specific user
 */
async function extractTraitsFromChat(chatHash: string, username: string): Promise<string[]> {
  try {
    // Fetch personality data for this chat
    const response = await fetch(`/api/chat-data?hash=${chatHash}`);
    if (!response.ok) {
      throw new Error('Failed to fetch chat data');
    }
    
    const data = await response.json();
    const personalityData = data.personalityData;
    
    if (!personalityData) {
      return [];
    }
    
    // Try to find the user's traits using common patterns
    const userKeys = Object.keys(personalityData);
    let userTraits: string[] = [];
    
    // Try direct username match
    if (personalityData[username]?.essence_profile) {
      userTraits = personalityData[username].essence_profile;
    }
    // Try 'X' or 'Z' if it's a dual analysis
    else if (userKeys.includes('X') && userKeys.includes('Z')) {
      // This is difficult without more context about which user is X/Z
      // For now, we can't reliably determine which is which in this function
      // The index approach used elsewhere requires chatUsers which we don't have here
    }
    // Try user1/user2 structure
    else if (userKeys.includes('user1') && userKeys.includes('user2')) {
      if (personalityData.user1?.username === username) {
        userTraits = personalityData.user1.essence_profile;
      } else if (personalityData.user2?.username === username) {
        userTraits = personalityData.user2.essence_profile;
      }
    }
    
    // Clean up traits
    return userTraits
      .map(trait => trait.trim())
      .filter(trait => trait.length > 0);
      
  } catch (error) {
    console.error('Error extracting traits:', error);
    return [];
  }
}

type UserNameAndIdentityDialogProps = {
  open: boolean;
  users: ChatUser[];
  onClose: () => void;
  onNameChange?: (updatedUsers: ChatUser[]) => void;
};

const UserNameAndIdentityDialog: React.FC<UserNameAndIdentityDialogProps> = ({
  open,
  onClose,
  users,
  onNameChange,
}) => {
  const [editedUsers, setEditedUsers] = useState<ChatUser[]>(users);
  const [selectedIdentity, setSelectedIdentity] = useState<string>("");
  const { hash, setUsers } = useGeneralInfo();

  const handleNameChange = (updatedUsers: ChatUser[]) => {
    console.log("updatedUsers", updatedUsers);
    if (users) {
      setUsers([...updatedUsers]);
      uploadJsonToS3(`chat/${hash}/people.json`, updatedUsers);
      mutateS3Cache(hash || "", `chat/:hash:/people.json`);
    }
  };

  const nameChange = onNameChange || handleNameChange;

  // Auto-select "me" if it exists
  useEffect(() => {
    if (open && users) {
      const currentMe = users.find((u) => u.isMe);
      if (currentMe) {
        setSelectedIdentity(currentMe.username);
      }
    }
  }, [open, users]);

  const handleSave = async () => {
    // Check if there was a change in who is "isMe"
    const oldMe = users.find((u) => u.isMe)?.username;
    const newMe = selectedIdentity;
    
    const updatedUsers = editedUsers.map((user) => ({
      ...user,
      isMe: user.username === selectedIdentity,
      edited: true,
    }));
    
    // Get the current user ID from localStorage if available (or other auth method)
    const userId = typeof window !== 'undefined' ? localStorage.getItem('userId') : null;
    
    // Update the user database
    nameChange(updatedUsers);
    
    // If there was a change in who is "isMe" and we have userId, update traits
    if (userId && hash && oldMe !== newMe) {
      // If someone was unset as "isMe"
      if (oldMe && oldMe !== newMe) {
        try {
          await fetch('/api/user-profile/update-traits', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId, chatHash: hash, isMe: false })
          });
        } catch (error) {
          console.error('Failed to update traits (remove):', error);
        }
      }
      
      // If someone new was set as "isMe"
      if (newMe) {
        // Get traits from personality data for the new "isMe" user
        try {
          // This function would need to be implemented to extract traits from a chat
          const traits = await extractTraitsFromChat(hash, newMe);
          
          if (traits && traits.length > 0) {
            await fetch('/api/user-profile/update-traits', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ userId, chatHash: hash, isMe: true, traits })
            });
          }
        } catch (error) {
          console.error('Failed to update traits (add):', error);
        }
      }
    }
    
    onClose();
  };

  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === "Enter" && !event.shiftKey) {
      handleSave();
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]" onKeyDown={handleKeyDown}>
        <DialogHeader>
          <DialogTitle className="text-lg font-semibold text-foreground">
            Edit Names & Select Your Identity
          </DialogTitle>
          <p className="text-sm text-muted-foreground mt-2">
            Edit display names and select which participant is you.
          </p>
        </DialogHeader>

        {/* Name editing section */}
        <div className="space-y-4 py-4">
          {editedUsers?.map((user) => (
            <div key={user.username} className="flex items-center gap-4">
              <Input
                placeholder="Username"
                value={user.username}
                disabled
                className="w-[30%] text-muted-foreground"
              />
              <Input
                placeholder="Display Name"
                value={user.name}
                onChange={(e) =>
                  setEditedUsers((prev) =>
                    prev.map((u) =>
                      u.username === user.username
                        ? { ...u, name: e.target.value }
                        : u
                    )
                  )
                }
                className="w-[40%] text-foreground"
              />
            </div>
          ))}
        </div>

        {/* Identity selection section */}
        <div className="space-y-4">
          <h4 className="text-sm font-medium text-foreground">
            Who are you in this conversation?
          </h4>
          <div className="flex flex-wrap gap-2">
            {editedUsers?.map((user) => (
              <Button
                key={user.username}
                variant={
                  selectedIdentity === user.username ? "default" : "outline"
                }
                onClick={() => setSelectedIdentity(user.username)}
                className="flex-grow basis-0 min-w-fit font-medium"
              >
                {user.name}
              </Button>
            ))}
            <Button
              variant={selectedIdentity === "" ? "default" : "outline"}
              onClick={() => setSelectedIdentity("")}
              className="flex-grow basis-0 min-w-fit font-medium"
            >
              Neither
            </Button>
          </div>
        </div>

        <DialogFooter className="mt-6">
          <Button
            variant="outline"
            onClick={onClose}
            className="text-foreground"
          >
            Cancel
          </Button>
          <Button onClick={handleSave} className="text-primary-foreground">
            Save Changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default UserNameAndIdentityDialog;
