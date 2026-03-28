// ─────────────────────────────────────────────
// Intent Service  (Gemini wrapper – mock)
// ─────────────────────────────────────────────

import { NormalizedData, IntentData, UrgencyLevel } from "../../shared/types";
import { logger } from "../../shared/logger";
import { globalCache } from "../../shared/cache";

const STAGE = "Intent";

// ── Gemini mock ──────────────────────────────────
interface GeminiResponse {
  intent: string;
  entities: Record<string, unknown>;
  urgency: UrgencyLevel;
}

function callGeminiApi(text: string): GeminiResponse {
  /**
   * Production: POST to Gemini endpoint with structured prompt.
   * Replace this block with a real HTTP call and parse the JSON response.
   */
  const lower = text.toLowerCase();

  // Deterministic rule-based mock that mimics LLM output
  const emergencyKeywords = ["emergency", "urgent", "help", "critical", "fire", "accident"];
  const bookingKeywords = ["book", "schedule", "appointment", "reserve"];
  const weatherKeywords = ["weather", "rain", "temperature", "forecast"];

  let intent = "general_query";
  let urgency: UrgencyLevel = "low";
  const entities: Record<string, unknown> = {};

  if (emergencyKeywords.some((kw) => lower.includes(kw))) {
    intent = "emergency_alert";
    urgency = "high";
    entities["alertType"] = "emergency";
  } else if (bookingKeywords.some((kw) => lower.includes(kw))) {
    intent = "booking_request";
    urgency = "medium";
    entities["action"] = "book";
  } else if (weatherKeywords.some((kw) => lower.includes(kw))) {
    intent = "weather_inquiry";
    urgency = "low";
    entities["domain"] = "weather";
  }

  // Extract simple location entity
  const locationMatch = lower.match(/\bin\s+([a-z\s]+)/);
  if (locationMatch) {
    entities["location"] = locationMatch[1].trim();
  }

  return { intent, entities, urgency };
}

// ── Public API ───────────────────────────────────
export function extractIntent(normalized: NormalizedData): IntentData {
  const cacheKey = `intent:${normalized.normalizedText}`;

  const cached = globalCache.get<IntentData>(cacheKey);
  if (cached) {
    logger.debug(STAGE, "Cache hit for intent", { key: cacheKey });
    return cached;
  }

  logger.info(STAGE, "Extracting intent from normalized text");

  const response = callGeminiApi(normalized.normalizedText);

  const result: IntentData = {
    intent: response.intent,
    entities: response.entities,
    urgency: response.urgency,
  };

  globalCache.set(cacheKey, result);
  logger.debug(STAGE, "Intent extracted", result);
  return result;
}
