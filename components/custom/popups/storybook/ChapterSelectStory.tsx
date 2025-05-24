import {
  Box,
  Button,
  List,
  ListItem,
  ListItemText,
  Typography,
} from "@mui/material";
import React from "react";

interface Chapter {
  title: string;
  summary: string;
}

interface ChapterSelectStoryProps {
  chapters: Chapter[] | null;
  selectedChapter: number | null; // Add this prop
  onChapterSelect: (index: number) => void;
  onBack: () => void;
  onNext: () => void;
}

const ChapterSelectStory: React.FC<ChapterSelectStoryProps> = ({
  chapters,
  selectedChapter, // Add this prop
  onChapterSelect,
  onBack,
  onNext,
}) => {
  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        Select a Chapter to Generate
      </Typography>
      <List>
        {chapters?.map((chapter, index) => (
          <ListItem
            key={index}
            sx={{
              border:
                selectedChapter === index
                  ? "2px solid #1976d2"
                  : "1px solid #e0e0e0",
              borderRadius: 1,
              mb: 2,
              backgroundColor:
                selectedChapter === index
                  ? "rgba(25, 118, 210, 0.08)"
                  : "transparent",
              "&:hover": {
                backgroundColor:
                  selectedChapter === index
                    ? "rgba(25, 118, 210, 0.12)"
                    : "rgba(0, 0, 0, 0.04)",
                cursor: "pointer",
              },
              transition: "all 0.2s ease-in-out",
              transform: selectedChapter === index ? "scale(1.02)" : "scale(1)",
            }}
            onClick={() => onChapterSelect(index)}
          >
            <ListItemText
              primary={
                <Typography
                  variant="subtitle1"
                  sx={{
                    fontWeight: selectedChapter === index ? "bold" : "normal",
                    color: selectedChapter === index ? "#1976d2" : "inherit",
                  }}
                >
                  {`Chapter ${index + 1}: ${chapter.title}`}
                </Typography>
              }
              secondary={chapter.summary}
            />
          </ListItem>
        ))}
      </List>
      <Box sx={{ mt: 2, display: "flex", justifyContent: "space-between" }}>
        <Button onClick={onBack}>Back</Button>
        <Button
          variant="contained"
          onClick={onNext}
          disabled={selectedChapter === null} // Disable if no chapter selected
        >
          Next
        </Button>
      </Box>
    </Box>
  );
};

export default ChapterSelectStory;
