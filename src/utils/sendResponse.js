const sendResponse = (res, { statusCode = 200, success = true, message, data, errors }) => {
  const payload = { success, message };
  if (data !== undefined) payload.data = data;
  if (errors) payload.errors = errors;
  return res.status(statusCode).send(payload);
};

module.exports = sendResponse;
