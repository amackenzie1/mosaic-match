import { useGeneralInfo } from "@/lib/contexts/general-info";
import { ChatUser } from "@/lib/types";
import { useThemeColors } from "./useThemeColors";

interface UserColors {
  primary: string;
  secondary: string;
  background: string;
}

// Sort users consistently based on username
const sortUsers = (users: ChatUser[]): ChatUser[] => {
  return [...users].sort((a, b) => a.username.localeCompare(b.username));
};

export function useUserColors() {
  const { users } = useGeneralInfo();
  const colors = useThemeColors();

  // Get sorted users for consistent ordering
  const sortedUsers = users ? sortUsers(users) : [];

  const getUserColors = (user: ChatUser): UserColors => {
    if (!sortedUsers.length)
      return {
        primary: colors.chart1,
        secondary: "hsl(var(--primary))",
        background: "hsl(var(--primary) / 0.1)",
      };

    // Find user's consistent position in sorted array
    const userIndex = sortedUsers.findIndex(
      (u) => u.username === user.username
    );
    const isFirstUser = userIndex === 0;

    return {
      primary: isFirstUser ? colors.chart1 : colors.chart2,
      secondary: isFirstUser ? "hsl(var(--primary))" : "hsl(var(--secondary))",
      background: isFirstUser
        ? "hsl(var(--primary) / 0.1)"
        : "hsl(var(--secondary) / 0.1)",
    };
  };

  const getColorsByUsername = (username: string): UserColors | undefined => {
    if (!sortedUsers.length) return undefined;
    const user = sortedUsers.find((u) => u.username === username);
    if (!user) return undefined;
    return getUserColors(user);
  };

  return {
    getUserColors,
    getColorsByUsername,
    users: sortedUsers, // Return sorted users for consistent ordering
  };
}
