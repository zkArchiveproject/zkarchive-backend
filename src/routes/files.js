const express = require("express");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const crypto = require("crypto");
const { v4: uuidv4 } = require("uuid");

const {
  UPLOAD_DIR,
  addFile,
  getFilesByWallet,
  getFileById
} = require("../storage");

const router = express.Router();

// Multer storage for encrypted blobs
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, UPLOAD_DIR);
  },
  filename: function (req, file, cb) {
    const ext = path.extname(file.originalname) || ".zkf";
    cb(null, `${uuidv4()}${ext}`);
  }
});

const upload = multer({
  storage,
  limits: {
    fileSize: 100 * 1024 * 1024 // 100MB max
  }
});

function readFileAsync(filePath) {
  return new Promise((resolve, reject) => {
    fs.readFile(filePath, (err, buf) => {
      if (err) return reject(err);
      resolve(buf);
    });
  });
}

/**
 * POST /api/files
 *
 * multipart/form-data:
 *   file           : encrypted blob (IV + ciphertext)
 *   wallet         : wallet address (string)
 *   filename       : original file name (string)
 *   size           : original size in bytes
 *   mime           : original mime type (optional)
 *   secretRequired : "true" / "false"  (default true)
 *   keyHint        : optional label for the key
 *
 * Note:
 *   The backend NEVER receives the actual secret key.
 *   All encryption/decryption stays on the client side.
 */
router.post("/api/files", upload.single("file"), async (req, res, next) => {
  try {
    const { wallet, filename, size, mime, secretRequired, keyHint } = req.body;

    if (!req.file) {
      const error = new Error("Encrypted file is required.");
      error.status = 400;
      throw error;
    }

    if (!wallet) {
      const error = new Error("Wallet address is required.");
      error.status = 400;
      throw error;
    }

    const id = uuidv4();
    const storedPath = req.file.path;
    const storedName = path.basename(storedPath);
    const encryptedSize = req.file.size;

    // Compute SHA-256 of encrypted blob (not plaintext)
    const buffer = await readFileAsync(storedPath);
    const hash = crypto.createHash("sha256").update(buffer).digest("hex");

    const now = new Date().toISOString();

    const meta = addFile({
      id,
      wallet,
      originalName:
        filename || req.file.originalname || "Encrypted File.zkf",
      storedName,
      encryptedSize,
      originalSize: size ? Number(size) : null,
      mime: mime || req.file.mimetype || "application/octet-stream",
      hash,
      secretRequired:
        typeof secretRequired === "string"
          ? secretRequired.toLowerCase() === "true"
          : true,
      keyHint: keyHint || null,
      createdAt: now
    });

    res.status(201).json({
      id: meta.id,
      hash: meta.hash,
      createdAt: meta.createdAt,
      secretRequired: meta.secretRequired,
      keyHint: meta.keyHint
    });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/files?wallet=<address>
 * Return metadata for files owned by a wallet.
 */
router.get("/api/files", (req, res, next) => {
  try {
    const wallet = req.query.wallet;

    if (!wallet) {
      const error = new Error("wallet query parameter is required.");
      error.status = 400;
      throw error;
    }

    const files = getFilesByWallet(wallet).map((f) => ({
      id: f.id,
      name: f.originalName,
      size: f.originalSize || f.encryptedSize,
      encryptedSize: f.encryptedSize,
      hash: f.hash,
      createdAt: f.createdAt,
      secretRequired: f.secretRequired !== false,
      keyHint: f.keyHint || null
    }));

    res.json(files);
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/files/:id/download
 * Download the encrypted blob for local decryption.
 */
router.get("/api/files/:id/download", (req, res, next) => {
  try {
    const { id } = req.params;
    const meta = getFileById(id);

    if (!meta) {
      const error = new Error("File not found.");
      error.status = 404;
      throw error;
    }

    const fullPath = path.join(UPLOAD_DIR, meta.storedName);
    res.download(fullPath, meta.originalName || "Encrypted File.zkf");
  } catch (err) {
    next(err);
  }
});

module.exports = router;
