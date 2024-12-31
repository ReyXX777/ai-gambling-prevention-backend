exports.errorHandler = (err, req, res, next) => {
  console.error(`[Error] ${err.message}`, {
    stack: err.stack, // Log stack trace for debugging purposes
    path: req.originalUrl, // Log the path where the error occurred
    method: req.method, // Log the HTTP method used
  });

  // Handle known error types
  const statusCode = res.statusCode !== 200 ? res.statusCode : 500; // Use existing statusCode or default to 500

  // Customize response for specific error types
  let errorMessage = err.message || 'Internal Server Error';
  if (err.name === 'ValidationError') {
    errorMessage = `Validation Error: ${err.message}`;
  } else if (err.name === 'CastError') {
    errorMessage = 'Resource not found. Invalid ID format.';
    res.status(404);
  }

  // Send error response
  res.status(statusCode).json({
    message: errorMessage,
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined, // Show stack only in development
    path: req.originalUrl,
    method: req.method,
  });
};
