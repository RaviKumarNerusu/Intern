const { errorResponse } = require("../utils/apiResponse");

const notFound = (req, res, next) => {
  const error = new Error(`Not Found - ${req.originalUrl}`);
  error.statusCode = 404;
  res.status(404);
  next(error);
};

const errorHandler = (err, req, res, next) => {
  const statusCode = res.statusCode !== 200 ? res.statusCode : err.statusCode || 500;

  if (process.env.NODE_ENV !== "test") {
    // eslint-disable-next-line no-console
    console.error(err);
  }

  return errorResponse(res, err.message || "Internal Server Error", statusCode);
};

module.exports = {
  notFound,
  errorHandler,
};
