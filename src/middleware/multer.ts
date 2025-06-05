import { randomUUID } from "crypto";
import type { Request } from "express";
import fs from "fs";
import multer, { type FileFilterCallback } from "multer";
import path from "path";

const uploadDir = path.join(process.cwd(), "public", "uploads");
fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const name = `${randomUUID().toString()}${ext}`;
    cb(null, name);
  },
});

function imageFileFilter(
  req: Request,
  file: Express.Multer.File,
  cb: FileFilterCallback
) {
  if (file.mimetype.startsWith("image/")) {
    cb(null, true);
  } else {
    cb(new Error("Only image files are allowed"));
  }
}

function documentFileFilter(
  req: Request,
  file: Express.Multer.File,
  cb: FileFilterCallback
) {
  const allowedTypes = ["text/csv"];

  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error("Only CSV files are allowed"));
  }
}

export const uploadImage = multer({
  storage,
  fileFilter: imageFileFilter,
  limits: { fileSize: 5 * 1024 * 1024 },
});

export const uploadDocument = multer({
  storage,
  fileFilter: documentFileFilter,
  limits: { fileSize: 10 * 1024 * 1024 },
});
