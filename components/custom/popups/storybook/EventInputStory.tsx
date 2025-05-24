import { Box, Button, TextField, Typography } from "@mui/material";
import React from "react";

interface MissingEvent {
  eventPrompt: string;
  userInput?: string;
}

interface EventInputStoryProps {
  missingEvents: MissingEvent[];
  onEventsUpdate: (events: MissingEvent[]) => void;
  onNext: () => void;
  onBack: () => void;
}

const EventInputStory: React.FC<EventInputStoryProps> = ({
  missingEvents,
  onEventsUpdate,
  onNext,
  onBack,
}) => {
  const handleInputChange = (index: number, value: string) => {
    const updatedEvents = [...missingEvents];
    updatedEvents[index].userInput = value;
    onEventsUpdate(updatedEvents);
  };

  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        Add Missing Details
      </Typography>
      {missingEvents.map((event, index) => (
        <Box key={index} sx={{ mb: 2 }}>
          <Typography variant="body1">{event.eventPrompt}</Typography>
          <TextField
            fullWidth
            value={event.userInput || ""}
            onChange={(e) => handleInputChange(index, e.target.value)}
            placeholder="Describe what happened..."
            multiline
            rows={3}
            sx={{ mt: 1 }}
          />
        </Box>
      ))}
      <Box sx={{ mt: 2, display: "flex", justifyContent: "space-between" }}>
        <Button onClick={onBack}>Back</Button>
        <Button variant="contained" onClick={onNext}>
          Next
        </Button>
      </Box>
    </Box>
  );
};

export default EventInputStory;
