"use client";

import { useState, type ChangeEvent, type FormEvent } from "react";
import type { z } from "zod";

/**
 * Gestione minimale dei moduli con validazione Zod.
 *
 * - I valori restano stringhe/booleani come nei campi HTML.
 * - Gli errori compaiono all'invio e spariscono mentre l'utente corregge.
 * - Dopo un invio non valido il focus va sul primo campo con errore.
 */
export function useZodForm<S extends z.ZodType>(schema: S, initialValues: z.input<S>) {
  type Values = z.input<S>;
  type Key = keyof Values & string;

  const [values, setValues] = useState<Values>(initialValues);
  const [errors, setErrors] = useState<Partial<Record<Key, string>>>({});

  function setValue<K extends Key>(key: K, value: Values[K]) {
    setValues((prev) => ({ ...(prev as object), [key]: value }) as Values);
    setErrors((prev) => {
      if (!prev[key]) return prev;
      const next = { ...prev };
      delete next[key];
      return next;
    });
  }

  /** Collega un campo di testo/select: value + onChange. */
  function text<K extends Key>(key: K) {
    return {
      value: String(values[key] ?? ""),
      onChange: (event: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
        setValue(key, event.target.value as Values[K]),
    };
  }

  function focusFirstError(formElement: HTMLFormElement) {
    requestAnimationFrame(() => {
      formElement.querySelector<HTMLElement>('[aria-invalid="true"]')?.focus();
    });
  }

  function handleSubmit(onValid: (data: z.output<S>) => void) {
    return (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      const formElement = event.currentTarget;
      const result = schema.safeParse(values);
      if (!result.success) {
        const next: Partial<Record<Key, string>> = {};
        for (const issue of result.error.issues) {
          const key = issue.path[0];
          if (typeof key === "string" && !(key in next)) next[key as Key] = issue.message;
        }
        setErrors(next);
        focusFirstError(formElement);
        return;
      }
      setErrors({});
      onValid(result.data);
    };
  }

  return { values, errors, setValue, setErrors, text, handleSubmit };
}
