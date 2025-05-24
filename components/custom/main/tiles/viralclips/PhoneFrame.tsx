import React from "react";

// iPhone 14 Pro dimensions with correct aspect ratio (scaled up for better visibility)
export const IPHONE_14_DIMENSIONS = {
  // Using the 147.5:71.5 ratio but scaled to a reasonable screen size
  width: 320, // base width
  height: 660, // maintains 147.5:71.5 ratio (approximately)
  borderRadius: 40,
};

interface PhoneFrameProps {
  children: React.ReactNode;
  scale?: number;
}

export const PhoneFrame: React.FC<PhoneFrameProps> = ({
  children,
  scale = 1,
}) => {
  const scaledWidth = IPHONE_14_DIMENSIONS.width * scale;
  const scaledHeight = IPHONE_14_DIMENSIONS.height * scale;
  const scaledBorderRadius = IPHONE_14_DIMENSIONS.borderRadius * scale;

  return (
    <div className="relative" style={{ width: `${scaledWidth}px` }}>
      {/* iPhone Frame */}
      <div
        className="relative mx-auto bg-black"
        style={{
          width: `${scaledWidth}px`,
          height: `${scaledHeight}px`,
          borderRadius: `${scaledBorderRadius}px`,
          padding: `${8 * scale}px`, // Scale the padding too
        }}
      >
        {/* Notch */}
        <div
          className="absolute top-0 left-1/2 -translate-x-1/2 bg-black rounded-b-[18px] z-20"
          style={{
            width: `${120 * scale}px`,
            height: `${25 * scale}px`,
          }}
        />

        {/* Screen Content */}
        <div
          className="relative h-full w-full overflow-hidden"
          style={{
            borderRadius: `${32 * scale}px`,
          }}
        >
          {children}
        </div>
      </div>
    </div>
  );
};
