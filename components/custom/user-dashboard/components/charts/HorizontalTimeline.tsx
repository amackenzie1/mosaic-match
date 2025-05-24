import { Card } from "@/components/ui/card";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import React, { useMemo } from "react";
import { ProcessedEvent, TimelineLayoutProps } from "./TimelineTypes";

const categoryStyles: Record<string, { color: string; label: string }> = {
  friendship: { color: "#4287f5", label: "Friend" },
  professional: { color: "#3d3d3d", label: "Professional" },
  romance: { color: "#e91e63", label: "Romance" },
  family: { color: "#4caf50", label: "Family" },
  default: { color: "#9e9e9e", label: "General" },
};

interface CategoryStat {
  category: string;
  label: string;
  color: string;
  count: number;
  avgSentiment: number;
  percentage: number;
}

const HorizontalTimelineView: React.FC<TimelineLayoutProps> = ({
  events,
  chatCategories,
  chatNames,
  chatUsers,
  minDate,
  maxDate,
  dateRange = [0, 100],
}) => {
  const EVENT_SIZE_BASE = 32;

  const processedEvents = useMemo(() => {
    return [...events]
      .sort(
        (a, b) =>
          new Date(a.timestamp_range.start).getTime() -
          new Date(b.timestamp_range.start).getTime()
      )
      .map((event) => {
        const eventDate = new Date(event.timestamp_range.start).getTime();
        const position = Math.min(
          Math.max(
            5, // Minimum 5% from left
            ((eventDate - minDate) / (maxDate - minDate)) * 90 + 5 // Scale to 90% of space and offset by 5%
          ),
          95 // Maximum 95% from left
        );
        const size = Math.max(
          EVENT_SIZE_BASE * 0.5,
          Math.min(EVENT_SIZE_BASE, event.major_score * EVENT_SIZE_BASE * 0.4)
        );
        const category = event.hash ? chatCategories[event.hash] : "default";
        const eventUsers = event.hash ? chatUsers[event.hash] || [] : [];
        const chatName = event.hash ? chatNames[event.hash] : "Unknown Chat";

        return {
          ...event,
          size,
          category,
          eventUsers,
          chatName,
          date: eventDate,
          position,
        } as ProcessedEvent;
      })
      .filter((event) => {
        const percentage = ((event.date - minDate) / (maxDate - minDate)) * 100;
        return percentage >= dateRange[0] && percentage <= dateRange[1];
      });
  }, [
    events,
    minDate,
    maxDate,
    chatCategories,
    chatUsers,
    chatNames,
    dateRange,
  ]);

  const categoryStats = useMemo<CategoryStat[]>(() => {
    if (!processedEvents.length) return [];

    return Object.entries(categoryStyles)
      .map(([category, style]) => {
        const categoryEvents = processedEvents.filter(
          (e) => e.category === category
        );
        const avgSentiment =
          categoryEvents.reduce((sum, e) => sum + (e.sentiment ?? 0), 0) /
          (categoryEvents.length || 1);

        return {
          category,
          label: style.label,
          color: style.color,
          count: categoryEvents.length,
          avgSentiment,
          percentage: (categoryEvents.length / processedEvents.length) * 100,
        };
      })
      .filter((stat) => stat.count > 0)
      .sort((a, b) => b.count - a.count);
  }, [processedEvents]);

  return (
    <div className="relative w-full h-full flex flex-col px-4 py-2">
      {/* Category Stats */}
      <div className="flex flex-wrap gap-3 mb-4 px-4 items-start justify-center">
        {categoryStats.map((stat) => (
          <Card
            key={stat.category}
            className={cn(
              "relative flex flex-col items-start min-w-[120px] p-4",
              "transition-colors duration-200",
              "hover:bg-muted/50"
            )}
          >
            <div className="flex items-center mb-2">
              <div
                className="w-2 h-2 rounded-full mr-2"
                style={{ backgroundColor: stat.color }}
              />
              <span className="font-semibold text-sm">{stat.label}</span>
            </div>

            <div className="grid gap-1 w-full">
              <div className="flex justify-between">
                <span className="text-xs text-muted-foreground">Events</span>
                <span className="text-xs font-semibold">{stat.count}</span>
              </div>

              <div className="flex justify-between">
                <span className="text-xs text-muted-foreground">
                  % of Total
                </span>
                <span className="text-xs font-semibold">
                  {stat.percentage.toFixed(1)}%
                </span>
              </div>

              <div className="flex justify-between">
                <span className="text-xs text-muted-foreground">
                  Avg Sentiment
                </span>
                <span
                  className={cn(
                    "text-xs font-semibold",
                    stat.avgSentiment >= 0 ? "text-green-500" : "text-red-500"
                  )}
                >
                  {stat.avgSentiment > 0 ? "+" : ""}
                  {stat.avgSentiment.toFixed(2)}
                </span>
              </div>
            </div>

            <div
              className="absolute bottom-0 left-0 h-0.5 rounded transition-all duration-300"
              style={{
                width: `${stat.percentage}%`,
                backgroundColor: stat.color,
              }}
            />
          </Card>
        ))}
      </div>

      {/* Timeline Container */}
      <div className="relative w-full h-40 flex items-center justify-center">
        {/* Timeline base line */}
        <div className="absolute top-1/2 left-[5%] right-[5%] h-0.5 bg-border -translate-y-1/2" />

        {/* Events */}
        {processedEvents.map((event, index) => {
          const categoryStyle = categoryStyles[event.category];
          const sentiment = event.sentiment ?? 0;
          const isPositive = sentiment >= 0;
          const sentimentColor = isPositive
            ? "rgba(74, 222, 128, 1)" // Bright green for positive
            : "rgba(239, 68, 68, 1)"; // Bright red for negative
          const sentimentIntensity = Math.min(Math.abs(sentiment) / 5, 1);
          const size = EVENT_SIZE_BASE * (0.5 + sentimentIntensity);

          return (
            <TooltipProvider key={index}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div
                    className="absolute transform -translate-x-1/2 -translate-y-1/2 cursor-pointer transition-all duration-300 z-10"
                    style={{
                      left: `${event.position}%`,
                      top: "50%",
                      width: size,
                      height: size,
                    }}
                  >
                    {/* Category border */}
                    <div
                      className="absolute inset-0 rounded-full opacity-80"
                      style={{
                        border: `3px solid ${categoryStyle.color}`,
                      }}
                    />
                    {/* Sentiment fill */}
                    <div
                      className="absolute rounded-full transition-all duration-200"
                      style={{
                        top: "15%",
                        left: "15%",
                        right: "15%",
                        bottom: "15%",
                        backgroundColor: sentimentColor,
                        opacity: Math.max(0.1, sentimentIntensity * 0.7),
                        boxShadow: `0 0 ${size / 3}px ${sentimentColor}`,
                      }}
                    />
                    {/* Hover effect layer */}
                    <div
                      className="absolute inset-0 rounded-full transition-transform duration-200 hover:scale-110"
                      style={{
                        background: `radial-gradient(circle, ${sentimentColor}20 0%, transparent 70%)`,
                      }}
                    />
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  <div className="space-y-1">
                    <p className="font-medium">
                      {format(event.date, "MMM d, yyyy")}
                    </p>
                    <p className="max-w-[200px] text-sm text-muted-foreground">
                      {event.event}
                    </p>
                    <p className="text-sm" style={{ color: sentimentColor }}>
                      Sentiment: {sentiment.toFixed(1)}
                    </p>
                  </div>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          );
        })}

        {/* Date markers */}
        {[0, 0.25, 0.5, 0.75, 1].map((fraction) => {
          const dateVal = new Date(minDate + (maxDate - minDate) * fraction);
          return (
            <span
              key={fraction}
              className="absolute -translate-x-1/2 text-xs text-muted-foreground px-2 py-1 rounded whitespace-nowrap"
              style={{
                left: `${5 + fraction * 90}%`,
                top: "75%",
              }}
            >
              {format(dateVal, "MMM yyyy")}
            </span>
          );
        })}
      </div>
    </div>
  );
};

export default HorizontalTimelineView;
