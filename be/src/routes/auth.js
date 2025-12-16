const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const prisma = require('../lib/prisma');

const router = express.Router();

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

// POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validate input
    if (!email || !password) {
      return res.status(400).json({ 
        success: false,
        error: 'Email and password are required' 
      });
    }

    // Find user by email
    const user = await prisma.user.findUnique({
      where: { email },
      include: {
        merchant: {
          select: {
            id: true,
            name: true,
            slug: true,
            type: true
          }
        }
      }
    });

    if (!user) {
      return res.status(401).json({ 
        success: false,
        error: 'Invalid email or password' 
      });
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.password);

    if (!isValidPassword) {
      return res.status(401).json({ 
        success: false,
        error: 'Invalid email or password' 
      });
    }

    // Generate JWT token
    const token = jwt.sign(
      { 
        userId: user.id, 
        email: user.email,
        merchantId: user.merchantId 
      },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );

    // Return success response
    res.json({
      success: true,
      data: {
        token,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          phoneNo: user.phoneNo,
          merchant: user.merchant
        }
      }
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ 
      success: false,
      error: 'Internal server error' 
    });
  }
});

// POST /api/auth/register
router.post('/register', async (req, res) => {
  try {
    const { name, email, password, phoneNo, merchantId } = req.body;

    // Validate input
    if (!name || !email || !password || !merchantId) {
      return res.status(400).json({ 
        success: false,
        error: 'Name, email, password, and merchantId are required' 
      });
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email }
    });

    if (existingUser) {
      return res.status(409).json({ 
        success: false,
        error: 'User with this email already exists' 
      });
    }

    // Check if merchant exists
    const merchant = await prisma.merchant.findUnique({
      where: { id: merchantId }
    });

    if (!merchant) {
      return res.status(404).json({ 
        success: false,
        error: 'Merchant not found' 
      });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        phoneNo,
        merchantId
      },
      include: {
        merchant: {
          select: {
            id: true,
            name: true,
            slug: true,
            type: true
          }
        }
      }
    });

    // Generate JWT token
    const token = jwt.sign(
      { 
        userId: user.id, 
        email: user.email,
        merchantId: user.merchantId 
      },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );

    res.status(201).json({
      success: true,
      data: {
        token,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          phoneNo: user.phoneNo,
          merchant: user.merchant
        }
      }
    });

  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ 
      success: false,
      error: 'Internal server error' 
    });
  }
});

// POST /api/auth/merchant-register - Register new merchant (no auth required)
router.post('/merchant-register', async (req, res) => {
  try {
    const { name, email, password, businessName, slug } = req.body;

    // Validate input
    if (!name || !email || !password || !businessName) {
      return res.status(400).json({ 
        success: false,
        error: 'Name, email, password, and businessName are required' 
      });
    }

    // Check if merchant email already exists
    const existingMerchant = await prisma.merchant.findUnique({
      where: { email }
    });

    if (existingMerchant) {
      return res.status(409).json({ 
        success: false,
        error: 'Merchant with this email already exists' 
      });
    }

    // Generate slug from business name if not provided
    const merchantSlug = slug || businessName.toLowerCase().replace(/[^a-z0-9]+/g, '-');

    // Check if slug exists
    const existingSlug = await prisma.merchant.findUnique({
      where: { slug: merchantSlug }
    });

    if (existingSlug) {
      return res.status(409).json({ 
        success: false,
        error: 'Business name already taken. Please choose a different name.' 
      });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create merchant and user in a transaction
    const result = await prisma.$transaction(async (tx) => {
      // Create merchant
      const merchant = await tx.merchant.create({
        data: {
          name: businessName,
          email,
          slug: merchantSlug,
          type: 'general',
          displayName: businessName
        }
      });

      // Create user for the merchant
      const user = await tx.user.create({
        data: {
          name,
          email,
          password: hashedPassword,
          merchantId: merchant.id
        }
      });

      return { merchant, user };
    });

    // Generate JWT token
    const token = jwt.sign(
      { 
        userId: result.user.id, 
        email: result.user.email,
        merchantId: result.merchant.id 
      },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );

    res.status(201).json({
      success: true,
      data: {
        token,
        user: {
          id: result.user.id,
          name: result.user.name,
          email: result.user.email
        },
        merchant: {
          id: result.merchant.id,
          name: result.merchant.name,
          slug: result.merchant.slug,
          email: result.merchant.email
        }
      },
      message: 'Merchant registered successfully'
    });

  } catch (error) {
    console.error('Merchant registration error:', error);
    res.status(500).json({ 
      success: false,
      error: 'Internal server error' 
    });
  }
});

// GET /api/auth/me - Get current user (protected route example)
router.get('/me', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ 
        success: false,
        error: 'No token provided' 
      });
    }

    const token = authHeader.split(' ')[1];
    
    const decoded = jwt.verify(token, JWT_SECRET);
    
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      include: {
        merchant: {
          select: {
            id: true,
            name: true,
            slug: true,
            type: true
          }
        }
      }
    });

    if (!user) {
      return res.status(404).json({ 
        success: false,
        error: 'User not found' 
      });
    }

    res.json({
      success: true,
      data: {
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          phoneNo: user.phoneNo,
          merchant: user.merchant
        }
      }
    });

  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ 
        success: false,
        error: 'Invalid token' 
      });
    }
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ 
        success: false,
        error: 'Token expired' 
      });
    }
    console.error('Auth error:', error);
    res.status(500).json({ 
      success: false,
      error: 'Internal server error' 
    });
  }
});

module.exports = router;

