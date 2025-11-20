function errorHandler(err, req, res, next) {
  console.error("Unhandled error:", err);

  if (res.headersSent) {
    return next(err);
  }

  const status = err.status || 500;
  const message =
    err.message || "Unexpected server error. Please try again later.";

  res.status(status).json({
    error: true,
    message
  });
}

module.exports = errorHandler;
