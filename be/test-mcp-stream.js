#!/usr/bin/env node

/**
 * Test MCP Stream Client
 * Tests the SSE-based MCP server
 */

const EventSource = require('eventsource');
const axios = require('axios');

// Fix for eventsource module
const EventSourceConstructor = EventSource.EventSource || EventSource;

const BASE_URL = 'http://localhost:3001/api/mcp';
const MERCHANT_ID = process.argv[2] || '10'; // Default to FashionHub

console.log('🚀 MCP Stream Test Client\n');
console.log(`Testing merchant ID: ${MERCHANT_ID}`);
console.log(`Base URL: ${BASE_URL}\n`);

async function listAllServers() {
  console.log('📋 Listing all available MCP servers...\n');
  
  try {
    const response = await axios.get(`${BASE_URL}/servers`);
    const { servers, count } = response.data;
    
    console.log(`Found ${count} MCP servers:\n`);
    
    servers.forEach(server => {
      console.log(`  🏪 ${server.merchantName}`);
      console.log(`     ID: ${server.merchantId}`);
      console.log(`     Slug: ${server.merchantSlug}`);
      console.log(`     APIs: ${server.apisCount}`);
      console.log(`     MCP URL: ${server.mcpUrl}\n`);
    });
    
    return servers;
  } catch (error) {
    console.error('❌ Error listing servers:', error.message);
    return [];
  }
}

async function getMerchantInfo(merchantId) {
  console.log(`\n📊 Getting MCP server info for merchant ${merchantId}...\n`);
  
  try {
    const response = await axios.get(`${BASE_URL}/merchants/${merchantId}/info`);
    const info = response.data;
    
    console.log('Server Info:');
    console.log(`  Name: ${info.merchant.name}`);
    console.log(`  Protocol: ${info.protocol}`);
    console.log(`  Tools: ${info.tools.count}`);
    console.log(`  Streaming: ${info.capabilities.streaming ? '✅' : '❌'}`);
    console.log(`  JSON-RPC: ${info.capabilities.jsonRpc ? '✅' : '❌'}`);
    console.log('\nEndpoints:');
    console.log(`  Stream: ${info.endpoints.stream}`);
    console.log(`  RPC: ${info.endpoints.rpc}`);
    console.log(`  Tools: ${info.endpoints.tools}`);
    console.log('\nAvailable Tools:');
    info.tools.available.forEach(tool => {
      console.log(`  - ${tool}`);
    });
    
    return info;
  } catch (error) {
    console.error('❌ Error getting info:', error.message);
    return null;
  }
}

async function testSSEStream(merchantId) {
  console.log(`\n🌊 Testing SSE Stream for merchant ${merchantId}...\n`);
  
  return new Promise((resolve, reject) => {
    const streamUrl = `${BASE_URL}/merchants/${merchantId}/stream`;
    const eventSource = new EventSourceConstructor(streamUrl);
    
    let receivedEvents = 0;
    const timeout = setTimeout(() => {
      console.log('\n⏱️  Stream test completed (30s timeout)');
      eventSource.close();
      resolve(receivedEvents);
    }, 30000);
    
    eventSource.onopen = () => {
      console.log('✅ SSE connection established\n');
    };
    
    eventSource.addEventListener('server-info', (event) => {
      const data = JSON.parse(event.data);
      console.log('📡 Received server-info:');
      console.log(`  Protocol: ${data.protocolVersion}`);
      console.log(`  Server: ${data.serverInfo.name}`);
      console.log(`  Tools: ${data.serverInfo.metadata.toolsCount}\n`);
      receivedEvents++;
    });
    
    eventSource.addEventListener('tools-list', (event) => {
      const data = JSON.parse(event.data);
      console.log('🔧 Received tools-list:');
      console.log(`  Count: ${data.tools.length}`);
      data.tools.forEach(tool => {
        console.log(`  - ${tool.name}: ${tool.description}`);
      });
      console.log('');
      receivedEvents++;
    });
    
    eventSource.addEventListener('heartbeat', (event) => {
      const data = JSON.parse(event.data);
      console.log(`💓 Heartbeat: ${data.timestamp}`);
      receivedEvents++;
    });
    
    eventSource.onerror = (error) => {
      console.error('❌ SSE Error:', error.message || 'Connection failed');
      clearTimeout(timeout);
      eventSource.close();
      reject(error);
    };
  });
}

async function testToolExecution(merchantId, toolName, args = {}) {
  console.log(`\n🔨 Testing tool execution: ${toolName}\n`);
  
  try {
    const response = await axios.post(
      `${BASE_URL}/merchants/${merchantId}/tools/${toolName}`,
      { args },
      { headers: { 'Content-Type': 'application/json' } }
    );
    
    const result = response.data.result;
    
    if (result.success) {
      console.log('✅ Tool executed successfully!');
      console.log(`Status: ${result.status}`);
      console.log('Data:', JSON.stringify(result.data, null, 2).substring(0, 500) + '...');
    } else {
      console.log('❌ Tool execution failed');
      console.log(`Error: ${result.error}`);
    }
    
    return result;
  } catch (error) {
    console.error('❌ Error executing tool:', error.message);
    return null;
  }
}

async function testJsonRpc(merchantId) {
  console.log(`\n🔌 Testing JSON-RPC endpoint...\n`);
  
  try {
    // Test initialize
    const initResponse = await axios.post(
      `${BASE_URL}/merchants/${merchantId}/rpc`,
      {
        jsonrpc: '2.0',
        method: 'initialize',
        params: {},
        id: 1
      }
    );
    
    console.log('✅ Initialize:');
    console.log(`  Protocol: ${initResponse.data.result.protocolVersion}`);
    console.log(`  Server: ${initResponse.data.result.serverInfo.name}\n`);
    
    // Test tools/list
    const toolsResponse = await axios.post(
      `${BASE_URL}/merchants/${merchantId}/rpc`,
      {
        jsonrpc: '2.0',
        method: 'tools/list',
        params: {},
        id: 2
      }
    );
    
    console.log('✅ Tools List:');
    console.log(`  Count: ${toolsResponse.data.result.tools.length}`);
    toolsResponse.data.result.tools.forEach(tool => {
      console.log(`  - ${tool.name}`);
    });
    console.log('');
    
    // Test tools/call
    const callResponse = await axios.post(
      `${BASE_URL}/merchants/${merchantId}/rpc`,
      {
        jsonrpc: '2.0',
        method: 'tools/call',
        params: {
          name: 'get_categories',
          arguments: {}
        },
        id: 3
      }
    );
    
    console.log('✅ Tool Call (get_categories):');
    console.log('  Result:', callResponse.data.result.content[0].text);
    
    return true;
  } catch (error) {
    console.error('❌ JSON-RPC Error:', error.message);
    return false;
  }
}

async function main() {
  try {
    // 1. List all available MCP servers
    const servers = await listAllServers();
    
    if (servers.length === 0) {
      console.log('❌ No MCP servers available. Please run the seeder first.');
      process.exit(1);
    }
    
    // 2. Get info for specific merchant
    await getMerchantInfo(MERCHANT_ID);
    
    // 3. Test SSE stream
    console.log('\n' + '='.repeat(60));
    await testSSEStream(MERCHANT_ID);
    
    // 4. Test tool execution
    console.log('\n' + '='.repeat(60));
    await testToolExecution(MERCHANT_ID, 'get_categories');
    
    // 5. Test JSON-RPC
    console.log('\n' + '='.repeat(60));
    await testJsonRpc(MERCHANT_ID);
    
    console.log('\n' + '='.repeat(60));
    console.log('\n✨ All tests completed!\n');
    
  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    process.exit(1);
  }
  
  process.exit(0);
}

// Run tests
main();

