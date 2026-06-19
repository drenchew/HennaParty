-- Editable questionnaire questions (admin-managed)
-- =============================================================================

CREATE TABLE public.questionnaire_questions (
  id           SERIAL      PRIMARY KEY,
  sort_order   INTEGER     NOT NULL DEFAULT 0,
  question_en  TEXT        NOT NULL,
  question_ar  TEXT        NOT NULL,
  options      JSONB       NOT NULL DEFAULT '[]'::jsonb,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT now(),

  CONSTRAINT questionnaire_questions_en_not_empty
    CHECK (char_length(trim(question_en)) > 0),
  CONSTRAINT questionnaire_questions_ar_not_empty
    CHECK (char_length(trim(question_ar)) > 0),
  CONSTRAINT questionnaire_questions_options_array
    CHECK (jsonb_typeof(options) = 'array')
);

COMMENT ON TABLE public.questionnaire_questions IS
  'Guest questionnaire — editable from admin panel.';
COMMENT ON COLUMN public.questionnaire_questions.options IS
  'Array of { "answer": string, "en": string, "ar": string } — answer is stored in votes.answer';

CREATE INDEX idx_questionnaire_questions_sort
  ON public.questionnaire_questions (sort_order, id);

INSERT INTO public.questionnaire_questions (id, sort_order, question_en, question_ar, options)
VALUES
  (
    1,
    1,
    'What should we do in our first year?',
    'ماذا يجب أن نفعل في سنتنا الأولى؟',
    '[
      {"answer":"Travel the world","en":"Travel the world","ar":"نسافر حول العالم"},
      {"answer":"Focus on faith & family","en":"Focus on faith & family","ar":"نركز على الإيمان والعائلة"},
      {"answer":"Build our home together","en":"Build our home together","ar":"نبني بيتنا معاً"},
      {"answer":"Celebrate every moment","en":"Celebrate every moment","ar":"نحتفل بكل لحظة"}
    ]'::jsonb
  ),
  (
    2,
    2,
    'What is most important in marriage?',
    'ما الأهم في الزواج؟',
    '[
      {"answer":"Trust","en":"Trust","ar":"الثقة"},
      {"answer":"Communication","en":"Communication","ar":"التواصل"},
      {"answer":"Patience","en":"Patience","ar":"الصبر"},
      {"answer":"Laughter","en":"Laughter","ar":"الضحك"}
    ]'::jsonb
  ),
  (
    3,
    3,
    'Where should we travel first?',
    'أين يجب أن نسافر أولاً؟',
    '[
      {"answer":"Makkah / Umrah","en":"Makkah / Umrah","ar":"مكة / العمرة"},
      {"answer":"Tropical beach","en":"Tropical beach","ar":"شاطئ استوائي"},
      {"answer":"European cities","en":"European cities","ar":"مدن أوروبية"},
      {"answer":"Somewhere new together","en":"Somewhere new together","ar":"مكاناً جديداً معاً"}
    ]'::jsonb
  )
ON CONFLICT (id) DO NOTHING;

SELECT setval(
  pg_get_serial_sequence('public.questionnaire_questions', 'id'),
  GREATEST((SELECT MAX(id) FROM public.questionnaire_questions), 1)
);

ALTER TABLE public.questionnaire_questions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "questionnaire_questions_deny_anon"
  ON public.questionnaire_questions FOR ALL TO anon
  USING (false) WITH CHECK (false);

CREATE POLICY "questionnaire_questions_deny_authenticated"
  ON public.questionnaire_questions FOR ALL TO authenticated
  USING (false) WITH CHECK (false);

CREATE POLICY "questionnaire_questions_service_role_all"
  ON public.questionnaire_questions FOR ALL TO service_role
  USING (true) WITH CHECK (true);
