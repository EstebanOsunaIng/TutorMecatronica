export function validate(required = []) {
  return (req, res, next) => {
    const missing = required.filter((key) => req.body?.[key] === undefined || req.body?.[key] === '');
    if (missing.length > 0) {
      return res.status(400).json({ error: `Missing fields: ${missing.join(', ')}` });
    }
    return next();
  };
}
