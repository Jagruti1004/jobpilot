// Throw this anywhere with a status code: throw new ApiError(401, 'Unauthorized')
export class ApiError extends Error {
  constructor(statusCode, message) {
    super(message);
    this.statusCode = statusCode;
  }
}

// Express error handler — must have 4 params for Express to recognize it
export const errorHandler = (err, _req, res, _next) => {
  if (err instanceof ApiError) {
    return res.status(err.statusCode).json({ error: err.message });
  }
  console.error('[Unhandled error]', err);
  return res.status(500).json({ error: 'Internal server error' });
};