import React from "react";
import StatisticsTiles from "./StatisticsTiles";

interface DashboardLayoutProps {
  children: React.ReactNode;
  ownedHashesLength: number;
  numMessages: number;
  numMajorEvents: number;
  isMobile?: boolean;
}

const DashboardLayout: React.FC<DashboardLayoutProps> = ({
  children,
  ownedHashesLength,
  numMessages,
  numMajorEvents,
  isMobile = false,
}) => {
  return (
    <main className={`flex-1 container mx-auto max-w-7xl flex-grow flex flex-col ${isMobile ? 'py-4 px-2' : 'py-8 px-4 sm:px-6 md:px-8'}`}>
      <div className={`flex flex-col ${isMobile ? 'gap-3' : 'gap-4 md:gap-8'}`}>
        <StatisticsTiles
          ownedHashesLength={ownedHashesLength}
          numMessages={numMessages}
          numMajorEvents={numMajorEvents}
          isMobile={isMobile}
        />
        {/* Main Content */}
        <div className={`flex flex-col ${isMobile ? 'gap-3' : 'gap-4 md:gap-8'}`}>{children}</div>
      </div>
    </main>
  );
};

export default DashboardLayout;
