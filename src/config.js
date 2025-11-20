const dotenv = require("dotenv");

dotenv.config();

const PORT = process.env.PORT || 4000;
const NODE_ENV = process.env.NODE_ENV || "development";

const ALLOWED_ORIGINS = (process.env.ALLOWED_ORIGINS || "")
  .split(",")
  .map((o) => o.trim())
  .filter(Boolean);

module.exports = {
  PORT,
  NODE_ENV,
  ALLOWED_ORIGINS
};
