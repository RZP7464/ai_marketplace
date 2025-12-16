# API Integration Guide

## Overview
This document explains how the frontend integrates with the backend API for authentication and other features.

## Backend API
- **Base URL**: `http://localhost:3001`
- **API Prefix**: `/api`

## Authentication Flow

### 1. Login
**Endpoint**: `POST /api/auth/login`

**Request Body**:
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**Success Response** (200):
```json
{
  "success": true,
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": 1,
      "name": "John Doe",
      "email": "user@example.com",
      "phoneNo": "1234567890",
      "merchant": {
        "id": 1,
        "name": "Merchant Name",
        "slug": "merchant-slug",
        "type": "general"
      }
    }
  }
}
```

**Error Response** (401):
```json
{
  "success": false,
  "error": "Invalid email or password"
}
```

### 2. Register
**Endpoint**: `POST /api/auth/register`

**Request Body**:
```json
{
  "name": "John Doe",
  "email": "user@example.com",
  "password": "password123",
  "phoneNo": "1234567890",
  "merchantId": 1
}
```

**Success Response** (201):
```json
{
  "success": true,
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": 1,
      "name": "John Doe",
      "email": "user@example.com",
      "phoneNo": "1234567890",
      "merchant": {
        "id": 1,
        "name": "Merchant Name",
        "slug": "merchant-slug",
        "type": "general"
      }
    }
  }
}
```

### 3. Get Current User
**Endpoint**: `GET /api/auth/me`

**Headers**:
```
Authorization: Bearer <token>
```

**Success Response** (200):
```json
{
  "success": true,
  "data": {
    "user": {
      "id": 1,
      "name": "John Doe",
      "email": "user@example.com",
      "phoneNo": "1234567890",
      "merchant": {
        "id": 1,
        "name": "Merchant Name",
        "slug": "merchant-slug",
        "type": "general"
      }
    }
  }
}
```

## Frontend Implementation

### API Service (`src/services/api.js`)

The API service is a singleton class that handles all API requests:

```javascript
import apiService from '../services/api';

// Login
const response = await apiService.login(email, password);

// Register
const response = await apiService.register({
  name: 'John Doe',
  email: 'user@example.com',
  password: 'password123',
  phoneNo: '1234567890',
  merchantId: 1
});

// Get current user
const response = await apiService.getCurrentUser();

// Logout
apiService.logout();

// Check if authenticated
const isAuth = apiService.isAuthenticated();
```

### Token Management

The API service automatically:
- Stores JWT token in localStorage
- Attaches token to all authenticated requests
- Handles token expiration
- Provides methods to check authentication status

### Login Component

The `MerchantLogin` component now:
1. Uses the API service for authentication
2. Displays error messages
3. Handles loading states
4. Stores user data in localStorage
5. Calls the `onLogin` callback with user data

## Environment Variables

Create a `.env` file in the frontend root:

```env
VITE_API_URL=http://localhost:3001
```

## Testing the Integration

### 1. Start the Backend
```bash
cd be
npm install
npm run dev
```

### 2. Start the Frontend
```bash
cd fe
npm install
npm run dev
```

### 3. Test Login
1. Navigate to the login page
2. Enter credentials
3. Check browser console for API requests
4. Check localStorage for token and user data

## Database Setup

Before testing, ensure the database is set up:

```bash
cd be
npx prisma migrate dev
npx prisma db seed  # If you have seed data
```

### Create a Test User

You can create a test user using Prisma Studio or directly via SQL:

```bash
cd be
npx prisma studio
```

Or create a user programmatically:

```javascript
const bcrypt = require('bcryptjs');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function createTestUser() {
  const hashedPassword = await bcrypt.hash('password123', 10);
  
  const user = await prisma.user.create({
    data: {
      name: 'Test User',
      email: 'test@example.com',
      password: hashedPassword,
      phoneNo: '1234567890',
      merchantId: 1  // Make sure this merchant exists
    }
  });
  
  console.log('Test user created:', user);
}

createTestUser();
```

## Error Handling

The API service handles common errors:
- Network errors
- Authentication errors (401)
- Validation errors (400)
- Server errors (500)

All errors are logged to the console and thrown for component-level handling.

## Security Considerations

1. **JWT Token**: Stored in localStorage (consider httpOnly cookies for production)
2. **HTTPS**: Use HTTPS in production
3. **CORS**: Backend has CORS enabled for development
4. **Password Hashing**: Backend uses bcrypt for password hashing
5. **Token Expiration**: Tokens expire after 7 days (configurable)

## Next Steps

1. Add refresh token mechanism
2. Implement password reset flow
3. Add email verification
4. Implement social login (Google, GitHub, etc.)
5. Add two-factor authentication

