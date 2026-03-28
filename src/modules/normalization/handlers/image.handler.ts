// ─────────────────────────────────────────────
// Image Handler (mock OCR)
// ─────────────────────────────────────────────

import { NormalizedData } from "../../../shared/types";

/**
 * Placeholder for a real OCR provider.
 * In production, replace with Google Vision API, Tesseract, etc.
 */
function performOcr(base64Image: string): string {
  // Mock: pretend the image contained some text
  const preview = base64Image.substring(0, 30);
  return `[OCR Extracted] Sample text from image starting with: ${preview}...`;
}

export function handleImage(payload: string): NormalizedData {
  const extractedText = performOcr(payload);
  return {
    type: "image",
    normalizedText: extractedText.trim(),
  };
}
