export const sendSuccess = (
  res,
  {
    status = 200,
    message,
    data,
    meta,
  } = {},
) => {
  const payload = { success: true };

  if (message) {
    payload.message = message;
  }

  if (data !== undefined) {
    payload.data = data;
  }

  if (meta) {
    payload.meta = meta;
  }

  return res.status(status).json(payload);
};

export const sendError = (
  res,
  {
    status = 500,
    message = 'Something went wrong.',
    details,
  } = {},
) => {
  const payload = {
    success: false,
    message,
  };

  if (details) {
    payload.details = details;
  }

  return res.status(status).json(payload);
};

export const parsePagination = (query, defaults = {}) => {
  const defaultPage = defaults.page ?? 1;
  const defaultLimit = defaults.limit ?? 12;
  const maxLimit = defaults.maxLimit ?? 50;

  const page = Math.max(1, Number.parseInt(query.page, 10) || defaultPage);
  const limit = Math.min(
    maxLimit,
    Math.max(1, Number.parseInt(query.limit, 10) || defaultLimit),
  );

  return {
    page,
    limit,
    skip: (page - 1) * limit,
  };
};
