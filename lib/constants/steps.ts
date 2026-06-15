/** Ordered steps for the Henna Party guest journey. */
export const GUEST_STEPS = [
  "welcome",
  "dua",
  "capsule",
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
  capsule: "/capsule",
  photos: "/photos",
  advice: "/advice",
  questionnaire: "/questionnaire",
  complete: "/thank-you",
};

/** Human-readable labels for the progress stepper (UI will consume these). */
export const STEP_LABELS: Record<GuestStep, string> = {
  welcome: "Welcome",
  dua: "Your Dua",
  capsule: "Time Capsule",
  photos: "Photos",
  advice: "Advice",
  questionnaire: "Questionnaire",
  complete: "Thank You",
};

export const LOCAL_STORAGE_GUEST_TOKEN_KEY = "henna_guest_token";

export const GUEST_TOKEN_HEADER = "X-Guest-Token";

export const MAX_PHOTOS_PER_GUEST = 3;

export const MAX_VIDEO_DURATION_SECONDS = 60;

export const PHOTOS_BUCKET = "photos";

export const VIDEOS_BUCKET = "videos";

/** Static questionnaire — IDs must match vote.question_id in the database. */
export const QUESTIONNAIRE: Array<{
  id: number;
  question_text: string;
  options: string[];
}> = [
  {
    id: 1,
    question_text: "Best marriage advice in one word?",
    options: ["Patience", "Communication", "Trust", "Laughter"],
  },
  {
    id: 2,
    question_text: "Ideal honeymoon destination?",
    options: ["Beach", "Mountains", "City break", "Staycation"],
  },
  {
    id: 3,
    question_text: "Who will win every argument?",
    options: ["The bride", "The groom", "Neither", "Both simultaneously"],
  },
];
