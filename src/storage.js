const fs = require("fs");
const path = require("path");

const DATA_DIR = path.join(__dirname, "..", "data");
const DB_PATH = path.join(DATA_DIR, "files.json");
const UPLOAD_DIR = path.join(__dirname, "..", "uploads");

// Ensure base folders exist
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}
if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

// Load simple JSON DB from disk
function loadDB() {
  if (!fs.existsSync(DB_PATH)) {
    const initial = { files: [] };
    fs.writeFileSync(DB_PATH, JSON.stringify(initial, null, 2), "utf-8");
    return initial;
  }

  const raw = fs.readFileSync(DB_PATH, "utf-8");
  try {
    return JSON.parse(raw);
  } catch (err) {
    console.error("Failed to parse files DB, recreating:", err);
    const initial = { files: [] };
    fs.writeFileSync(DB_PATH, JSON.stringify(initial, null, 2), "utf-8");
    return initial;
  }
}

function saveDB(db) {
  fs.writeFileSync(DB_PATH, JSON.stringify(db, null, 2), "utf-8");
}

function addFile(meta) {
  const db = loadDB();
  db.files.push(meta);
  saveDB(db);
  return meta;
}

function getFilesByWallet(walletAddress) {
  const db = loadDB();
  return db.files
    .filter((f) => f.wallet === walletAddress)
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
}

function getFileById(id) {
  const db = loadDB();
  return db.files.find((f) => f.id === id) || null;
}

module.exports = {
  UPLOAD_DIR,
  addFile,
  getFilesByWallet,
  getFileById
};
