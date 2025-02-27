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
    } else if (err.name === 'UnauthorizedError') {
        errorMessage = 'Unauthorized: Access denied.';
        res.status(401);
    }

    // Send error response
    res.status(statusCode).json({
        message: errorMessage,
        stack: process.env.NODE_ENV === 'development' ? err.stack : undefined, // Show stack only in development
        path: req.originalUrl,
        method: req.method,
    });
};

// Middleware to log incoming requests
exports.requestLogger = (req, res, next) => {
    console.log(`[Request] ${req.method} ${req.originalUrl}`, {
        timestamp: new Date().toISOString(),
        body: req.body,
        query: req.query,
        params: req.params,
    });
    next();
};

// Middleware to handle 404 Not Found errors
exports.notFoundHandler = (req, res, next) => {
    res.status(404).json({
        message: 'Resource not found.',
        path: req.originalUrl,
        method: req.method,
    });
};

// Added Middleware: Error Response Formatting for API Consistency
exports.apiErrorFormatter = (err, req, res, next) => {
    const statusCode = res.statusCode !== 200 ? res.statusCode : 500;
    const message = err.message || 'Internal Server Error';

    res.status(statusCode).json({
        success: false, // Indicate failure
        error: {
            message: message,
            // Add other error details as needed (e.g., code, details)
            ...(process.env.NODE_ENV === 'development' && { stack: err.stack }), //Include stack trace only in dev
        },
    });
};

// Added Middleware: Unhandled Rejection Handler (for promise rejections)
process.on('unhandledRejection', (reason, promise) => {
    console.error('Unhandled Rejection:', reason);
    // Optionally, you can perform cleanup or exit the process here
});
