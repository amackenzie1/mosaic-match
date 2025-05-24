"use client";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useIsMobile } from "@/components/ui/use-mobile";
import { useGeneralInfo } from "@/lib/contexts/general-info";
import { useUserColors } from "@/lib/hooks/useUserColors";
import { ChatMessage, ChatUser } from "@/lib/types";
import { cn, getWeekStart } from "@/lib/utils";
import { getUserName, updateUserReferences } from "@/lib/utils/general";
import { getToken } from "@/lib/utils/hashAuthentication";
import { SentimentData } from "@/lib/utils/oldTypes";
import { requestFile } from "@/lib/utils/s3cache";
import { checkFileExists } from "@amackenzie1/mosaic-lib";
import { fetchSentiments } from "@/lib/utils/sentimentAnalysis";
import { format } from "date-fns";
import { BarChart2, ExternalLink, Info } from "lucide-react";
import { useTheme } from "next-themes";
import React, { useEffect, useMemo, useState } from "react";
import {
  Area,
  Legend,
  Line,
  LineChart,
  ReferenceLine,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  XAxis,
  YAxis,
} from "recharts";

// Export the CustomTooltip component

type CustomTooltipProps = {
  users: ChatUser[];
  active?: boolean;
  payload?: any;
  label?: string;
  coordinate?: any;
};
export const CustomTooltip = ({
  active,
  payload,
  label,
  users,
}: CustomTooltipProps) => {
  const { getUserColors } = useUserColors();
  const { theme } = useTheme();
  const isDark = theme === "dark";
  const isMobile = useIsMobile();

  if (!active || !payload || !payload.length || !users) {
    return null;
  }

  const data = payload[0].payload;

  // Mobile optimization: Using smaller, more compact design
  if (isMobile) {
    return (
      <Card className="p-2 max-w-[250px] bg-background/98 shadow-lg border border-border rounded-lg">
        <div className="flex justify-between items-center mb-2 pb-1 border-b">
          <p className="text-xs font-semibold">
            {format(new Date(label || ""), "MMM d, yyyy")}
          </p>
          <div className="flex items-center gap-1">
            <span className={cn(
              "text-xs font-medium px-1.5 py-0.5 rounded-full",
              data.X_sentiment > 0 ? "text-green-600 bg-green-50 dark:bg-green-900/30 dark:text-green-300" : 
                "text-red-600 bg-red-50 dark:bg-red-900/30 dark:text-red-300"
            )}>
              {data.X_sentiment > 0 ? "+" : ""}
              {data.X_sentiment.toFixed(1)}
            </span>
          </div>
        </div>

        {data.summary_quote && (
          <div className="mb-2">
            <div className="flex items-center">
              <div 
                className="w-2 h-2 rounded-full mr-1"
                style={{
                  backgroundColor: data.summary_quote?.user === users[0].username
                    ? getUserColors(users[0]).primary
                    : getUserColors(users[1]).primary,
                }}
              ></div>
              <span className="font-medium text-[10px]">
                {getUserName(users, data.summary_quote?.user)}
              </span>
            </div>
            <p
              className="mt-1 p-1 rounded-md text-[10px] line-clamp-3 whitespace-pre-wrap break-words"
              style={{
                backgroundColor: data.summary_quote?.user === users[0].username
                  ? getUserColors(users[0]).primary
                  : getUserColors(users[1]).primary,
                color: "white",
              }}
            >
              {data.summary_quote?.quote}
            </p>
          </div>
        )}

        {/* Show only top event and top quote for compact mobile view */}
        <div className="flex flex-col gap-2">
          {data.salient_events?.length > 0 && (
            <div>
              <h4 className="font-bold mb-0.5 text-[10px]">Key Event:</h4>
              <div className="text-[10px] bg-muted/50 p-1 rounded-md">
                {updateUserReferences(data.salient_events[0].event, users)}
              </div>
            </div>
          )}
          
          {data.top_quotes?.length > 0 && data.top_quotes[0] && (
            <div>
              <h4 className="font-bold mb-0.5 text-[10px]">Top Quote:</h4>
              <div className="flex items-center">
                <div 
                  className="w-2 h-2 rounded-full mr-1"
                  style={{
                    backgroundColor: data.top_quotes[0].user === users[0].username
                      ? getUserColors(users[0]).primary
                      : getUserColors(users[1]).primary,
                  }}
                ></div>
                <span className="text-[9px]">
                  {getUserName(users, data.top_quotes[0].user)}
                </span>
              </div>
              <p
                className="mt-0.5 p-1 rounded-md text-[9px] line-clamp-2 whitespace-pre-wrap break-words"
                style={{
                  backgroundColor: data.top_quotes[0].user === users[0].username
                    ? getUserColors(users[0]).primary
                    : getUserColors(users[1]).primary,
                  color: "white",
                }}
              >
                {data.top_quotes[0].quote}
              </p>
            </div>
          )}
        </div>
      </Card>
    );
  }

  // Desktop view remains mostly the same with some refinements
  return (
    <Card className="p-4 w-[500px] bg-popover text-popover-foreground shadow-lg border border-border">
      <h3 className="font-bold mb-2 text-base">{`Week of ${format(
        new Date(label || ""),
        "MMM d, yyyy"
      )}`}</h3>
      <Separator className="mb-3" />

      <h4 className="font-bold mb-2 text-sm">Summary Quote</h4>
      <div className="mb-4">
        <span
          style={{
            color:
              data.summary_quote?.user === users[0].username
                ? getUserColors(users[0]).primary
                : getUserColors(users[1]).primary,
          }}
          className="font-bold text-sm"
        >
          {getUserName(users, data.summary_quote?.user)}
        </span>
        <p
          className="mt-1 p-2 rounded-md text-sm whitespace-pre-wrap break-words"
          style={{
            backgroundColor:
              data.summary_quote?.user === users[0].username
                ? getUserColors(users[0]).primary
                : getUserColors(users[1]).primary,
            color: "white",
          }}
        >
          {data.summary_quote?.quote}
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <h4 className="font-bold mb-2 text-sm">Salient Events:</h4>
          <ul className="space-y-2 list-disc list-inside text-xs">
            {data.salient_events
              .sort((a: any, b: any) => b.salience - a.salience)
              .map((event: any, index: number) => {
                const updatedEvent = updateUserReferences(event.event, users);
                return (
                  <li key={index} className="text-foreground text-xs">
                    {updatedEvent}
                  </li>
                );
              })}
          </ul>
        </div>
        <div>
          <h4 className="font-bold mb-2 text-sm">Top Quotes:</h4>
          <div className="space-y-3">
            {data.top_quotes.map((quote: any, index: number) => (
              <div key={index}>
                <span
                  style={{
                    color:
                      quote.user === users[0].username
                        ? getUserColors(users[0]).primary
                        : getUserColors(users[1]).primary,
                  }}
                  className="font-bold text-xs"
                >
                  {getUserName(users, quote.user)}
                </span>
                <p
                  className="mt-1 p-2 rounded-md text-xs whitespace-pre-wrap break-words"
                  style={{
                    backgroundColor:
                      quote.user === users[0].username
                        ? getUserColors(users[0]).primary
                        : getUserColors(users[1]).primary,
                    color: "white",
                  }}
                >
                  {quote.quote}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </Card>
  );
};

// Mobile Event Details Component for SentimentChart
type MobileEventDetailsProps = {
  data: any;
  users: ChatUser[];
  onClose: () => void;
}

const MobileEventDetails = ({ data, users, onClose }: MobileEventDetailsProps) => {
  const { getUserColors } = useUserColors();
  if (!data || !users) return null;

  return (
    <div className="pt-3 px-4 pb-4 relative transition-all duration-300">
      <div className="flex justify-between items-center mb-3">
        <h3 className="text-base font-bold">
          {format(new Date(data.weekStart), "MMMM d, yyyy")}
        </h3>
        <div className="flex items-center gap-3">
          <span className={cn(
            "text-base font-bold px-2 py-1 rounded-full",
            data.X_sentiment > 0 
              ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300" 
              : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300"
          )}>
            {data.X_sentiment > 0 ? "+" : ""}
            {data.X_sentiment.toFixed(2)}
          </span>
          <button 
            onClick={(e) => {
              e.stopPropagation();
              onClose();
            }}
            aria-label="Close event details"
            className="rounded-full w-6 h-6 flex items-center justify-center bg-muted hover:bg-muted/80 text-muted-foreground"
          >
            ✕
          </button>
        </div>
      </div>

      {data.summary_quote && (
        <div className="mb-3">
          <div className="flex items-center mb-2">
            <div 
              className="h-1 w-16 rounded-full mr-3"
              style={{
                backgroundColor: data.summary_quote.user === users[0].username
                  ? getUserColors(users[0]).primary
                  : getUserColors(users[1]).primary,
              }}
            ></div>
            <p className="text-sm text-muted-foreground">Summary Quote</p>
          </div>
          
          <div className="bg-card border rounded-lg p-3 mb-4">
            <div className="flex items-center mb-1">
              <span
                className="font-medium text-xs"
                style={{
                  color: data.summary_quote.user === users[0].username
                    ? getUserColors(users[0]).primary
                    : getUserColors(users[1]).primary,
                }}
              >
                {getUserName(users, data.summary_quote.user)}
              </span>
            </div>
            <p className="text-xs whitespace-pre-wrap break-words">
              {data.summary_quote.quote}
            </p>
          </div>
        </div>
      )}

      <div className="space-y-3">
        {data.salient_events && data.salient_events.length > 0 && (
          <div>
            <div className="flex items-center mb-2">
              <div className="h-1 w-16 bg-primary rounded-full mr-3"></div>
              <p className="text-sm text-muted-foreground">Key Events</p>
            </div>
            <div className="space-y-2 max-h-[100px] overflow-y-auto pb-1">
              {data.salient_events
                .sort((a: any, b: any) => b.salience - a.salience)
                .slice(0, 3)
                .map((event: any, idx: number) => (
                  <div key={idx} className="bg-muted/40 p-2 rounded-md">
                    <p className="text-xs">{updateUserReferences(event.event, users)}</p>
                  </div>
                ))}
            </div>
          </div>
        )}
        
        {data.top_quotes && data.top_quotes.length > 0 && (
          <div>
            <div className="flex items-center mb-2">
              <div className="h-1 w-16 bg-primary rounded-full mr-3"></div>
              <p className="text-sm text-muted-foreground">Top Quotes</p>
            </div>
            <div className="space-y-2 max-h-[120px] overflow-y-auto pb-1">
              {data.top_quotes.slice(0, 2).map((quote: any, idx: number) => (
                <div key={idx} className="mb-2">
                  <div className="flex items-center">
                    <div 
                      className="w-2 h-2 rounded-full mr-1.5"
                      style={{
                        backgroundColor: quote.user === users[0].username
                          ? getUserColors(users[0]).primary
                          : getUserColors(users[1]).primary,
                      }}
                    ></div>
                    <span
                      className="font-medium text-xs"
                      style={{
                        color: quote.user === users[0].username
                          ? getUserColors(users[0]).primary
                          : getUserColors(users[1]).primary,
                      }}
                    >
                      {getUserName(users, quote.user)}
                    </span>
                  </div>
                  <p
                    className="mt-1 p-2 rounded-md text-xs whitespace-pre-wrap break-words"
                    style={{
                      backgroundColor: quote.user === users[0].username
                        ? getUserColors(users[0]).primary
                        : getUserColors(users[1]).primary,
                      color: "white",
                    }}
                  >
                    {quote.quote}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

const SentimentChart: React.FC<{
  onClick?: () => void;
  onDataFetched?: (data: SentimentData) => void;
}> = ({ onClick, onDataFetched }) => {
  const { theme } = useTheme();
  const isMobile = useIsMobile();
  const [chartData, setChartData] = useState<SentimentData>({
    sentiments: [],
    allMajorEvents: [],
  });
  const { parsedData, hash, token, users, file } = useGeneralInfo();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { getUserColors } = useUserColors();
  
  // Mobile-specific state variables
  const [selectedPoint, setSelectedPoint] = useState<any>(null);
  const [isBoxVisible, setIsBoxVisible] = useState<boolean>(false);
  const refreshToken = async () => {
    if (!hash || !file) {
      return "";
    }
    const token = await getToken(hash, file, 3600);
    return token;
  };

  const weeklyData = useMemo(() => {
    const data: { [key: string]: ChatMessage[] } = {};
    const persons: Record<string, number> = {};

    parsedData?.forEach((message) => {
      const weekStart = getWeekStart(message.date);
      if (!data[weekStart]) {
        data[weekStart] = [];
      }
      data[weekStart].push(message);
      if (!persons[message.user]) {
        persons[message.user] = 1;
      } else {
        persons[message.user]++;
      }
    });

    const top_two = Object.keys(persons)
      .sort((a, b) => persons[b] - persons[a])
      .slice(0, 2);

    return { data, persons: Array.from(top_two).sort() };
  }, [parsedData]);

  useEffect(() => {
    const loadSentiments = async () => {
      if (!hash || !token) return;
      setLoading(true);
      setError(null);

      try {
        const desiredFilePath = `chat/${hash}/sentiment.json`;
        const exists = await checkFileExists(desiredFilePath);
        let data: SentimentData;

        if (exists) {
          data = await requestFile(desiredFilePath, hash, token, refreshToken);
        } else {
          data = await fetchSentiments(parsedData || [], weeklyData, hash);
        }

        setChartData(data);
        if (onDataFetched) onDataFetched(data);
      } catch (err) {
        setError("Failed to fetch sentiment data");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    loadSentiments();
  }, [hash, token, weeklyData, onDataFetched, users]);

  if (loading || !users) {
    return (
      <Card className={cn(
        "bg-card flex items-center justify-center",
        isMobile ? "p-2 sm:p-4 h-[350px] sm:h-[400px]" : "p-6 h-[550px]"
      )}>
        <div className={cn(
          "animate-spin rounded-full border-b-2 border-primary",
          isMobile ? "h-6 w-6" : "h-8 w-8"
        )} />
      </Card>
    );
  }

  if (error) {
    return (
      <Card className={cn(
        "bg-card flex items-center justify-center",
        isMobile ? "p-2 sm:p-4 h-[350px] sm:h-[400px]" : "p-6 h-[550px]"
      )}>
        <div className="text-center">
          <h2 className={cn(
            isMobile ? "text-sm" : "text-base"
          )}>Error: {error}</h2>
        </div>
      </Card>
    );
  }

  if (chartData.sentiments.length === 0) {
    return (
      <Card className={cn(
        "bg-card flex items-center justify-center",
        isMobile ? "p-2 sm:p-4 h-[350px] sm:h-[400px]" : "p-6 h-[550px]"
      )}>
        <div className="text-center">
          <h2 className={cn(
            isMobile ? "text-sm" : "text-base"
          )}>No data available for the chart.</h2>
        </div>
      </Card>
    );
  }

  const [user1, user2] = users || [];
  const isDark = theme === "dark";

  return (
    <div className="relative">
      <div
        className="absolute inset-0 rounded-lg pointer-events-none before:absolute before:inset-0 before:rounded-lg before:animate-pulse"
        style={{
          background: `linear-gradient(135deg, ${
            getUserColors(user1).primary
          }00, ${getUserColors(user1).primary}40)`,
          boxShadow: `
            inset 0 0 15px 1px ${getUserColors(user1).primary}60,
            inset 0 0 30px 2px ${getUserColors(user2).primary}40,
            0 0 15px 1px ${getUserColors(user1).primary}40,
            0 0 30px 2px ${getUserColors(user2).primary}20
          `,
        }}
      >
        <div
          className="absolute inset-0 rounded-lg animate-border"
          style={{
            background: `linear-gradient(90deg, 
              ${getUserColors(user1).primary}00 0%, 
              ${getUserColors(user1).primary}60 25%, 
              ${getUserColors(user2).primary}60 50%, 
              ${getUserColors(user2).primary}60 75%, 
              ${getUserColors(user1).primary}00 100%
            )`,
            backgroundSize: "200% 100%",
            animation: "moveGradient 3s linear infinite",
          }}
        />
      </div>
      <style jsx>{`
        @keyframes moveGradient {
          0% {
            background-position: 100% 0;
          }
          100% {
            background-position: -100% 0;
          }
        }
      `}</style>
      <Card
        className={cn(
          "bg-card/95 border-2 rounded-lg mb-4 flex flex-col relative",
          "shadow-[0_0_15px_-10px_rgba(0,0,0,0.2)] dark:shadow-[0_0_25px_-15px_rgba(255,255,255,0.1)]",
          isMobile ? "p-2 sm:p-3 h-[350px] sm:h-[400px]" : "p-6 h-[550px]", 
          !isMobile && onClick && "cursor-pointer hover:shadow-lg transition-all duration-500",
          !isMobile && onClick &&
            "after:content-['Click_to_view_major_events'] after:absolute after:bottom-2 after:right-2 after:p-2 after:rounded-md after:bg-muted/10 after:text-primary after:text-sm after:opacity-0 hover:after:opacity-100 after:transition-opacity"
        )}
        style={{
          borderImage: `linear-gradient(135deg, ${
            getUserColors(user1).primary
          }, ${getUserColors(user2).primary}) 1`,
        }}
        onClick={!isMobile ? onClick : undefined}
      >
        <div className="flex justify-between items-center gap-1 sm:gap-2 mb-2 sm:mb-4">
          <div className="flex items-center gap-2">
            <h2 className="font-bold text-base sm:text-lg md:text-2xl">Sentiment StoryBoard</h2>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Info
                    className={cn("text-muted-foreground hover:text-primary cursor-help", 
                      isMobile ? "h-3 w-3" : "h-4 w-4"
                    )}
                    aria-label="Mood Storyline Information"
                  />
                </TooltipTrigger>
                <TooltipContent side="top" align="center" className="max-w-sm">
                  <p className={isMobile ? "text-xs" : "text-sm"}>
                    This graph displays each person's emotional journey, with
                    events being marked on a scale from -10 (extremely negative)
                    to 10 (extremely positive). High points represent joy and
                    contentment, while low points indicate tension or difficult
                    periods. Sharp drops may signify a sudden conflict or
                    negative events. {isMobile ? "Tap on the chart to explore events. Use the icon in the top-right for detailed analysis." : "Click on the chart to view more in depth analytics."}
                  </p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
          
          {/* Add button for in-depth view on mobile */}
          {isMobile && onClick && (
            <Button
              variant="ghost"
              size="icon"
              onClick={(e) => {
                e.stopPropagation();
                onClick();
              }}
              className="h-8 w-8"
              aria-label="View detailed sentiment analysis"
            >
              <ExternalLink className="h-4 w-4 text-muted-foreground" />
            </Button>
          )}
        </div>
        
        {isMobile && (
          <div className="flex justify-between text-xs text-muted-foreground px-2 mb-2">
            <div>
              <span className="inline-block w-2 h-2 rounded-full bg-primary/50 animate-pulse mr-1.5"></span>
              Tap chart to explore events
            </div>
            {onClick && (
              <div className="flex items-center">
                <span className="inline-block w-2 h-2 rounded-full bg-muted-foreground mr-1.5"></span>
                Use <ExternalLink className="h-3 w-3 mx-1 inline" /> for detailed view
              </div>
            )}
          </div>
        )}

        <div className="flex-grow relative">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={chartData.sentiments}
              margin={isMobile ? {
                top: 5,
                right: 5,
                left: 2,
                bottom: 5,
              } : {
                top: 20,
                right: 30,
                left: 20,
                bottom: 10,
              }}
              style={{ overflow: "visible" }}
              onClick={(data) => {
                if (isMobile && data.activePayload && data.activePayload[0]) {
                  // On mobile: Show event details locally
                  const payload = data.activePayload[0].payload;
                  setSelectedPoint(payload);
                  setIsBoxVisible(true);
                  // Prevent navigation on mobile when tapping the chart
                  return;
                }
                // On desktop: Navigate to detailed view
                if (onClick && !isMobile) {
                  onClick();
                }
              }}
              onMouseMove={(data) => {
                if (isMobile && data.activePayload && data.activePayload[0]) {
                  // Update the selected point on hover/touch
                  const point = data.activePayload[0].payload;
                  setSelectedPoint(point);
                }
              }}
            >
              <defs>
                <linearGradient id="sentimentGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={getUserColors(user1).primary} stopOpacity={0.3} />
                  <stop offset="50%" stopColor={getUserColors(user2).primary} stopOpacity={0.1} />
                  <stop offset="100%" stopColor={getUserColors(user1).primary} stopOpacity={0.05} />
                </linearGradient>
              </defs>
              <XAxis
                dataKey="weekStart"
                tickFormatter={(tickItem) =>
                  format(new Date(tickItem), isMobile ? "MMM d" : "MMM d, yyyy")
                }
                interval={
                  (isMobile ? 4 : 1) *
                  Math.ceil(chartData.sentiments.length / 10)
                }
                tick={{ fill: isDark ? "#94a3b8" : "#64748b", fontSize: isMobile ? 8 : 12 }}
                height={isMobile ? 20 : 30}
              />
              <YAxis
                domain={[-10, 10]}
                width={isMobile ? 18 : 30}
                tick={{ fill: isDark ? "#94a3b8" : "#64748b", fontSize: isMobile ? 8 : 12 }}
                tickCount={isMobile ? 5 : 7} // Reduce number of ticks on mobile
              />
              {/* Only show tooltip on desktop */}
              {!isMobile ? (
                <RechartsTooltip
                  content={({ active, payload, label }) => (
                    <CustomTooltip
                      active={active}
                      payload={payload}
                      label={label}
                      users={users}
                    />
                  )}
                  wrapperStyle={{ 
                    zIndex: 100,
                    filter: 'drop-shadow(0 2px 12px rgba(0, 0, 0, 0.15))'
                  }}
                />
              ) : (
                <RechartsTooltip 
                  content={() => null} // No tooltip content on mobile
                  cursor={{ 
                    stroke: 'hsl(var(--primary))',
                    strokeWidth: 1.5,
                    strokeDasharray: '4 4'
                  }}
                />
              )}
              {/* Reference line at 0 */}
              <ReferenceLine 
                y={0} 
                stroke="hsl(var(--border))" 
                strokeWidth={1}
                strokeDasharray={isMobile ? "3 3" : "4 4"}
              />
              
              {/* Fill area with gradient */}
              <Area
                type="monotone"
                dataKey="X_sentiment"
                stroke="none"
                fill="url(#sentimentGradient)"
                fillOpacity={0.8}
              />
              
              <Legend
                payload={[
                  {
                    value: user1.name,
                    type: "line",
                    color: getUserColors(user1).primary,
                  },
                  {
                    value: user2.name,
                    type: "line",
                    color: getUserColors(user2).primary,
                  },
                ]}
                iconSize={isMobile ? 6 : 10}
                fontSize={isMobile ? 8 : 12}
                wrapperStyle={isMobile ? { 
                  marginTop: '-12px',
                  fontSize: '8px',
                  lineHeight: '1',
                  padding: '0 5px'
                } : undefined}
                layout={isMobile ? "horizontal" : "horizontal"}
                verticalAlign={isMobile ? "top" : "bottom"}
              />
              <Line
                type="monotone"
                dataKey="X_sentiment"
                name={user1.name}
                stroke={getUserColors(user1).primary}
                activeDot={{ 
                  r: isMobile ? 4 : 8,
                  fill: getUserColors(user1).primary,
                  stroke: "var(--background)", 
                  strokeWidth: 2,
                  style: { 
                    cursor: 'pointer',
                    filter: 'drop-shadow(0 0 3px rgba(0, 0, 0, 0.2))'
                  }
                }}
                strokeWidth={isMobile ? 1 : 2}
                dot={isMobile ? { r: 0 } : false}
                animationDuration={1000}
              />
              <Line
                type="monotone"
                dataKey="Z_sentiment"
                name={user2.name}
                stroke={getUserColors(user2).primary}
                activeDot={{ 
                  r: isMobile ? 4 : 8,
                  fill: getUserColors(user2).primary,
                  stroke: "var(--background)", 
                  strokeWidth: 2,
                  style: { 
                    cursor: 'pointer',
                    filter: 'drop-shadow(0 0 3px rgba(0, 0, 0, 0.2))'
                  }
                }}
                strokeWidth={isMobile ? 1 : 2}
                dot={isMobile ? { r: 0 } : false}
                animationDuration={1500}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </Card>
      
      {/* Mobile Event Details Box - Displayed below the chart */}
      {isMobile && selectedPoint && users && (
        <div 
          className={cn(
            "mt-4 mb-4 border rounded-lg bg-card shadow-md transition-all duration-300",
            isBoxVisible 
              ? "opacity-100 max-h-[500px] overflow-visible" 
              : "opacity-0 max-h-0 overflow-hidden pointer-events-none border-0 m-0 p-0"
          )}
          style={{ 
            borderWidth: isBoxVisible ? '1.5px' : '0',
            borderColor: 'hsl(var(--primary) / 0.3)',
            boxShadow: isBoxVisible ? '0 4px 20px -5px hsl(var(--primary) / 0.2)' : 'none'
          }}
        >
          <MobileEventDetails 
            data={selectedPoint}
            users={users}
            onClose={() => setIsBoxVisible(false)}
          />
        </div>
      )}
    </div>
  );
};

export default SentimentChart;
