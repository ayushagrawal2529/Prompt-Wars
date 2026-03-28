// ─────────────────────────────────────────────
// Context Service (mock API providers)
// ─────────────────────────────────────────────

import { IntentData, ContextData } from "../../shared/types";
import { logger } from "../../shared/logger";
import { globalCache } from "../../shared/cache";

const STAGE = "Context";

// ── Mock Providers ───────────────────────────────

function fetchWeather(location: string): Record<string, unknown> {
  return {
    provider: "weather",
    location,
    temperature: "28°C",
    condition: "Partly cloudy",
    humidity: "65%",
    windSpeed: "12 km/h",
  };
}

function fetchTraffic(location: string): Record<string, unknown> {
  return {
    provider: "traffic",
    location,
    congestionLevel: "moderate",
    estimatedDelay: "8 mins",
    incidents: [],
  };
}

function fetchMedical(alertType: string): Record<string, unknown> {
  return {
    provider: "medical",
    alertType,
    nearestHospital: "City General Hospital",
    distanceKm: 3.2,
    emergencyContactActive: true,
    responseEtaMinutes: 6,
  };
}

// ── Context Aggregator ───────────────────────────

function gatherContext(intentData: IntentData): Record<string, unknown> {
  const context: Record<string, unknown> = {};
  const location = (intentData.entities["location"] as string) ?? "default";

  if (
    intentData.intent === "weather_inquiry" ||
    intentData.urgency === "high"
  ) {
    context["weather"] = fetchWeather(location);
  }

  if (
    intentData.intent === "booking_request" ||
    intentData.intent === "emergency_alert"
  ) {
    context["traffic"] = fetchTraffic(location);
  }

  if (intentData.intent === "emergency_alert") {
    const alertType = (intentData.entities["alertType"] as string) ?? "general";
    context["medical"] = fetchMedical(alertType);
  }

  return context;
}

// ── Public API ───────────────────────────────────

export function enrichContext(intentData: IntentData): ContextData {
  const cacheKey = `context:${intentData.intent}:${JSON.stringify(intentData.entities)}`;

  const cached = globalCache.get<ContextData>(cacheKey);
  if (cached) {
    logger.debug(STAGE, "Cache hit for context", { key: cacheKey });
    return cached;
  }

  logger.info(STAGE, `Enriching context for intent: ${intentData.intent}`);

  const context = gatherContext(intentData);

  const result: ContextData = {
    ...intentData,
    context,
  };

  globalCache.set(cacheKey, result);
  logger.debug(STAGE, "Context enriched", result);
  return result;
}
