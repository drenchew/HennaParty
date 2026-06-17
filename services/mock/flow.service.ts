import { getOrCreateGuestToken } from "@/lib/guest/session";
import { pickMockDua, MOCK_EVENT_STATS } from "@/lib/flow/mock-data";
import {
  loadFlowState,
  saveFlowState,
  createDefaultFlowState,
} from "@/lib/flow/storage";
import { markStepComplete } from "@/lib/flow/progress";
import type { FlowState, FlowStepData, MockDua, MockVideo } from "@/lib/flow/types";
import { QUESTIONNAIRE_QUESTION_COUNT, type GuestStep } from "@/lib/constants/steps";

/** Mock service layer — swap for Supabase API calls later. */

export function getGuestToken(): string {
  return getOrCreateGuestToken();
}

export function getFlowState(): FlowState {
  const guestToken = getGuestToken();
  return loadFlowState(guestToken);
}

export function persistFlowState(state: FlowState): FlowState {
  saveFlowState(state);
  return state;
}

export function initFlowState(): FlowState {
  const guestToken = getGuestToken();
  const existing = loadFlowState(guestToken);
  if (existing.completedSteps.length > 0 || existing.data.dua) {
    return existing;
  }
  return persistFlowState(createDefaultFlowState(guestToken));
}

export function completeStep(
  step: GuestStep,
  patch?: Partial<FlowStepData>,
): FlowState {
  const current = getFlowState();
  const next: FlowState = markStepComplete(current, step);

  if (patch) {
    next.data = { ...next.data, ...patch };
  }

  return persistFlowState(next);
}

export function assignMockDua(): MockDua {
  const guestToken = getGuestToken();
  const state = getFlowState();
  if (state.data.dua) return state.data.dua;

  const dua = pickMockDua(guestToken);
  persistFlowState({ ...state, data: { ...state.data, dua } });
  return dua;
}

export function acceptMockDua(): FlowState {
  const dua = assignMockDua();
  return completeStep("dua", { dua });
}

export function saveMockVideo(video: MockVideo): FlowState {
  return completeStep("video", { video });
}

export function addMockPhoto(dataUrl: string): FlowState {
  const state = getFlowState();
  const photos = [...state.data.photos, dataUrl].slice(0, 3);
  return persistFlowState({ ...state, data: { ...state.data, photos } });
}

export function finishMockPhotos(): FlowState {
  return completeStep("photos");
}

export function saveMockAdvice(message: string): FlowState {
  return completeStep("advice", { advice: message.trim() });
}

export function saveMockVote(questionId: number, answer: string): FlowState {
  const state = getFlowState();
  const votes = [
    ...state.data.votes.filter((v) => v.questionId !== questionId),
    { questionId, answer },
  ];
  const next = persistFlowState({ ...state, data: { ...state.data, votes } });

  if (votes.length >= QUESTIONNAIRE_QUESTION_COUNT) {
    return completeStep("questionnaire", { votes });
  }

  return next;
}

export function finishQuestionnaire(): FlowState {
  return completeStep("questionnaire");
}

export function getMockEventStats() {
  const state = getFlowState();
  return {
    ...MOCK_EVENT_STATS,
    photos_uploaded: MOCK_EVENT_STATS.photos_uploaded + state.data.photos.length,
    messages_count: state.data.advice
      ? MOCK_EVENT_STATS.messages_count + 1
      : MOCK_EVENT_STATS.messages_count,
  };
}

export function resetMockFlow(): void {
  const guestToken = getGuestToken();
  persistFlowState(createDefaultFlowState(guestToken));
}
