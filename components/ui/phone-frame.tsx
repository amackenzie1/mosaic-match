"use client";

import React from "react";

interface PhoneFrameProps {
  children: React.ReactNode;
}

export const PhoneFrame: React.FC<PhoneFrameProps> = ({ children }) => {
  return (
    <div className="relative w-[320px] h-[660px]">
      {/* Phone frame border */}
      <div className="absolute inset-0 bg-gray-900 rounded-[40px] shadow-xl" />

      {/* Screen bezel */}
      <div className="absolute inset-[2px] bg-black rounded-[39px] overflow-hidden">
        {/* Notch */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[120px] h-[30px] bg-black rounded-b-[20px] z-20">
          <div className="absolute top-[10px] left-1/2 -translate-x-1/2 w-[8px] h-[8px] rounded-full bg-gray-600" />
        </div>

        {/* Screen content */}
        <div className="absolute inset-0 overflow-hidden rounded-[39px]">
          {children}
        </div>
      </div>
    </div>
  );
};
