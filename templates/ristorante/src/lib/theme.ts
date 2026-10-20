"use client";

import { useSyncExternalStore } from "react";

/**
 * Gestione del tema chiaro/scuro senza dipendenze.
 * Lo script in theme-script.ts viene eseguito nel <head> prima del primo paint
 * (niente lampeggio); questo hook permette di leggere e cambiare la preferenza.
 */
export type ThemePreference = "light" | "dark" | "system";

import { THEME_STORAGE_KEY } from "./theme-script";

const THEME_EVENT = "tavola:theme-change";

function resolve(preference: ThemePreference): "light" | "dark" {
  if (preference !== "system") return preference;
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

function apply(preference: ThemePreference) {
  const root = document.documentElement;
  root.setAttribute("data-theme", resolve(preference));
  root.setAttribute("data-theme-pref", preference);
}

function subscribe(onChange: () => void) {
  const mql = window.matchMedia("(prefers-color-scheme: dark)");
  const onSystemChange = () => {
    if (readPreference() === "system") apply("system");
    onChange();
  };
  mql.addEventListener("change", onSystemChange);
  window.addEventListener(THEME_EVENT, onChange);
  return () => {
    mql.removeEventListener("change", onSystemChange);
    window.removeEventListener(THEME_EVENT, onChange);
  };
}

function readPreference(): ThemePreference {
  const value = document.documentElement.getAttribute("data-theme-pref");
  return value === "light" || value === "dark" ? value : "system";
}

export function setThemePreference(preference: ThemePreference) {
  try {
    localStorage.setItem(THEME_STORAGE_KEY, preference);
  } catch {
    // archivio non disponibile: il tema vale solo per questa sessione
  }
  apply(preference);
  window.dispatchEvent(new Event(THEME_EVENT));
}

export function useTheme() {
  const preference = useSyncExternalStore(subscribe, readPreference, () => "system" as const);
  const resolved = useSyncExternalStore(
    subscribe,
    () => (document.documentElement.getAttribute("data-theme") === "dark" ? "dark" : "light"),
    () => "light" as const,
  );
  return { preference, resolved, setPreference: setThemePreference };
}
