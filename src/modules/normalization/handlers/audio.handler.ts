// ─────────────────────────────────────────────
// Audio Handler (mock speech-to-text)
// ─────────────────────────────────────────────

import { NormalizedData } from "../../../shared/types";

/**
 * Placeholder for a real speech-to-text provider.
 * In production, replace with calls to Google Speech API,
 * AWS Transcribe, or similar.
 */
function speechToText(base64Audio: string): string {
  // Mock: decode base64, pretend it produced a transcript
  const decoded = Buffer.from(base64Audio, "base64").toString("utf-8");
  // Simulate a transcription result
  return `[Transcribed] ${decoded.substring(0, 120)}`;
}

export function handleAudio(payload: string): NormalizedData {
  const transcript = speechToText(payload);
  return {
    type: "audio",
    normalizedText: transcript.trim(),
  };
}
