/** Ordered steps for the Henna Party guest journey. */
export const GUEST_STEPS = [
  "welcome",
  "dua",
  "video",
  "photos",
  "advice",
  "questionnaire",
  "complete",
] as const;

export type GuestStep = (typeof GUEST_STEPS)[number];

/** Route path for each step (complete → thank-you page). */
export const STEP_ROUTES: Record<GuestStep, string> = {
  welcome: "/",
  dua: "/dua",
  video: "/video",
  photos: "/photos",
  advice: "/advice",
  questionnaire: "/questionnaire",
  complete: "/thank-you",
};

/** Human-readable labels for the progress stepper. */
export const STEP_LABELS: Record<GuestStep, string> = {
  welcome: "Welcome",
  dua: "Your Dua",
  video: "Time Capsule",
  photos: "Photos",
  advice: "Advice",
  questionnaire: "Questionnaire",
  complete: "Thank You",
};

/** Steps shown in the progress indicator (excludes welcome). */
export const FLOW_STEPS = GUEST_STEPS.filter((s) => s !== "welcome");

export const LOCAL_STORAGE_GUEST_TOKEN_KEY = "henna_guest_token";

export const GUEST_TOKEN_HEADER = "X-Guest-Token";

export const MAX_PHOTOS_PER_GUEST = 3;

export const MAX_VIDEO_DURATION_SECONDS = 60;

export const PHOTOS_BUCKET = "photos";

export const VIDEOS_BUCKET = "videos";

export {
  QUESTIONNAIRE,
  QUESTIONNAIRE_QUESTION_COUNT,
} from "@/lib/questionnaire/constants";
