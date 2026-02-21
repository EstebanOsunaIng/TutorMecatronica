export function errorHandler(err, _req, res, _next) {
  console.error(err);

  if (err?.name === 'MulterError' && err?.code === 'LIMIT_FILE_SIZE') {
    const maxMb = Number(err?.limit) > 0 ? Math.round(Number(err.limit) / (1024 * 1024)) : 50;
    return res.status(413).json({
      error: `El archivo supera el maximo de ${maxMb}MB`,
      code: err.code
    });
  }

  const status = err.status || 500;
  return res.status(status).json({
    error: err.message || 'Server error',
    code: err.code
  });
}
