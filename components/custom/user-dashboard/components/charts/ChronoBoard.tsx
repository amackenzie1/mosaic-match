import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { MajorEventType } from "@/lib/utils/sentimentAnalysis";
import { select } from "d3-selection";
import { curveBasis, line, Line } from "d3-shape";
import { transition } from "d3-transition";
import { format } from "date-fns";
import { GitBranch, History } from "lucide-react";
import { Comfortaa } from "next/font/google";
import React, { useEffect, useMemo, useRef, useState } from "react";
import VerticalTimelineView from "./HorizontalTimeline";

const comfortaa = Comfortaa({
  subsets: ["latin"],
  weight: ["700"],
});

interface TimelineViewProps {
  events: MajorEventType[];
  chatCategories: Record<string, string>;
  chatNames: Record<string, string>;
  chatUsers: Record<string, Array<{ username: string; name: string }>>;
  minDate: number;
  maxDate: number;
  onViewModeChange?: () => void;
  isVertical?: boolean;
  onLayoutChange?: (isVertical: boolean) => void;
}

const categoryStyles: Record<string, { color: string; label: string }> = {
  friendship: { color: "#4287f5", label: "Friend" },
  professional: { color: "#3d3d3d", label: "Professional" },
  romance: { color: "#e91e63", label: "Romance" },
  family: { color: "#4caf50", label: "Family" },
  default: { color: "#9e9e9e", label: "General" },
};

interface ProcessedEvent extends MajorEventType {
  size: number;
  category: string;
  eventUsers: Array<{ username: string; name: string }>;
  chatName: string;
  date: number;
  position: number; // 0-1 normalized along total timeline
}

interface CategoryFilter {
  [key: string]: boolean;
}

const GradientTitle = ({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) => (
  <h2
    className={cn(
      "font-bold font-comfortaa text-transparent bg-clip-text",
      "bg-gradient-to-r from-[#200000] via-[#FF1414] to-[#200000]",
      className
    )}
  >
    {children}
  </h2>
);

const ChronoBoard: React.FC<TimelineViewProps> = ({
  events,
  chatCategories,
  chatNames,
  chatUsers,
  minDate,
  maxDate,
  onViewModeChange,
  onLayoutChange,
}) => {
  const [selectedEvent, setSelectedEvent] = useState<ProcessedEvent | null>(
    null
  );
  const [categoryFilters, setCategoryFilters] = useState<CategoryFilter>(
    Object.keys(categoryStyles).reduce(
      (acc, key) => ({ ...acc, [key]: true }),
      {}
    )
  );
  const [localIsVertical, setLocalIsVertical] = useState(false);

  const handleLayoutChange = () => {
    setLocalIsVertical(!localIsVertical);
    if (onLayoutChange) onLayoutChange(!localIsVertical);
  };

  const containerRef = useRef<HTMLDivElement>(null);
  const [containerHeight, setContainerHeight] = useState(0);
  const [containerWidth, setContainerWidth] = useState(0);

  const pathRef = useRef<SVGPathElement>(null);
  const [pathLength, setPathLength] = useState<number>(0);

  useEffect(() => {
    const updateSize = () => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        setContainerHeight(rect.height - 140);
        setContainerWidth(rect.width - 50);
      }
    };
    updateSize();
    window.addEventListener("resize", updateSize);
    return () => window.removeEventListener("resize", updateSize);
  }, []);

  const getPathPoints = (width: number, height: number): [number, number][] => {
    const segHeight = height / 3;
    const startX = 30;
    const endX = width - 40;

    return [
      // Top line (horizontal, left -> right)
      [startX, segHeight * 0.5],
      [startX + (endX - startX) * 0.5, segHeight * 0.5],
      [startX + (endX - startX) * 0.9, segHeight * 0.5],
      [endX, segHeight * 0.5],

      // Curve down on right side to second line
      [endX + segHeight / 6, segHeight],
      [endX, segHeight * 1.5],

      // Second line (horizontal, right -> left)
      [endX - (endX - startX) * 0.1, segHeight * 1.5],
      [startX + (endX - startX) * 0.5, segHeight * 1.5],
      [endX - (endX - startX) * 0.9, segHeight * 1.5],
      [startX, segHeight * 1.5],

      // Curve down on left side to third line
      [startX - segHeight / 6, segHeight * 2],
      [startX, segHeight * 2.5],

      // Third line (horizontal, left -> right)
      [startX + (endX - startX) * 0.1, segHeight * 2.5],
      [startX + (endX - startX) * 0.5, segHeight * 2.5],
      [endX, segHeight * 2.5],
    ];
  };

  const pathD = useMemo(() => {
    if (!containerWidth || !containerHeight || localIsVertical) {
      return "";
    }

    const lineGenerator: Line<[number, number]> = line()
      .x((d) => d[0])
      .y((d) => d[1])
      .curve(curveBasis);

    const points = getPathPoints(containerWidth, containerHeight);
    return lineGenerator(points) || "";
  }, [containerWidth, containerHeight, localIsVertical]);

  useEffect(() => {
    if (pathRef.current && pathD) {
      const length = pathRef.current.getTotalLength();
      setPathLength(length);
    } else {
      setPathLength(0);
    }
  }, [pathD, localIsVertical]);

  useEffect(() => {
    if (!pathRef.current || !pathD) return;

    const svgPath = select(pathRef.current);
    const t = transition().duration(1000);

    svgPath.transition(t).attr("d", pathD);
  }, [pathD]);

  const processedEvents = useMemo(() => {
    return [...events]
      .sort(
        (a, b) =>
          new Date(a.timestamp_range.start).getTime() -
          new Date(b.timestamp_range.start).getTime()
      )
      .map((event) => {
        const eventDate = new Date(event.timestamp_range.start).getTime();
        const ratio = (eventDate - minDate) / (maxDate - minDate);
        const position = Math.max(0, Math.min(1, ratio));
        const size = Math.max(8, Math.min(16, event.major_score * 2));
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
      });
  }, [events, minDate, maxDate, chatCategories, chatUsers, chatNames]);

  const filteredEvents = useMemo(() => {
    return processedEvents.filter((event) => categoryFilters[event.category]);
  }, [processedEvents, categoryFilters]);

  const renderEventDialog = () => {
    if (!selectedEvent) return null;
    const categoryStyle = categoryStyles[selectedEvent.category];

    return (
      <Dialog
        open={!!selectedEvent}
        onOpenChange={() => setSelectedEvent(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle
              className="text-lg font-semibold"
              style={{ color: categoryStyle.color }}
            >
              {format(selectedEvent.date, "MMMM d, yyyy")}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              {selectedEvent.event}
            </p>
            <div className="flex flex-wrap gap-2">
              {selectedEvent.eventUsers.map((user, idx) => (
                <Badge
                  key={idx}
                  variant="outline"
                  style={{
                    backgroundColor: `${categoryStyle.color}10`,
                    borderColor: categoryStyle.color,
                  }}
                >
                  {user.name}
                </Badge>
              ))}
            </div>
            <p className="text-xs text-muted-foreground">
              Impact Score: {selectedEvent.major_score.toFixed(1)}
            </p>
          </div>
        </DialogContent>
      </Dialog>
    );
  };

  const renderHeader = () => (
    <div className="relative flex justify-between items-center mb-4 px-4">
      <Button
        variant="ghost"
        size="icon"
        onClick={onViewModeChange}
        className="absolute left-2 top-0"
      >
        <History className="h-4 w-4" />
      </Button>

      <Button
        variant="ghost"
        size="icon"
        onClick={handleLayoutChange}
        className="absolute left-12 top-0"
      >
        <GitBranch className="h-4 w-4" />
      </Button>

      <h2
        className={cn(
          comfortaa.className,
          "text-2xl w-full text-center mb-2 font-bold",
          "text-transparent bg-clip-text",
          "bg-gradient-to-r from-[hsl(var(--chart-1))] via-[hsl(var(--chart-2))] to-[hsl(var(--chart-3))]"
        )}
      >
        Events ChronoBoard
      </h2>

      {!localIsVertical && (
        <div className="absolute right-2 top-0 flex gap-2">
          {Object.entries(categoryStyles).map(([category, style]) => (
            <Badge
              key={category}
              variant={categoryFilters[category] ? "outline" : "secondary"}
              className={cn(
                "cursor-pointer transition-colors",
                categoryFilters[category]
                  ? "hover:bg-opacity-30"
                  : "opacity-50 hover:opacity-70"
              )}
              style={{
                backgroundColor: `${style.color}${
                  categoryFilters[category] ? "20" : "10"
                }`,
                borderColor: categoryFilters[category]
                  ? style.color
                  : "transparent",
                color: categoryFilters[category]
                  ? style.color
                  : "var(--muted-foreground)",
              }}
              onClick={() =>
                setCategoryFilters((prev) => ({
                  ...prev,
                  [category]: !prev[category],
                }))
              }
            >
              {style.label}
            </Badge>
          ))}
        </div>
      )}
    </div>
  );

  const renderEvent = (event: ProcessedEvent, index: number) => {
    if (!pathRef.current || !pathLength) return null;

    const posLength = event.position * pathLength;
    const point = pathRef.current.getPointAtLength(posLength);

    const categoryStyle = categoryStyles[event.category];
    const sentiment = event.sentiment ?? 0;
    const isPositive = sentiment >= 0;
    const sentimentColor = isPositive
      ? "rgba(74, 222, 128, 1)" // Bright green for positive
      : "rgba(239, 68, 68, 1)"; // Bright red for negative
    const sentimentIntensity = Math.min(Math.abs(sentiment) / 5, 1);
    const EVENT_SIZE_BASE = Math.min(32, containerHeight / 4);
    const size = EVENT_SIZE_BASE * (0.5 + sentimentIntensity);

    return (
      <TooltipProvider key={index}>
        <Tooltip>
          <TooltipTrigger asChild>
            <div
              onClick={() => setSelectedEvent(event)}
              className="absolute transform -translate-x-1/2 -translate-y-1/2 cursor-pointer transition-all duration-300 z-10"
              style={{
                left: point.x,
                top: point.y,
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
              <p className="font-medium">{format(event.date, "MMM d, yyyy")}</p>
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
  };

  const renderDateMarkers = () => {
    if (!pathLength || !pathRef.current) return null;
    const fractions = [0, 0.25, 0.5, 0.75, 1];
    return fractions.map((frac) => {
      const dist = frac * pathLength;
      const point = pathRef.current!.getPointAtLength(dist);
      const dateVal = new Date(minDate + (maxDate - minDate) * frac);

      if (isNaN(dateVal.getTime())) {
        console.error("Invalid date value:", dateVal);
        return null;
      }

      return (
        <span
          key={frac}
          className="absolute -translate-x-1/2 -translate-y-1/2 text-xs text-muted-foreground px-2 py-1 rounded whitespace-nowrap"
          style={{
            left: point.x,
            top: point.y - 25,
          }}
        >
          {format(dateVal, "MMM yyyy")}
        </span>
      );
    });
  };

  const renderCurvePoints = () => {
    if (!containerWidth || !containerHeight || localIsVertical) {
      return null;
    }

    const points = getPathPoints(containerWidth, containerHeight);
    return points.map(([x, y], index) => (
      <circle key={index} cx={x} cy={y} r={4} fill="red" opacity={0.7} />
    ));
  };

  return (
    <Card
      className={cn(
        "p-4 bg-card h-[450px] flex flex-col relative",
        "border-2 border-[hsl(var(--chart-1)_/_0.2)] dark:border-[hsl(var(--chart-1)_/_0.3)]",
        "bg-gradient-to-br from-[hsl(var(--chart-1)_/_0.02)] via-[hsl(var(--chart-2)_/_0.02)] to-background"
      )}
      ref={containerRef}
    >
      {renderHeader()}

      {localIsVertical ? (
        <VerticalTimelineView
          events={filteredEvents}
          chatCategories={chatCategories}
          chatNames={chatNames}
          chatUsers={chatUsers}
          minDate={minDate}
          maxDate={maxDate}
          onViewModeChange={onViewModeChange}
          isVertical={localIsVertical}
          onLayoutChange={handleLayoutChange}
        />
      ) : (
        <div className="relative flex-grow mx-4 mt-4 mb-2 overflow-hidden">
          <svg width="100%" height="100%" className="absolute left-0 top-0">
            <path
              ref={pathRef}
              d={pathD}
              fill="none"
              className="stroke-[hsl(var(--chart-1)_/_0.3)]"
              strokeWidth={3}
            />
          </svg>
          {renderDateMarkers()}
          {filteredEvents.map(renderEvent)}
        </div>
      )}

      {renderEventDialog()}
    </Card>
  );
};

export default ChronoBoard;
