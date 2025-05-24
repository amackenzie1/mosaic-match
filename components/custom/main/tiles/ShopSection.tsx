import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import {
  Box,
  Button,
  Card,
  CardContent,
  CardMedia,
  Grid,
  Typography,
  useTheme,
} from "@mui/material";
import { BarChart, Book, Music } from "lucide-react";
import React, { useEffect, useState } from "react";
import { useS3Fetcher } from "@/lib/utils/fetcher";
import {
  ImageContent,
  generateImagePromptFromChat,
} from "@/lib/utils/imageGeneration";
import { useRouter } from 'next/navigation'
import StorybookPopup from "../../popups/storybook/StorybookPopup";
import SongPopup from "../../popups/song/SongPopup";
import ChartPopup from "../../popups/ChartPopup";
import ComingSoonPopup from "../../popups/ComingSoonPopup";

const ShopSection: React.FC = () => {
  const router = useRouter();
  const theme = useTheme();
  const [openPopup, setOpenPopup] = useState<string | null>(null);

  const { data: imageContent } = useS3Fetcher<ImageContent>({
    generator: generateImagePromptFromChat,
    cachePath: 'chat/:hash:/image-prompt.json',
  })

  const handleOpenPopup = (popupType: string) => {
    setOpenPopup(popupType);
  };

  const handleClosePopup = () => {
    setOpenPopup(null);
  };

  const products = [
    {
      title: "Personalized Storybook",
      description:
        "A unique storybook crafted from your chat history, bringing your conversations to life.",
      icon: <Book size={48} />,
      color: theme.palette.primary.main,
      popupType: "comingsoon",
      enabled: true,
    },
    {
      title: "Personalized Chart",
      description:
        "A beautiful, data-driven chart showcasing the ebb and flow of your relationship.",
      icon: <BarChart size={48} />,
      color: theme.palette.secondary.main,
      popupType: "comingsoon",
      enabled: true,
    },
    {
      title: "Personalized Song",
      description:
        "A one-of-a-kind melody composed based on the rhythm and sentiment of your conversations.",
      icon: <Music size={48} />,
      color: theme.palette.success.main,
      popupType: "comingsoon",
      enabled: true,
    },
  ];

  useEffect(() => {
    console.log("ShopSection mounted");
    return () => {
      console.log("ShopSection unmounted");
    };
  }, []);

  return (
    <Box
      sx={{
        py: 8,
        px: 4,
        bgcolor: "#F8FAFC", // Very light silvery-white
        background: "linear-gradient(135deg, #FFFFFF 0%, #F0F4F8 100%)", // Subtle gradient
      }}
    >
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          mb: 6,
        }}
      >
        <Button
          startIcon={<ArrowBackIcon />}
          onClick={() => router.push("/")}
          variant="outlined"
          color="inherit"
          sx={{
            fontWeight: "bold",
            alignSelf: "flex-start",
            mb: 4,
            "&:hover": {
              backgroundColor: theme.palette.action.hover,
            },
          }}
        >
          Back to Dashboard
        </Button>
        <Box
          sx={{
            display: "flex",
            alignItems: "baseline",
            justifyContent: "center",
            mb: 2,
          }}
        >
          <Typography
            component="span"
            sx={{
              fontWeight: "bold",
              fontSize: "4rem",
              fontFamily: "'Comfortaa', sans-serif",
              background: "linear-gradient(45deg, #3B82F6, #00C4FF, #60A5FA)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              mr: 2,
            }}
          >
            Mosaic
          </Typography>
          <Typography
            component="span"
            sx={{
              fontWeight: "bold",
              fontSize: "4rem",
              fontFamily: "'Comfortaa', sans-serif",
              background: "linear-gradient(45deg, #9c27b0, #d500f9, #9c27b0)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
            }}
          >
            Shop
          </Typography>
        </Box>
        <Typography
          variant="h5"
          component="h2"
          align="center"
          sx={{
            color: theme.palette.text.secondary,
            maxWidth: "600px",
            mb: 4,
          }}
        >
          Discover unique products inspired by your conversations
        </Typography>
      </Box>

      <Grid container spacing={4} justifyContent="center">
        {products.map((product, index) => (
          <Grid item xs={12} sm={6} md={4} key={index}>
            <Card
              sx={{
                height: "100%",
                display: "flex",
                flexDirection: "column",
                transition:
                  "transform 0.3s ease-in-out, box-shadow 0.3s ease-in-out",
                position: "relative",
                overflow: "hidden",
                "&:hover": {
                  transform: "translateY(-10px)",
                  boxShadow: `0 0 20px ${product.color}`,
                },
                "&::before": {
                  content: '""',
                  position: "absolute",
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  background: `linear-gradient(45deg, ${product.color}, ${theme.palette.background.paper}, ${product.color})`,
                  backgroundSize: "400% 400%",
                  animation: "gradientMove 15s ease infinite",
                  opacity: 0.3,
                },
                "@keyframes gradientMove": {
                  "0%": {
                    backgroundPosition: "0% 50%",
                  },
                  "50%": {
                    backgroundPosition: "100% 50%",
                  },
                  "100%": {
                    backgroundPosition: "0% 50%",
                  },
                },
              }}
            >
              <CardMedia
                sx={{
                  pt: "56.25%",
                  position: "relative",
                  overflow: "hidden",
                  background: `linear-gradient(45deg, ${product.color}, ${theme.palette.background.paper})`,
                }}
              >
                <Box
                  sx={{
                    position: "absolute",
                    top: "50%",
                    left: "50%",
                    transform: "translate(-50%, -50%)",
                    color: "white",
                  }}
                >
                  {product.icon}
                </Box>
              </CardMedia>
              <CardContent sx={{ flexGrow: 1 }}>
                <Typography
                  gutterBottom
                  variant="h5"
                  component="h2"
                  sx={{ fontWeight: "bold" }}
                >
                  {product.title}
                </Typography>
                <Typography>{product.description}</Typography>
              </CardContent>
              <Box sx={{ p: 2 }}>
                <Button
                  fullWidth
                  variant="contained"
                  onClick={() => handleOpenPopup(product.popupType)}
                  sx={{
                    bgcolor: product.color,
                    "&:hover": {
                      bgcolor: theme.palette.getContrastText(product.color),
                      color: product.color,
                    },
                  }}
                >
                  Create Your {product.title.split(" ")[1]}
                </Button>
              </Box>
            </Card>
          </Grid>
        ))}
      </Grid>

      <StorybookPopup
        open={openPopup === "storybook"}
        onClose={handleClosePopup}
      />
      <ChartPopup open={openPopup === "chart"} onClose={handleClosePopup} />
      <SongPopup
        open={openPopup === "song"}
        onClose={handleClosePopup}
        suggestedCategory={imageContent?.chatCategory || ""}
        suggestedStyles={imageContent?.suggestedStyles || []}
      />
      <ComingSoonPopup
        open={openPopup === "comingsoon"}
        onClose={handleClosePopup}
      />
    </Box>
  );
};

export default ShopSection;
