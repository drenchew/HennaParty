import {
  formatQuestionsForClient,
  getQuestionnaireQuestionCount,
  listQuestionnaireQuestions,
} from "@/lib/questionnaire/server";
import { findGuestByToken, upsertGuest } from "@/lib/guest/server";
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
  question_text_ar: string;
  total_votes: number;
  answers: Array<{
    answer: string;
    count: number;
    percentage: number;
  }>;
}

export async function getClientQuestions() {
  const questions = await listQuestionnaireQuestions();
  return formatQuestionsForClient(questions);
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
  const validation = await validateVotePayload(questionId, answer);
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
  const [questions, votesResult] = await Promise.all([
    listQuestionnaireQuestions(),
    supabase.from("votes").select("question_id, answer"),
  ]);

  if (votesResult.error) throw votesResult.error;
  const votes = votesResult.data ?? [];

  return questions.map((question) => {
    const rows = votes.filter((vote) => vote.question_id === question.id);
    const total = rows.length;

    const counts = new Map<string, number>();
    for (const row of rows) {
      const text = row.answer.trim();
      if (!text) continue;
      counts.set(text, (counts.get(text) ?? 0) + 1);
    }

    const answers = [...counts.entries()]
      .map(([answer, count]) => ({
        answer,
        count,
        percentage: total > 0 ? Math.round((count / total) * 100) : 0,
      }))
      .sort((a, b) => b.count - a.count || a.answer.localeCompare(b.answer));

    return {
      question_id: question.id,
      question_text: question.question_en,
      question_text_ar: question.question_ar,
      total_votes: total,
      answers,
    };
  });
}

export async function isQuestionnaireComplete(
  votes: Record<number, string>,
): Promise<boolean> {
  const questions = await listQuestionnaireQuestions();
  return questions.every((question) => Boolean(votes[question.id]?.trim()));
}

export async function getQuestionnaireQuestionCountForGuest(): Promise<number> {
  return getQuestionnaireQuestionCount();
}
