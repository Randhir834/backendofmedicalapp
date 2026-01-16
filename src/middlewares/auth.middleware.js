/**
 * tpex-healthcare-backend\src\middlewares\auth.middleware.js
 *
 * Auto-generated documentation comments.
 */
 import { verifyAccessToken } from "../config/jwt.js";

// auth.middleware.js
//
// authMiddleware protects routes that require a logged-in user.
//
// It expects an Authorization header in the form:
//   Authorization: Bearer <accessToken>
//
// If the token is valid, it attaches the decoded payload to req.user.
export default function authMiddleware(req, res, next) {
  try {
    const header = req.headers?.authorization || "";
    const [type, token] = header.split(" ");
    if (type !== "Bearer" || !token) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    // Decode/verify token and store identity on the request.
    const payload = verifyAccessToken(token);
    req.user = payload;
    return next();
  } catch (err) {
    return res.status(401).json({ success: false, message: "Unauthorized" });
  }
}
