import { NextRequest } from "next/server";
import { requireGuestToken } from "@/lib/api/request";
import {
  jsonError,
  jsonOk,
  serverError,
  unauthorized,
} from "@/lib/api/response";
import {
  formatQuestionsForClient,
  getGuestVotes,
  getLiveResults,
  submitVoteForGuest,
} from "@/lib/vote/server";

/**
 * GET /api/vote
 * Returns questions + guest's current votes.
 * ?results=true — include live aggregated results (optional display).
 */
export async function GET(request: NextRequest) {
  try {
    const guestToken = requireGuestToken(request);
    if (!guestToken) return unauthorized();

    const includeResults = request.nextUrl.searchParams.get("results") === "true";
    const [questions, votes] = await Promise.all([
      Promise.resolve(formatQuestionsForClient()),
      getGuestVotes(guestToken),
    ]);

    const payload: {
      questions: ReturnType<typeof formatQuestionsForClient>;
      votes: Record<number, string>;
      results?: Awaited<ReturnType<typeof getLiveResults>>;
    } = { questions, votes };

    if (includeResults) {
      payload.results = await getLiveResults();
    }

    return jsonOk(payload);
  } catch (error) {
    if (error instanceof Error && error.message === "GUEST_NOT_FOUND") {
      return unauthorized();
    }
    console.error("[GET /api/vote]", error);
    return serverError();
  }
}

/**
 * POST /api/vote
 * Body: { question_id: number, answer: string }
 * One vote row per guest per question (upsert on same question).
 */
export async function POST(request: NextRequest) {
  try {
    const guestToken = requireGuestToken(request);
    if (!guestToken) return unauthorized();

    const body = (await request.json()) as {
      question_id?: number;
      answer?: string;
    };

    const vote = await submitVoteForGuest(
      guestToken,
      body.question_id,
      body.answer,
    );

    return jsonOk({ vote });
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === "GUEST_NOT_FOUND") return unauthorized();

      const [code, message] = error.message.split(":");
      if (code === "INVALID_PAYLOAD" || code === "INVALID_VOTE") {
        return jsonError(message, 400, code);
      }
    }

    console.error("[POST /api/vote]", error);
    return serverError();
  }
}
