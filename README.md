# 🚀 AI Marketplace

AI-powered marketplace platform with dynamic MCP (Model Context Protocol) integration, multi-AI provider support, and intelligent chat interfaces.

## 🌟 Features

- **🤖 Multi-AI Provider Support** - Gemini AI, OpenAI, and more
- **🔧 Dynamic MCP Tools** - Merchant APIs automatically become AI tools
- **💬 Intelligent Chat Interface** - AI-powered customer interactions
- **🏪 Multi-Merchant Platform** - Support for multiple e-commerce stores
- **🎨 Custom Branding** - Merchant-specific themes and styling
- **🔐 Flexible Authentication** - API Key, Bearer, Basic Auth, and more

## 📦 Quick Start

### Prerequisites
- Node.js 20.10+
- PostgreSQL database
- Gemini API key (or OpenAI)

### Installation

```bash
# Clone repository
git clone <repository-url>
cd ai_marketplace

# Install backend dependencies
cd be
npm install

# Setup environment
cp .env.example .env
# Edit .env with your database and API keys

# Run migrations
npm run prisma:migrate

# Seed database with mock data
npm run db:seed

# Start backend
npm run dev
```

```bash
# Install frontend dependencies (in new terminal)
cd fe
npm install

# Setup environment
cp env.example .env
# Edit .env if needed

# Start frontend
npm run dev
```

### Access
- **Frontend**: http://localhost:5173
- **Backend**: http://localhost:3001
- **Prisma Studio**: `npm run prisma:studio` (in be/)

## 📚 Documentation

All documentation is organized in the `/docs` folder:

### Getting Started
- 📖 [Quick Start Guide](docs/QUICKSTART.md)
- 🔧 [Installation Guide](docs/INSTALL.md)
- ⚙️ [Setup Complete Guide](docs/SETUP_COMPLETE.md)

### Database & Seeding
- 🗄️ [Database Setup](docs/DATABASE_SETUP.md)
- 🌱 [Seeder Guide](docs/SEED_README.md)
- ⚡ [Seeder Quick Start](docs/SEEDER_QUICK_START.md)

### API & Integration
- 🔌 [API Integration](docs/API_INTEGRATION.md)
- 🤖 [MCP Server](docs/MCP_SERVER.md)
- 💬 [MCP Chat Interface](docs/MCP_CHAT_INTERFACE.md)
- 🔗 [MCP Integration Guide](docs/MCP_INTEGRATION.md)

### Frontend
- 🎨 [Component Guide](docs/COMPONENT_GUIDE.md)
- 📱 [Frontend README](docs/FRONTEND_README.md)
- 🏪 [Merchant Dashboard](docs/MERCHANT_DASHBOARD.md)
- 🎨 [Shopify Redesign](docs/SHOPIFY_REDESIGN.md)
- 📊 [Project Summary](docs/PROJECT_SUMMARY.md)

## 🏗️ Project Structure

```
ai_marketplace/
├── be/                     # Backend (Node.js + Express)
│   ├── prisma/            # Database schema & migrations
│   ├── src/
│   │   ├── routes/        # API routes
│   │   ├── services/      # Business logic
│   │   └── middleware/    # Auth & validation
│   └── package.json
│
├── fe/                     # Frontend (React + Vite)
│   ├── src/
│   │   ├── components/    # React components
│   │   ├── pages/         # Page components
│   │   └── services/      # API clients
│   └── package.json
│
└── docs/                   # Documentation
    └── *.md               # All documentation files
```

## 🎯 Key Concepts

### Dynamic MCP (Model Context Protocol)
Each merchant's APIs are automatically converted into AI-callable tools:
```
Merchant API → MCP Tool → AI can use it in conversations
```

### Multi-AI Provider
Merchants can configure their preferred AI provider:
- **Gemini AI** (Google)
- **OpenAI** (GPT-4, GPT-3.5)
- More coming soon!

### Merchant-Specific Endpoints
Each merchant gets their own MCP endpoint:
```
http://localhost:3001/api/mcp/merchants/{merchantId}/tools
```

## 🧪 Testing

### Mock Data
The seeder creates 3 test merchants:
1. **FashionHub** - Fashion e-commerce
2. **TechMart** - Electronics store
3. **QuickBite** - Food delivery

Test credentials:
```
Email: john@example.com
Password: password123
```

### API Testing
```bash
# Test MCP endpoint
curl http://localhost:3001/api/mcp/merchants/7/tools | jq

# Test chat
curl -X POST http://localhost:3001/api/chat/sessions \
  -H "Content-Type: application/json" \
  -d '{"merchantId": 7}'
```

## 🔐 Environment Variables

### Backend (.env)
```bash
PORT=3001
DATABASE_URL="postgresql://user:password@host/database"
JWT_SECRET=your-secret-key
GEMINI_API_KEY=your-gemini-api-key
```

### Frontend (.env)
```bash
VITE_MCP_SERVER_URL=http://localhost:3001
```

## 🛠️ Tech Stack

### Backend
- Node.js + Express
- Prisma ORM
- PostgreSQL
- JWT Authentication
- Gemini AI / OpenAI

### Frontend
- React 18
- Vite
- TailwindCSS
- Lucide Icons

## 📖 API Documentation

### Main Endpoints

#### Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/register` - User registration

#### Merchant APIs
- `GET /api/merchant-apis` - List merchant APIs
- `POST /api/merchant-apis` - Add new API

#### MCP
- `GET /api/mcp/merchants/:id/tools` - Get merchant tools
- `POST /api/mcp/merchants/:id/execute` - Execute tool

#### Chat
- `POST /api/chat/sessions` - Create chat session
- `POST /api/chat/sessions/:id/messages` - Send message

#### AI Settings
- `GET /api/settings/ai/providers` - List providers
- `POST /api/settings/merchants/:id/ai` - Configure AI

## 🤝 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing`)
5. Open Pull Request

## 📝 License

MIT License - see LICENSE file for details

## 🆘 Support

- 📚 Check the [docs/](docs/) folder for detailed guides
- 🐛 Report issues on GitHub
- 💬 Join our community discussions

---

**Built with ❤️ for the AI Marketplace Hackathon**

