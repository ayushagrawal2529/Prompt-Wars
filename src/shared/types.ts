// ─────────────────────────────────────────────
// Centralized Interfaces & Types
// ─────────────────────────────────────────────

export type InputType = "text" | "audio" | "image";
export type UrgencyLevel = "low" | "medium" | "high";
export type PriorityLevel = "low" | "medium" | "high";
export type RiskLevel = "low" | "medium" | "high";

// ── Raw Input ───────────────────────────────────
export interface RawInput {
  type: InputType;
  payload: string; // raw text, base64 audio, base64 image
}

// ── Normalization ────────────────────────────────
export interface NormalizedData {
  type: InputType;
  normalizedText: string;
}

// ── Intent ───────────────────────────────────────
export interface IntentData {
  intent: string;
  entities: Record<string, unknown>;
  urgency: UrgencyLevel;
}

// ── Context ──────────────────────────────────────
export interface ContextData extends IntentData {
  context: Record<string, unknown>;
}

// ── Decision ─────────────────────────────────────
export interface ActionData {
  actions: string[];
  priority: PriorityLevel;
  riskLevel: RiskLevel;
}

// ── Verification ─────────────────────────────────
export interface VerifiedActionData {
  verifiedActions: string[];
  confidence: number; // 0.0 – 1.0
}

// ── Pipeline Result ──────────────────────────────
export interface PipelineResult {
  normalized: NormalizedData;
  intent: IntentData;
  context: ContextData;
  actions: ActionData;
  verified: VerifiedActionData;
}
