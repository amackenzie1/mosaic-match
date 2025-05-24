import { Card } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useGeneralInfo } from "@/lib/contexts/general-info";
import { useIsMobile } from "@/components/ui/use-mobile";
import { cn } from "@/lib/utils";
import { MajorEventType } from "@/lib/utils/sentimentAnalysis";
import { format, parseISO } from "date-fns";
import React, { useMemo } from "react";

interface MajorEventsTableProps {
  majorEvents: MajorEventType[];
  onEventClick: (event: MajorEventType, index: number) => void;
  scrollToChart: () => void;
}

const MajorEventsTable: React.FC<MajorEventsTableProps> = ({
  majorEvents,
  onEventClick,
  scrollToChart,
}) => {
  const { users } = useGeneralInfo();

  const updateDescription = (text: string) => {
    if (!text || !users) return text;

    const nameMap = users.reduce<Record<string, string>>(
      (acc, user) => ({
        ...acc,
        [user.username]: user.name,
        [user.name]: user.name,
        ...(user.isMe ? { "User 1": user.name } : { "User 2": user.name }),
      }),
      {}
    );

    let updatedText = text;
    Object.entries(nameMap).forEach(([oldName, newName]) => {
      const regex = new RegExp(`\\b${oldName}\\b`, "gi");
      updatedText = updatedText.replace(regex, () => newName);
    });

    return updatedText;
  };

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

  const renderDate = (event: MajorEventType) => {
    if (event.timestamp_range && event.timestamp_range.start) {
      try {
        const date = format(
          parseISO(event.timestamp_range.start),
          "MMM d, yyyy"
        );
        return date;
      } catch (error) {
        return "Invalid date";
      }
    }
    return "N/A";
  };

  const renderSummary = (event: MajorEventType) => {
    if (event.event_deep_dive && typeof event.event_deep_dive === "object") {
      return (
        updateDescription(event.event_deep_dive.event_summary) ||
        "No summary available"
      );
    }
    return "No summary available";
  };

  const renderEventName = (event: MajorEventType) => {
    if (event.event && typeof event.event === "string") {
      return updateDescription(event.event);
    }
    return "Unknown Event";
  };

  const renderTableRows = () => {
    if (!Array.isArray(majorEvents) || majorEvents.length === 0) {
      return (
        <TableRow>
          <TableCell colSpan={6} className="text-center">
            No major events
          </TableCell>
        </TableRow>
      );
    }

    const rows = [];
    const midpoint = Math.ceil(sortedEvents.length / 2);

    for (let i = 0; i < midpoint; i++) {
      const leftEvent = sortedEvents[i];
      const rightEvent = sortedEvents[i + midpoint];

      rows.push(
        <TableRow key={i}>
          {/* Left Column Event */}
          <TableCell className="font-medium">{renderDate(leftEvent)}</TableCell>
          <TableCell
            onClick={() => {
              onEventClick(leftEvent, sortedEvents.indexOf(leftEvent));
              scrollToChart();
            }}
            className="cursor-pointer text-primary hover:text-primary/80 transition-colors"
          >
            {renderEventName(leftEvent)}
          </TableCell>
          <TableCell className="max-w-[300px] truncate">
            {renderSummary(leftEvent)}
          </TableCell>

          {/* Right Column Event (if exists) */}
          {rightEvent ? (
            <>
              <TableCell className="font-medium">
                {renderDate(rightEvent)}
              </TableCell>
              <TableCell
                onClick={() => {
                  onEventClick(rightEvent, sortedEvents.indexOf(rightEvent));
                  scrollToChart();
                }}
                className="cursor-pointer text-primary hover:text-primary/80 transition-colors"
              >
                {renderEventName(rightEvent)}
              </TableCell>
              <TableCell className="max-w-[300px] truncate">
                {renderSummary(rightEvent)}
              </TableCell>
            </>
          ) : (
            <>
              <TableCell colSpan={3}></TableCell>
            </>
          )}
        </TableRow>
      );
    }
    return rows;
  };
  
  // Function to render mobile view for an event
  const renderMobileEventCard = (event: MajorEventType, index: number) => {
    return (
      <div 
        key={index} 
        onClick={() => {
          onEventClick(event, sortedEvents.indexOf(event));
          scrollToChart();
        }}
        className="border rounded-md overflow-hidden active:bg-muted/50 transition-colors cursor-pointer">
        <div className="p-3">
          <div className="flex justify-between items-center mb-1.5">
            <div className="text-xs text-muted-foreground">
              {renderDate(event)}
            </div>
            {event.emojis && event.emojis.length > 0 && (
              <div className="flex gap-0.5">
                {event.emojis.slice(0, 2).map((emoji, i) => (
                  <span key={i} className="text-base">{emoji}</span>
                ))}
              </div>
            )}
          </div>
          <div className="text-sm font-semibold text-primary mb-1.5 flex items-center gap-1 pr-6 relative">
            <span className="hover:underline">
              {renderEventName(event)}
            </span>
            <span className="absolute right-0 top-1 text-xs opacity-70">→</span>
          </div>
          <div className="text-xs text-muted-foreground line-clamp-2">
            {renderSummary(event)}
          </div>
        </div>
      </div>
    );
  };

  const isMobile = useIsMobile();

  return (
    <Card className="mb-4">
      <div className={cn("text-center", isMobile ? "py-2" : "py-4")}>
        <h2 className={cn("font-bold", isMobile ? "text-lg" : "text-2xl")}>Major Events</h2>
      </div>
      {isMobile ? (
        // Mobile view - simplified table with single column layout
        <div className="pb-2">
          {sortedEvents.length === 0 ? (
            <div className="px-4 py-3 text-center text-sm text-muted-foreground">
              No major events
            </div>
          ) : (
            <div className="space-y-2 px-2">
              {sortedEvents.map((event, index) => renderMobileEventCard(event, index))}
            </div>
          )}
        </div>
      ) : (
        // Desktop view - regular table with side-by-side events
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>Event</TableHead>
              <TableHead>Summary</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Event</TableHead>
              <TableHead>Summary</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>{renderTableRows()}</TableBody>
        </Table>
      )}
    </Card>
  );
};

export default MajorEventsTable;
