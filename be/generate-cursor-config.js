#!/usr/bin/env node

/**
 * Generate Cursor MCP Configuration
 * Creates JSON config for all merchant MCP servers
 */

const axios = require('axios');
const fs = require('fs');
const path = require('path');

const BASE_URL = process.env.BASE_URL || 'http://localhost:3001';

async function generateCursorConfig() {
  try {
    console.log('🔧 Generating Cursor MCP Configuration...\n');

    // Fetch all MCP servers
    const response = await axios.get(`${BASE_URL}/api/mcp/servers`);
    const { servers } = response.data;

    if (!servers || servers.length === 0) {
      console.error('❌ No MCP servers found. Please run the seeder first.');
      process.exit(1);
    }

    console.log(`Found ${servers.length} MCP servers\n`);

    // Generate Cursor config format
    const cursorConfig = {
      mcpServers: {}
    };

    for (const server of servers) {
      const serverKey = `ai-marketplace-${server.merchantSlug}`;
      
      cursorConfig.mcpServers[serverKey] = {
        command: "node",
        args: [
          path.join(__dirname, "mcp-client-wrapper.js"),
          server.merchantId.toString(),
          BASE_URL
        ],
        env: {
          MERCHANT_ID: server.merchantId.toString(),
          MERCHANT_NAME: server.merchantName,
          MERCHANT_SLUG: server.merchantSlug,
          BASE_URL: BASE_URL
        },
        description: `${server.merchantName} - ${server.apisCount} APIs available`,
        disabled: false
      };

      console.log(`✅ Added: ${server.merchantName} (${serverKey})`);
    }

    // Save to file
    const outputPath = path.join(__dirname, '..', 'cursor-mcp-config.json');
    fs.writeFileSync(outputPath, JSON.stringify(cursorConfig, null, 2));

    console.log(`\n📄 Configuration saved to: ${outputPath}`);
    console.log('\n📋 Copy this to your Cursor settings:\n');
    console.log(JSON.stringify(cursorConfig, null, 2));

    // Also generate simple HTTP transport config
    const httpConfig = {
      mcpServers: {}
    };

    for (const server of servers) {
      const serverKey = `ai-marketplace-${server.merchantSlug}-http`;
      
      httpConfig.mcpServers[serverKey] = {
        url: server.mcpUrl,
        transport: "sse",
        description: `${server.merchantName} via HTTP SSE`,
        disabled: false
      };
    }

    const httpOutputPath = path.join(__dirname, '..', 'cursor-mcp-http-config.json');
    fs.writeFileSync(httpOutputPath, JSON.stringify(httpConfig, null, 2));

    console.log(`\n📄 HTTP config saved to: ${httpOutputPath}`);

    return { cursorConfig, httpConfig, servers };
  } catch (error) {
    console.error('❌ Error generating config:', error.message);
    process.exit(1);
  }
}

// Run
generateCursorConfig();

