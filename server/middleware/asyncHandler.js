// Sends errors from async controllers to the error handler in server.js
module.exports = (fn) => (req, res, next) => fn(req, res, next).catch(next);
