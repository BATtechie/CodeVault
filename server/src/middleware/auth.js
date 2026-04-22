import jwt from 'jsonwebtoken';
import prisma from '../db/prisma.js';

export const authMiddleware = async (req, res, next) => {
  try {
    // Try to get token from cookie first, then Authorization header
    let token = req.cookies?.token;
    
    // Debug logging in development
    if (process.env.NODE_ENV !== 'production') {
      console.log('Auth middleware - Cookie token:', token ? 'Present' : 'Missing');
      console.log('Auth middleware - Authorization header:', req.headers.authorization ? 'Present' : 'Missing');
    }
    
    // If no cookie, try Authorization header (case-insensitive)
    if (!token) {
      const authHeader = req.headers.authorization || req.headers['authorization'] || req.headers['Authorization'];
      
      if (authHeader) {
        // Handle both "Bearer token" and "bearer token" formats
        if (authHeader.startsWith('Bearer ') || authHeader.startsWith('bearer ')) {
          token = authHeader.split(' ')[1];
        } else if (authHeader.startsWith('BEARER ')) {
          token = authHeader.split(' ')[1];
        } else {
          // If no Bearer prefix, assume the whole header is the token
          token = authHeader.trim();
        }
        
        if (process.env.NODE_ENV !== 'production') {
          console.log('Auth middleware - Extracted token from header:', token ? 'Present' : 'Missing');
        }
      }
    }

    if (!token) {
      if (process.env.NODE_ENV !== 'production') {
        console.log('Auth middleware - No token found');
      }
      return res.status(401).json({ 
        success: false, 
        message: 'Authentication required' 
      });
    }

    if (!process.env.JWT_SECRET) {
      return res.status(500).json({
        success: false,
        message: 'Server configuration error'
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Fetch full user data from database
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: {
        id: true,
        email: true,
        name: true,
        createdAt: true,
        updatedAt: true
      }
    });

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'User not found'
      });
    }
    
    req.user = user;
    next();
  } catch (error) {
    res.status(401).json({ success: false, message: 'Invalid or expired session' });
  }
};
