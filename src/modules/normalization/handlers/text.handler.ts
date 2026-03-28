// ─────────────────────────────────────────────
// Text Handler
// ─────────────────────────────────────────────

import { NormalizedData } from "../../../shared/types";

export function handleText(payload: string): NormalizedData {
  const cleaned = payload.trim().replace(/\s+/g, " ");
  return {
    type: "text",
    normalizedText: cleaned,
  };
}
