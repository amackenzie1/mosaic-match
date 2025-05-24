import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Slider } from "@/components/ui/slider";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useIsMobile } from "@/components/ui/use-mobile";
import { useGeneralInfo } from "@/lib/contexts/general-info";
import { useUserColors } from "@/lib/hooks/useUserColors";
import { cn, getWeekStart } from "@/lib/utils";
import { getUserName, updateUserReferences } from "@/lib/utils/general";
import {
  MajorEventType,
  SentimentResponseComplete,
} from "@/lib/utils/sentimentAnalysis";
import { useThemeColors } from "@/lib/utils/useThemeColors";
import { format, subYears } from "date-fns";
import { Info, X } from "lucide-react";
import { useTheme } from "next-themes";
import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  Legend,
  Line,
  LineChart,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  XAxis,
  YAxis,
} from "recharts";

export type EventMessage = {
  user: string;
  message: string;
  isContext: boolean;
  isAfterContext: boolean;
  timestamp: string;
};

interface SentimentChartDrillDownProps {
  chartData: SentimentResponseComplete[];
  selectedEventIndex: number | null;
}

const SentimentChartDrillDown: React.FC<SentimentChartDrillDownProps> = ({
  chartData,
  selectedEventIndex,
}) => {
  const { theme } = useTheme();
  const { users } = useGeneralInfo();
  const isMobile = useIsMobile();
  const colors = useThemeColors();
  const isDark = theme === "dark";
  const [selectedEvent, setSelectedEvent] = useState<MajorEventType | null>(
    null
  );
  const [dateRange, setDateRange] = useState<[number, number]>([0, 100]);

  // Early return if no users
  if (!users) {
    return (
      <p className="text-muted-foreground">
        User information is not available.
      </p>
    );
  }

  const [user1, user2] = users;
  const user1Color = "hsl(var(--primary))";
  const user2Color = "hsl(var(--secondary))";

  const majorEvents = useMemo(() => {
    return chartData.flatMap((week) => week.major_events || []);
  }, [chartData]);

  const sortedEvents = useMemo(() => {
    return [...majorEvents].sort((a, b) => {
      const dateA = a?.timestamp_range?.start
        ? new Date(a.timestamp_range.start)
        : new Date(0);
      const dateB = b?.timestamp_range?.start
        ? new Date(b.timestamp_range.start)
        : new Date(0);
      return dateA.getTime() - dateB.getTime();
    });
  }, [majorEvents]);

  useEffect(() => {
    if (
      selectedEventIndex !== null &&
      selectedEventIndex >= 0 &&
      selectedEventIndex < sortedEvents.length
    ) {
      setSelectedEvent(sortedEvents[selectedEventIndex]);
    }
  }, [selectedEventIndex, sortedEvents]);

  const renderCustomDot = (props: any) => {
    const { cx, cy, payload, dataKey } = props;
    const weekStart = new Date(payload.weekStartTimestamp).getTime();
    const weekEnd = weekStart + 7 * 24 * 60 * 60 * 1000;

    // Find all major events within the week
    const eventsInWeek = sortedEvents.filter((event) => {
      const eventStart = new Date(event.timestamp_range.start).getTime();
      return eventStart >= weekStart && eventStart <= weekEnd;
    });

    // If there are events, render the custom dot with emojis
    if (eventsInWeek.length > 0) {
      const xIsHigher = payload.X_sentiment > payload.Z_sentiment;
      const shouldShowEmojis =
        (xIsHigher && dataKey === "X_sentiment") ||
        (!xIsHigher && dataKey === "Z_sentiment");

      if (shouldShowEmojis) {
        return (
          <g>
            <circle
              cx={cx}
              cy={cy}
              r={3}
              fill="#fff"
              stroke={props.stroke}
              strokeWidth={2}
            />
            {eventsInWeek.map((event: MajorEventType, eventIndex: number) => {
              const isSelectedEvent =
                selectedEvent &&
                selectedEvent.timestamp_range.start ===
                  event.timestamp_range.start;

              return event.emojis.map((emoji: string, emojiIndex: number) => (
                <g key={`${eventIndex}-${emojiIndex}`}>
                  <line
                    x1={cx}
                    y1={cy}
                    x2={cx + (eventIndex - eventsInWeek.length / 2) * 20}
                    y2={20 + emojiIndex * 20}
                    stroke={props.stroke}
                    strokeWidth={1}
                    strokeDasharray="3,3"
                    style={{ opacity: isSelectedEvent ? 0.6 : 0.3 }}
                  />
                  <text
                    x={cx + (eventIndex - eventsInWeek.length / 2) * 20}
                    y={20 + emojiIndex * 20}
                    textAnchor="middle"
                    fontSize={20}
                    style={{
                      cursor: "pointer",
                      opacity: selectedEvent ? (isSelectedEvent ? 1 : 0.3) : 1,
                    }}
                    onMouseDown={(e) => {
                      e.stopPropagation();
                      setSelectedEvent(isSelectedEvent ? null : event);
                    }}
                  >
                    {emoji}
                  </text>
                </g>
              ));
            })}
          </g>
        );
      }
    }

    // For non-event points, use Recharts default dot styling
    return (
      <circle
        cx={cx}
        cy={cy}
        r={3}
        fill="#fff"
        stroke={props.stroke}
        strokeWidth={2}
      />
    );
  };

  const chartDataWithTimestamps = useMemo(() => {
    return chartData.map((dataPoint) => {
      return {
        ...dataPoint,
        weekStartTimestamp: new Date(
          getWeekStart(dataPoint.weekStart)
        ).getTime(),
      };
    });
  }, [chartData]);

  const minDate =
    chartDataWithTimestamps.length > 0
      ? chartDataWithTimestamps[0].weekStartTimestamp
      : 0;
  const maxDate =
    chartDataWithTimestamps.length > 0
      ? chartDataWithTimestamps[chartDataWithTimestamps.length - 1]
          .weekStartTimestamp
      : 0;

  const chartRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (selectedEvent) {
        const tooltip = document.getElementById("selected-event-messages");
        if (tooltip && !tooltip.contains(event.target as Node)) {
          setSelectedEvent(null);
        }
      }
    };

    document.addEventListener("mousedown", handleClickOutside as EventListener);
    return () => {
      document.removeEventListener(
        "mousedown",
        handleClickOutside as EventListener
      );
    };
  }, [selectedEvent]);

  useEffect(() => {
    if (chartDataWithTimestamps.length === 0) return;
    const oneYearAgo = subYears(new Date(maxDate), 1).getTime();
    if (minDate === maxDate) {
      setDateRange([0, 100]);
      return;
    }
    const defaultStartDate = Math.max(oneYearAgo, minDate);
    const defaultStartPercentage =
      ((defaultStartDate - minDate) / (maxDate - minDate)) * 100;
    setDateRange([defaultStartPercentage, 100]);
  }, [chartDataWithTimestamps.length, minDate, maxDate]);

  const filteredChartData = chartDataWithTimestamps.filter((data) => {
    const percentage =
      ((data.weekStartTimestamp - minDate) / (maxDate - minDate)) * 100;
    return percentage >= dateRange[0] && percentage <= dateRange[1];
  });

  const handleDateRangeChange = (value: number[]) => {
    setDateRange(value as [number, number]);
  };

  const valuetext = (value: number) => {
    if (chartDataWithTimestamps.length === 0) return "";
    const date = new Date(minDate + ((maxDate - minDate) * value) / 100);
    return format(date, "MMM d, yyyy");
  };

  const { getUserColors } = useUserColors();

  const CustomTooltip = ({ active, payload, label }: any) => {
    const { users } = useGeneralInfo();

    if (!active || !payload || !payload.length || !users) {
      return null;
    }

    const data = payload[0].payload;

    return (
      <Card
        className={cn(
          "bg-popover text-popover-foreground shadow-lg border border-border",
          isMobile ? "p-3 w-[300px] max-w-[95vw]" : "p-4 w-[500px]"
        )}
      >
        <h3
          className={cn("font-bold mb-2", isMobile ? "text-sm" : "text-base")}
        >
          {`Week of ${format(new Date(label || ""), "MMM d, yyyy")}`}
        </h3>
        <Separator className="mb-4" />

        <h4 className={cn("font-bold mb-2", isMobile ? "text-xs" : "text-sm")}>
          Summary Quote
        </h4>
        {data.summary_quote ? (
          <div className="mb-4">
            <span
              style={{
                color:
                  data.summary_quote.user === users[0].username
                    ? getUserColors(users[0]).primary
                    : getUserColors(users[1]).primary,
              }}
              className={cn("font-bold", isMobile ? "text-xs" : "text-sm")}
            >
              {getUserName(users, data.summary_quote.user)}
            </span>
            <p
              className={cn(
                "mt-1 p-2 rounded-md whitespace-pre-wrap break-words",
                isMobile ? "text-xs" : "text-sm"
              )}
              style={{
                backgroundColor:
                  data.summary_quote.user === users[0].username
                    ? getUserColors(users[0]).primary
                    : getUserColors(users[1]).primary,
                color: "white",
              }}
            >
              {data.summary_quote.quote}
            </p>
          </div>
        ) : (
          <p className={cn("mb-4", isMobile ? "text-xs" : "text-sm")}>
            No summary quote available
          </p>
        )}

        <div className={isMobile ? "space-y-4" : "grid grid-cols-2 gap-4"}>
          <div>
            <h4
              className={cn("font-bold mb-2", isMobile ? "text-xs" : "text-sm")}
            >
              Salient Events:
            </h4>
            <ul
              className={cn(
                "list-disc list-inside",
                isMobile ? "space-y-1 text-xs" : "space-y-2 text-sm"
              )}
            >
              {data.salient_events
                .sort((a: any, b: any) => b.salience - a.salience)
                .slice(0, isMobile ? 3 : undefined) // Limit events on mobile
                .map((event: any, index: number) => {
                  const updatedEvent = updateUserReferences(event.event, users);
                  return (
                    <li key={index} className="text-foreground">
                      {updatedEvent}
                    </li>
                  );
                })}
            </ul>
          </div>
          <div>
            <h4
              className={cn("font-bold mb-2", isMobile ? "text-xs" : "text-sm")}
            >
              Top Quotes:
            </h4>
            <div className="space-y-3">
              {data.top_quotes
                .slice(0, isMobile ? 1 : 2) // Show fewer quotes on mobile
                .map((quote: any, index: number) => (
                  <div key={index}>
                    <span
                      style={{
                        color:
                          quote.user === users[0].username
                            ? getUserColors(users[0]).primary
                            : getUserColors(users[1]).primary,
                      }}
                      className={cn(
                        "font-bold",
                        isMobile ? "text-xs" : "text-sm"
                      )}
                    >
                      {getUserName(users, quote.user)}
                    </span>
                    <p
                      className={cn(
                        "mt-1 p-2 rounded-md whitespace-pre-wrap break-words",
                        isMobile ? "text-xs" : "text-sm"
                      )}
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

  if (!chartData || chartData.length === 0) {
    return (
      <p className="text-muted-foreground">No data available for the chart.</p>
    );
  }

  return (
    <TooltipProvider>
      <div className={cn("w-full relative", isMobile ? "h-full" : "h-[700px]")}>
        <div
          className={cn(
            "absolute inset-0 rounded-lg shadow-lg filter blur-sm",
            "shadow-[0_0_5px_2px_rgba(255,0,0,0.4),0_0_10px_4px_rgba(255,0,0,0.3),0_0_15px_6px_rgba(255,0,0,0.2)]",
            "z-0"
          )}
        />
        <Card
          ref={chartRef}
          className={cn(
            "bg-card border-2 border-border rounded-lg flex flex-col relative z-10",
            isMobile ? "p-3 h-full" : "p-6 h-full"
          )}
        >
          <div className="relative z-10">
            <div
              className={cn(
                "items-center",
                isMobile ? "flex flex-col space-y-2" : "grid grid-cols-12"
              )}
            >
              {!isMobile && <div className="col-span-4" />}
              <div className={isMobile ? "w-full" : "col-span-4 text-center"}>
                <div className="flex items-center justify-center">
                  <h2
                    className={cn(
                      "font-bold",
                      isMobile ? "text-xl" : "text-2xl"
                    )}
                  >
                    Detailed Sentiment Analysis
                  </h2>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button variant="ghost" size="icon" className="ml-1">
                        <Info
                          className={cn(isMobile ? "h-3 w-3" : "h-4 w-4")}
                        />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent className="p-4 max-w-sm">
                      <p>
                        This chart shows major events that occurred during your
                        chat history. An emoji pair represents the general vibe
                        of your talk and clicking on them will reveal deeper
                        insights on this moment.
                      </p>
                    </TooltipContent>
                  </Tooltip>
                </div>
              </div>
              {isMobile && (
                <div className="w-full text-center text-xs text-muted-foreground">
                  <span>Tap on emoji indicators to view event details</span>
                </div>
              )}
            </div>
          </div>
          <div className="flex-grow w-full relative z-10">
            <ResponsiveContainer
              width="100%"
              height={isMobile ? 350 : "100%"}
              style={{ overflow: "visible" }}
            >
              <LineChart
                data={filteredChartData}
                margin={
                  isMobile
                    ? { top: 30, right: 10, left: 0, bottom: 10 }
                    : { top: 50, right: 30, left: 20, bottom: 10 }
                }
                style={{ isolation: "isolate" }}
              >
                <XAxis
                  dataKey="weekStartTimestamp"
                  type="number"
                  domain={["dataMin", "dataMax"]}
                  tickFormatter={(tickItem) =>
                    format(new Date(tickItem), "MMM d, yyyy")
                  }
                  interval={
                    (isMobile ? 4 : 1) * Math.ceil(chartData.length / 10)
                  }
                  tick={{
                    fill: isDark
                      ? "hsl(var(--muted-foreground))"
                      : "hsl(var(--foreground))",
                    fontSize: isMobile ? 10 : 12,
                  }}
                />
                <YAxis
                  domain={[-10, 10]}
                  tick={{
                    fill: isDark
                      ? "hsl(var(--muted-foreground))"
                      : "hsl(var(--foreground))",
                    fontSize: isMobile ? 10 : 12,
                  }}
                  width={isMobile ? 30 : 40}
                />
                <Legend
                  verticalAlign="bottom"
                  height={isMobile ? 20 : 36}
                  iconSize={isMobile ? 8 : 14}
                  wrapperStyle={{ fontSize: isMobile ? 10 : 12 }}
                />
                <Line
                  type="monotoneX"
                  dataKey="X_sentiment"
                  name={user1.name}
                  stroke={user1Color}
                  activeDot={{ r: isMobile ? 6 : 8 }}
                  strokeWidth={isMobile ? 1.5 : 2}
                  dot={renderCustomDot}
                />
                <Line
                  type="monotoneX"
                  dataKey="Z_sentiment"
                  name={user2.name}
                  stroke={user2Color}
                  activeDot={{ r: isMobile ? 6 : 8 }}
                  strokeWidth={isMobile ? 1.5 : 2}
                  dot={renderCustomDot}
                />
                <RechartsTooltip
                  content={({ active, payload, label }) => (
                    <CustomTooltip
                      active={active}
                      payload={payload}
                      label={label}
                    />
                  )}
                  wrapperStyle={{ zIndex: 50 }}
                />
              </LineChart>
            </ResponsiveContainer>

            {/* Selected event messages */}
            {selectedEvent && users && (
              <div
                className="fixed inset-0 z-[100] bg-background/80 backdrop-blur-sm overflow-hidden"
                onClick={(e) => {
                  if (e.target === e.currentTarget) {
                    setSelectedEvent(null);
                  }
                }}
                style={{ zIndex: 100 }}
              >
                {/* Mobile view as a bottom sheet that slides up */}
                {isMobile ? (
                  <div className="w-full h-full flex flex-col">
                    {/* Semi-transparent backdrop */}
                    <div
                      className="flex-grow"
                      onClick={() => setSelectedEvent(null)}
                    />

                    {/* Fixed height bottom sheet with its own scrolling */}
                    <div
                      className="w-full bg-card rounded-t-xl shadow-xl border-t border-border flex flex-col"
                      style={{
                        height: "85vh",
                        maxHeight: "85vh",
                        zIndex: 1000,
                      }}
                    >
                      {/* Mobile header with sticky position */}
                      <div className="sticky top-0 z-30 w-full bg-card rounded-t-xl pt-5 pb-3 px-4 flex flex-col">
                        {/* Drag indicator */}
                        <div className="w-12 h-1 bg-muted-foreground/30 rounded-full mx-auto mb-4" />

                        {/* Title and close button */}
                        <div className="flex items-center justify-between">
                          <div className="flex items-center">
                            <div className="flex gap-1 mr-2">
                              {selectedEvent.emojis.map((emoji, i) => (
                                <span key={i} className="text-xl">
                                  {emoji}
                                </span>
                              ))}
                            </div>
                            <h3 className="text-base font-bold truncate max-w-[70%]">
                              {selectedEvent.event}
                            </h3>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 rounded-full"
                            onClick={() => setSelectedEvent(null)}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>

                        {/* Date range with higher emphasis */}
                        <p className="text-xs text-muted-foreground mt-1">
                          {format(
                            new Date(selectedEvent.timestamp_range.start),
                            "MMM d, yyyy"
                          )}
                          {" — "}
                          {format(
                            new Date(selectedEvent.timestamp_range.end),
                            "MMM d, yyyy"
                          )}
                        </p>

                        {/* Tab-like divider */}
                        <div className="w-full h-px bg-border mt-3" />
                      </div>

                      {/* Mobile content - independently scrollable area */}
                      <div className="flex-1 overflow-y-auto overscroll-contain px-4 pt-2 pb-12">
                        {/* Event Overview */}
                        <div className="mb-5">
                          <h4 className="text-sm font-bold mb-3">
                            Event Overview
                          </h4>
                          <div className="space-y-3 pb-1">
                            <div className="border-l-2 border-primary/70 pl-3">
                              <p className="text-xs">
                                <span className="font-medium text-[11px] text-primary block mb-1">
                                  Summary
                                </span>
                                {updateUserReferences(
                                  selectedEvent.event_deep_dive.event_summary,
                                  users
                                )}
                              </p>
                            </div>

                            <div className="border-l-2 border-primary/70 pl-3">
                              <p className="text-xs">
                                <span className="font-medium text-[11px] text-primary block mb-1">
                                  Key Interactions
                                </span>
                                {updateUserReferences(
                                  selectedEvent.event_deep_dive
                                    .key_interactions,
                                  users
                                )}
                              </p>
                            </div>

                            <div className="border-l-2 border-primary/70 pl-3">
                              <p className="text-xs">
                                <span className="font-medium text-[11px] text-primary block mb-1">
                                  Emotional Impact
                                </span>
                                {updateUserReferences(
                                  selectedEvent.event_deep_dive
                                    .emotional_responses,
                                  users
                                )}
                              </p>
                            </div>

                            <div className="border-l-2 border-primary/70 pl-3">
                              <p className="text-xs">
                                <span className="font-medium text-[11px] text-primary block mb-1">
                                  Impact on Relationship
                                </span>
                                {updateUserReferences(
                                  selectedEvent.event_deep_dive
                                    .potential_impact,
                                  users
                                )}
                              </p>
                            </div>

                            <div className="border-l-2 border-primary/70 pl-3">
                              <p className="text-xs">
                                <span className="font-medium text-[11px] text-primary block mb-1">
                                  Psychological Analysis
                                </span>
                                {updateUserReferences(
                                  selectedEvent.event_deep_dive
                                    .psychoanalytical_takeaway,
                                  users
                                )}
                              </p>
                            </div>
                          </div>
                        </div>

                        {/* Related Messages */}
                        <div className="mb-6">
                          <h4 className="text-sm font-bold mb-3">
                            Related Messages
                          </h4>
                          <div className="space-y-3">
                            {selectedEvent.eventMessages.map(
                              (message, index) => {
                                const isUser1 = message.user === user1.username;
                                const messageClass = cn(
                                  "rounded-lg p-3",
                                  message.isContext
                                    ? isUser1
                                      ? "bg-primary/10"
                                      : "bg-secondary/10"
                                    : isUser1
                                    ? "bg-primary text-primary-foreground"
                                    : "bg-secondary text-secondary-foreground"
                                );

                                return (
                                  <div key={index} className={messageClass}>
                                    <div className="flex justify-between items-center mb-1">
                                      <span className="text-xs font-semibold">
                                        {isUser1 ? user1.name : user2.name}
                                      </span>
                                      <span className="text-[10px] opacity-70">
                                        {format(
                                          new Date(message.timestamp),
                                          "MMM d HH:mm"
                                        )}
                                      </span>
                                    </div>
                                    <p className="text-xs leading-normal">
                                      {message.message}
                                    </p>
                                  </div>
                                );
                              }
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  /* Desktop view remains unchanged */
                  <div className="w-full h-full flex items-center justify-center">
                    <div className="relative bg-card rounded-lg shadow-lg p-4 flex w-full max-w-[1200px] h-[600px] mx-4">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="absolute top-2 right-2 z-20"
                        onClick={() => setSelectedEvent(null)}
                      >
                        <X className="h-4 w-4" />
                      </Button>

                      {/* Event Details Section */}
                      <div className="w-1/2 pr-4 border-r border-border overflow-y-auto">
                        {/* Event Header Section */}
                        <div className="mb-6 border-b border-border pb-4">
                          <div className="flex items-center text-xl font-semibold">
                            {selectedEvent.emojis.map((emoji, i) => (
                              <span key={i} className="mr-2">
                                {emoji}
                              </span>
                            ))}
                            {selectedEvent.event}
                          </div>
                          <p className="text-sm text-muted-foreground">
                            {format(
                              new Date(selectedEvent.timestamp_range.start),
                              "PPP"
                            )}{" "}
                            -{" "}
                            {format(
                              new Date(selectedEvent.timestamp_range.end),
                              "PPP"
                            )}
                          </p>
                        </div>

                        {/* Event Details Content */}
                        <div>
                          <h3 className="text-lg font-semibold mb-4">
                            Event Overview
                          </h3>
                          <div className="space-y-4">
                            <p>
                              <strong>Summary:</strong>{" "}
                              {updateUserReferences(
                                selectedEvent.event_deep_dive.event_summary,
                                users
                              )}
                            </p>
                            <p>
                              <strong>Key Interactions:</strong>{" "}
                              {updateUserReferences(
                                selectedEvent.event_deep_dive.key_interactions,
                                users
                              )}
                            </p>
                            <p>
                              <strong>Emotional Impact:</strong>{" "}
                              {updateUserReferences(
                                selectedEvent.event_deep_dive
                                  .emotional_responses,
                                users
                              )}
                            </p>
                            <p>
                              <strong>Impact on Relationship:</strong>{" "}
                              {updateUserReferences(
                                selectedEvent.event_deep_dive.potential_impact,
                                users
                              )}
                            </p>
                            <p>
                              <strong>Psychological Analysis:</strong>{" "}
                              {updateUserReferences(
                                selectedEvent.event_deep_dive
                                  .psychoanalytical_takeaway,
                                users
                              )}
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Messages Section */}
                      <div className="w-1/2 pl-4 overflow-y-auto">
                        <h3 className="text-lg font-semibold mb-4">
                          Related Messages
                        </h3>
                        <div className="space-y-3">
                          {selectedEvent.eventMessages.map((message, index) => {
                            const isUser1 = message.user === user1.username;
                            const messageClass = cn(
                              "p-3 rounded-lg",
                              message.isContext
                                ? isUser1
                                  ? "bg-primary/10"
                                  : "bg-secondary/10"
                                : isUser1
                                ? "bg-primary text-primary-foreground"
                                : "bg-secondary text-secondary-foreground"
                            );

                            return (
                              <div key={index} className={messageClass}>
                                <div className="flex justify-between items-center mb-1">
                                  <span className="font-semibold">
                                    {isUser1 ? user1.name : user2.name}
                                  </span>
                                  <span className="text-xs opacity-70">
                                    {format(
                                      new Date(message.timestamp),
                                      "MMM d, yyyy HH:mm:ss"
                                    )}
                                  </span>
                                </div>
                                <p className="text-sm">{message.message}</p>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          <div className={cn(isMobile ? "px-2 pt-2" : "px-6 pt-4")}>
            <Slider
              value={dateRange}
              onValueChange={handleDateRangeChange}
              min={0}
              max={100}
              step={1}
              className="w-full"
            />
            <div className="flex justify-between mt-2 text-muted-foreground">
              <span className={isMobile ? "text-xs" : "text-sm"}>
                {valuetext(dateRange[0])}
              </span>
              <span className={isMobile ? "text-xs" : "text-sm"}>
                {valuetext(dateRange[1])}
              </span>
            </div>
          </div>
        </Card>
      </div>
    </TooltipProvider>
  );
};

export default SentimentChartDrillDown;
