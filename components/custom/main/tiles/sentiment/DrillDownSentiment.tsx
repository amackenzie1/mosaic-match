import { useGeneralInfo } from "@/lib/contexts/general-info";
import { MajorEventType } from "@/lib/utils/sentimentAnalysis";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import {
  Box,
  Button,
  Container,
  Typography,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import React, { useEffect, useMemo, useRef, useState } from "react";
import { sampleCorrelation, variance } from "simple-statistics";
import MajorEventsTable from "./MajorEventsTable";
import SentimentChartDrillDown from "./SentimentChartDrillDown";

interface DrillDownSentimentProps {
  onClose: () => void;
  chartData: any[];
  allMajorEvents: MajorEventType[];
}

const DrillDownSentiment: React.FC<DrillDownSentimentProps> = (props) => {
  const { onClose, chartData, allMajorEvents } = props;
  const theme = useTheme();
  const { users } = useGeneralInfo();
  const [user1, user2] = users || [];
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const [selectedEventIndex, setSelectedEventIndex] = useState<number | null>(
    null
  );
  const componentRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<HTMLDivElement>(null);
  const [displayedCharts, setDisplayedCharts] = useState<string[]>([]);

  useEffect(() => {
    if (chartData.length > 0) {
      setIsLoading(false);
    }
  }, [chartData]);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const { user1Variance, user2Variance, correlation } = useMemo(() => {
    const user1Data = chartData.map((item) => item.X_sentiment);
    const user2Data = chartData.map((item) => item.Z_sentiment);

    const user1Variance = user1Data.length > 1 ? variance(user1Data) : 0;
    const user2Variance = user2Data.length > 1 ? variance(user2Data) : 0;
    const correlation =
      user1Data.length > 1 && user2Data.length > 1
        ? sampleCorrelation(user1Data, user2Data)
        : 0;

    return { user1Variance, user2Variance, correlation };
  }, [chartData]);

  const { user1Frequency, user2Frequency, maxFrequency } = useMemo(() => {
    const user1Frequency = new Array(21).fill(0);
    const user2Frequency = new Array(21).fill(0);

    chartData.forEach((item) => {
      const user1Score = Math.round(item.X_sentiment) + 10;
      const user2Score = Math.round(item.Z_sentiment) + 10;
      user1Frequency[user1Score]++;
      user2Frequency[user2Score]++;
    });

    const maxFrequency = Math.max(...user1Frequency, ...user2Frequency);

    return { user1Frequency, user2Frequency, maxFrequency };
  }, [chartData]);

  const handleEventClick = (event: any, index: number) => {
    setSelectedEventIndex((prevIndex) => (prevIndex === index ? null : index));
  };

  const scrollToChart = () => {
    if (chartRef.current) {
      chartRef.current.scrollIntoView({ behavior: "smooth" });
    }
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        componentRef.current &&
        !componentRef.current.contains(event.target as Node)
      ) {
        setSelectedEventIndex(null);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleChartDisplay = (chartType: string) => {
    if (chartType === "correlation") {
      setDisplayedCharts((prev) =>
        prev.includes("correlation") ? [] : ["correlation"]
      );
    } else {
      setDisplayedCharts((prev) => {
        if (prev.includes(chartType)) {
          return prev.filter((chart) => chart !== chartType);
        } else if (prev.length === 1 && prev[0] !== "correlation") {
          return [...prev, chartType];
        } else {
          return [chartType];
        }
      });
    }
  };

  const correlationData = useMemo(() => {
    return chartData.map((item) => ({
      x: item.X_sentiment,
      y: item.Z_sentiment,
    }));
  }, [chartData]);

  const varianceData = useMemo(() => {
    return chartData.map((item) => ({
      weekStart: item.weekStart,
      X_sentiment: item.X_sentiment,
      Z_sentiment: item.Z_sentiment,
    }));
  }, [chartData]);

  const updateDescription = (text: string) => {
    if (!text || !users || users.length === 0) return text;

    const nameMap = users.reduce<Record<string, string>>((acc, user) => {
      if (!user || !user.name) return acc;

      return {
        ...acc,
        [user.username]: user.name,
        [user.name]: user.name,
        ...(user.isMe ? { "User 1": user.name } : { "User 2": user.name }),
      };
    }, {});

    let updatedText = text;
    Object.entries(nameMap).forEach(([oldName, newName]) => {
      if (!oldName || !newName) return;
      const regex = new RegExp(`\\b${oldName}\\b`, "gi");
      updatedText = updatedText.replace(regex, () => newName);
    });

    return updatedText;
  };

  // Only update names in specific fields of major events
  const processedMajorEvents = allMajorEvents.map((event) => ({
    ...event,
    event_deep_dive: {
      event_summary: updateDescription(event.event_deep_dive.event_summary),
      key_interactions: updateDescription(
        event.event_deep_dive.key_interactions
      ),
      emotional_responses: updateDescription(
        event.event_deep_dive.emotional_responses
      ),
      potential_impact: updateDescription(
        event.event_deep_dive.potential_impact
      ),
      psychoanalytical_takeaway: updateDescription(
        event.event_deep_dive.psychoanalytical_takeaway
      ),
    },
  }));

  if (!users || users.length === 0) {
    return (
      <Box sx={{ textAlign: "center", py: 4 }}>
        <Typography>Loading user data...</Typography>
      </Box>
    );
  }

  return (
    <Container maxWidth="lg" ref={componentRef} sx={isMobile ? { px: 1 } : {}}>
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          mb: isMobile ? 2 : 3,
          flexDirection: isMobile ? "column" : "row",
        }}
      >
        <Box sx={{ 
          flex: isMobile ? "1 1 auto" : "1 1 30%", 
          mr: isMobile ? 0 : 2,
          width: isMobile ? "100%" : "auto",
          mb: isMobile ? 2 : 0,
        }}>
          <Button
            startIcon={<ArrowBackIcon fontSize={isMobile ? "small" : "medium"} />}
            onClick={onClose}
            variant="outlined"
            color="inherit"
            size={isMobile ? "small" : "medium"}
            fullWidth={isMobile}
            sx={{
              fontWeight: "bold",
              "&:hover": {
                backgroundColor: theme.palette.action.hover,
              },
            }}
          >
            Back to Dashboard
          </Button>
        </Box>
        {!isMobile && (
          <>
            <Box
              sx={{
                flex: "1 1 30%",
                mx: 2,
                display: "flex",
                justifyContent: "center",
              }}
            ></Box>
            <Box sx={{ flex: "1 1 30%", ml: 2 }} />
          </>
        )}
      </Box>
      {isLoading ? (
        <Typography variant="body1" sx={{ mt: 3 }}>
          Loading sentiment analysis data...
        </Typography>
      ) : error ? (
        <Typography variant="body1" color="error" sx={{ mt: 3 }}>
          {error}
        </Typography>
      ) : chartData.length > 0 ? (
        <>
          <Box sx={{ mt: isMobile ? 2 : 6 }}>
            <MajorEventsTable
              majorEvents={processedMajorEvents}
              onEventClick={handleEventClick}
              scrollToChart={scrollToChart}
            />
          </Box>
          <Box sx={{ mt: isMobile ? 2 : 6 }} ref={chartRef}>
            <SentimentChartDrillDown
              chartData={chartData}
              selectedEventIndex={selectedEventIndex}
            />
          </Box>
        </>
      ) : (
        <Typography variant="body1" sx={{ mt: 3 }}>
          No sentiment analysis data available.
        </Typography>
      )}
    </Container>
  );
};
export default DrillDownSentiment;
