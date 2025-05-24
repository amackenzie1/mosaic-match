import React from 'react';
import { Box, Typography, Card, CardContent, Button, Grid } from '@mui/material';
import { STORY_STYLES } from "../../../utils/storyGeneration";

interface StyleSelectStoryProps {
  selectedStyle: string;
  onStyleSelect: (style: string) => void;
  onNext: () => void;
}

const StyleSelectStory: React.FC<StyleSelectStoryProps> = ({
  selectedStyle,
  onStyleSelect,
  onNext,
}) => {
  const handleStyleSelect = (style: string) => {
    console.log("Style selected:", style);
    onStyleSelect(style);
  };

  const handleNext = () => {
    console.log("Next clicked in StyleSelectStory with style:", selectedStyle);
    onNext();
  };

  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        Choose your story style
      </Typography>
      <Grid container spacing={2}>
        {STORY_STYLES.map((style) => (
          <Grid item xs={12} sm={6} key={style.name}>
            <Card
              sx={{
                cursor: 'pointer',
                border: selectedStyle === style.name ? '2px solid primary.main' : '1px solid transparent',
                '&:hover': { 
                  boxShadow: 3,
                  transform: 'scale(1.02)',
                  transition: 'transform 0.2s ease-in-out'
                },
                boxShadow: selectedStyle === style.name ? 6 : 1,
                backgroundColor: selectedStyle === style.name ? 'action.selected' : 'background.paper',
                position: 'relative',
                '&:after': selectedStyle === style.name ? {
                  content: '""',
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  border: '2px solid',
                  borderColor: 'primary.main',
                  borderRadius: 'inherit',
                  animation: 'pulse 1.5s infinite'
                } : {},
                '@keyframes pulse': {
                  '0%': { opacity: 1 },
                  '50%': { opacity: 0.5 },
                  '100%': { opacity: 1 }
                }
              }}
              onClick={() => handleStyleSelect(style.name)}
            >
              <CardContent>
                <Typography variant="h6">{style.name}</Typography>
                <Typography variant="body2" color="text.secondary">
                  {style.description}
                </Typography>
                <Typography variant="caption" display="block" sx={{ mt: 1 }}>
                  {style.example}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
      <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2 }}>
        <Button 
          variant="contained" 
          onClick={handleNext} 
          disabled={!selectedStyle}
        >
          Next
        </Button>
      </Box>
    </Box>
  );
};

export default StyleSelectStory;
