import {
  getOrCreateGuestToken,
  guestAuthHeaders,
} from "@/lib/guest/session";
import type {
  ApiResponse,
  AssignDuaResponse,
  CapsuleStatusResponse,
  EventStats,
  GuestMeResponse,
  PhotoListItem,
  QuestionnaireQuestion,
  SubmitAdviceResponse,
  SubmitVoteResponse,
  UploadCapsuleResponse,
  UploadPhotoResponse,
} from "@/types";

async function apiFetch<T>(
  path: string,
  options: RequestInit = {},
): Promise<ApiResponse<T>> {
  const token = getOrCreateGuestToken();
  const headers = {
    ...guestAuthHeaders(token),
    ...(options.headers ?? {}),
  };

  const response = await fetch(path, { ...options, headers });
  const json = (await response.json()) as ApiResponse<T>;

  if (!response.ok && !("error" in json)) {
    return { error: "Request failed", code: String(response.status) };
  }

  return json;
}

async function apiFetchForm<T>(
  path: string,
  formData: FormData,
): Promise<ApiResponse<T>> {
  const token = getOrCreateGuestToken();

  const response = await fetch(path, {
    method: "POST",
    headers: { "X-Guest-Token": token },
    body: formData,
  });

  return (await response.json()) as ApiResponse<T>;
}

/** POST /api/guest/init — register anonymous guest session. */
export async function initGuest() {
  const token = getOrCreateGuestToken();
  return apiFetch<{ guest: GuestMeResponse["guest"]; created: boolean }>(
    "/api/guest/init",
    {
      method: "POST",
      body: JSON.stringify({ guest_token: token }),
    },
  );
}

/** GET /api/guest/me — current guest + progress. */
export async function getGuestMe() {
  return apiFetch<GuestMeResponse>("/api/guest/me");
}

/** POST /api/guest/preference — hijabi vs standard photo/video section. */
export async function setGuestHijabiPreference(hijabi: boolean) {
  return apiFetch<{ guest: GuestMeResponse["guest"] }>("/api/guest/preference", {
    method: "POST",
    body: JSON.stringify({ hijabi }),
  });
}

/** POST /api/dua/assign — atomic unique dua assignment. */
export async function assignDua() {
  return apiFetch<AssignDuaResponse>("/api/dua/assign", { method: "POST" });
}

/** POST /api/dua/accept — mark dua accepted, advance flow. */
export async function acceptDua() {
  return apiFetch<{ accepted_at: string }>("/api/dua/accept", {
    method: "POST",
  });
}

/** GET /api/capsule/status — upload status (no video URL). */
export async function getCapsuleStatus() {
  return apiFetch<CapsuleStatusResponse>("/api/capsule/status");
}

/** POST /api/capsule/upload — multipart video upload. */
export async function uploadCapsule(formData: FormData) {
  return apiFetchForm<UploadCapsuleResponse>("/api/capsule/upload", formData);
}

/** GET /api/photos — list guest photos. */
export async function listPhotos() {
  return apiFetch<{ photos: PhotoListItem[] }>("/api/photos");
}

/** POST /api/photos — upload compressed photo. */
export async function uploadPhoto(formData: FormData) {
  return apiFetchForm<UploadPhotoResponse>("/api/photos", formData);
}

/** DELETE /api/photos/[id] — remove a photo. */
export async function deletePhoto(photoId: string) {
  return apiFetch<{ deleted: true }>(`/api/photos/${photoId}`, {
    method: "DELETE",
  });
}

/** POST /api/advice — submit advice message. */
export async function submitAdvice(message: string) {
  return apiFetch<SubmitAdviceResponse>("/api/advice", {
    method: "POST",
    body: JSON.stringify({ message }),
  });
}

/** GET /api/questionnaire — static questions list. */
export async function getQuestionnaire() {
  return apiFetch<{ questions: QuestionnaireQuestion[] }>("/api/questionnaire");
}

/** POST /api/questionnaire/vote — record one answer. */
export async function submitVote(questionId: number, answer: string) {
  return apiFetch<SubmitVoteResponse>("/api/questionnaire/vote", {
    method: "POST",
    body: JSON.stringify({ question_id: questionId, answer }),
  });
}

/** GET /api/stats — aggregate event statistics. */
export async function getEventStats() {
  return apiFetch<EventStats>("/api/stats");
}
