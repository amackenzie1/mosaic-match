import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { ChatMessage } from "@/lib/types";
import { useS3Fetcher } from "@/lib/utils/fetcher";
import {
  customImageLoader,
  customImageSaver,
  generateImage,
  generateImagePromptFromChat,
  ImageContent,
} from "@/lib/utils/imageGeneration";
import { Palette } from "lucide-react";
import React from "react";

const VisualStoryCanvas: React.FC = () => {
  const { data: imageContent } = useS3Fetcher<ImageContent>({
    generator: generateImagePromptFromChat,
    cachePath: "chat/:hash:/image-prompt.json",
  });

  const { data: imageUrl } = useS3Fetcher<string>({
    generator: (_: ChatMessage[]) =>
      generateImage(imageContent?.imagePrompt || ""),
    cachePath: "chat/:hash:/image.png",
    customLoader: customImageLoader,
    customSaver: customImageSaver,
    wait: !Boolean(imageContent?.imagePrompt),
  });

  return (
    <Card className="overflow-hidden border-2 bg-gradient-to-br from-background via-background to-muted/30">
      <CardHeader>
        <div className="flex flex-col items-center gap-2">
          <div className="flex items-center gap-2">
            <CardTitle className="text-2xl font-serif">
              Visual Story Canvas
            </CardTitle>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Palette className="h-4 w-4 text-muted-foreground cursor-help hover:text-primary transition-colors" />
                </TooltipTrigger>
                <TooltipContent className="max-w-sm">
                  A canvas where your conversations transform into visual
                  stories, capturing the essence of your shared moments through
                  artistic interpretation.
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {!imageUrl ? (
          <div className="flex justify-center items-center min-h-[400px]">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
          </div>
        ) : (
          <div className="flex flex-col md:flex-row gap-8">
            <div className="flex-1 md:max-w-[60%] relative group">
              <div className="absolute -inset-1 bg-gradient-to-r from-[hsl(var(--chart-1))] via-[hsl(var(--chart-2))] to-[hsl(var(--chart-3))] rounded-lg blur opacity-25 group-hover:opacity-40 transition duration-1000"></div>
              <div className="relative">
                <img
                  src={imageUrl}
                  alt="Visual interpretation"
                  className="w-full h-auto rounded-lg shadow-lg transition-transform duration-500 group-hover:scale-[1.02]"
                />
              </div>
            </div>
            <div className="flex-1 md:max-w-[40%] space-y-6">
              <div className="relative">
                <h3 className="font-serif text-3xl md:text-4xl font-bold pb-4 relative">
                  {imageContent?.title}
                  <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-border to-transparent"></div>
                </h3>
                <p className="mt-4 text-content leading-relaxed">
                  {imageContent?.description}
                </p>
              </div>
              <Card className="border-2 bg-gradient-to-br from-muted/30 to-transparent">
                <CardContent className="pt-6">
                  <h4 className="font-serif text-xl mb-4 text-primary">
                    Inspired Verse
                  </h4>
                  <p className="italic whitespace-pre-line text-sm text-content leading-relaxed">
                    {imageContent?.poem}
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default VisualStoryCanvas;
