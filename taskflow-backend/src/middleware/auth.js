import jwt from 'jsonwebtoken';

// Token ab httpOnly cookie me aata hai (login ke baad) — JS ise padh nahi sakta.
// Header wala fallback rakha hai taaki Postman/curl wagairah me Bearer token use kar sake.
const readToken = (req) =>
  req.cookies?.token || req.headers.authorization?.split(' ')[1];

export default (req, res, next) => {
  const token = readToken(req);
  if (!token) return res.status(401).json({ msg: "No token" });

  try {
    const decode = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decode;
    next();
  } catch (error) {
    // Cookie me stale token pada hai -> saaf kar do taaki dobara try na ho
    res.clearCookie('token');
    return res.status(401).json({ msg: "Invalid token", error: error.message });
  }
};