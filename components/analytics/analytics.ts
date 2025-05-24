// GA4 Event tracking utility
import { safeGtag } from "@/components/analytics/GoogleAnalytics";

interface AnalyticsEvent {
  action: string;
  category: string;
  label?: string;
  value?: number;
  [key: string]: any; // For custom parameters
}

// Initialize gtag function
declare global {
  interface Window {
    gtag: (
      command: "event" | "config" | "set",
      actionOrConfig: string | object,
      params?: any
    ) => void;
  }
}

// Track user signup
export const trackSignUp = (method: "email" | "google") => {
  safeGtag("event", "sign_up", {
    method: method,
    timestamp: new Date().toISOString(),
  });
};

// Track chat upload with enhanced metrics
export const trackChatUpload = (
  platform: string,
  messageCount: number,
  fileSize: number,
  uploadDuration: number,
  status: "started" | "success" | "failed",
  errorType?: string
) => {
  safeGtag("event", "chat_upload", {
    platform: platform,
    message_count: messageCount,
    file_size_bytes: fileSize,
    upload_duration_ms: uploadDuration,
    status: status,
    error_type: errorType,
    timestamp: new Date().toISOString(),
  });
};

// Track chat processing
export const trackChatProcessing = (
  platform: string,
  processingType: "parse" | "anonymize" | "analyze",
  duration: number,
  status: "success" | "failed",
  errorType?: string
) => {
  safeGtag("event", "chat_processing", {
    platform: platform,
    processing_type: processingType,
    duration_ms: duration,
    status: status,
    error_type: errorType,
    timestamp: new Date().toISOString(),
  });
};

// Track message statistics
export const trackMessageStats = (
  platform: string,
  totalMessages: number,
  averageMessageLength: number,
  timespan: {
    start: string;
    end: string;
  },
  participantCount: number
) => {
  safeGtag("event", "message_stats", {
    platform: platform,
    total_messages: totalMessages,
    avg_message_length: averageMessageLength,
    timespan_start: timespan.start,
    timespan_end: timespan.end,
    participant_count: participantCount,
    timestamp: new Date().toISOString(),
  });
};

// Track analysis share
export const trackAnalysisShare = (analysisType: string) => {
  safeGtag("event", "share_analysis", {
    analysis_type: analysisType,
    timestamp: new Date().toISOString(),
  });
};

// Track user engagement
export const trackEngagement = (action: string, value?: number) => {
  safeGtag("event", "user_engagement", {
    engagement_action: action,
    engagement_value: value,
    timestamp: new Date().toISOString(),
  });
};

// Track feature usage
export const trackFeatureUsage = (feature: string) => {
  safeGtag("event", "feature_use", {
    feature_name: feature,
    timestamp: new Date().toISOString(),
  });
};

// Track error events
export const trackError = (errorType: string, errorMessage: string) => {
  safeGtag("event", "error", {
    error_type: errorType,
    error_message: errorMessage,
    timestamp: new Date().toISOString(),
  });
};

// Track user session
export const trackSession = (userId: string) => {
  safeGtag("set", {
    user_id: userId,
    user_properties: {
      user_type: "registered",
      last_login: new Date().toISOString(),
    },
  });
};

// Track platform specific events
export const trackPlatformEvent = (
  platform: string,
  eventType: string,
  details: any
) => {
  safeGtag("event", "platform_event", {
    platform: platform,
    event_type: eventType,
    ...details,
    timestamp: new Date().toISOString(),
  });
};

// Track user return visits
export const trackReturnVisit = (daysSinceLastVisit: number) => {
  safeGtag("event", "return_visit", {
    days_since_last: daysSinceLastVisit,
    timestamp: new Date().toISOString(),
  });
};

// Track analysis generation
export const trackAnalysisGeneration = (
  analysisType: string,
  duration: number
) => {
  safeGtag("event", "analysis_generation", {
    analysis_type: analysisType,
    generation_duration: duration,
    timestamp: new Date().toISOString(),
  });
};

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
