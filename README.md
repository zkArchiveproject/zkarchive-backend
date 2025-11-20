# zkArchive Backend

Backend for **zkArchive** — a zero-knowledge encrypted file vault.

The backend never sees plaintext files or decryption keys. It only stores encrypted blobs and minimal metadata. All encryption, key derivation, and decryption happen client-side.

## Tech Stack

- Node.js + Express
- Multer for encrypted file uploads
- JSON file database (`data/files.json`)
- Strict CORS locked to:
  - https://zkarchive.us
  - https://app.zkarchive.us

## Secret Key Model

- The **secret key is generated and kept in the browser**.
- The backend stores only:
  - the encrypted blob,
  - the file hash (SHA-256 of the encrypted data),
  - metadata such as wallet, name, size, and optional `keyHint`.
- When a user wants to open a file:
  1. Frontend calls `GET /api/files/:id/download`.
  2. Browser asks the user to paste / unlock their secret key.
  3. Decryption happens locally in the browser.

The server never validates or stores the secret key. This matches the zero-knowledge.

## Environment

Create `.env` from `.env.example`:

```bash
PORT=4000
ALLOWED_ORIGINS=https://zkarchive.us,https://app.zkarchive.us
NODE_ENV=production
