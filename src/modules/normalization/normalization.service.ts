// ─────────────────────────────────────────────
// Normalization Service
// ─────────────────────────────────────────────

import { RawInput, NormalizedData } from "../../shared/types";
import { logger } from "../../shared/logger";
import { handleText } from "./handlers/text.handler";
import { handleAudio } from "./handlers/audio.handler";
import { handleImage } from "./handlers/image.handler";

const STAGE = "Normalization";

export function normalizeInput(input: RawInput): NormalizedData {
  logger.info(STAGE, `Normalizing input of type: ${input.type}`);

  let result: NormalizedData;

  switch (input.type) {
    case "text":
      result = handleText(input.payload);
      break;
    case "audio":
      result = handleAudio(input.payload);
      break;
    case "image":
      result = handleImage(input.payload);
      break;
    default: {
      const exhaustive: never = input.type;
      throw new Error(`Unsupported input type: ${String(exhaustive)}`);
    }
  }

  logger.debug(STAGE, "Normalized result", result);
  return result;
}
