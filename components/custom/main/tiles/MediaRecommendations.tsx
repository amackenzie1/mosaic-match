import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useIsMobile } from "@/components/ui/use-mobile";
import { useGeneralInfo } from "@/lib/contexts/general-info";
import { useThemeColors } from "@/lib/hooks/useThemeColors";
import { useUserColors } from "@/lib/hooks/useUserColors";
import { cn } from "@/lib/utils";
import { useS3Fetcher } from "@/lib/utils/fetcher";
import { updateUserReferences } from "@/lib/utils/general";
import {
  analyzePersonalities,
  PersonalityProfile,
} from "@/lib/utils/personalityInsights";
import { Book, Gift, Info, Music, Video } from "lucide-react";
import React from "react";

type MediaTypeKey =
  | "song_recommendations"
  | "gift_recommendations"
  | "movie_recommendations"
  | "book_recommendations";

interface MediaItemProps {
  text: string;
  icon: React.ElementType;
  color: string;
}

const MediaItem: React.FC<MediaItemProps & { isMobile?: boolean }> = ({
  text,
  icon: Icon,
  color,
  isMobile,
}) => {
  return (
    <div
      className={cn(
        "flex items-center gap-3 sm:gap-4 rounded-lg bg-muted/50 hover:bg-muted/70 transition-all group relative overflow-hidden",
        isMobile ? "p-3" : "p-4"
      )}
      style={{ borderLeft: `3px solid ${color}` }}
    >
      <div
        className={cn(
          "rounded-full transition-all relative",
          isMobile ? "p-2" : "p-3"
        )}
        style={{ backgroundColor: color + "20", color: color }}
      >
        <Icon className={cn(isMobile ? "h-4 w-4" : "h-5 w-5")} />
      </div>
      <p
        className={cn(
          "text-content group-hover:text-foreground transition-colors",
          isMobile ? "text-xs" : "text-sm"
        )}
      >
        {text}
      </p>
    </div>
  );
};

const UserProfile: React.FC<{ userId: string; isMobile?: boolean }> = ({
  userId,
  isMobile,
}) => {
  const { users } = useGeneralInfo();
  const { getUserColors } = useUserColors();
  if (!users) return null;

  const user = users.find((u) => u.username === userId);
  if (!user) return null;

  const userColors = getUserColors(user);
  const initial = user.name.charAt(0).toUpperCase();

  return (
    <div className="flex items-center gap-3 sm:gap-4">
      <div className="relative group">
        <div
          className="absolute inset-0 rounded-full opacity-20 animate-pulse group-hover:animate-none group-hover:opacity-30 transition-all"
          style={{ backgroundColor: userColors.primary }}
        />
        <div
          className="absolute -inset-1 rounded-full opacity-10 group-hover:opacity-20 transition-all animate-pulse group-hover:animate-none"
          style={{ backgroundColor: userColors.primary }}
        />
        <Avatar
          className={cn(
            "relative border-2 transition-transform group-hover:scale-105 bg-background",
            isMobile ? "h-10 w-10" : "h-12 w-12"
          )}
          style={{
            borderColor: userColors.primary + "50",
          }}
        >
          <AvatarFallback
            style={{ color: userColors.primary }}
            className={cn(isMobile ? "text-sm" : "text-base")}
          >
            {initial}
          </AvatarFallback>
        </Avatar>
      </div>
      <div className="flex flex-col">
        <span
          className={cn(
            "font-semibold text-foreground truncate max-w-[200px] sm:max-w-full",
            isMobile ? "text-base" : "text-lg"
          )}
        >
          {user.name}
        </span>
        <span
          className={cn("transition-colors", isMobile ? "text-xs" : "text-sm")}
          style={{ color: userColors.primary + "90" }}
        >
          {isMobile ? "User Profile" : "Media Recommendations"}
        </span>
      </div>
    </div>
  );
};

const MediaRecommendations: React.FC = () => {
  const { users, file } = useGeneralInfo();
  const colors = useThemeColors();
  const { getUserColors } = useUserColors();
  const isMobile = useIsMobile();

  const {
    data: insights,
    isLoading,
    error,
  } = useS3Fetcher<PersonalityProfile>({
    generator: analyzePersonalities,
    cachePath: "chat/:hash:/personality-insights.json",
  });

  if (isLoading) {
    return file ? (
      <Card>
        <CardContent
          className={cn(
            "flex justify-center items-center",
            isMobile ? "p-8" : "p-12",
            isMobile ? "h-[300px]" : "h-[400px]"
          )}
        >
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
        </CardContent>
      </Card>
    ) : null;
  }

  if (!insights || error || !users) {
    return null;
  }

  // Sort users by username for consistent ordering
  const sortedUsers = [...users].sort((a, b) =>
    a.username.localeCompare(b.username)
  );
  const [user1, user2] = sortedUsers;

  const mediaTypes: Array<{
    key: MediaTypeKey;
    title: string;
    icon: React.ElementType;
    color: string;
  }> = [
    {
      key: "song_recommendations",
      title: "Music",
      icon: Music,
      color: "hsl(var(--chart-1))",
    },
    {
      key: "gift_recommendations",
      title: "Gifts",
      icon: Gift,
      color: "hsl(var(--chart-2))",
    },
    {
      key: "movie_recommendations",
      title: "Movies & Shows",
      icon: Video,
      color: "hsl(var(--chart-3))",
    },
    {
      key: "book_recommendations",
      title: "Books",
      icon: Book,
      color: "hsl(var(--chart-4))",
    },
  ];

  const processedInsights = Object.fromEntries(
    Object.entries(insights).map(([person, analysis]) => [
      person,
      {
        ...analysis,
        // Media recommendations
        song_recommendations: analysis.song_recommendations?.map((song) =>
          updateUserReferences(song, users)
        ),
        gift_recommendations: analysis.gift_recommendations?.map((gift) =>
          updateUserReferences(gift, users)
        ),
        movie_recommendations: analysis.movie_recommendations?.map((movie) =>
          updateUserReferences(movie, users)
        ),
        book_recommendations: analysis.book_recommendations?.map((book) =>
          updateUserReferences(book, users)
        ),
      },
    ])
  );

  return (
    <Card>
      <CardHeader className="p-4 sm:p-6">
        <div className="flex flex-col items-center text-center">
          <div className="flex items-center justify-center gap-2">
            <CardTitle
              className={cn("font-bold", isMobile ? "text-xl" : "text-2xl")}
            >
              User Profiles
            </CardTitle>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Info className="h-4 w-4 text-content cursor-help hover:text-primary transition-colors" />
                </TooltipTrigger>
                <TooltipContent className="max-w-sm">
                  Detailed user profiles including recommendations for music,
                  gifts, movies, and books based on conversation analysis.
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </div>
      </CardHeader>
      <CardContent
        className={cn(
          "space-y-5 sm:space-y-8",
          isMobile ? "p-3 sm:p-6" : "p-6"
        )}
      >
        {Object.entries(processedInsights)
          .sort(([a], [b]) => a.localeCompare(b))
          .map(([userId, analysis]) => {
            const user = users?.find((u) => u.username === userId);
            const userColors = user
              ? getUserColors(user)
              : { primary: colors.chart1 };

            return (
              <Card
                key={userId}
                className="bg-gradient-to-br from-background via-background to-muted/30 overflow-hidden hover:shadow-lg transition-all duration-500 relative"
                style={{
                  background: `linear-gradient(to bottom right, ${userColors.primary}10, transparent)`,
                }}
              >
                <div className="absolute inset-0 bg-dot-pattern opacity-[0.02] pointer-events-none" />
                <div className="absolute inset-0 bg-gradient-to-br from-transparent via-transparent to-muted/10 pointer-events-none" />
                <CardHeader
                  className={cn("relative", isMobile ? "p-4 pb-4" : "p-6 pb-6")}
                >
                  <div className="flex flex-col gap-4 sm:gap-6">
                    <UserProfile userId={userId} isMobile={isMobile} />
                    <div className="h-px bg-gradient-to-r from-transparent via-border to-transparent opacity-50" />
                  </div>
                </CardHeader>
                <CardContent
                  className={cn("relative", isMobile ? "p-3" : "p-6")}
                >
                  {/* Media Recommendations Section */}
                  <div>
                    <h3
                      className={cn(
                        "font-semibold mb-4",
                        isMobile ? "text-base" : "text-lg"
                      )}
                    >
                      Media Recommendations
                    </h3>
                    <div className="grid gap-4 sm:gap-6 md:grid-cols-2">
                      {mediaTypes.map(
                        ({ key, title, icon, color }) =>
                          analysis[key] && (
                            <Card
                              key={key}
                              className="border-2 bg-gradient-to-br from-background to-muted/5 transition-all relative overflow-hidden group hover:shadow-md"
                              style={{
                                borderColor: color,
                                background: `linear-gradient(135deg, ${color}/0.1, transparent)`,
                              }}
                            >
                              <CardHeader
                                className={cn(
                                  "pb-2 sm:pb-3",
                                  isMobile ? "p-3" : "p-6"
                                )}
                              >
                                <div className="flex items-center gap-2">
                                  <div
                                    className={cn(
                                      "rounded-full transition-all",
                                      isMobile ? "p-2" : "p-2.5"
                                    )}
                                    style={{ backgroundColor: color + "20" }}
                                  >
                                    {React.createElement(icon, {
                                      className: isMobile
                                        ? "h-4 w-4"
                                        : "h-5 w-5",
                                      style: { color },
                                    })}
                                  </div>
                                  <h3
                                    className={cn(
                                      "font-medium",
                                      isMobile ? "text-base" : "text-lg"
                                    )}
                                    style={{ color }}
                                  >
                                    {title}
                                  </h3>
                                </div>
                              </CardHeader>
                              <CardContent className={isMobile ? "p-3" : "p-6"}>
                                <ScrollArea
                                  className={cn(
                                    "pr-3 sm:pr-4",
                                    isMobile ? "h-[180px]" : "h-[250px]"
                                  )}
                                >
                                  <div className="space-y-2 sm:space-y-3">
                                    {analysis[key]?.map((item, index) => (
                                      <MediaItem
                                        key={index}
                                        text={item}
                                        icon={icon}
                                        color={color}
                                        isMobile={isMobile}
                                      />
                                    ))}
                                  </div>
                                </ScrollArea>
                              </CardContent>
                            </Card>
                          )
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
      </CardContent>
    </Card>
  );
};

export default MediaRecommendations;
