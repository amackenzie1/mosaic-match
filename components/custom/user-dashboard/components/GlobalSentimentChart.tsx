import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { cn } from "@/lib/utils";
import { MajorEventType } from "@/lib/utils/sentimentAnalysis";
import { format } from "date-fns";
import { BarChart2, Lock, Menu } from "lucide-react";
import { useTheme } from "next-themes";
import { Comfortaa } from "next/font/google";
import React, { useMemo, useState } from "react";
import {
  Area,
  Line,
  LineChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { getWeekStart } from "./dateUtils";
import SentimentEventsSidebar from "./SentimentEventsSidebar";
import { calculateWeightedSentiment } from "./weightedSentiment";

interface GlobalSentimentChartProps {
  sentimentData: Record<string, number>;
  majorEvents?: MajorEventType[];
  numChats: number;
  chatNames: Record<string, string>;
  chatCategories: Record<string, string>;
  chatUsers: Record<string, Array<{ username: string; name: string }>>;
  onViewModeChange?: (mode: "chart" | "timeline") => void;
  viewMode: "chart" | "timeline";
  isMobile?: boolean;
}

interface ChartDataPoint {
  weekStart: string;
  sentiment: number | null;
  timestamp: number;
}

// Add this type definition
interface TooltipProps {
  active?: boolean;
  payload?: Array<any>;
  label?: string;
  majorEvents: MajorEventType[];
  chatNames: Record<string, string>;
  chatCategories: Record<string, string>;
  chatUsers: Record<string, Array<{ username: string; name: string }>>;
}

// Define the getScoreColor function at the top of the file
const getScoreColor = (score: number) => {
  const intensity = Math.min(Math.abs(score) / 10, 1) * 0.15;
  return score > 0
    ? `rgba(76, 175, 80, ${intensity})` // Green
    : `rgba(239, 83, 80, ${intensity})`; // Red
};

// Update the categoryColors to use richer negative colors
const categoryColors: Record<string, { positive: string; negative: string }> = {
  friendship: {
    positive: "#B3DBFF", // Light blue
    negative: "#003399", // Rich navy blue
  },
  professional: {
    positive: "#E0E0E0", // Light gray
    negative: "#2B2B2B", // Rich dark gray
  },
  romance: {
    positive: "#FFB3B3", // Soft pastel pink
    negative: "#990000", // Rich blood red
  },
  family: {
    positive: "#B8E6B8", // Soft pastel green
    negative: "#004400", // Rich forest green
  },
  default: {
    positive: "#F5F5F5", // Light grey
    negative: "#333333", // Rich dark grey
  },
};

// Modify the getCategoryColor function to preserve rich colors
const getCategoryColor = (
  category: string,
  sentiment: number,
  majorScore: number
): string => {
  const colors = categoryColors[category] || categoryColors.default;
  const baseColor = sentiment >= 0 ? colors.positive : colors.negative;

  // Convert the majorScore to a 0-1 scale
  const intensity = Math.min(majorScore / 10, 1);

  if (sentiment >= 0) {
    // Positive sentiment logic remains the same
    const r = parseInt(baseColor.slice(1, 3), 16);
    const g = parseInt(baseColor.slice(3, 5), 16);
    const b = parseInt(baseColor.slice(5, 7), 16);

    const adjustedR = Math.round(255 - (255 - r) * intensity);
    const adjustedG = Math.round(255 - (255 - g) * intensity);
    const adjustedB = Math.round(255 - (255 - b) * intensity);

    return `rgb(${adjustedR}, ${adjustedG}, ${adjustedB})`;
  } else {
    // Modified negative sentiment logic to maintain rich colors
    const r = parseInt(baseColor.slice(1, 3), 16);
    const g = parseInt(baseColor.slice(3, 5), 16);
    const b = parseInt(baseColor.slice(5, 7), 16);

    // Use minimal intensity reduction to keep colors rich
    const adjustedR = Math.round(r * (1 - intensity * 0.2)); // Reduced from 0.3 to 0.2
    const adjustedG = Math.round(g * (1 - intensity * 0.2));
    const adjustedB = Math.round(b * (1 - intensity * 0.2));

    return `rgb(${adjustedR}, ${adjustedG}, ${adjustedB})`;
  }
};

// Add this helper function to determine if we should use light text
const shouldUseLightText = (
  category: string,
  sentiment: number,
  majorScore: number
): boolean => {
  // For negative sentiments with high major scores, use light text
  if (sentiment < 0 && majorScore > 5) {
    return true;
  }
  return false;
};

// Update the LockedChart component to use Shadcn/UI
const LockedChart: React.FC<{ numChats: number; isMobile?: boolean }> = ({
  numChats,
  isMobile = false,
}) => {
  const REQUIRED_CHATS = 3;

  return (
    <Card
      className={`bg-card relative ${
        isMobile ? "p-4 h-[300px]" : "p-8 h-[400px]"
      } flex flex-col`}
    >
      {/* Chart content with blur */}
      <div className="opacity-40 blur-sm h-full">
        <h2
          className={`${
            isMobile ? "text-lg" : "text-2xl"
          } font-bold text-center mb-4 bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent`}
        >
          Global SentimentBoard
        </h2>
      </div>

      {/* Lock overlay */}
      <div className="absolute inset-0 bg-background/50 flex flex-col items-center justify-center rounded-lg">
        <Lock
          className={`${
            isMobile ? "h-8 w-8 mb-2" : "h-12 w-12 mb-4"
          } text-muted-foreground/50`}
        />
        <h3
          className={`${
            isMobile ? "text-base" : "text-xl"
          } font-semibold mb-2 text-muted-foreground`}
        >
          Global Sentiment Chart Locked
        </h3>
        <p
          className={`text-muted-foreground text-center max-w-[85%] ${
            isMobile ? "text-sm" : "text-base"
          }`}
        >
          Add {REQUIRED_CHATS - numChats} more{" "}
          {REQUIRED_CHATS - numChats === 1 ? "chat" : "chats"} to unlock the
          Global Sentiment Chart
        </p>
      </div>
    </Card>
  );
};

// Update the CustomTooltip component to use Tailwind classes
const CustomTooltip = ({
  active,
  payload,
  label,
  majorEvents,
  chatNames,
  chatCategories,
  chatUsers,
}: TooltipProps) => {
  if (!active || !payload || !payload.length || !label) return null;

  try {
    const weekStart = new Date(label as string);
    if (isNaN(weekStart.getTime())) {
      console.error("Invalid date label:", label);
      return null;
    }

    const weekEnd = new Date(weekStart.getTime() + 7 * 24 * 60 * 60 * 1000);

    const eventsThisWeek = majorEvents
      .filter((event: MajorEventType) => {
        try {
          const eventDate = new Date(event.timestamp_range.start);
          return (
            !isNaN(eventDate.getTime()) &&
            eventDate >= weekStart &&
            eventDate < weekEnd
          );
        } catch (error) {
          console.error("Error processing event:", event);
          return false;
        }
      })
      .sort(
        (a: MajorEventType, b: MajorEventType) =>
          new Date(a.timestamp_range.start).getTime() -
          new Date(b.timestamp_range.start).getTime()
      );

    const sentimentValue = payload[0].value;

    return (
      <Card className="p-4 bg-background/98 max-w-[350px] shadow-lg">
        <div className="flex justify-between items-center mb-4 pb-4 border-b">
          <p className="text-base font-semibold">
            {format(weekStart, "MMMM d, yyyy")}
          </p>
          <p
            className={cn(
              "text-lg font-semibold",
              sentimentValue > 0 ? "text-green-600" : "text-red-600"
            )}
          >
            {sentimentValue > 0 ? "+" : ""}
            {sentimentValue.toFixed(2)}
          </p>
        </div>

        {eventsThisWeek.length > 0 && (
          <>
            <p className="text-sm font-semibold text-muted-foreground mb-4">
              Key Events This Week
            </p>

            <div className="flex flex-col gap-4">
              {eventsThisWeek.map((event, index) => {
                const eventUsers = event.hash
                  ? chatUsers[event.hash] || []
                  : [];
                const chatName = event.hash
                  ? updateUserReferences(chatNames[event.hash], eventUsers)
                  : "Unknown Chat";
                const category = event.hash
                  ? chatCategories[event.hash]
                  : "default";
                const sentiment = event.sentiment || 0;
                const useLightText = shouldUseLightText(
                  category,
                  sentiment,
                  event.major_score
                );

                return (
                  <div
                    key={index}
                    className={cn(
                      "group relative p-4 rounded-lg border",
                      "before:absolute before:inset-0 before:rounded-lg before:transition-opacity",
                      "before:bg-gradient-to-b before:from-background/10 before:to-background/5 before:backdrop-blur-sm",
                      sentiment < 0 ? "text-white" : "text-gray-900"
                    )}
                    style={{
                      backgroundColor: getCategoryColor(
                        category,
                        sentiment,
                        event.major_score
                      ),
                    }}
                  >
                    <div className="relative z-10">
                      <div className="flex justify-between items-center mb-1">
                        <span
                          className={cn(
                            "text-xs",
                            sentiment < 0 ? "text-white/70" : "text-gray-600"
                          )}
                        >
                          {format(
                            new Date(event.timestamp_range.start),
                            "MMM d, yyyy"
                          )}
                        </span>
                        <span
                          className={cn(
                            "font-medium text-sm px-2 py-0.5 rounded-full",
                            sentiment < 0
                              ? "bg-white/10 text-white"
                              : sentiment > 0
                              ? "bg-green-100 text-green-800"
                              : "bg-red-100 text-red-800"
                          )}
                        >
                          Score: {event.major_score}
                        </span>
                      </div>

                      <h3 className="font-semibold text-sm mb-1 line-clamp-2">
                        {updateUserReferences(event.event, eventUsers)}
                      </h3>

                      <span
                        className={cn(
                          "text-xs block mb-2",
                          sentiment < 0 ? "text-white/70" : "text-gray-600"
                        )}
                      >
                        {chatName}
                      </span>

                      <p
                        className={cn(
                          "text-xs leading-relaxed line-clamp-2",
                          sentiment < 0 ? "text-white/80" : "text-gray-600"
                        )}
                      >
                        {updateUserReferences(
                          event.event_deep_dive.event_summary,
                          eventUsers
                        )}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </Card>
    );
  } catch (error) {
    console.error("Error in CustomTooltip:", error, "Label:", label);
    return null;
  }
};

// Add this helper function to update user references
const updateUserReferences = (
  text: string,
  users: Array<{ username: string; name: string }>
): string => {
  // Define regex patterns for different mention styles
  const patterns = [
    /\{([^}]+)\}/g, // {username}
    /@(\w+)/g, // @username
    /\b(\w+)\b/g, // username as a standalone word
  ];

  let updatedText = text;

  patterns.forEach((pattern) => {
    updatedText = updatedText.replace(pattern, (match, p1) => {
      const user = users.find(
        (u) => u.username.toLowerCase() === p1.toLowerCase()
      );
      return user ? user.name : match;
    });
  });

  return updatedText;
};

const comfortaa = Comfortaa({ subsets: ["latin"], weight: ["700"] });

const GlobalSentimentChart: React.FC<GlobalSentimentChartProps> = ({
  sentimentData,
  majorEvents = [],
  numChats,
  chatNames,
  chatCategories,
  chatUsers,
  onViewModeChange,
  viewMode,
  isMobile = false,
}) => {
  const REQUIRED_CHATS = 3;

  if (numChats < REQUIRED_CHATS) {
    return <LockedChart numChats={numChats} isMobile={isMobile} />;
  }

  const { theme } = useTheme();
  const [dateRange, setDateRange] = React.useState<[number, number]>([0, 100]);
  const [isEventsPanelOpen, setIsEventsPanelOpen] = useState<boolean>(false);
  const [selectedEvent, setSelectedEvent] = useState<{
    point: any;
    events: MajorEventType[];
  } | null>(null);
  const [isBoxVisible, setIsBoxVisible] = useState<boolean>(false);
  const [activeTimestamp, setActiveTimestamp] = useState<number | null>(null);

  const transformedMajorEvents = useMemo(() => {
    return {
      global: majorEvents,
    };
  }, [majorEvents]);

  const weightedSentimentData = useMemo(() => {
    return calculateWeightedSentiment(
      { global: sentimentData },
      transformedMajorEvents
    );
  }, [sentimentData, transformedMajorEvents]);

  const chartData: ChartDataPoint[] = useMemo(() => {
    const uniqueWeekData = new Map<string, number>();

    Object.entries(weightedSentimentData).forEach(([date, sentiment]) => {
      const weekStart = getWeekStart(date);
      uniqueWeekData.set(weekStart, sentiment);
    });

    return Array.from(uniqueWeekData.entries())
      .map(([weekStart, sentiment]) => ({
        weekStart,
        sentiment,
        timestamp: new Date(weekStart).getTime(),
      }))
      .sort((a, b) => a.timestamp - b.timestamp);
  }, [weightedSentimentData]);

  // Insert nulls for gaps larger than two weeks to create discontinuities
  const processedChartData: ChartDataPoint[] = useMemo(() => {
    const MAX_GAP = 14 * 24 * 60 * 60 * 1000; // Two weeks in milliseconds
    const newData: ChartDataPoint[] = [];

    for (let i = 0; i < chartData.length; i++) {
      const currentPoint = chartData[i];
      newData.push(currentPoint);

      if (i < chartData.length - 1) {
        const nextPoint = chartData[i + 1];
        const gap = nextPoint.timestamp - currentPoint.timestamp;

        if (gap > MAX_GAP) {
          newData.push({
            weekStart: new Date(
              currentPoint.timestamp + MAX_GAP / 2
            ).toISOString(),
            sentiment: null,
            timestamp: currentPoint.timestamp + MAX_GAP / 2,
          });
        }
      }
    }

    return newData;
  }, [chartData]);

  // Get the actual data points (excluding nulls) for date range calculations
  const dateRangeData = useMemo(() => {
    return Object.entries(sentimentData)
      .map(([weekStart, _]) => ({
        timestamp: new Date(weekStart).getTime(),
      }))
      .sort((a, b) => a.timestamp - b.timestamp);
  }, [sentimentData]);

  const minDate = dateRangeData.length > 0 ? dateRangeData[0].timestamp : 0;
  const maxDate =
    dateRangeData.length > 0
      ? dateRangeData[dateRangeData.length - 1].timestamp
      : 0;

  // Filter the chart data based on the date range
  const filteredChartData = useMemo(() => {
    return processedChartData.filter((data) => {
      const percentage =
        ((data.timestamp - minDate) / (maxDate - minDate)) * 100;
      return percentage >= dateRange[0] && percentage <= dateRange[1];
    });
  }, [processedChartData, dateRange, minDate, maxDate]);

  const handleDateRangeChange = (value: number[]) => {
    setDateRange(value as [number, number]);
  };

  const valuetext = (value: number) => {
    if (dateRangeData.length === 0) return "";
    try {
      const timestamp = minDate + ((maxDate - minDate) * value) / 100;
      return format(new Date(timestamp), "MMM d, yyyy");
    } catch (error) {
      console.error("Error formatting date:", error);
      return "";
    }
  };

  // **New: Calculate dynamic Y-Axis domain based on data**
  const yAxisDomain = useMemo(() => {
    const sentiments = filteredChartData
      .map((data) => data.sentiment)
      .filter((s): s is number => s !== null);
    const minSentiment = Math.min(...sentiments);
    const maxSentiment = Math.max(...sentiments);

    // Handle edge cases where all sentiments are equal
    if (minSentiment === maxSentiment) {
      // Provide a default range if all values are the same
      return [minSentiment - 1, maxSentiment + 1];
    }

    return [minSentiment, maxSentiment];
  }, [filteredChartData]);

  // Mobile Event Details Component
  const MobileEventDetails = ({
    events,
    selectedPoint,
    onClose,
  }: {
    events: MajorEventType[];
    selectedPoint: any;
    onClose: () => void;
  }) => {
    if (!selectedPoint) return null;

    const weekStart = new Date(selectedPoint.weekStart);
    const weekEnd = new Date(weekStart.getTime() + 7 * 24 * 60 * 60 * 1000);

    const filteredEvents = events
      .filter((event) => {
        const eventDate = new Date(event.timestamp_range.start);
        return eventDate >= weekStart && eventDate < weekEnd;
      })
      .sort((a, b) => b.major_score - a.major_score);
    // Always return a container, even if no events to prevent UI jumping

    return (
      <div className="pt-3 px-4 pb-4 relative">
        <div className="flex justify-between items-center mb-3">
          <h3 className="text-base font-bold">
            {format(weekStart, "MMMM d, yyyy")}
          </h3>
          <div className="flex items-center gap-3">
            <span
              className={cn(
                "text-base font-bold px-2 py-1 rounded-full",
                typeof selectedPoint.sentiment === "number" &&
                  selectedPoint.sentiment > 0
                  ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300"
                  : typeof selectedPoint.sentiment === "number" &&
                    selectedPoint.sentiment < 0
                  ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300"
                  : "bg-gray-100 text-gray-700 dark:bg-gray-800/30 dark:text-gray-300"
              )}
            >
              {typeof selectedPoint.sentiment === "number" && (
                <>
                  {selectedPoint.sentiment > 0 ? "+" : ""}
                  {selectedPoint.sentiment.toFixed(2)}
                </>
              )}
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

        <div className="flex items-center mb-3">
          <div className="h-1 w-16 bg-gradient-to-r from-[hsl(var(--chart-1))] to-[hsl(var(--chart-2))] rounded-full mr-3"></div>
          <p className="text-sm text-muted-foreground">Events this week</p>
        </div>

        <div className="space-y-3 max-h-[250px] overflow-y-auto pb-1">
          {filteredEvents.length > 0 ? (
            filteredEvents.map((event, idx) => {
              const eventUsers = event.hash ? chatUsers[event.hash] || [] : [];
              const chatName = event.hash
                ? updateUserReferences(chatNames[event.hash], eventUsers)
                : "Unknown Chat";
              const category = event.hash
                ? chatCategories[event.hash]
                : "default";
              const sentiment = event.sentiment || 0;

              return (
                <div
                  key={idx}
                  className={cn(
                    "group relative p-3 rounded-lg border",
                    "before:absolute before:inset-0 before:rounded-lg before:transition-opacity",
                    "before:bg-gradient-to-b before:from-background/10 before:to-background/5 before:backdrop-blur-sm",
                    sentiment < 0 ? "text-white" : "text-gray-900"
                  )}
                  style={{
                    backgroundColor: getCategoryColor(
                      category,
                      sentiment,
                      event.major_score
                    ),
                  }}
                >
                  <div className="relative z-10">
                    <div className="flex justify-between items-center mb-1">
                      <span
                        className={cn(
                          "text-xs",
                          sentiment < 0 ? "text-white/70" : "text-gray-600"
                        )}
                      >
                        {format(new Date(event.timestamp_range.start), "MMM d")}
                      </span>
                      <span
                        className={cn(
                          "font-medium text-sm px-2 py-0.5 rounded-full",
                          sentiment < 0
                            ? "bg-white/10 text-white"
                            : sentiment > 0
                            ? "bg-green-100 text-green-800"
                            : "bg-red-100 text-red-800"
                        )}
                      >
                        Score: {event.major_score}
                      </span>
                    </div>

                    <h3 className="font-semibold text-sm mb-1 line-clamp-2">
                      {updateUserReferences(event.event, eventUsers)}
                    </h3>

                    <span
                      className={cn(
                        "text-xs block mb-1",
                        sentiment < 0 ? "text-white/70" : "text-gray-600"
                      )}
                    >
                      {chatName}
                    </span>

                    <p
                      className={cn(
                        "text-xs leading-relaxed line-clamp-2",
                        sentiment < 0 ? "text-white/80" : "text-gray-600"
                      )}
                    >
                      {updateUserReferences(
                        event.event_deep_dive?.event_summary || "",
                        eventUsers
                      )}
                    </p>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="p-4 text-center text-muted-foreground text-sm">
              <p>No significant events found for this week</p>
              <p className="text-xs mt-2 opacity-70">Try another time period</p>
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <>
      <Card
        className={cn(
          "bg-card relative flex flex-col",
          "shadow-[0_0_15px_-10px_hsl(var(--chart-1))] dark:shadow-[0_0_25px_-15px_hsl(var(--chart-1))]",
          "border border-[hsl(var(--chart-1)_/_0.1)] !border-solid",
          isMobile ? "p-2 h-[450px]" : "p-8 h-[600px]"
        )}
        style={{ borderWidth: "1px" }}
      >
        {/* Header Section */}
        <div
          className={cn(
            "flex justify-between items-center relative",
            isMobile ? "mb-2 px-2" : "mb-8 px-8"
          )}
        >
          <Button
            variant="ghost"
            size="icon"
            onClick={() =>
              onViewModeChange?.(viewMode === "chart" ? "timeline" : "chart")
            }
            className="absolute left-1 top-0"
          >
            <BarChart2 className={isMobile ? "h-3 w-3" : "h-4 w-4"} />
          </Button>

          <h2
            className={cn(
              comfortaa.className,
              "text-transparent bg-clip-text text-center w-full",
              "bg-gradient-to-r from-[hsl(var(--chart-1))] via-[hsl(var(--chart-2))] to-[hsl(var(--chart-3))]",
              "tracking-wide drop-shadow-[0_0_5px_hsl(var(--chart-1)_/_0.2)]",
              isMobile ? "text-lg font-bold" : "text-2xl font-bold"
            )}
          >
            Global SentimentBoard
            {isMobile && (
              <div className="text-xs text-muted-foreground font-normal mt-0.5 flex items-center justify-center">
                <span className="w-2 h-2 rounded-full bg-[hsl(var(--chart-2))] mr-1.5 animate-pulse"></span>
                Tap and drag to explore events
              </div>
            )}
          </h2>

          {!isMobile && (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsEventsPanelOpen(!isEventsPanelOpen)}
              className="absolute right-2 top-0"
            >
              <Menu className="h-4 w-4" />
            </Button>
          )}
        </div>

        {/* Main Content */}
        <div
          className={cn(
            "flex flex-grow",
            isMobile ? "flex-col gap-0" : "gap-8 h-[calc(100%-60px)]"
          )}
        >
          {/* Chart Section */}
          <div
            className={cn(
              "flex-grow transition-[width] duration-300",
              !isMobile && isEventsPanelOpen ? "w-[70%]" : "w-full"
            )}
          >
            <ResponsiveContainer width="100%" height={isMobile ? "80%" : "85%"}>
              <LineChart
                data={filteredChartData}
                margin={{
                  top: isMobile ? 10 : 20,
                  right: isMobile ? 10 : 30,
                  left: isMobile ? 5 : 20,
                  bottom: isMobile ? 5 : 10,
                }}
                onClick={(data: any) => {
                  if (isMobile && data.activePayload && data.activePayload[0]) {
                    // If we have valid data, update the selected event and show the box
                    console.log(
                      "Chart clicked with payload:",
                      data.activePayload[0].payload
                    );

                    setSelectedEvent({
                      point: data.activePayload[0].payload,
                      events: majorEvents,
                    });
                    setIsBoxVisible(true);
                  }
                }}
                // Adding additional mobile-specific touch handler
                // Remove onTouchEnd handler as it's causing type errors
                // Remove onTouchMove handler as it's causing type errors
                onMouseMove={(data: any) => {
                  if (isMobile && data.activePayload && data.activePayload[0]) {
                    console.log(
                      "Mouse move on chart with payload:",
                      data.activePayload[0].payload
                    );

                    // Always update the selected point, even if there are no events
                    const point = data.activePayload[0].payload;
                    setSelectedEvent({
                      point: point,
                      events: majorEvents,
                    });
                    setActiveTimestamp(point.timestamp);

                    // Always ensure box is visible
                    setIsBoxVisible(true);

                    // Add active state indicator to show where user is on chart
                    const activeDot = document.querySelector(
                      ".recharts-active-dot"
                    );
                    if (activeDot) {
                      activeDot.classList.add("animate-pulse");
                      activeDot.setAttribute("stroke-width", "3");
                    }
                  }
                }}
              >
                <defs>
                  <linearGradient
                    id="sentimentGradient"
                    x1="0"
                    y1="0"
                    x2="0"
                    y2="1"
                  >
                    <stop
                      offset="0%"
                      stopColor="hsl(var(--chart-2))"
                      stopOpacity={0.3}
                    />
                    <stop
                      offset="50%"
                      stopColor="hsl(var(--chart-3))"
                      stopOpacity={0.1}
                    />
                    <stop
                      offset="100%"
                      stopColor="hsl(var(--chart-1))"
                      stopOpacity={0.3}
                    />
                  </linearGradient>
                  <linearGradient id="lineGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="hsl(var(--chart-2))" />
                    <stop offset="50%" stopColor="hsl(var(--chart-3))" />
                    <stop offset="100%" stopColor="hsl(var(--chart-1))" />
                  </linearGradient>
                </defs>

                <XAxis
                  dataKey="weekStart"
                  tickFormatter={(tickItem) =>
                    tickItem ? format(new Date(tickItem), "MMM d") : ""
                  }
                  interval={
                    (isMobile ? 3 : 1) * Math.ceil(chartData.length / 10)
                  }
                  tick={{
                    fill: "hsl(var(--muted-foreground))",
                    fontSize: isMobile ? 10 : 12,
                  }}
                  axisLine={{ stroke: "hsl(var(--border))" }}
                  tickLine={{ stroke: "hsl(var(--border))" }}
                />

                {/* **Updated YAxis with Dynamic Domain and Whole Number Ticks** */}
                <YAxis
                  domain={yAxisDomain}
                  tick={{
                    fill: "hsl(var(--muted-foreground))",
                    fontSize: isMobile ? 10 : 12,
                  }}
                  tickFormatter={(value) => Math.round(value).toString()} // Format ticks as whole numbers
                  axisLine={false}
                  tickLine={false}
                  allowDecimals={false} // Prevent decimal ticks
                  width={isMobile ? 20 : 30}
                />

                {/* Add reference line for cursor position */}
                <Tooltip
                  content={({ active, payload, label }) =>
                    !isMobile ? (
                      <CustomTooltip
                        active={active}
                        payload={payload}
                        label={label}
                        majorEvents={majorEvents}
                        chatNames={chatNames}
                        chatCategories={chatCategories}
                        chatUsers={chatUsers}
                      />
                    ) : null
                  }
                  wrapperStyle={{ zIndex: 50 }}
                  cursor={{
                    stroke: isMobile ? "hsl(var(--chart-2))" : "none",
                    strokeWidth: 2,
                    strokeDasharray: "4 4",
                  }}
                />

                <ReferenceLine
                  y={0}
                  stroke="hsl(var(--border))"
                  strokeWidth={1}
                />

                <Area
                  type="monotone"
                  dataKey="sentiment"
                  stroke="none"
                  fill="url(#sentimentGradient)"
                  fillOpacity={1}
                />

                <Line
                  type="monotone"
                  dataKey="sentiment"
                  stroke="url(#lineGradient)"
                  strokeWidth={isMobile ? 1.5 : 2}
                  dot={false}
                  activeDot={{
                    r: isMobile ? 6 : 6,
                    fill: "hsl(var(--chart-2))",
                    stroke: "hsl(var(--background))",
                    strokeWidth: isMobile ? 3 : 2,
                    className: "sentiment-active-dot",
                    style: {
                      cursor: "pointer",
                      transition: "all 0.2s ease-in-out",
                      filter: "drop-shadow(0 0 4px hsl(var(--chart-2) / 0.6))",
                    },
                    onClick: (data: any) => {
                      if (isMobile) {
                        console.log("activeDot clicked", data);
                        setSelectedEvent({
                          point: data.payload,
                          events: majorEvents,
                        });
                        setIsBoxVisible(true);
                      }
                    },
                  }}
                />
              </LineChart>
            </ResponsiveContainer>

            {/* Date Range Slider */}
            <div className={isMobile ? "px-4 pt-2" : "px-12 pt-8 -mt-8"}>
              <Slider
                value={dateRange}
                onValueChange={handleDateRangeChange}
                max={100}
                step={1}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-muted-foreground mt-2">
                <span>{valuetext(dateRange[0])}</span>
                <span>{valuetext(dateRange[1])}</span>
              </div>
            </div>

            {/* Mobile Event Details - Moved outside of Chart to ensure proper displacement */}
          </div>

          {/* Events Sidebar (only for desktop) */}
          {!isMobile && (
            <SentimentEventsSidebar
              isOpen={isEventsPanelOpen}
              events={majorEvents}
              chatNames={chatNames}
              chatCategories={chatCategories}
              dateRange={dateRange}
              minDate={minDate}
              maxDate={maxDate}
              chatUsers={chatUsers}
            />
          )}
        </div>
      </Card>

      {/* Mobile Event Details - Completely outside the card to properly push content down */}
      {isMobile && selectedEvent && (
        <div
          className={cn(
            "mt-4 mb-4 border rounded-lg bg-card shadow-md transition-all",
            isBoxVisible ? "block" : "hidden"
          )}
          style={{
            borderWidth: "1.5px",
            borderColor: "hsl(var(--chart-1) / 0.3)",
            boxShadow: "0 4px 20px -5px hsl(var(--chart-2) / 0.2)",
          }}
        >
          <MobileEventDetails
            events={selectedEvent.events}
            selectedPoint={selectedEvent.point}
            onClose={() => setIsBoxVisible(false)}
          />
        </div>
      )}
    </>
  );
};

export default GlobalSentimentChart;
