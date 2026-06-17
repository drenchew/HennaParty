import type { GuestStep } from "@/lib/constants/steps";

export interface MockDua {
  id: number;
  arabic: string;
  translation: string;
}

export interface MockVideo {
  recorded: boolean;
  fileName?: string;
}

export interface MockVote {
  questionId: number;
  answer: string;
}

export interface FlowStepData {
  dua?: MockDua;
  video?: MockVideo;
  photos: string[];
  advice?: string;
  votes: MockVote[];
}

export interface FlowState {
  version: 1;
  guestToken: string;
  completedSteps: GuestStep[];
  data: FlowStepData;
}

export interface EventStats {
  duas_assigned: number;
  photos_uploaded: number;
  messages_count: number;
  votes_count: number;
  videos_count: number;
}

export const FLOW_STORAGE_VERSION = 1 as const;

export const EMPTY_FLOW_DATA: FlowStepData = {
  photos: [],
  votes: [],
};
