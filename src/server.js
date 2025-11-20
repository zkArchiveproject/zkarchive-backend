const express = require("express");
const cors = require("cors");
const morgan = require("morgan");
const path = require("path");

const { PORT, NODE_ENV, ALLOWED_ORIGINS } = require("./config");
const filesRoutes = require("./routes/files");
const errorHandler = require("./middleware/errorHandler");

const app = express();

// CORS: only your two domains
const corsOptions = {
  origin: function (origin, callback) {
    // Allow tools like curl / Postman with no origin
    if (!origin) return callback(null, true);

    if (ALLOWED_ORIGINS.length === 0) {
      console.warn("No ALLOWED_ORIGINS set, blocking:", origin);
      return callback(new Error("Not allowed by CORS"), false);
    }

    if (ALLOWED_ORIGINS.includes(origin)) {
      return callback(null, true);
    }

    console.warn("Blocked CORS origin:", origin);
    return callback(new Error("Not allowed by CORS"), false);
  },
  credentials: false
};

app.use(cors(corsOptions));
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));
app.use(morgan(NODE_ENV === "production" ? "combined" : "dev"));

// Health check for Render
app.get("/health", (req, res) => {
  res.json({ ok: true, status: "healthy" });
});

// Optional: serve encrypted blobs statically for debugging
app.use("/uploads", express.static(path.join(__dirname, "..", "uploads")));

// Main API routes
app.use(filesRoutes);

// Central error handler
app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`zkArchive backend running on port ${PORT} (${NODE_ENV})`);
  console.log("Allowed CORS origins:", ALLOWED_ORIGINS);
});
