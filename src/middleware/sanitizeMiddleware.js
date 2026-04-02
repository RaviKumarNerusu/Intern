const sanitizeObject = (value) => {
  if (Array.isArray(value)) {
    value.forEach((item, index) => {
      value[index] = sanitizeObject(item);
    });
    return value;
  }

  if (value && typeof value === "object") {
    Object.keys(value).forEach((key) => {
      const sanitizedKey = key.replace(/^\$+/g, "").replace(/\./g, "");
      const sanitizedValue = sanitizeObject(value[key]);

      if (sanitizedKey !== key) {
        delete value[key];

        if (sanitizedKey) {
          value[sanitizedKey] = sanitizedValue;
        }

        return;
      }

      value[key] = sanitizedValue;
    });
  }

  return value;
};

const sanitizeInputs = (req, res, next) => {
  if (req.body && typeof req.body === "object") {
    sanitizeObject(req.body);
  }

  if (req.query && typeof req.query === "object") {
    sanitizeObject(req.query);
  }

  if (req.params && typeof req.params === "object") {
    sanitizeObject(req.params);
  }

  next();
};

module.exports = sanitizeInputs;