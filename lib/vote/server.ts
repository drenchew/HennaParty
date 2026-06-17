import { findGuestByToken, upsertGuest } from "@/lib/guest/server";
import {
  QUESTIONNAIRE,
  QUESTIONNAIRE_QUESTION_COUNT,
} from "@/lib/questionnaire/constants";
import { validateVotePayload } from "@/lib/vote/validation";
import { createAdminClient } from "@/lib/supabase/admin";

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

export function formatQuestionsForClient() {
  return QUESTIONNAIRE.map((q) => ({
    id: q.id,
    question_text: q.question_text,
    options: q.options.map((option_text, index) => ({
      id: index + 1,
      question_id: q.id,
      option_text,
    })),
  }));
}

export async function getGuestVotes(
  guestToken: string,
): Promise<Record<number, string>> {
  const guest = await findGuestByToken(guestToken);
  if (!guest) throw new Error("GUEST_NOT_FOUND");

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("votes")
    .select("question_id, answer")
    .eq("guest_id", guest.id);

  if (error) throw error;

  const map: Record<number, string> = {};
  for (const row of data ?? []) {
    map[row.question_id] = row.answer;
  }
  return map;
}

export async function submitVoteForGuest(
  guestToken: string,
  questionId: unknown,
  answer: unknown,
): Promise<VoteRecord> {
  const validation = validateVotePayload(questionId, answer);
  if (!validation.ok) {
    throw new Error(`${validation.code}:${validation.error}`);
  }

  await upsertGuest(guestToken);
  const guest = await findGuestByToken(guestToken);
  if (!guest) throw new Error("GUEST_NOT_FOUND");

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("votes")
    .upsert(
      {
        guest_id: guest.id,
        question_id: validation.question_id,
        answer: validation.answer,
      },
      { onConflict: "guest_id,question_id" },
    )
    .select("id, guest_id, question_id, answer")
    .single();

  if (error) throw error;
  return data as VoteRecord;
}

export async function getLiveResults(): Promise<QuestionResult[]> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("votes")
    .select("question_id, answer");

  if (error) throw error;

  return QUESTIONNAIRE.map((question) => {
    const rows = (data ?? []).filter((v) => v.question_id === question.id);
    const total = rows.length;

    const options = question.options.map((option) => {
      const count = rows.filter((r) => r.answer === option).length;
      return {
        answer: option,
        count,
        percentage: total > 0 ? Math.round((count / total) * 100) : 0,
      };
    });

    return {
      question_id: question.id,
      question_text: question.question_text,
      total_votes: total,
      options,
    };
  });
}

export function isQuestionnaireComplete(votes: Record<number, string>): boolean {
  return QUESTIONNAIRE.every((q) => Boolean(votes[q.id]));
}

export { QUESTIONNAIRE_QUESTION_COUNT };
