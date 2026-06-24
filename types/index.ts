/**
 * Shared TypeScript types aligned with the Supabase schema.
 * Regenerate from Supabase CLI when schema stabilizes:
 *   npx supabase gen types typescript --local > types/database.ts
 */

import type { GuestStep } from "@/lib/constants/steps";

export type { GuestStep };

export interface Guest {
  id: string;
  guest_token: string;
  created_at: string;
  /** null until guest chooses on welcome; routes photo/video to hijabi or standard buckets */
  hijabi: boolean | null;
}

export interface Dua {
  id: number;
  arabic: string;
  translation: string;
  used: boolean;
  assigned_guest_id: string | null;
  assigned_at: string | null;
  accepted_at?: string | null;
}

export interface Photo {
  id: string;
  guest_id: string;
  url: string;
  created_at: string;
  is_hijabi: boolean;
}

export interface Message {
  id: string;
  guest_id: string;
  message: string;
  created_at: string;
}

export interface Video {
  id: string;
  guest_id: string;
  video_url: string;
  unlock_date: string;
  created_at: string;
  is_hijabi: boolean;
}

export interface Vote {
  id: string;
  guest_id: string;
  question_id: number;
  answer: string;
}

export interface QuestionnaireQuestion {
  id: number;
  question_text: string;
  question_text_ar?: string;
}

export interface EventStats {
  duas_assigned: number;
  photos_uploaded: number;
  messages_count: number;
  votes_count: number;
  videos_count: number;
}

export interface GuestSession {
  guestToken: string;
  guestId: string | null;
}

export interface ApiSuccess<T> {
  data: T;
}

export interface ApiError {
  error: string;
  code?: string;
}

export type ApiResponse<T> = ApiSuccess<T> | ApiError;

export interface GuestMeResponse {
  guest: Guest;
  progress: GuestProgress;
}

export interface GuestProgress {
  hasDua: boolean;
  duaAccepted: boolean;
  hasVideo: boolean;
  photoCount: number;
  hasMessage: boolean;
  votesCount: number;
  questionnaireComplete: boolean;
  suggestedStep: GuestStep;
}

export interface CapsuleStatusResponse {
  uploaded: boolean;
  unlock_date: string | null;
  locked: boolean;
}

export interface PhotoListItem extends Photo {
  signed_url?: string;
}

export interface VotePayload {
  question_id: number;
  answer: string;
}

export interface AssignDuaResponse {
  dua: Dua;
}

export interface UploadCapsuleResponse {
  video: Video;
}

export interface UploadPhotoResponse {
  photo: Photo;
}

export interface SubmitAdviceResponse {
  message: Message;
}

export interface SubmitVoteResponse {
  vote: Vote;
}
