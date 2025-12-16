/**
 * Test MCP Server Setup Script
 * 
 * This script creates a test merchant with sample APIs
 * to demonstrate the MCP server functionality
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function setup() {
  console.log('🚀 Setting up MCP Test Environment...\n');

  try {
    // 1. Create or get test merchant
    const merchant = await prisma.merchant.upsert({
      where: { email: 'mcp-test@store.com' },
      update: {},
      create: {
        name: 'MCP Test Store',
        email: 'mcp-test@store.com',
        slug: 'mcp-test-store',
        type: 'ecommerce'
      }
    });

    console.log('✅ Merchant created/found:');
    console.log(`   ID: ${merchant.id}`);
    console.log(`   Name: ${merchant.name}`);
    console.log(`   Slug: ${merchant.slug}\n`);

    // 2. Create credentials for different auth types
    const apiKeyCredential = await prisma.credential.upsert({
      where: { id: merchant.id },
      update: {},
      create: {
        merchantId: merchant.id,
        authType: 'api_key',
        header: 'X-API-Key:test-api-key-123'
      }
    });

    console.log('✅ Credentials created\n');

    // 3. Create sample APIs

    // API 1: Weather API
    const weatherApi = await prisma.api.create({
      data: {
        merchantId: merchant.id,
        authId: apiKeyCredential.id,
        apiType: 'get_weather',
        config: {
          method: 'GET',
          url: 'https://api.weatherapi.com/v1/current.json',
          description: 'Get current weather for a location',
          toolName: 'get_weather',
          parameters: {
            location: {
              type: 'string',
              required: true,
              description: 'City name or coordinates (e.g., "Mumbai" or "19.0760,72.8777")'
            }
          }
        },
        payload: {}
      }
    });

    console.log('✅ API 1: Weather API created');
    console.log(`   Tool Name: get_weather`);
    console.log(`   Description: Get current weather\n`);

    // API 2: Mock Email API
    const emailApi = await prisma.api.create({
      data: {
        merchantId: merchant.id,
        authId: apiKeyCredential.id,
        apiType: 'send_email',
        config: {
          method: 'POST',
          url: 'https://api.example.com/send-email',
          description: 'Send email notification',
          toolName: 'send_email',
          parameters: {
            to: {
              type: 'string',
              required: true,
              description: 'Recipient email address'
            },
            subject: {
              type: 'string',
              required: true,
              description: 'Email subject'
            },
            body: {
              type: 'string',
              required: true,
              description: 'Email body content'
            }
          }
        },
        payload: {
          to: '{{to}}',
          subject: '{{subject}}',
          body: '{{body}}',
          from: 'noreply@teststore.com'
        }
      }
    });

    console.log('✅ API 2: Email API created');
    console.log(`   Tool Name: send_email`);
    console.log(`   Description: Send email notification\n`);

    // API 3: Product Search API
    const productApi = await prisma.api.create({
      data: {
        merchantId: merchant.id,
        authId: apiKeyCredential.id,
        apiType: 'search_products',
        config: {
          method: 'GET',
          url: 'https://api.store.com/products/search',
          description: 'Search products in catalog',
          toolName: 'search_products',
          parameters: {
            query: {
              type: 'string',
              required: true,
              description: 'Search query'
            },
            limit: {
              type: 'number',
              required: false,
              description: 'Maximum results to return'
            }
          }
        },
        payload: {}
      }
    });

    console.log('✅ API 3: Product Search API created');
    console.log(`   Tool Name: search_products`);
    console.log(`   Description: Search products\n`);

    // Summary
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('✨ MCP Server Setup Complete!\n');
    console.log('📍 MCP Endpoints:');
    console.log(`   Base: http://localhost:3001/api/mcp/${merchant.id}`);
    console.log(`   Tools List: http://localhost:3001/api/mcp/${merchant.id}/tools`);
    console.log(`   Server Info: http://localhost:3001/api/mcp/${merchant.id}/info\n`);

    console.log('🧪 Test Commands:\n');
    console.log('1. List all tools:');
    console.log(`   curl http://localhost:3001/api/mcp/${merchant.id}/tools | json_pp\n`);

    console.log('2. Get server info:');
    console.log(`   curl http://localhost:3001/api/mcp/${merchant.id}/info | json_pp\n`);

    console.log('3. Execute weather tool:');
    console.log(`   curl -X POST http://localhost:3001/api/mcp/${merchant.id}/tools/get_weather \\`);
    console.log(`     -H "Content-Type: application/json" \\`);
    console.log(`     -d '{"args": {"location": "Mumbai"}}'\n`);

    console.log('4. Execute email tool:');
    console.log(`   curl -X POST http://localhost:3001/api/mcp/${merchant.id}/tools/send_email \\`);
    console.log(`     -H "Content-Type: application/json" \\`);
    console.log(`     -d '{"args": {"to": "user@example.com", "subject": "Test", "body": "Hello!"}}'\n`);

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

  } catch (error) {
    console.error('❌ Error during setup:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run setup
setup()
  .then(() => {
    console.log('\n✅ Setup completed successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Setup failed:', error);
    process.exit(1);
  });

