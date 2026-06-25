function legacyCopy(text: string): boolean {
  const el = document.createElement("textarea");
  el.value = text;
  el.setAttribute("readonly", "");
  el.style.position = "fixed";
  el.style.left = "-9999px";
  document.body.appendChild(el);
  el.focus();
  el.select();
  const ok = document.execCommand("copy");
  document.body.removeChild(el);
  return ok;
}

/** Copy text without throwing when the Clipboard API is blocked (e.g. unfocused tab). */
export async function copyTextToClipboard(text: string): Promise<boolean> {
  if (typeof window === "undefined") return false;

  if (!document.hasFocus()) {
    window.focus();
  }

  if (document.hasFocus()) {
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(text);
        return true;
      }
    } catch {
      // NotAllowedError: document not focused, permission denied, etc.
    }
  }

  try {
    return legacyCopy(text);
  } catch {
    return false;
  }
}
