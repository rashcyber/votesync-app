function errorHandler(err, req, res, next) {
  console.error(err.stack || err.message);

  const status = err.status || 500;
  const message = err.status ? err.message : 'Internal server error';

  res.status(status).json({
    error: {
      message,
      ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
    },
  });
}

module.exports = errorHandler;
