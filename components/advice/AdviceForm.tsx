"use client";

import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useState,
} from "react";
import { MESSAGE_MAX_LENGTH } from "@/lib/message/validation";
import { isApiError } from "@/lib/utils/api";
import { createMessage, getGuestMessage } from "@/services/message.service";
import type { Message } from "@/types";

export interface AdviceFormHandle {
  submit: () => Promise<boolean>;
  isSubmitted: () => boolean;
}

interface AdviceFormProps {
  onSubmitted?: (message: Message) => void;
}

export const AdviceForm = forwardRef<AdviceFormHandle, AdviceFormProps>(
  function AdviceForm({ onSubmitted }, ref) {
    const [text, setText] = useState("");
    const [submitted, setSubmitted] = useState<Message | null>(null);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const loadExisting = useCallback(async () => {
      setLoading(true);
      const result = await getGuestMessage();
      if (isApiError(result)) {
        setError(result.error);
        setLoading(false);
        return;
      }

      if (result.data.message) {
        setSubmitted(result.data.message);
        setText(result.data.message.message);
      }
      setLoading(false);
    }, []);

    useEffect(() => {
      void loadExisting();
    }, [loadExisting]);

    const submit = useCallback(async (): Promise<boolean> => {
      if (submitted) return true;
      if (submitting) return false;

      const trimmed = text.trim();
      if (!trimmed) {
        setError("Please write a message before continuing.");
        return false;
      }

      setSubmitting(true);
      setError(null);

      const result = await createMessage(trimmed);
      if (isApiError(result)) {
        if (result.code === "MESSAGE_EXISTS") {
          await loadExisting();
          setSubmitting(false);
          return true;
        }
        setError(result.error);
        setSubmitting(false);
        return false;
      }

      setSubmitted(result.data.message);
      setText(result.data.message.message);
      onSubmitted?.(result.data.message);
      setSubmitting(false);
      return true;
    }, [submitted, submitting, text, loadExisting, onSubmitted]);

    useImperativeHandle(ref, () => ({
      submit,
      isSubmitted: () => Boolean(submitted),
    }));

    if (loading) {
      return <p className="flow-loading">Loading your message…</p>;
    }

    const isLocked = Boolean(submitted);

    return (
      <div className="flow-stack">
        <textarea
          className="flow-textarea"
          rows={6}
          maxLength={MESSAGE_MAX_LENGTH}
          placeholder="Dear bride & groom…"
          value={text}
          readOnly={isLocked}
          aria-readonly={isLocked}
          disabled={submitting}
          onChange={(e) => {
            if (isLocked) return;
            setText(e.target.value);
            setError(null);
          }}
        />

        <p className="flow-meta">
          {text.length} / {MESSAGE_MAX_LENGTH}
          {isLocked && " · Submitted — editing is disabled"}
        </p>

        {isLocked && submitted && (
          <p className="flow-success">
            ✓ Your message was saved on{" "}
            {new Intl.DateTimeFormat(undefined, {
              dateStyle: "medium",
              timeStyle: "short",
            }).format(new Date(submitted.created_at))}
          </p>
        )}

        {error && <p className="flow-error">{error}</p>}
      </div>
    );
  },
);
