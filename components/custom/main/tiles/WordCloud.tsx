import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useIsMobile } from "@/components/ui/use-mobile";
import { useGeneralInfo } from "@/lib/contexts/general-info";
import { useUserColors } from "@/lib/hooks/useUserColors";
import { useS3Fetcher } from "@/lib/utils/fetcher";
import { getUserName } from "@/lib/utils/general";
import { getTopWords, WordCloudResult, WordItem } from "@/lib/utils/wordCloud";
import { cn } from "@/lib/utils";
import { InfoIcon } from "lucide-react";
import React, { useCallback } from "react";
import WordCloudComponent from "react-d3-cloud";

const WordCloud: React.FC = React.memo(() => {
  const { users } = useGeneralInfo();
  const { getUserColors } = useUserColors();
  const isMobile = useIsMobile();

  const { data: wordCloudResult } = useS3Fetcher<WordCloudResult>({
    generator: getTopWords,
    cachePath: "chat/:hash:/wordcloud.json",
  });

  const fontSizeMapper = useCallback((word: WordItem) => {
    const baseSize = Math.max(Math.log(word.value * 100 + 1), 0.5) * 40 + 5;
    return isMobile ? baseSize * 0.8 : baseSize; // Reduce font size on mobile
  }, [isMobile]);

  if (!users || !wordCloudResult) {
    return (
      <div className="flex justify-center items-center py-4">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <Card>
      <CardHeader className="p-4 sm:p-6">
        <div className="flex flex-col items-center gap-2">
          <div className="flex items-center gap-2">
            <CardTitle className="text-xl sm:text-2xl">Word Cloud</CardTitle>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <InfoIcon className="h-4 w-4 text-muted-foreground cursor-help hover:text-primary" />
                </TooltipTrigger>
                <TooltipContent className="max-w-sm">
                  A visual representation of the most frequently used words in
                  your conversations. The size of each word indicates how often
                  it appears.
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-3 sm:p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
          {wordCloudResult?.people.map((person, index) => {
            const userColors = getUserColors(users[index], index);
            return (
              <Card key={person.name}>
                <CardHeader className="p-3 sm:p-6">
                  <CardTitle className="text-center text-base sm:text-lg">
                    {getUserName(users, person.name)}'s Top Words
                  </CardTitle>
                </CardHeader>
                <CardContent className={cn(
                  "bg-background/50",
                  isMobile ? "h-[300px]" : "h-[400px]"
                )}>
                  <WordCloudComponent
                    data={person.topWords}
                    fontSize={fontSizeMapper}
                    rotate={0}
                    padding={isMobile ? 1 : 2}
                    fill={(word: WordItem, wordIndex: number) =>
                      wordIndex % 2 === 0
                        ? userColors.primary
                        : "hsl(var(--muted-foreground))"
                    }
                  />
                </CardContent>
              </Card>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
});

WordCloud.displayName = "WordCloud";

export default WordCloud;
