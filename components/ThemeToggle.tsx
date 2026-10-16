"use client";

import { useEffect, useState } from "react";

export const THEME_STORAGE_KEY = "theme";

/** Inline script string, meant to run in <head> before hydration (see
 * layout.tsx) so the correct theme attribute is set before first paint.
 * Light is the default; this only switches to dark for visitors who chose
 * it, so they don't flash light and then snap dark. */
export const themeInitScript = `
  try {
    var t = localStorage.getItem("${THEME_STORAGE_KEY}");
    if (t === "dark") document.documentElement.setAttribute("data-theme", "dark");
  } catch (e) {}
`;

/** Manual light/dark toggle — light by default, never follows the
 * OS/browser theme, only ever this button (persisted to localStorage). Toggles the
 * [data-theme="dark"] attribute globals.css keys its dark token values
 * off of. */
export default function ThemeToggle() {
  const [theme, setTheme] = useState<"light" | "dark">("light");

  useEffect(() => {
    const current = document.documentElement.getAttribute("data-theme") === "dark" ? "dark" : "light";
    setTheme(current);
  }, []);

  function toggle() {
    const next = theme === "light" ? "dark" : "light";
    setTheme(next);
    if (next === "dark") {
      document.documentElement.setAttribute("data-theme", "dark");
    } else {
      document.documentElement.removeAttribute("data-theme");
    }
    try {
      localStorage.setItem(THEME_STORAGE_KEY, next);
    } catch {
      // localStorage unavailable (private mode, etc.) — theme still
      // applies for this page view, just won't persist across reloads.
    }
  }

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={`Switch to ${theme === "light" ? "dark" : "light"} theme`}
      className="flex shrink-0 cursor-pointer items-center justify-center text-on-surface transition-opacity duration-200 ease-out hover:opacity-60"
    >
      {theme === "light" ? <SunIcon className="h-4 w-fit" /> : <MoonIcon className="h-4 w-fit" />}
    </button>
  );
}

/* Icons inlined (not <img>-sourced) so their stroke can take the current
   text color via currentColor instead of a CSS `invert` filter. */

function SunIcon({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" className={className} role="img" aria-hidden="true">
      <path d="M7.99995 11.1819C9.75723 11.1819 11.1818 9.75732 11.1818 8.00004C11.1818 6.24276 9.75723 4.81821 7.99995 4.81821C6.24267 4.81821 4.81812 6.24276 4.81812 8.00004C4.81812 9.75732 6.24267 11.1819 7.99995 11.1819Z" stroke="currentColor" strokeLinecap="square" strokeLinejoin="round" />
      <path d="M8 1V2.27273" stroke="currentColor" strokeLinecap="square" strokeLinejoin="round" />
      <path d="M8 13.7274V15.0001" stroke="currentColor" strokeLinecap="square" strokeLinejoin="round" />
      <path d="M3.04883 3.0491L3.95247 3.95274" stroke="currentColor" strokeLinecap="square" strokeLinejoin="round" />
      <path d="M12.0474 12.0473L12.951 12.951" stroke="currentColor" strokeLinecap="square" strokeLinejoin="round" />
      <path d="M1 8.00006H2.27273" stroke="currentColor" strokeLinecap="square" strokeLinejoin="round" />
      <path d="M13.7273 8.00006H15" stroke="currentColor" strokeLinecap="square" strokeLinejoin="round" />
      <path d="M3.04883 12.951L3.95247 12.0473" stroke="currentColor" strokeLinecap="square" strokeLinejoin="round" />
      <path d="M12.0474 3.95274L12.951 3.0491" stroke="currentColor" strokeLinecap="square" strokeLinejoin="round" />
    </svg>
  );
}

function MoonIcon({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" className={className} role="img" aria-hidden="true">
      <path d="M13 8.45045C12.9124 9.39813 12.5568 10.3013 11.9746 11.0542C11.3925 11.8071 10.608 12.3787 9.71286 12.702C8.81775 13.0253 7.84906 13.087 6.92016 12.8799C5.99125 12.6728 5.14055 12.2054 4.46758 11.5324C3.79461 10.8595 3.32722 10.0087 3.1201 9.07984C2.91298 8.15094 2.97469 7.18225 3.29801 6.28714C3.62133 5.39202 4.19289 4.6075 4.94581 4.02537C5.69873 3.44324 6.60187 3.08758 7.54955 3C6.99471 3.75063 6.72772 4.67547 6.79714 5.60631C6.86655 6.53716 7.26776 7.41217 7.9278 8.0722C8.58783 8.73224 9.46284 9.13345 10.3937 9.20286C11.3245 9.27228 12.2494 9.00529 13 8.45045Z" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
