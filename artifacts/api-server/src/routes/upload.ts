import { Router } from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import { logger } from "../lib/logger";

const router = Router();

const UPLOADS_DIR = "/tmp/twp-uploads";
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, UPLOADS_DIR),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname) || "";
    const name = `${Date.now()}-${Math.random().toString(36).slice(2)}${ext}`;
    cb(null, name);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 50 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const allowed = [
      "image/jpeg", "image/png", "image/webp", "image/gif",
      "video/mp4", "video/3gpp", "video/quicktime",
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "application/vnd.ms-excel",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    ];
    if (allowed.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error(`Unsupported file type: ${file.mimetype}`));
    }
  },
});

router.post("/upload-media", upload.single("file"), (req, res) => {
  if (!req.file) {
    res.status(400).json({ error: "No file uploaded" });
    return;
  }

  const domain = process.env.REPLIT_DEV_DOMAIN ?? `localhost:${process.env.PORT ?? 8080}`;
  const protocol = process.env.REPLIT_DEV_DOMAIN ? "https" : "http";
  const url = `${protocol}://${domain}/api/media/${req.file.filename}`;

  logger.info({ filename: req.file.filename, size: req.file.size, mimetype: req.file.mimetype }, "upload-media: file stored");
  res.json({ url, filename: req.file.filename, mimetype: req.file.mimetype, size: req.file.size });
});

export { UPLOADS_DIR };
export default router;
