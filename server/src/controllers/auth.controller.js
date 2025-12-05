import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import prisma from '../db/prisma.js';

const authController = {
  async signup(req, res) {
    try {
      const { email, password, name } = req.body;

      if (!email || !password) {
        return res.status(400).json({ 
          success: false, 
          message: 'Email and password are required' 
        });
      }

      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid email format'
        });
      }

      // Validate password length
      if (password.length < 6) {
        return res.status(400).json({
          success: false,
          message: 'Password must be at least 6 characters long'
        });
      }
  
      let existingUser;
      try {
        existingUser = await prisma.user.findUnique({
          where: { email }
        });
      } catch (dbError) {
        console.error('Database error checking existing user:', dbError);
        return res.status(500).json({
          success: false,
          message: 'Database connection error. Please try again later.'
        });
      }

      if (existingUser) {
        return res.status(409).json({ 
          success: false, 
          message: 'User already exists' 
        });
      }

      const hashedPassword = await bcrypt.hash(password, 10);

      let user;
      try {
        user = await prisma.user.create({
          data: {
            email,
            password: hashedPassword,
            name: name || null
          },
          select: {
            id: true,
            email: true,
            name: true,
            createdAt: true
          }
        });
      } catch (dbError) {
        console.error('Database error creating user:', dbError);
        return res.status(500).json({
          success: false,
          message: 'Failed to create account. Please try again later.'
        });
      }

      if (!process.env.JWT_SECRET) {
        console.error('JWT_SECRET is not configured');
        return res.status(500).json({
          success: false,
          message: 'Server configuration error'
        });
      }

      const token = jwt.sign(
        { userId: user.id, email: user.email },
        process.env.JWT_SECRET,
        { expiresIn: '7d' }
      );

      // Cookie settings for cross-origin support
      const isProduction = process.env.NODE_ENV === 'production';
      res.cookie('token', token, {
        httpOnly: true,
        secure: isProduction, // Must be true for sameSite: 'none'
        sameSite: isProduction ? 'none' : 'lax', // 'none' for cross-origin, 'lax' for same-site
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
        path: '/', // Ensure cookie is available for all paths
      });

      res.status(201).json({
        success: true,
        message: 'User registered successfully',
        data: { user, token }
      });
    } catch (error) {
      console.error('Register error:', error);
      // Don't expose internal error details in production
      const errorMessage = process.env.NODE_ENV === 'production' 
        ? 'Registration failed. Please try again later.'
        : error.message;
      res.status(500).json({ 
        success: false, 
        message: errorMessage 
      });
    }
  },

  async login(req, res) {
    try {
      const { email, password } = req.body;

      // Validate input
      if (!email || !password) {
        return res.status(400).json({ 
          success: false, 
          message: 'Email and password are required' 
        });
      }

      // Find user
      let user;
      try {
        user = await prisma.user.findUnique({
          where: { email }
        });
      } catch (dbError) {
        console.error('Database error finding user:', dbError);
        return res.status(500).json({
          success: false,
          message: 'Database connection error. Please try again later.'
        });
      }

      if (!user) {
        return res.status(401).json({ 
          success: false, 
          message: 'Invalid credentials' 
        });
      }

      // Verify password
      const isPasswordValid = await bcrypt.compare(password, user.password);
      if (!isPasswordValid) {
        return res.status(401).json({ 
          success: false, 
          message: 'Invalid credentials' 
        });
      }

      // Generate JWT token
      if (!process.env.JWT_SECRET) {
        console.error('JWT_SECRET is not configured');
        return res.status(500).json({
          success: false,
          message: 'Server configuration error'
        });
      }

      const token = jwt.sign(
        { userId: user.id, email: user.email },
        process.env.JWT_SECRET,
        { expiresIn: '7d' }
      );

      // Set cookie
      // Cookie settings for cross-origin support
      const isProduction = process.env.NODE_ENV === 'production';
      res.cookie('token', token, {
        httpOnly: true,
        secure: isProduction, // Must be true for sameSite: 'none'
        sameSite: isProduction ? 'none' : 'lax', // 'none' for cross-origin, 'lax' for same-site
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
        path: '/', // Ensure cookie is available for all paths
      });

      // Remove password from response
      const { password: _, ...userWithoutPassword } = user;

      res.status(200).json({
        success: true,
        message: 'Login successful',
        data: { user: userWithoutPassword, token }
      });
    } catch (error) {
      console.error('Login error:', error);
      // Don't expose internal error details in production
      const errorMessage = process.env.NODE_ENV === 'production'
        ? 'Login failed. Please try again later.'
        : error.message;
      res.status(500).json({ 
        success: false, 
        message: errorMessage 
      });
    }
  },

  async getProfile(req, res) {
    try {
      // User is attached to request by auth middleware
      const user = req.user;
      res.status(200).json({
        success: true,
        data: user
      });
    } catch (error) {
      console.error('Get profile error:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Failed to fetch profile' 
      });
    }
  },

  async updateProfile(req, res) {
    try {
      const { name, email } = req.body;
      const userId = req.user.id;

      // Check if email is being changed and if it's already taken
      if (email && email !== req.user.email) {
        const existingUser = await prisma.user.findUnique({
          where: { email }
        });

        if (existingUser) {
          return res.status(409).json({
            success: false,
            message: 'Email already exists'
          });
        }
      }

      // Update user
      const updatedUser = await prisma.user.update({
        where: { id: userId },
        data: {
          ...(name !== undefined && { name }),
          ...(email !== undefined && { email })
        },
        select: {
          id: true,
          email: true,
          name: true,
          createdAt: true,
          updatedAt: true
        }
      });

      res.status(200).json({
        success: true,
        message: 'Profile updated successfully',
        data: updatedUser
      });
    } catch (error) {
      console.error('Update profile error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update profile'
      });
    }
  },

  async logout(req, res) {
    try {
      const isProduction = process.env.NODE_ENV === 'production';
      res.clearCookie('token', {
        httpOnly: true,
        secure: isProduction,
        sameSite: isProduction ? 'none' : 'lax',
        path: '/',
      });
      res.status(200).json({
        success: true,
        message: 'Logged out successfully'
      });
    } catch (error) {
      console.error('Logout error:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Logout failed' 
      });
    }
  }
};

export default authController;
