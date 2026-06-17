-- Track explicit guest acceptance separately from assignment time
ALTER TABLE public.duas
  ADD COLUMN IF NOT EXISTS accepted_at TIMESTAMPTZ;

COMMENT ON COLUMN public.duas.accepted_at IS 'Set when guest clicks "I accept this dua".';

-- Idempotent accept — safe under double-clicks and retries
CREATE OR REPLACE FUNCTION public.accept_dua(p_guest_token UUID)
RETURNS public.duas
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_guest_id UUID;
  v_dua      public.duas;
BEGIN
  SELECT id INTO v_guest_id
  FROM public.guests
  WHERE guest_token = p_guest_token;

  IF v_guest_id IS NULL THEN
    RAISE EXCEPTION 'GUEST_NOT_FOUND'
      USING ERRCODE = 'no_data_found';
  END IF;

  SELECT d.* INTO v_dua
  FROM public.duas d
  WHERE d.assigned_guest_id = v_guest_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'DUA_NOT_ASSIGNED'
      USING ERRCODE = 'no_data_found';
  END IF;

  IF v_dua.accepted_at IS NOT NULL THEN
    RETURN v_dua;
  END IF;

  UPDATE public.duas d
  SET accepted_at = now()
  WHERE d.id = v_dua.id
    AND d.accepted_at IS NULL
  RETURNING d.* INTO v_dua;

  RETURN v_dua;
END;
$$;

REVOKE ALL ON FUNCTION public.accept_dua(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.accept_dua(UUID) TO service_role;
