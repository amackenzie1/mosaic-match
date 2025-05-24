import Script from "next/script";

// Define gtag parameter types
type GtagEventParams = {
  page_title?: string;
  page_location?: string;
  page_path?: string;
  journey_step?: string;
  step_number?: number;
  [key: string]: any;
};

type GtagConfigParams = {
  page_path?: string;
  debug_mode?: boolean;
  [key: string]: any;
};

// Define the gtag function type
type GtagFunction = {
  (command: "event", action: string, params: GtagEventParams): void;
  (command: "config", targetId: string, params?: GtagConfigParams): void;
  (command: "set", params: { [key: string]: any }): void;
};

// Utility function to safely call gtag
export const safeGtag: GtagFunction = (
  command: "event" | "config" | "set",
  action: any,
  params?: any
) => {
  if (
    process.env.NODE_ENV === "production" &&
    typeof window !== "undefined" &&
    window.gtag
  ) {
    window.gtag(command, action, params);
  } else {
    // In development, just log to console that we would have tracked something
    console.debug("[Dev] Analytics event:", { command, action, params });
  }
};

// Add journey step tracking
export const trackJourneyStep = (
  stepName: string,
  stepNumber: number,
  additionalParams: Record<string, any> = {}
) => {
  safeGtag("event", "journey_step", {
    journey_step: stepName,
    step_number: stepNumber,
    ...additionalParams,
  });
};

export default function GoogleAnalytics({
  measurementId,
}: {
  measurementId: string;
}) {
  // Only render GA in production
  if (process.env.NODE_ENV !== "production") {
    return null;
  }

  if (!measurementId) {
    console.warn("Google Analytics measurement ID is missing");
    return null;
  }

  return (
    <>
      <Script
        strategy="afterInteractive"
        src={`https://www.googletagmanager.com/gtag/js?id=${measurementId}`}
      />
      <Script
        id="google-analytics"
        strategy="afterInteractive"
        dangerouslySetInnerHTML={{
          __html: `
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', '${measurementId}', {
              page_path: window.location.pathname
            });
          `,
        }}
      />
    </>
  );
}
