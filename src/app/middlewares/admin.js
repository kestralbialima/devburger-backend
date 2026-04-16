// src/app/middlewares/admin.js
export default (request, response, next) => {
  if (!request.userAdmin) {
    return response.status(401).json({ error: 'User is not an administrator' });
  }
  return next();
};