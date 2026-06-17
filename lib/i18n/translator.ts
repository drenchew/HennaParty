import { messages, type MessageTree } from "./messages";
import type { Locale } from "./types";

type Params = Record<string, string | number>;

function resolvePath(tree: MessageTree, path: string): string | undefined {
  const parts = path.split(".");
  let current: string | MessageTree | undefined = tree;

  for (const part of parts) {
    if (typeof current !== "object" || current === null) return undefined;
    current = current[part];
  }

  return typeof current === "string" ? current : undefined;
}

function interpolate(template: string, params?: Params): string {
  if (!params) return template;
  return template.replace(/\{(\w+)\}/g, (_, key: string) =>
    params[key] !== undefined ? String(params[key]) : `{${key}}`,
  );
}

export function translate(locale: Locale, key: string, params?: Params): string {
  const value =
    resolvePath(messages[locale], key) ?? resolvePath(messages.en, key) ?? key;
  return interpolate(value, params);
}

export type TranslateFn = (key: string, params?: Params) => string;

export function createTranslator(locale: Locale): TranslateFn {
  return (key, params) => translate(locale, key, params);
}
