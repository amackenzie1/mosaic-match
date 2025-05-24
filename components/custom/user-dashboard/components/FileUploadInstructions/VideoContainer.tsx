import { useIsMobile } from "@/components/ui/use-mobile";
import React, { useEffect, useState } from "react";

interface VideoContainerProps {
  selectedFileType: string;
}

const videoUrls: Record<string, string> = {
  "iMessage (Mac)":
    "https://relanalysis-public.s3.amazonaws.com/imessage_upload.mp4",
  "WhatsApp (Desktop)":
    "https://relanalysis-public.s3.amazonaws.com/whatsapp_upload_laptop.mp4",
  "WhatsApp (Mobile)":
    "https://relanalysis-public.s3.amazonaws.com/whatsapp_upload_mobile.mp4",
  Android:
    "https://relanalysis-public.s3.amazonaws.com/sms_android_placeholder.mp4",
  Instagram: "https://relanalysis-public.s3.amazonaws.com/instagram_upload.mp4",
  Facebook: "https://relanalysis-public.s3.amazonaws.com/facebook_upload.mp4",
  Telegram: "https://relanalysis-public.s3.amazonaws.com/telegram_upload.mp4",
};

const VideoContainer: React.FC<VideoContainerProps> = ({
  selectedFileType,
}) => {
  const [videoKey, setVideoKey] = useState(0);
  const [isVideoLoaded, setIsVideoLoaded] = useState(false);
  const [videoError, setVideoError] = useState(false);

  const isDesktop =
    selectedFileType === "WhatsApp (Desktop)" ||
    selectedFileType === "iMessage (Mac)" ||
    selectedFileType === "Telegram";

  const videoSource = videoUrls[selectedFileType];

  useEffect(() => {
    setVideoKey((prevKey) => prevKey + 1);
    setIsVideoLoaded(false);
    setVideoError(false);
  }, [selectedFileType, videoSource]);

  const handleVideoLoad = () => {
    setIsVideoLoaded(true);
  };

  const handleVideoError = () => {
    setVideoError(true);
  };

  if (!videoSource) {
    return (
      <div className="w-full h-full flex items-center justify-center p-4">
        <p className="text-muted-foreground text-center">No video available</p>
      </div>
    );
  }

  const isMobile = useIsMobile();

  return (
    <div className="w-full h-full flex justify-center items-center p-0">
      <div
        className={`relative ${
          isDesktop
            ? isMobile
              ? "w-full h-full min-h-[130px] max-h-[160px]"
              : "w-full h-full min-h-[160px] sm:min-h-[220px] md:min-h-[300px] max-h-[calc(100vh-18rem)]"
            : isMobile
            ? "w-auto h-full min-h-[230px] max-h-[300px] aspect-[9/19.5]"
            : "w-full max-w-[170px] sm:max-w-[220px] md:max-w-[270px] lg:max-w-[320px] aspect-[9/19.5]"
        }`}
      >
        {/* Loading indicator */}
        {!isVideoLoaded && !videoError && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/10 rounded-xl z-10">
            <div className="w-5 h-5 sm:w-6 sm:h-6 border-2 border-primary/30 border-t-primary rounded-full animate-spin"></div>
          </div>
        )}

        {/* Error message */}
        {videoError && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/10 rounded-xl z-10">
            <div className="text-center p-2">
              <p className="text-destructive text-xs sm:text-sm font-medium mb-1">
                Video failed to load
              </p>
              <p className="text-[9px] sm:text-xs text-muted-foreground">
                Please try refreshing the page
              </p>
            </div>
          </div>
        )}

        {/* Device Frame */}
        <div
          className={`absolute inset-0 bg-black ${
            isDesktop ? "rounded-[10px] p-[1%]" : "rounded-[24px] p-[1.5%]"
          }`}
        >
          {/* Video Content */}
          <div
            className={`w-full h-full overflow-hidden ${
              isDesktop ? "rounded-[7px]" : "rounded-[22px]"
            }`}
          >
            <video
              key={videoKey}
              autoPlay
              loop
              muted
              playsInline
              onLoadedData={handleVideoLoad}
              onError={handleVideoError}
              preload="auto"
              className={`w-full h-full ${
                isDesktop ? "object-contain" : "object-cover"
              }`}
            >
              <source src={videoSource} type="video/mp4" />
              Your browser does not support the video tag.
            </video>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VideoContainer;
