import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
dotenv.config();

export const authenticateUser = (req, res, next) => {
  const authHeader = req.header('Authorization');

  if (!authHeader) {
    return res.status(401).send({ error: 'Access denied. No token provided.' });
  }

  try {
    const token = authHeader.replace('Bearer ', '');

    const decodedToken = jwt.verify(token, process.env.JWT_SECRET);
    if (!decodedToken) {
      return res.status(400).send({ error: 'Invalid token.' });
    }

    req.user = { ...decodedToken, role: decodedToken.role };

    next();
  } catch (error) {
    console.error('Error verifying token:', error.message);

    if (error.name === 'TokenExpiredError') {
      return res.status(401).send({ error: 'Token has expired.' });
    } else if (error.name === 'JsonWebTokenError') {
      return res.status(400).send({ error: 'Invalid token.' });
    } else {
      return res.status(500).send({ error: 'Internal server error during token verification.' });
    }
  }
};

export const authorizeRoles = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user || !allowedRoles.includes(req.user.role)) {
      return res.status(403).send({ error: 'Access denied. Insufficient permissions.' });
    }
    next();
  };
};