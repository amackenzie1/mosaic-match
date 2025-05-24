import { safeGtag } from "@/components/analytics/GoogleAnalytics";
import { trackError } from "./analytics";

// Page Views
export const trackPageView = (pageName: string) => {
  safeGtag("event", "page_view", {
    page_title: pageName,
    page_location: window.location.href,
    page_path: window.location.pathname,
  });
};

// Section Views (for long-form pages)
export const trackSectionView = (sectionName: string, pageName: string) => {
  safeGtag("event", "section_view", {
    section_name: sectionName,
    page_name: pageName,
  });
};

// CTA Interactions
export const trackCTAClick = (
  ctaName: string,
  ctaLocation: string,
  ctaType: "primary" | "secondary" | "tertiary" = "primary"
) => {
  safeGtag("event", "cta_click", {
    cta_name: ctaName,
    cta_location: ctaLocation,
    cta_type: ctaType,
  });
};

// Feature Interactions
export const trackFeatureInteraction = (
  featureName: string,
  interactionType: "view" | "click" | "hover"
) => {
  safeGtag("event", "feature_interaction", {
    feature_name: featureName,
    interaction_type: interactionType,
  });
};

// Navigation
export const trackNavigation = (
  linkName: string,
  linkDestination: string,
  linkType: "header" | "footer" | "inline" | "mobile"
) => {
  safeGtag("event", "navigation_click", {
    link_name: linkName,
    link_destination: linkDestination,
    link_type: linkType,
  });
};

// Scroll Depth
export const trackScrollDepth = (depth: number, pageName: string) => {
  safeGtag("event", "scroll_depth", {
    depth_percentage: depth,
    page_name: pageName,
  });
};

// Demo Request
export const trackDemoRequest = (businessType: string, userType: string) => {
  safeGtag("event", "demo_request", {
    business_type: businessType,
    user_type: userType,
  });
};

// Contact Form
export const trackContactForm = (
  formType: "contact" | "support" | "enterprise",
  status: "started" | "completed" | "failed"
) => {
  safeGtag("event", "contact_form", {
    form_type: formType,
    form_status: status,
  });
};

// Platform Interest
export const trackPlatformInterest = (platformName: string) => {
  safeGtag("event", "platform_interest", {
    platform_name: platformName,
  });
};

// Blog/Research
export const trackResearchEngagement = (
  articleId: string,
  articleTitle: string,
  interactionType: "view" | "share" | "download"
) => {
  safeGtag("event", "research_engagement", {
    article_id: articleId,
    article_title: articleTitle,
    interaction_type: interactionType,
  });
};

// Privacy Section
export const trackPrivacyEngagement = (
  sectionName: string,
  interactionType: "view" | "expand" | "link_click"
) => {
  safeGtag("event", "privacy_engagement", {
    section_name: sectionName,
    interaction_type: interactionType,
  });
};

// Error Tracking
export const trackPublicError = (
  errorType: string,
  errorMessage: string,
  errorLocation: string
) => {
  trackError(
    "public_website",
    `${errorType}: ${errorMessage} at ${errorLocation}`
  );
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
