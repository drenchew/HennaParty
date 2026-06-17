import { getOrCreateGuestToken, guestAuthHeaders } from "@/lib/guest/session";
import type { ApiResponse } from "@/types";

export interface VoteQuestion {
  id: number;
  question_text: string;
  options: Array<{
    id: number;
    question_id: number;
    option_text: string;
  }>;
}

export interface VoteRecord {
  id: string;
  guest_id: string;
  question_id: number;
  answer: string;
}

export interface QuestionResult {
  question_id: number;
  question_text: string;
  total_votes: number;
  options: Array<{
    answer: string;
    count: number;
    percentage: number;
  }>;
}

export interface VoteStateResponse {
  questions: VoteQuestion[];
  votes: Record<number, string>;
  results?: QuestionResult[];
}

async function voteFetch<T>(
  path: string,
  options: RequestInit = {},
): Promise<ApiResponse<T>> {
  const token = getOrCreateGuestToken();
  const response = await fetch(path, {
    ...options,
    headers: {
      ...guestAuthHeaders(token),
      ...(options.headers ?? {}),
    },
  });
  return (await response.json()) as ApiResponse<T>;
}

/** GET /api/vote */
export async function getVoteState(includeResults = false) {
  const query = includeResults ? "?results=true" : "";
  return voteFetch<VoteStateResponse>(`/api/vote${query}`);
}

/** POST /api/vote */
export async function submitVote(questionId: number, answer: string) {
  return voteFetch<{ vote: VoteRecord }>("/api/vote", {
    method: "POST",
    body: JSON.stringify({ question_id: questionId, answer }),
  });
}

/** GET /api/vote?results=true — live results only refresh */
export async function getLiveResults() {
  return getVoteState(true);
}
