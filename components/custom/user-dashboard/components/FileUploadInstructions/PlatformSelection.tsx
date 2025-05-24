import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useIsMobile } from "@/components/ui/use-mobile";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { Ghost, Instagram, Laptop, Send, Smartphone } from "lucide-react";
import { useTheme } from "next-themes";
import dynamic from "next/dynamic";
import React from "react";

// Dynamically import icons like in chat-platforms.tsx for consistency
const MessageCircle = dynamic(
  () => import("lucide-react").then((mod) => mod.MessageCircle),
  { ssr: false }
);
const MessageSquare = dynamic(
  () => import("lucide-react").then((mod) => mod.MessageSquare),
  { ssr: false }
);
const Facebook = dynamic(
  () => import("lucide-react").then((mod) => mod.Facebook),
  { ssr: false }
);

// Updated platforms array to align with chat-platforms.tsx styling
const platforms = [
  {
    id: "whatsapp-mobile",
    name: "WhatsApp Mobile",
    icon: MessageCircle,
    description: "Export chat from your WhatsApp mobile app.",
    gradientColor: "from-green-500 to-emerald-500",
  },
  {
    id: "whatsapp-desktop",
    name: "WhatsApp Desktop",
    icon: Laptop,
    description: "Export chat from WhatsApp Web or Desktop app.",
    gradientColor: "from-green-500 to-emerald-500",
  },
  {
    id: "telegram",
    name: "Telegram",
    icon: Send,
    description: "Analyze messages from your Telegram chats.",
    gradientColor: "from-blue-500 to-sky-500",
  },
  {
    id: "imessage",
    name: "iMessage",
    icon: MessageSquare,
    description: "Analyze messages from your iMessage chats.",
    gradientColor: "from-blue-400 to-cyan-500",
  },
  {
    id: "instagram",
    name: "Instagram",
    icon: Instagram,
    description: "Analyze messages from your Instagram DMs.",
    gradientColor: "from-purple-500 to-pink-500",
  },
  {
    id: "messenger",
    name: "Messenger",
    icon: Facebook,
    description: "Analyze messages from Facebook and Messenger.",
    gradientColor: "from-blue-600 to-indigo-500",
  },
  {
    id: "snapchat",
    name: "Snapchat",
    icon: Ghost,
    description: "Analyze messages from your Snapchat chats.",
    gradientColor: "from-yellow-400 to-yellow-500",
  },
  {
    id: "android",
    name: "Android SMS",
    icon: Smartphone,
    description: "Analyze messages from your Android device.",
    gradientColor: "from-teal-500 to-cyan-600",
  },
];

interface PlatformSelectionProps {
  onPlatformSelect: (platformId: string) => void;
  onClose?: () => void;
}

const PlatformSelection: React.FC<PlatformSelectionProps> = ({
  onPlatformSelect,
  onClose,
}) => {
  const { theme } = useTheme();
  const isMobile = useIsMobile();
  const isDark = theme?.includes("dark");
  const currentScheme =
    theme?.replace("dark-", "").replace("light-", "") || "default";

  return (
    <div
      className={cn("flex flex-col h-full bg-background", isDark ? "dark" : "")}
      data-theme={currentScheme}
    >
      {/* Header */}
      <div className="space-y-1 sm:space-y-2 px-3 py-3 sm:py-4 border-b bg-muted/50 shrink-0">
        <div className="flex flex-col items-center justify-center text-center">
          <h2 className="text-base sm:text-lg font-semibold text-foreground">
            Select Your Chat Platform
          </h2>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1 px-2 max-w-md mx-auto">
            Choose your messaging platform to get step-by-step upload
            instructions
          </p>
        </div>
      </div>

      {/* Content */}
      <ScrollArea className="flex-1 w-full h-full overflow-y-auto">
        <div className="p-2 sm:p-4 md:p-6">
          <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-4 md:gap-6 max-w-6xl mx-auto">
            {platforms.map((platform, index) => (
              <Card
                key={platform.id}
                onClick={() => onPlatformSelect(platform.id)}
                className={cn(
                  "group relative flex flex-col items-center overflow-hidden card-backdrop",
                  "p-3 sm:p-4 md:p-6 transition-all duration-300 cursor-pointer",
                  "border-border/50 hover:border-border",
                  "active:shadow-sm sm:hover:shadow-xl hover:-translate-y-1",
                  "hover:ring-2 sm:hover:ring-2 hover:ring-blue-500/60 hover:ring-offset-1 sm:hover:ring-offset-2 ring-offset-background",
                  "touch-action-manipulation rounded-xl"
                )}
              >
                <motion.div
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ duration: 0.5, delay: index * 0.05 }}
                  className={cn(
                    "w-12 h-12 rounded-xl flex items-center justify-center mb-3 group-hover:scale-110 transition-transform",
                    `bg-gradient-to-r ${platform.gradientColor}`
                  )}
                >
                  <platform.icon className={cn("w-6 h-6 text-white")} />
                </motion.div>
                <h3
                  className={cn(
                    "text-base sm:text-lg font-semibold mb-0.5 sm:mb-1 text-center",
                    "text-foreground group-hover:text-primary transition-colors"
                  )}
                >
                  {platform.name}
                </h3>
                <p
                  className={cn(
                    "text-[10px] sm:text-xs text-center line-clamp-2 transition-colors",
                    "text-muted-foreground group-hover:text-foreground/80"
                  )}
                >
                  {platform.description}
                </p>
              </Card>
            ))}
          </div>
        </div>
      </ScrollArea>
    </div>
  );
};

export default PlatformSelection;
