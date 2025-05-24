import { Box, Button, Typography } from "@mui/material";
import React, { useEffect, useState } from "react";
import { useS3Fetcher } from "../../../utils/fetcher";
import { ChatMessage } from "../../../utils/types";
import { generateChapterContent } from "../../../utils/storyGeneration";

interface ChapterGenerateStoryProps {
  style: string;
  chapter: number | null;
  onBack: () => void;
  onClose: () => void;
}

const ChapterGenerateStory: React.FC<ChapterGenerateStoryProps> = ({
  style,
  chapter,
  onBack,
  onClose,
}) => {
  const [chapterContent, setChapterContent] = useState<string>("");

  const { data: chatData } = useS3Fetcher<ChatMessage[]>({
    generator: async () => [],
    cachePath: 'chat/:hash:/messages.json',
  })

  useEffect(() => {
    const fetchChapterContent = async () => {
      if (chapter !== null && chatData) {
        try {
          const content = await generateChapterContent(
            style,
            chapter,
            chatData
          );
          setChapterContent(content);
        } catch (error) {
          console.error("Error:", error);
          setChapterContent("Failed to generate chapter content.");
        }
      }
    };

    fetchChapterContent();
  }, [style, chapter, chatData]);

  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        Your Story Chapter
      </Typography>
      <Typography variant="body1" sx={{ mb: 3 }}>
        {chapterContent || "Generating your story..."}
      </Typography>
      <Box sx={{ mt: 2, display: "flex", justifyContent: "space-between" }}>
        <Button onClick={onBack}>Back</Button>
        <Button variant="contained" onClick={onClose}>
          Finish
        </Button>
      </Box>
    </Box>
  );
};

export default ChapterGenerateStory;
