// ─────────────────────────────────────────────
// Application Entry Point
// ─────────────────────────────────────────────

import { processRequest } from "./orchestrator/pipeline.service";
import { RawInput } from "./shared/types";

async function main(): Promise<void> {
  const sampleInputs: RawInput[] = [
    {
      type: "text",
      payload: "There is a fire emergency in the building! Help needed urgently.",
    },
    {
      type: "text",
      payload: "I want to book an appointment in New York for next Monday.",
    },
    {
      type: "text",
      payload: "What is the weather forecast in London today?",
    },
    {
      type: "audio",
      // base64 of a plain ASCII string (simulates an audio payload)
      payload: Buffer.from("Patient collapsed, need help").toString("base64"),
    },
    {
      type: "image",
      // base64 of a plain ASCII string (simulates an image payload)
      payload: Buffer.from("Road closed ahead – detour via Route 7").toString("base64"),
    },
  ];

  for (const input of sampleInputs) {
    console.log("\n══════════════════════════════════════════════════");
    console.log(`INPUT TYPE : ${input.type}`);
    console.log("══════════════════════════════════════════════════");

    const result = await processRequest(input);

    console.log("\n📋 PIPELINE RESULT:");
    console.log(JSON.stringify(result, null, 2));
  }
}

main().catch((err: unknown) => {
  console.error("Fatal pipeline error:", err);
  process.exit(1);
});
