// ─────────────────────────────────────────────
// Verification Service
// ─────────────────────────────────────────────

import { ActionData, ContextData, VerifiedActionData } from "../../shared/types";
import { logger } from "../../shared/logger";

const STAGE = "Verification";

// ── Blocklist ────────────────────────────────────
// Actions that are never allowed regardless of context
const BLOCKED_ACTIONS = new Set<string>([
  "DELETE_ALL_RECORDS",
  "EXECUTE_UNVERIFIED_CODE",
  "BYPASS_AUTHENTICATION",
  "SEND_UNSOLICITED_MESSAGES",
]);

// ── Relevance Checks ────────────────────────────
function isActionRelevant(action: string, contextData: ContextData): boolean {
  // Emergency actions must only fire on high-urgency intents
  if (
    (action.startsWith("DISPATCH_") || action.startsWith("NOTIFY_NEAREST_")) &&
    contextData.urgency !== "high"
  ) {
    return false;
  }
  return true;
}

// ── Confidence Scoring ────────────────────────────
function calculateConfidence(
  originalCount: number,
  verifiedCount: number,
  priority: ActionData["priority"],
  riskLevel: ActionData["riskLevel"]
): number {
  if (originalCount === 0) return 0;

  const retentionRatio = verifiedCount / originalCount;

  const priorityWeight: Record<typeof priority, number> = {
    high: 0.9,
    medium: 0.75,
    low: 0.6,
  };

  const riskPenalty: Record<typeof riskLevel, number> = {
    low: 0,
    medium: 0.05,
    high: 0.1,
  };

  const base = retentionRatio * priorityWeight[priority];
  const penalized = base - riskPenalty[riskLevel];
  return Math.max(0, Math.min(1, parseFloat(penalized.toFixed(4))));
}

// ── Public API ───────────────────────────────────

export function verifyActions(
  actionData: ActionData,
  contextData: ContextData
): VerifiedActionData {
  logger.info(STAGE, `Verifying ${actionData.actions.length} action(s)`);

  const verifiedActions = actionData.actions.filter((action) => {
    if (BLOCKED_ACTIONS.has(action)) {
      logger.warn(STAGE, `Blocked unsafe action: ${action}`);
      return false;
    }
    if (!isActionRelevant(action, contextData)) {
      logger.warn(STAGE, `Filtered irrelevant action: ${action}`);
      return false;
    }
    return true;
  });

  const confidence = calculateConfidence(
    actionData.actions.length,
    verifiedActions.length,
    actionData.priority,
    actionData.riskLevel
  );

  const result: VerifiedActionData = { verifiedActions, confidence };
  logger.debug(STAGE, "Verification complete", result);
  return result;
}
