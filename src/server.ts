// ─────────────────────────────────────────────
// PromptWars Express API Server
// ─────────────────────────────────────────────

import express, { Request, Response } from "express";
import cors from "cors";
import multer from "multer";
import path from "path";
import fs from "fs";
import { processRequest } from "./orchestrator/pipeline.service";
import { RawInput, InputType } from "./shared/types";

const app = express();
const PORT = parseInt(process.env.PORT || "3000", 10);

// Middleware
app.use(cors());
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));

// Serve static frontend files
const publicDir = path.join(__dirname, "../public");
app.use(express.static(publicDir));

// Multer for file uploads (memory storage → base64)
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 50 * 1024 * 1024 } });

// ── POST /api/process ─────────────────────────
// Body: { type: "text"|"audio"|"image", payload: string }
// OR multipart file upload with field "file" + form field "type"
app.post("/api/process", upload.single("file"), async (req: Request, res: Response) => {
  try {
    let type: InputType;
    let payload: string;

    if (req.file) {
      // File upload — derive type from mimetype
      const mime = req.file.mimetype;
      if (mime.startsWith("audio/")) {
        type = "audio";
      } else if (mime.startsWith("image/")) {
        type = "image";
      } else if (mime.startsWith("text/")) {
        type = "text";
        payload = req.file.buffer.toString("utf-8");
      } else {
        // default: try to read as text
        type = "text";
      }

      // For binary files, convert to base64
      if (type === "audio" || type === "image") {
        payload = req.file.buffer.toString("base64");
      } else {
        payload = req.file.buffer.toString("utf-8");
      }
    } else {
      // JSON body
      type = req.body.type as InputType;
      payload = req.body.payload as string;
    }

    if (!type || !payload) {
      res.status(400).json({ error: "Missing required fields: type and payload" });
      return;
    }

    if (!["text", "audio", "image"].includes(type)) {
      res.status(400).json({ error: "Invalid type. Must be: text | audio | image" });
      return;
    }

    const input: RawInput = { type, payload };
    const result = await processRequest(input);

    res.json({ success: true, input: { type, payloadPreview: payload.substring(0, 80) }, result });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("[Server] Error processing request:", message);
    res.status(500).json({ error: message });
  }
});

// ── GET /api/health ───────────────────────────
app.get("/api/health", (_req: Request, res: Response) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// ── Fallback → serve index.html ───────────────
app.get("/{*path}", (_req: Request, res: Response) => {
  res.sendFile(path.join(publicDir, "index.html"));
});

app.listen(PORT, "0.0.0.0", () => {
  console.log(`\n🚀 PromptWars UI Server running at: http://0.0.0.0:${PORT}`);
  console.log(`   API endpoint: http://0.0.0.0:${PORT}/api/process\n`);
});
