# 🚀 Installation Guide

Complete installation and setup guide for the Chat Commerce Platform.

## 📋 Prerequisites

Before you begin, ensure you have the following installed:

### Required
- **Node.js**: Version 18.0.0 or higher
- **npm**: Version 9.0.0 or higher (comes with Node.js)

### Optional
- **Git**: For version control
- **VS Code**: Recommended editor

### Check Your Versions
```bash
node --version    # Should be v18.0.0 or higher
npm --version     # Should be 9.0.0 or higher
```

### Install Node.js (if needed)
- **macOS**: `brew install node` or download from https://nodejs.org
- **Windows**: Download from https://nodejs.org
- **Linux**: `sudo apt install nodejs npm` or use nvm

---

## 📦 Installation Steps

### Step 1: Navigate to Frontend Directory
```bash
cd /Users/jatin.g/go/src/github.com/razorpay/ai_marketplace/fe
```

### Step 2: Install Dependencies
```bash
npm install
```

This will install:
- React 18.3.1
- React DOM 18.3.1
- Vite 5.1.4
- Tailwind CSS 3.4.1
- Lucide React 0.344.0
- And other dev dependencies

**Expected output:**
```
added 234 packages, and audited 235 packages in 15s

89 packages are looking for funding
  run `npm fund` for details

found 0 vulnerabilities
```

### Step 3: Configure Environment (Optional)
```bash
# Copy example env file
cp env.example .env

# Edit .env file with your settings
nano .env  # or use your preferred editor
```

Example `.env`:
```env
VITE_MCP_SERVER_URL=http://localhost:8000
VITE_API_KEY=your_api_key_here
VITE_ENABLE_PAYMENTS=true
VITE_ENABLE_COUPONS=true
VITE_ENV=development
```

### Step 4: Start Development Server
```bash
npm run dev
```

**Expected output:**
```
  VITE v5.1.4  ready in 523 ms

  ➜  Local:   http://localhost:3000/
  ➜  Network: use --host to expose
  ➜  press h to show help
```

### Step 5: Open in Browser
The app should automatically open at `http://localhost:3000`

If not, manually navigate to: **http://localhost:3000**

---

## ✅ Verify Installation

### 1. Check the UI
You should see:
- ✅ Left sidebar with company icon
- ✅ Center chat area with welcome message
- ✅ Right panel with product cards
- ✅ Bottom command bar
- ✅ Beautiful gradient colors

### 2. Test Basic Functionality

#### Test Search
1. Click the search box in the chat area
2. Type "sneakers"
3. Press Enter or click Search
4. You should see a bot response

#### Test Add to Cart
1. Click "Add" button on any product card
2. Cart icon should show badge with "1"
3. You should see a bot message confirming addition

#### Test Cart View
1. Click the shopping cart icon (top right)
2. You should see your cart items
3. Try adjusting quantity with +/- buttons

#### Test Quick Commands
1. Click "View Cart" button in command bar
2. You should see a bot response about your cart

### 3. Check Console
Open browser DevTools (F12) and check console:
- ✅ No red errors
- ⚠️ Warnings are okay (React dev mode)

---

## 🔧 Troubleshooting

### Issue: Port 3000 Already in Use

**Solution 1**: Kill the process using port 3000
```bash
# macOS/Linux
lsof -ti:3000 | xargs kill -9

# Windows
netstat -ano | findstr :3000
taskkill /PID <PID> /F
```

**Solution 2**: Use a different port
Vite will automatically try the next available port (3001, 3002, etc.)

### Issue: npm install Fails

**Error**: `EACCES` permission denied

**Solution**:
```bash
# Clear npm cache
npm cache clean --force

# Try again
npm install
```

**Error**: `ERESOLVE` dependency conflicts

**Solution**:
```bash
# Use legacy peer deps
npm install --legacy-peer-deps
```

### Issue: Module Not Found

**Error**: `Cannot find module 'react'`

**Solution**:
```bash
# Delete node_modules and reinstall
rm -rf node_modules package-lock.json
npm install
```

### Issue: Blank White Screen

**Possible causes**:
1. JavaScript error (check console)
2. Build issue (restart dev server)
3. Browser cache (hard refresh: Ctrl+Shift+R)

**Solution**:
```bash
# Stop server (Ctrl+C)
# Clear cache
rm -rf node_modules/.vite

# Restart
npm run dev
```

### Issue: Styles Not Loading

**Solution**:
```bash
# Rebuild Tailwind
npm run dev
```

### Issue: Hot Reload Not Working

**Solution**:
```bash
# Restart dev server
# Press Ctrl+C to stop
npm run dev
```

---

## 🏗️ Build for Production

### Build Command
```bash
npm run build
```

**Expected output:**
```
vite v5.1.4 building for production...
✓ 234 modules transformed.
dist/index.html                   0.45 kB │ gzip:  0.29 kB
dist/assets/index-a1b2c3d4.css    8.23 kB │ gzip:  2.15 kB
dist/assets/index-e5f6g7h8.js   143.21 kB │ gzip: 46.32 kB
✓ built in 2.34s
```

### Preview Production Build
```bash
npm run preview
```

Opens at: `http://localhost:4173`

### Build Output
```
fe/
└── dist/
    ├── index.html
    ├── assets/
    │   ├── index-[hash].css
    │   └── index-[hash].js
    └── vite.svg
```

---

## 📁 Project Structure After Installation

```
fe/
├── node_modules/              # Dependencies (auto-generated)
├── dist/                      # Build output (after npm run build)
├── src/
│   ├── components/
│   │   ├── ChatArea.jsx
│   │   ├── CommandBar.jsx
│   │   ├── Message.jsx
│   │   ├── ProductCard.jsx
│   │   ├── ProductDisplay.jsx
│   │   └── Sidebar.jsx
│   ├── config/
│   │   └── mcpConfig.js
│   ├── App.jsx
│   ├── main.jsx
│   └── index.css
├── index.html
├── package.json
├── package-lock.json          # Lock file (auto-generated)
├── vite.config.js
├── tailwind.config.js
├── postcss.config.js
├── .eslintrc.cjs
├── .gitignore
├── .env                       # Your environment variables
├── env.example
├── README.md
├── QUICKSTART.md
├── MCP_INTEGRATION.md
├── COMPONENT_GUIDE.md
├── PROJECT_SUMMARY.md
└── INSTALL.md                 # This file
```

---

## 🎯 Next Steps

### 1. Explore the UI
- Browse products
- Add items to cart
- Try the chat interface
- Test quick commands

### 2. Read Documentation
- `README.md` - Full project overview
- `QUICKSTART.md` - Quick start guide
- `COMPONENT_GUIDE.md` - Component details
- `MCP_INTEGRATION.md` - MCP server integration

### 3. Customize
- Change colors in `tailwind.config.js`
- Modify products in `src/App.jsx`
- Add features to components

### 4. Integrate MCP Server
- Follow `MCP_INTEGRATION.md`
- Configure `.env` with server URL
- Test API endpoints

### 5. Deploy
- Build for production: `npm run build`
- Deploy `dist/` folder to your host
- Configure environment variables

---

## 📊 Dependency Details

### Production Dependencies
```json
{
  "react": "^18.3.1",           // UI library
  "react-dom": "^18.3.1",       // React DOM renderer
  "lucide-react": "^0.344.0",   // Icon library
  "clsx": "^2.1.0"              // Utility for classes
}
```

### Development Dependencies
```json
{
  "@vitejs/plugin-react": "^4.2.1",  // Vite React plugin
  "vite": "^5.1.4",                   // Build tool
  "tailwindcss": "^3.4.1",            // CSS framework
  "autoprefixer": "^10.4.18",         // CSS prefixer
  "postcss": "^8.4.35"                // CSS processor
}
```

---

## 🔒 Security Notes

### Environment Variables
- Never commit `.env` file to git
- Use `.env.example` as template
- Keep API keys secure

### Dependencies
- Regularly update dependencies
- Run `npm audit` to check for vulnerabilities
- Use `npm audit fix` to fix issues

---

## 🆘 Getting Help

### Check Documentation
1. Read error messages carefully
2. Check browser console (F12)
3. Review documentation files
4. Search for similar issues

### Debug Steps
1. Check Node.js version
2. Clear cache and reinstall
3. Restart dev server
4. Hard refresh browser
5. Check network tab for API errors

### Common Commands
```bash
# Install dependencies
npm install

# Start dev server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Run linter
npm run lint

# Clear cache
rm -rf node_modules/.vite

# Reinstall everything
rm -rf node_modules package-lock.json
npm install
```

---

## ✨ Success!

If you see the beautiful chat commerce interface with:
- ✅ Gradient colors
- ✅ Product cards
- ✅ Chat interface
- ✅ Shopping cart
- ✅ Command bar

**Congratulations! Your installation is complete!** 🎉

---

## 📞 Support

For issues or questions:
1. Check this installation guide
2. Review error messages
3. Check browser console
4. Verify all prerequisites
5. Try troubleshooting steps

---

**Happy coding!** 🚀

