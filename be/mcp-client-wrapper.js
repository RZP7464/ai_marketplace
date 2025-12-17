#!/usr/bin/env node

/**
 * MCP Client Wrapper for Cursor
 * Bridges HTTP MCP server to stdio protocol required by Cursor
 */

const axios = require('axios');
const readline = require('readline');

const MERCHANT_ID = process.argv[2] || process.env.MERCHANT_ID;
const BASE_URL = process.argv[3] || process.env.API_BASE_URL || process.env.BASE_URL || 'http://localhost:3001';

if (!MERCHANT_ID) {
  console.error('Error: MERCHANT_ID required');
  process.exit(1);
}

const MCP_BASE = `${BASE_URL}/api/mcp/merchants/${MERCHANT_ID}`;

// Setup stdio communication
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
  terminal: false
});

let messageBuffer = '';

rl.on('line', async (line) => {
  messageBuffer += line;
  
  try {
    const request = JSON.parse(messageBuffer);
    messageBuffer = '';
    
    const response = await handleRequest(request);
    console.log(JSON.stringify(response));
  } catch (error) {
    // Not a complete JSON yet, continue buffering
    if (error instanceof SyntaxError) {
      return;
    }
    
    console.error(JSON.stringify({
      jsonrpc: '2.0',
      error: {
        code: -32603,
        message: error.message
      },
      id: null
    }));
  }
});

async function handleRequest(request) {
  const { method, params, id } = request;

  try {
    // Forward request to HTTP MCP server
    const response = await axios.post(`${MCP_BASE}/rpc`, {
      jsonrpc: '2.0',
      method,
      params,
      id
    });

    return response.data;
  } catch (error) {
    return {
      jsonrpc: '2.0',
      error: {
        code: -32603,
        message: error.message
      },
      id
    };
  }
}

// Handle process signals
process.on('SIGINT', () => {
  process.exit(0);
});

process.on('SIGTERM', () => {
  process.exit(0);
});

