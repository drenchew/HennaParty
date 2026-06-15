/** HTTP-layer request/response shapes used by services and route handlers. */

export type { ApiError, ApiResponse, ApiSuccess } from "./index";

export interface InitGuestRequest {
  guest_token: string;
}

export interface InitGuestResponse {
  guest: import("./index").Guest;
  created: boolean;
}

export interface AssignDuaResponse {
  dua: import("./index").Dua;
}

export interface AcceptDuaResponse {
  accepted_at: string;
}

export interface UploadCapsuleResponse {
  video: import("./index").Video;
}

export interface UploadPhotoResponse {
  photo: import("./index").Photo;
}

export interface SubmitAdviceRequest {
  message: string;
}

export interface SubmitAdviceResponse {
  message: import("./index").Message;
}

export interface SubmitVoteRequest {
  question_id: number;
  answer: string;
}

export interface SubmitVoteResponse {
  vote: import("./index").Vote;
}
