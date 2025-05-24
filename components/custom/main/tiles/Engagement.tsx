import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import UserAvatar from "@/components/ui/user-avatar";
import { useIsMobile } from "@/components/ui/use-mobile";
import { useGeneralInfo } from "@/lib/contexts/general-info";
import { useUserColors } from "@/lib/hooks/useUserColors";
import { ChatUser } from "@/lib/types";
import { cn } from "@/lib/utils";
import {
  EngagementData,
  processEngagementData,
} from "@/lib/utils/engagementLogic";
import { useS3Fetcher } from "@/lib/utils/fetcher";
import { format } from "date-fns";
import { InfoIcon } from "lucide-react";
import React from "react";
import {
  Legend,
  Line,
  LineChart,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  XAxis,
  YAxis,
} from "recharts";

const formatXAxis = (dateStr: string) => {
  return format(new Date(dateStr), "MMM d");
};

const UserProfile: React.FC<{
  user: ChatUser;
  userIndex: number;
  messageCount: number;
  totalMessages: number;
  isLeft?: boolean;
  isMobile?: boolean;
}> = ({ user, userIndex, messageCount, totalMessages, isLeft, isMobile }) => {
  const percentage = Math.round((messageCount / totalMessages) * 100);
  const { getUserColors } = useUserColors();
  const userColors = getUserColors(user);

  return (
    <div className="flex flex-col space-y-2 w-full">
      <div
        className={cn(
          "flex items-center justify-between w-full",
          isLeft ? "flex-row" : "flex-row-reverse"
        )}
      >
        <div className="flex items-center gap-2 sm:gap-3">
          {isLeft ? (
            <>
              <UserAvatar
                name={user.name}
                color={userColors.primary}
                size={isMobile ? "sm" : "lg"}
              />
              <div className="flex flex-col">
                <span className="font-semibold text-sm sm:text-base truncate max-w-[120px] sm:max-w-full">
                  {user.name}
                </span>
                <span className="text-content text-xs sm:text-sm">
                  {messageCount} {isMobile ? "msgs" : "messages"}
                </span>
              </div>
            </>
          ) : (
            <>
              <div className="flex flex-col items-end">
                <span className="font-semibold text-sm sm:text-base truncate max-w-[120px] sm:max-w-full">
                  {user.name}
                </span>
                <span className="text-content text-xs sm:text-sm">
                  {messageCount} {isMobile ? "msgs" : "messages"}
                </span>
              </div>
              <UserAvatar
                name={user.name}
                color={userColors.primary}
                size={isMobile ? "sm" : "lg"}
              />
            </>
          )}
        </div>
      </div>
      <Progress
        value={percentage}
        className="bg-muted h-2 sm:h-3"
        style={
          {
            "--progress-indicator": userColors.primary,
          } as React.CSSProperties
        }
      />
    </div>
  );
};

const ActivityHeatmap: React.FC<{
  data: Record<number, Record<string, number>>;
  isMobile?: boolean;
}> = ({ data, isMobile }) => {
  const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const timeSlots = [
    { key: "Early Hours", label: isMobile ? "12-4a" : "12am - 4am" },
    { key: "Dawn", label: isMobile ? "4-8a" : "4am - 8am" },
    { key: "Mid Day", label: isMobile ? "8-12p" : "8am - 12pm" },
    { key: "Afternoon", label: isMobile ? "12-4p" : "12pm - 4pm" },
    { key: "Evening", label: isMobile ? "4-8p" : "4pm - 8pm" },
    { key: "Night", label: isMobile ? "8-12a" : "8pm - 12am" },
  ];
  const maxValue = Math.max(
    ...Object.values(data).flatMap((dayData) => Object.values(dayData))
  );

  return (
    <div className="grid grid-cols-[auto_1fr] gap-2 sm:gap-4">
      {/* Column headers for time slots */}
      <div className="text-content text-sm" /> {/* Empty cell for alignment */}
      <div className="grid grid-cols-6 gap-1 mb-1 sm:mb-2">
        {timeSlots.map((slot) => (
          <div key={slot.key} className="text-content text-[10px] sm:text-xs text-center">
            {slot.label}
          </div>
        ))}
      </div>
      {/* Days and heatmap cells */}
      <div className="flex flex-col justify-around text-content text-xs sm:text-sm h-[140px] sm:h-auto">
        {days.map((day) => (
          <span key={day}>{day}</span>
        ))}
      </div>
      <div className="grid grid-cols-6 grid-rows-7 gap-[2px] sm:gap-1 h-[140px] sm:h-auto">
        {days.map((_, dayIndex) =>
          timeSlots.map((timeSlot) => {
            const value = data[dayIndex]?.[timeSlot.key] || 0;
            const intensity = maxValue > 0 ? value / maxValue : 0;
            return (
              <TooltipProvider key={`${dayIndex}-${timeSlot.key}`}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div
                      className="w-full h-full rounded-sm"
                      style={{
                        background:
                          value === 0
                            ? "hsl(var(--muted))"
                            : `hsl(var(--primary) / ${0.2 + intensity * 0.8})`,
                      }}
                    />
                  </TooltipTrigger>
                  <TooltipContent>
                    {value} messages at {timeSlot.label} on {days[dayIndex]}
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            );
          })
        )}
      </div>
    </div>
  );
};

const Engagement: React.FC = () => {
  const { users } = useGeneralInfo();
  const isMobile = useIsMobile();
  const { getUserColors } = useUserColors();

  const { data: engagementData } = useS3Fetcher<EngagementData>({
    generator: processEngagementData,
    cachePath: "chat/:hash:/engagement.json",
  });

  if (!engagementData || !users) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className={cn(
            "flex items-center justify-center",
            isMobile ? "h-[300px]" : "h-[400px]"
          )}>
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
          </div>
        </CardContent>
      </Card>
    );
  }

  const {
    chartData,
    distribution: rawDistribution,
    heatmapData,
  } = engagementData;
  const [user1, user2] = users;
  const distribution = rawDistribution.filter((d) =>
    [user1.username, user2.username].includes(d.userId)
  );
  const totalMessages = distribution.reduce(
    (sum, d) => sum + d.messageCount,
    0
  );
  return (
    <div className="space-y-4 sm:space-y-6">
      <Card>
        <CardHeader className="p-4 sm:p-6">
          <div className="flex flex-col items-center gap-2">
            <div className="flex items-center gap-2">
              <CardTitle className="text-xl sm:text-2xl">Engagement Analysis</CardTitle>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <InfoIcon className="h-4 w-4 text-muted-foreground cursor-help hover:text-primary" />
                  </TooltipTrigger>
                  <TooltipContent className="max-w-sm">
                    Analysis of chat engagement patterns and interaction
                    dynamics over time.
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-3 sm:p-6 space-y-5 sm:space-y-8">
          {/* Message Distribution */}
          <div className="grid gap-4 sm:gap-6 md:grid-cols-2">
            {distribution.map((d, i) => {
              const user = users.find((u) => u.username === d.userId)!;
              const userIndex = users.findIndex((u) => u.username === d.userId);
              return (
                <UserProfile
                  key={d.userId}
                  user={user}
                  userIndex={userIndex}
                  messageCount={d.messageCount}
                  totalMessages={totalMessages}
                  isLeft={i === 0}
                  isMobile={isMobile}
                />
              );
            })}
          </div>

          {/* Activity Heatmap */}
          {heatmapData && (
            <div>
              <h3 className="text-base sm:text-lg font-semibold mb-2 sm:mb-4">
                Weekly Activity Pattern
              </h3>
              <ActivityHeatmap data={heatmapData} isMobile={isMobile} />
            </div>
          )}

          {/* Engagement Trend */}
          <div>
            <h3 className="text-base sm:text-lg font-semibold mb-2 sm:mb-4">Engagement Over Time</h3>
            <div className={cn(
              isMobile ? "h-[200px]" : "h-[300px]"
            )}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={chartData}
                  margin={isMobile 
                    ? { top: 5, right: 5, left: 0, bottom: 5 } 
                    : { top: 10, right: 10, left: 10, bottom: 10 }
                  }
                >
                  <XAxis
                    dataKey="weekStart"
                    tickFormatter={formatXAxis}
                    interval={isMobile ? 3 : 1}
                    tick={{ fontSize: isMobile ? 10 : 12 }}
                  />
                  <YAxis 
                    width={isMobile ? 22 : 30}
                    tick={{ fontSize: isMobile ? 10 : 12 }}
                  />
                  <RechartsTooltip
                    formatter={(value: number, name: string) => {
                      const user = users.find((u) => u.username === name);
                      return [`${value} ${isMobile ? "msgs" : "messages"}`, user?.name || name];
                    }}
                    contentStyle={{
                      backgroundColor: "hsl(var(--popover))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "0.5rem",
                      padding: isMobile ? "0.5rem" : "0.75rem",
                      fontSize: isMobile ? "12px" : "inherit",
                    }}
                    labelStyle={{
                      color: "hsl(var(--muted-foreground))",
                      marginBottom: isMobile ? "0.25rem" : "0.5rem",
                      fontSize: isMobile ? "12px" : "inherit",
                    }}
                    itemStyle={{
                      color: "hsl(var(--foreground))",
                      fontSize: isMobile ? "12px" : "inherit",
                    }}
                    labelFormatter={(label) =>
                      format(new Date(label), isMobile ? "MMM d" : "MMM d, yyyy")
                    }
                  />
                  <Legend
                    formatter={(value: string) =>
                      users.find((u) => u.username === value)?.name || value
                    }
                    iconSize={isMobile ? 8 : 10}
                    fontSize={isMobile ? 10 : 12}
                    verticalAlign={isMobile ? "top" : "bottom"}
                    wrapperStyle={isMobile ? { paddingTop: "5px" } : undefined}
                  />
                  {users.map((user) => {
                    const userColors = getUserColors(user);
                    return (
                      <Line
                        key={user.username}
                        type="monotone"
                        dataKey={(data) => data.numMessages[user.username] || 0}
                        name={user.username}
                        stroke={userColors.primary}
                        strokeWidth={isMobile ? 1.5 : 2}
                        dot={isMobile ? { r: 2 } : false}
                        activeDot={{ r: isMobile ? 4 : 6 }}
                      />
                    );
                  })}
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Engagement;
