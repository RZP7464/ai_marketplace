const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seeding...\n');

  // Clear existing data
  console.log('🗑️  Clearing existing data...');
  await prisma.chat.deleteMany({});
  await prisma.session.deleteMany({});
  await prisma.user.deleteMany({});
  await prisma.aiConfiguration.deleteMany({});
  await prisma.api.deleteMany({});
  await prisma.credential.deleteMany({});
  await prisma.dynamicSettings.deleteMany({});
  await prisma.merchant.deleteMany({});
  await prisma.standardPayload.deleteMany({});
  console.log('✅ Cleared existing data\n');

  // Create Standard Payloads
  console.log('📦 Creating standard payloads...');
  await prisma.standardPayload.createMany({
    data: [
      {
        apiType: 'GET',
        config: {
          method: 'GET',
          description: 'Fetch data from an endpoint'
        }
      },
      {
        apiType: 'POST',
        config: {
          method: 'POST',
          description: 'Send data to an endpoint'
        }
      },
      {
        apiType: 'PUT',
        config: {
          method: 'PUT',
          description: 'Update data at an endpoint'
        }
      },
      {
        apiType: 'DELETE',
        config: {
          method: 'DELETE',
          description: 'Delete data at an endpoint'
        }
      }
    ]
  });
  console.log('✅ Created standard payloads\n');

  // 1. Fashion E-commerce Merchant
  console.log('👗 Creating Fashion Store merchant...');
  const fashionMerchant = await prisma.merchant.create({
    data: {
      name: 'FashionHub',
      email: 'admin@fashionhub.com',
      slug: 'fashionhub',
      type: 'fashion',
      displayName: 'FashionHub - Your Style Destination',
      tagline: 'Trendy Fashion at Your Fingertips',
      welcomeMessage: 'Welcome to FashionHub! Discover the latest trends in fashion.',
      categories: ['Clothing', 'Accessories', 'Footwear', 'Jewelry'],
      description: 'Leading online fashion retailer offering trendy clothing and accessories',
      website: 'https://fashionhub.com',
      phone: '+91-9876543210',
      address: '123 Fashion Street, Mumbai, Maharashtra 400001',
      dynamicSettings: {
        create: {
          primaryColor: '#FF6B9D',
          secondaryColor: '#C44569',
          accentColor: '#FFA07A',
          header: 'Welcome to FashionHub',
          footer: '© 2024 FashionHub. All rights reserved.'
        }
      }
    }
  });

  // Fashion Store Credentials
  const fashionNoAuth = await prisma.credential.create({
    data: {
      merchantId: fashionMerchant.id,
      authType: 'none',
      header: null,
      username: null,
      password: null
    }
  });

  const fashionApiKey = await prisma.credential.create({
    data: {
      merchantId: fashionMerchant.id,
      authType: 'api-key',
      header: 'X-API-Key',
      username: null,
      password: null
    }
  });

  // Fashion Store APIs
  await prisma.api.createMany({
    data: [
      {
        merchantId: fashionMerchant.id,
        authId: fashionNoAuth.id,
        apiType: 'GET',
        payload: {
          name: 'get_products',
          description: 'Get all fashion products with optional filters',
          url: 'https://fakestoreapi.com/products',
          method: 'GET'
        },
        config: {
          parameters: {
            category: { type: 'string', description: 'Filter by category' },
            limit: { type: 'number', description: 'Limit results' }
          }
        }
      },
      {
        merchantId: fashionMerchant.id,
        authId: fashionNoAuth.id,
        apiType: 'GET',
        payload: {
          name: 'get_product_by_id',
          description: 'Get detailed information about a specific product',
          url: 'https://fakestoreapi.com/products/{{product_id}}',
          method: 'GET'
        },
        config: {
          parameters: {
            product_id: { type: 'string', description: 'Product ID', required: true }
          }
        }
      },
      {
        merchantId: fashionMerchant.id,
        authId: fashionNoAuth.id,
        apiType: 'GET',
        payload: {
          name: 'get_categories',
          description: 'Get all available product categories',
          url: 'https://fakestoreapi.com/products/categories',
          method: 'GET'
        },
        config: {}
      },
      {
        merchantId: fashionMerchant.id,
        authId: fashionApiKey.id,
        apiType: 'POST',
        payload: {
          name: 'create_order',
          description: 'Create a new order for products',
          url: 'https://fakestoreapi.com/products',
          method: 'POST'
        },
        config: {
          parameters: {
            userId: { type: 'number', description: 'User ID', required: true },
            products: { type: 'array', description: 'Array of product IDs', required: true }
          }
        }
      }
    ]
  });

  // Fashion Store AI Configuration
  await prisma.aiConfiguration.create({
    data: {
      merchantId: fashionMerchant.id,
      provider: 'gemini',
      apiKey: process.env.GEMINI_API_KEY || 'your-gemini-api-key',
      model: 'gemini-pro',
      isActive: true,
      config: {
        temperature: 0.7,
        maxTokens: 2048
      }
    }
  });

  console.log('✅ Created FashionHub merchant\n');

  // 2. Electronics Store Merchant
  console.log('📱 Creating Electronics Store merchant...');
  const electronicsMerchant = await prisma.merchant.create({
    data: {
      name: 'TechMart',
      email: 'admin@techmart.com',
      slug: 'techmart',
      type: 'electronics',
      displayName: 'TechMart - Electronics Paradise',
      tagline: 'Latest Tech, Best Prices',
      welcomeMessage: 'Welcome to TechMart! Your one-stop shop for all things tech.',
      categories: ['Smartphones', 'Laptops', 'Tablets', 'Accessories', 'Gaming'],
      description: 'Premier electronics retailer with the latest gadgets and devices',
      website: 'https://techmart.com',
      phone: '+91-9876543211',
      address: '456 Tech Avenue, Bangalore, Karnataka 560001',
      dynamicSettings: {
        create: {
          primaryColor: '#4A90E2',
          secondaryColor: '#357ABD',
          accentColor: '#5DADE2',
          header: 'Welcome to TechMart',
          footer: '© 2024 TechMart. All rights reserved.'
        }
      }
    }
  });

  const techNoAuth = await prisma.credential.create({
    data: {
      merchantId: electronicsMerchant.id,
      authType: 'none',
      header: null,
      username: null,
      password: null
    }
  });

  const techBearer = await prisma.credential.create({
    data: {
      merchantId: electronicsMerchant.id,
      authType: 'bearer',
      header: 'Authorization',
      username: null,
      password: null
    }
  });

  // Electronics Store APIs
  await prisma.api.createMany({
    data: [
      {
        merchantId: electronicsMerchant.id,
        authId: techNoAuth.id,
        apiType: 'GET',
        payload: {
          name: 'search_electronics',
          description: 'Search for electronic products',
          url: 'https://dummyjson.com/products/search',
          method: 'GET'
        },
        config: {
          parameters: {
            q: { type: 'string', description: 'Search query', required: true }
          }
        }
      },
      {
        merchantId: electronicsMerchant.id,
        authId: techNoAuth.id,
        apiType: 'GET',
        payload: {
          name: 'get_product_details',
          description: 'Get detailed specs of an electronic product',
          url: 'https://dummyjson.com/products/{{id}}',
          method: 'GET'
        },
        config: {
          parameters: {
            id: { type: 'number', description: 'Product ID', required: true }
          }
        }
      },
      {
        merchantId: electronicsMerchant.id,
        authId: techBearer.id,
        apiType: 'POST',
        payload: {
          name: 'add_to_cart',
          description: 'Add product to shopping cart',
          url: 'https://dummyjson.com/carts/add',
          method: 'POST'
        },
        config: {
          parameters: {
            userId: { type: 'number', description: 'User ID', required: true },
            products: { type: 'array', description: 'Products to add', required: true }
          }
        }
      }
    ]
  });

  // Electronics Store AI Configuration
  await prisma.aiConfiguration.create({
    data: {
      merchantId: electronicsMerchant.id,
      provider: 'gemini',
      apiKey: process.env.GEMINI_API_KEY || 'your-gemini-api-key',
      model: 'gemini-pro',
      isActive: true,
      config: {
        temperature: 0.8,
        maxTokens: 1024
      }
    }
  });

  console.log('✅ Created TechMart merchant\n');

  // 3. Food Delivery Merchant
  console.log('🍕 Creating Food Delivery merchant...');
  const foodMerchant = await prisma.merchant.create({
    data: {
      name: 'QuickBite',
      email: 'admin@quickbite.com',
      slug: 'quickbite',
      type: 'food',
      displayName: 'QuickBite - Fast Food Delivery',
      tagline: 'Delicious Food, Lightning Fast',
      welcomeMessage: 'Welcome to QuickBite! Order your favorite meals now.',
      categories: ['Pizza', 'Burgers', 'Indian', 'Chinese', 'Desserts'],
      description: 'Quick and reliable food delivery service with wide variety of cuisines',
      website: 'https://quickbite.com',
      phone: '+91-9876543212',
      address: '789 Food Court, Delhi, Delhi 110001',
      dynamicSettings: {
        create: {
          primaryColor: '#FF9500',
          secondaryColor: '#FF6B35',
          accentColor: '#FFB84D',
          header: 'Welcome to QuickBite',
          footer: '© 2024 QuickBite. All rights reserved.'
        }
      }
    }
  });

  const foodBasicAuth = await prisma.credential.create({
    data: {
      merchantId: foodMerchant.id,
      authType: 'basic',
      header: 'Authorization',
      username: 'quickbite_user',
      password: await bcrypt.hash('quickbite_pass', 10)
    }
  });

  // Food Delivery APIs
  await prisma.api.createMany({
    data: [
      {
        merchantId: foodMerchant.id,
        authId: foodBasicAuth.id,
        apiType: 'GET',
        payload: {
          name: 'get_restaurants',
          description: 'Get list of available restaurants',
          url: 'https://dummyjson.com/recipes',
          method: 'GET'
        },
        config: {
          parameters: {
            limit: { type: 'number', description: 'Limit results' }
          }
        }
      },
      {
        merchantId: foodMerchant.id,
        authId: foodBasicAuth.id,
        apiType: 'GET',
        payload: {
          name: 'get_menu',
          description: 'Get menu items for a restaurant',
          url: 'https://dummyjson.com/recipes/{{recipe_id}}',
          method: 'GET'
        },
        config: {
          parameters: {
            recipe_id: { type: 'number', description: 'Recipe/Menu ID', required: true }
          }
        }
      },
      {
        merchantId: foodMerchant.id,
        authId: foodBasicAuth.id,
        apiType: 'POST',
        payload: {
          name: 'place_order',
          description: 'Place a food order',
          url: 'https://dummyjson.com/recipes/add',
          method: 'POST'
        },
        config: {
          parameters: {
            name: { type: 'string', description: 'Order name', required: true },
            ingredients: { type: 'array', description: 'Order items', required: true }
          }
        }
      }
    ]
  });

  // Food Delivery AI Configuration
  await prisma.aiConfiguration.create({
    data: {
      merchantId: foodMerchant.id,
      provider: 'gemini',
      apiKey: process.env.GEMINI_API_KEY || 'your-gemini-api-key',
      model: 'gemini-pro',
      isActive: true,
      config: {
        temperature: 0.9,
        maxTokens: 2048
      }
    }
  });

  console.log('✅ Created QuickBite merchant\n');

  // Create Users for each merchant
  console.log('👥 Creating users...');
  const hashedPassword = await bcrypt.hash('password123', 10);

  await prisma.user.createMany({
    data: [
      {
        merchantId: fashionMerchant.id,
        name: 'John Doe',
        email: 'john@example.com',
        password: hashedPassword,
        phoneNo: '+91-9876000001'
      },
      {
        merchantId: fashionMerchant.id,
        name: 'Jane Smith',
        email: 'jane@example.com',
        password: hashedPassword,
        phoneNo: '+91-9876000002'
      },
      {
        merchantId: electronicsMerchant.id,
        name: 'Mike Johnson',
        email: 'mike@example.com',
        password: hashedPassword,
        phoneNo: '+91-9876000003'
      },
      {
        merchantId: electronicsMerchant.id,
        name: 'Sarah Williams',
        email: 'sarah@example.com',
        password: hashedPassword,
        phoneNo: '+91-9876000004'
      },
      {
        merchantId: foodMerchant.id,
        name: 'David Brown',
        email: 'david@example.com',
        password: hashedPassword,
        phoneNo: '+91-9876000005'
      },
      {
        merchantId: foodMerchant.id,
        name: 'Emily Davis',
        email: 'emily@example.com',
        password: hashedPassword,
        phoneNo: '+91-9876000006'
      }
    ]
  });
  console.log('✅ Created users\n');

  // Create Sessions and Chats
  console.log('💬 Creating chat sessions...');
  
  // Fashion Store Sessions
  const fashionSession1 = await prisma.session.create({
    data: {
      merchantId: fashionMerchant.id
    }
  });

  await prisma.chat.createMany({
    data: [
      {
        sessionId: fashionSession1.id,
        merchantId: fashionMerchant.id,
        message: JSON.stringify({
          role: 'user',
          content: 'Show me trending fashion products'
        })
      },
      {
        sessionId: fashionSession1.id,
        merchantId: fashionMerchant.id,
        message: JSON.stringify({
          role: 'assistant',
          content: 'I found some great trending products for you! Let me fetch the latest fashion items.',
          toolCalls: ['get_products']
        })
      },
      {
        sessionId: fashionSession1.id,
        merchantId: fashionMerchant.id,
        message: JSON.stringify({
          role: 'user',
          content: 'What categories do you have?'
        })
      },
      {
        sessionId: fashionSession1.id,
        merchantId: fashionMerchant.id,
        message: JSON.stringify({
          role: 'assistant',
          content: 'We have categories like Clothing, Accessories, Footwear, and Jewelry.',
          toolCalls: ['get_categories']
        })
      }
    ]
  });

  // Electronics Store Sessions
  const techSession1 = await prisma.session.create({
    data: {
      merchantId: electronicsMerchant.id
    }
  });

  await prisma.chat.createMany({
    data: [
      {
        sessionId: techSession1.id,
        merchantId: electronicsMerchant.id,
        message: JSON.stringify({
          role: 'user',
          content: 'I need a good laptop for programming'
        })
      },
      {
        sessionId: techSession1.id,
        merchantId: electronicsMerchant.id,
        message: JSON.stringify({
          role: 'assistant',
          content: 'Let me search for the best laptops for programming.',
          toolCalls: ['search_electronics']
        })
      }
    ]
  });

  // Food Delivery Sessions
  const foodSession1 = await prisma.session.create({
    data: {
      merchantId: foodMerchant.id
    }
  });

  await prisma.chat.createMany({
    data: [
      {
        sessionId: foodSession1.id,
        merchantId: foodMerchant.id,
        message: JSON.stringify({
          role: 'user',
          content: 'What restaurants are available?'
        })
      },
      {
        sessionId: foodSession1.id,
        merchantId: foodMerchant.id,
        message: JSON.stringify({
          role: 'assistant',
          content: 'Let me show you the available restaurants and their menus.',
          toolCalls: ['get_restaurants']
        })
      },
      {
        sessionId: foodSession1.id,
        merchantId: foodMerchant.id,
        message: JSON.stringify({
          role: 'user',
          content: 'I want to order pizza'
        })
      },
      {
        sessionId: foodSession1.id,
        merchantId: foodMerchant.id,
        message: JSON.stringify({
          role: 'assistant',
          content: 'Great choice! Let me help you place an order for pizza.',
          toolCalls: ['place_order']
        })
      }
    ]
  });

  console.log('✅ Created chat sessions\n');

  // Summary
  console.log('\n🎉 Seeding completed successfully!\n');
  console.log('📊 Summary:');
  console.log('─────────────────────────────────────');
  console.log(`✓ Merchants: 3 (FashionHub, TechMart, QuickBite)`);
  console.log(`✓ Credentials: 5 (various auth types)`);
  console.log(`✓ APIs: 11 (GET, POST across merchants)`);
  console.log(`✓ AI Configurations: 3 (all with Gemini)`);
  console.log(`✓ Users: 6 (2 per merchant)`);
  console.log(`✓ Sessions: 3`);
  console.log(`✓ Chat Messages: 10`);
  console.log('─────────────────────────────────────\n');
  
  console.log('🔐 Test Credentials:');
  console.log('─────────────────────────────────────');
  console.log('Merchant Login:');
  console.log('  • admin@fashionhub.com');
  console.log('  • admin@techmart.com');
  console.log('  • admin@quickbite.com');
  console.log('\nUser Login:');
  console.log('  • Any user email (john@example.com, etc.)');
  console.log('  • Password: password123');
  console.log('─────────────────────────────────────\n');
  
  console.log('🚀 Test URLs:');
  console.log('─────────────────────────────────────');
  console.log(`  • FashionHub MCP: http://localhost:3001/api/mcp/merchants/${fashionMerchant.id}/tools`);
  console.log(`  • TechMart MCP: http://localhost:3001/api/mcp/merchants/${electronicsMerchant.id}/tools`);
  console.log(`  • QuickBite MCP: http://localhost:3001/api/mcp/merchants/${foodMerchant.id}/tools`);
  console.log('─────────────────────────────────────\n');
}

main()
  .catch((e) => {
    console.error('\n❌ Error during seeding:');
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

