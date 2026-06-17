import type { FlowState } from "./types";
import { EMPTY_FLOW_DATA, FLOW_STORAGE_VERSION } from "./types";

const FLOW_STORAGE_PREFIX = "henna_flow_";

function storageKey(guestToken: string): string {
  return `${FLOW_STORAGE_PREFIX}${guestToken}`;
}

export function loadFlowState(guestToken: string): FlowState {
  if (typeof window === "undefined") {
    return createDefaultFlowState(guestToken);
  }

  const raw = localStorage.getItem(storageKey(guestToken));
  if (!raw) return createDefaultFlowState(guestToken);

  try {
    const parsed = JSON.parse(raw) as FlowState;
    if (parsed.version !== FLOW_STORAGE_VERSION || parsed.guestToken !== guestToken) {
      return createDefaultFlowState(guestToken);
    }
    return {
      ...parsed,
      data: {
        ...EMPTY_FLOW_DATA,
        ...parsed.data,
        photos: parsed.data.photos ?? [],
        votes: parsed.data.votes ?? [],
      },
    };
  } catch {
    return createDefaultFlowState(guestToken);
  }
}

export function saveFlowState(state: FlowState): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(storageKey(state.guestToken), JSON.stringify(state));
}

export function createDefaultFlowState(guestToken: string): FlowState {
  return {
    version: FLOW_STORAGE_VERSION,
    guestToken,
    completedSteps: [],
    data: { ...EMPTY_FLOW_DATA, photos: [], votes: [] },
  };
}

export function clearFlowState(guestToken: string): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(storageKey(guestToken));
}
