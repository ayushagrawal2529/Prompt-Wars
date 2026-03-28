// ─────────────────────────────────────────────
// Decision Service (rule-based, no random output)
// ─────────────────────────────────────────────

import { ContextData, ActionData, PriorityLevel, RiskLevel } from "../../shared/types";
import { logger } from "../../shared/logger";

const STAGE = "Decision";

// ── Rule Definitions ─────────────────────────────

interface Rule {
  name: string;
  condition: (data: ContextData) => boolean;
  actions: string[];
  priority: PriorityLevel;
  riskLevel: RiskLevel;
}

const RULES: Rule[] = [
  {
    name: "emergency_high_priority",
    condition: (d) =>
      d.intent === "emergency_alert" && d.urgency === "high",
    actions: [
      "DISPATCH_EMERGENCY_SERVICES",
      "NOTIFY_NEAREST_HOSPITAL",
      "ALERT_EMERGENCY_CONTACTS",
      "INITIATE_LIVE_TRACKING",
    ],
    priority: "high",
    riskLevel: "high",
  },
  {
    name: "booking_medium_priority",
    condition: (d) =>
      d.intent === "booking_request" && d.urgency !== "high",
    actions: [
      "CREATE_BOOKING_RECORD",
      "SEND_CONFIRMATION_NOTIFICATION",
      "CHECK_AVAILABILITY",
    ],
    priority: "medium",
    riskLevel: "low",
  },
  {
    name: "weather_low_priority",
    condition: (d) => d.intent === "weather_inquiry",
    actions: [
      "FETCH_WEATHER_REPORT",
      "DELIVER_WEATHER_SUMMARY_TO_USER",
    ],
    priority: "low",
    riskLevel: "low",
  },
  {
    name: "general_fallback",
    condition: (_d) => true, // always matches as last resort
    actions: [
      "LOG_UNMATCHED_REQUEST",
      "ROUTE_TO_GENERAL_SUPPORT",
    ],
    priority: "low",
    riskLevel: "low",
  },
];

// ── Rule Engine ──────────────────────────────────

function evaluateRules(data: ContextData): Rule {
  // Rules respect declaration order; first match wins
  for (const rule of RULES) {
    if (rule.condition(data)) {
      return rule;
    }
  }
  // Should never reach here because "general_fallback" always matches
  return RULES[RULES.length - 1]!;
}

// ── Public API ───────────────────────────────────

export function generateActions(contextData: ContextData): ActionData {
  logger.info(STAGE, `Generating actions for intent: ${contextData.intent}`);

  const matchedRule = evaluateRules(contextData);

  logger.debug(STAGE, `Matched rule: ${matchedRule.name}`, {
    actions: matchedRule.actions,
  });

  const result: ActionData = {
    actions: [...matchedRule.actions],
    priority: matchedRule.priority,
    riskLevel: matchedRule.riskLevel,
  };

  logger.debug(STAGE, "Actions generated", result);
  return result;
}
