import React from "react";

interface StatisticsTilesProps {
  numMessages: number;
  numMajorEvents: number;
  ownedHashesLength: number;
  isMobile?: boolean;
}

const getValueColor = (title: string, value: string | number): string => {
  if (title === "Number of Messages Sent") {
    const numValue = Number(value.toString().replace(",", ""));
    if (numValue <= 10000)
      return "from-[hsl(var(--chart-1))] to-[hsl(var(--chart-2))]";
    if (numValue <= 100000)
      return "from-[hsl(var(--chart-2))] to-[hsl(var(--chart-3))]";
    if (numValue <= 500000)
      return "from-[hsl(var(--chart-3))] to-[hsl(var(--chart-1))]";
    if (numValue <= 1000000)
      return "from-[hsl(var(--chart-1))] to-[hsl(var(--chart-3))]";
    return "from-[hsl(var(--destructive))] to-[hsl(var(--destructive-foreground))]";
  }

  if (title === "Major Events") {
    const numValue = Number(value);
    if (numValue <= 50)
      return "from-[hsl(var(--chart-1))] to-[hsl(var(--chart-2))]";
    if (numValue <= 100)
      return "from-[hsl(var(--chart-2))] to-[hsl(var(--chart-3))]";
    if (numValue <= 250)
      return "from-[hsl(var(--chart-3))] to-[hsl(var(--chart-1))]";
    if (numValue <= 500)
      return "from-[hsl(var(--chart-1))] to-[hsl(var(--chart-3))]";
    return "from-[hsl(var(--destructive))] to-[hsl(var(--destructive-foreground))]";
  }

  if (title === "Conversations") {
    const numValue = Number(value);
    if (numValue <= 10)
      return "from-[hsl(var(--chart-1))] to-[hsl(var(--chart-2))]";
    if (numValue <= 25)
      return "from-[hsl(var(--chart-2))] to-[hsl(var(--chart-3))]";
    if (numValue <= 50)
      return "from-[hsl(var(--chart-3))] to-[hsl(var(--chart-1))]";
    if (numValue <= 100)
      return "from-[hsl(var(--chart-1))] to-[hsl(var(--chart-3))]";
    return "from-[hsl(var(--destructive))] to-[hsl(var(--destructive-foreground))]";
  }

  return "from-[hsl(var(--chart-1))] to-[hsl(var(--chart-2))]"; // default gradient
};

const StatisticsTiles: React.FC<StatisticsTilesProps> = ({
  numMessages,
  numMajorEvents,
  ownedHashesLength,
  isMobile = false,
}) => {
  return (
    <div className={`${isMobile ? 'flex overflow-x-auto gap-2 mb-2 pb-1' : 'grid grid-cols-1 md:grid-cols-3 gap-6 mb-8'}`}>
      {[
        {
          title: isMobile ? "Messages" : "Number of Messages Sent",
          value: numMessages,
        },
        {
          title: "Major Events",
          value: numMajorEvents,
        },
        {
          title: "Conversations",
          value: ownedHashesLength,
        },
      ].map((item) => (
        <div
          key={item.title}
          className={`${isMobile ? 'p-2 min-w-[110px] flex-1' : 'p-6'} bg-card rounded-lg shadow-sm border border-border/40 hover:border-border/80 transition-colors flex flex-col items-center justify-center`}
        >
          <h3 className={`${isMobile ? 'text-xs' : 'text-sm'} text-muted-foreground uppercase tracking-wider ${isMobile ? 'mb-1' : 'mb-2'} text-center`}>
            {item.title}
          </h3>
          <p
            className={`${isMobile ? 'text-xl' : 'text-4xl'} font-bold bg-gradient-to-br ${getValueColor(
              item.title,
              item.value
            )} bg-clip-text text-transparent text-center`}
          >
            {item.value}
          </p>
        </div>
      ))}
    </div>
  );
};

export default StatisticsTiles;
