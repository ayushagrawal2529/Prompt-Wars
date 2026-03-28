// ─────────────────────────────────────────────
// Pipeline Orchestrator
// ─────────────────────────────────────────────

import { RawInput, PipelineResult } from "../shared/types";
import { logger } from "../shared/logger";
import { normalizeInput } from "../modules/normalization/normalization.service";
import { extractIntent } from "../modules/intent/intent.service";
import { enrichContext } from "../modules/context/context.service";
import { generateActions } from "../modules/decision/decision.service";
import { verifyActions } from "../modules/verification/verification.service";

const STAGE = "Pipeline";

export async function processRequest(input: RawInput): Promise<PipelineResult> {
  logger.info(STAGE, "─── Pipeline START ───────────────────────────");

  // Stage 1 – Normalization
  logger.info(STAGE, "[1/5] Normalization");
  const normalized = normalizeInput(input);

  // Stage 2 – Intent Extraction
  logger.info(STAGE, "[2/5] Intent Extraction");
  const intent = extractIntent(normalized);

  // Stage 3 – Context Enrichment
  logger.info(STAGE, "[3/5] Context Enrichment");
  const context = enrichContext(intent);

  // Stage 4 – Decision / Action Generation
  logger.info(STAGE, "[4/5] Decision");
  const actions = generateActions(context);

  // Stage 5 – Verification
  logger.info(STAGE, "[5/5] Verification");
  const verified = verifyActions(actions, context);

  logger.info(STAGE, "─── Pipeline END ─────────────────────────────");

  return {
    normalized,
    intent,
    context,
    actions,
    verified,
  };
}
