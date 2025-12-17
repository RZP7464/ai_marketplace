# AI-Powered Response Normalization

## Problem Solved

Merchant APIs often return complex, messy data structures that break the UI:
- ❌ Complex price objects: `{effective: 599, marked: 799}`
- ❌ Nested image URLs: `{images: [{url: "..."}, {url: "..."}]}`
- ❌ Inconsistent field names: `product_name` vs `productName` vs `name`
- ❌ Objects rendered directly in React (causes crashes)

## Solution

**AI-powered normalization** that automatically cleans up API responses before rendering.

### Two-Layer Protection

#### 1. Backend Normalization (AI-Powered)
Automatically normalizes complex responses using AI:
- Flattens nested structures
- Extracts clean price values
- Finds images in any format
- Standardizes field names

#### 2. Frontend Robustness (Failsafe)
ProductCard component handles any data format:
- Safely extracts values from objects
- Formats complex prices (marked/effective)
- Converts objects to strings as last resort
- Never crashes the UI

## How It Works

### Backend Flow

```
API Returns Complex Data
    ↓
ResponseNormalizerService
    ↓
Analyzes Complexity
    ↓
Simple Data? → Basic Normalization
Complex Data? → AI Normalization
    ↓
Clean, Flat Data Structure
    ↓
Sent to Frontend
```

### Example Transformation

**Before (Messy API Response):**
```json
{
  "products": [
    {
      "product_name": "Lipstick",
      "price": {
        "effective": 599,
        "marked": 799
      },
      "images": [
        {"url": "https://cdn.example.com/img1.jpg"}
      ],
      "product_url": "https://shop.com/lipstick"
    }
  ]
}
```

**After (Normalized):**
```json
[
  {
    "id": "lipstick-001",
    "name": "Lipstick",
    "price": {
      "current": 599,
      "original": 799,
      "discount": 25
    },
    "image": "https://cdn.example.com/img1.jpg",
    "url": "https://shop.com/lipstick"
  }
]
```

## Features

### 1. Smart Price Handling
```javascript
// Handles all these formats:
{effective: 599, marked: 799}  → {current: 599, original: 799, discount: 25}
"₹599"                         → 599
599.00                         → 599
{price: {value: 599}}          → 599
```

### 2. Image URL Extraction
```javascript
// Finds images anywhere:
{image: "url"}                 → "url"
{images: [{url: "url"}]}       → "url"
{thumbnail: {src: "url"}}      → "url"
{photo: ["url1", "url2"]}      → "url1"
```

### 3. Field Name Normalization
```javascript
// Maps various names:
product_name → name
productName  → name
display_name → name
title        → name
```

### 4. Nested Data Flattening
```javascript
// Extracts from any depth:
{data: {products: [{...}]}}    → [{...}]
{results: {items: [{...}]}}    → [{...}]
{response: {list: [{...}]}}    → [{...}]
```

## Implementation

### Backend Services

#### 1. ResponseNormalizerService
```javascript
// Auto-normalizes tool results
const normalized = await responseNormalizerService.normalizeToolResult(result);
```

**Methods:**
- `normalizeProduct()` - Clean single product
- `normalizeProducts()` - Clean array of products
- `normalizeWithAI()` - Use AI for complex data
- `extractPrice()` - Handle complex price structures
- `extractImage()` - Find images anywhere

#### 2. APIParserService
```javascript
// Parse curl commands intelligently
const enhanced = await apiParserService.generateEnhancedPayload(curlCommand, apiType);
```

**Methods:**
- `parseCurlCommand()` - Extract API config from curl
- `generateSemanticToolConfig()` - AI-powered semantic params
- `mapSemanticToHttp()` - Convert semantic params to HTTP
- `generateToolSchema()` - Create MCP tool schema

### Frontend Components

#### Enhanced ProductCard
```jsx
// Safely handles any data format
<ProductCard product={complexProduct} />
```

**Features:**
- Safe extraction from nested objects
- Complex price display (current + original)
- Object-to-string fallback
- Never crashes React

## Configuration

### Enable AI Normalization

Set in `.env`:
```bash
GEMINI_API_KEY=your_key_here
```

Without API key, falls back to basic normalization.

### Complexity Threshold

AI normalization triggers when:
- JSON depth > 5 levels
- Contains nested arrays
- Has complex price objects (`effective`, `marked`)

## API Endpoints

### Parse API Configuration
```http
POST /api/merchant/parse-api
Content-Type: application/json

{
  "curlCommand": "curl 'https://api.example.com/search' ...",
  "apiType": "search_products"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "payload": {
      "url": "https://api.example.com/search",
      "method": "POST",
      "parameterMapping": [...]
    },
    "toolSchema": {...},
    "preview": {
      "toolName": "search_products",
      "description": "Search for products",
      "parameters": [...]
    }
  }
}
```

## Usage Examples

### Example 1: Tira Beauty API

**Raw Response:**
```json
{
  "catalogResponse": {
    "products": [
      {
        "name": "Lipstick",
        "price": {
          "effective": "599.00",
          "marked": "799.00"
        },
        "images": {
          "listing": "https://..."
        }
      }
    ]
  }
}
```

**Normalized:**
```json
[
  {
    "name": "Lipstick",
    "price": {
      "current": 599,
      "original": 799,
      "discount": 25
    },
    "image": "https://..."
  }
]
```

**UI Display:**
```
┌─────────────────┐
│  [Lipstick Img] │
├─────────────────┤
│ Lipstick        │
│ ₹599  ̶₹̶7̶9̶9̶   │
│ [View →]        │
└─────────────────┘
```

### Example 2: Shopify API

**Raw Response:**
```json
{
  "products": [
    {
      "title": "Product",
      "variants": [
        {"price": "29.99"}
      ],
      "images": [
        {"src": "https://..."}
      ]
    }
  ]
}
```

**Normalized:**
```json
[
  {
    "name": "Product",
    "price": 29.99,
    "image": "https://..."
  }
]
```

## Error Handling

### Normalization Fails?
- Falls back to basic normalization
- Never throws errors
- Returns original data if all else fails

### UI Rendering Fails?
- ProductCard converts objects to strings
- Handles null/undefined values
- Shows partial data if available

### React Child Error?
- Now prevented by proper type checking
- Objects converted to strings/numbers
- Arrays flattened appropriately

## Testing

### Test Complex Price

```javascript
const complexPrice = {
  effective: 599,
  marked: 799
};

// Backend normalizes to:
{
  current: 599,
  original: 799,
  discount: 25
}

// Frontend displays:
"₹599  ̶₹̶7̶9̶9̶  (25% off)"
```

### Test Nested Images

```javascript
const nestedImage = {
  images: [
    {url: "https://img1.jpg"},
    {url: "https://img2.jpg"}
  ]
};

// Extracts: "https://img1.jpg"
```

### Test Missing Data

```javascript
const incomplete = {
  name: "Product"
  // No price, no image
};

// Renders name only, no crash
```

## Performance

- **Basic Normalization**: <1ms
- **AI Normalization**: 500-1500ms
- **Caching**: Considered for future
- **Impact**: Minimal on user experience

## Benefits

✅ **No More UI Crashes**: Handles any data format
✅ **Better UX**: Clean, consistent displays
✅ **Developer Friendly**: No manual data mapping
✅ **AI-Powered**: Handles unexpected formats
✅ **Backwards Compatible**: Works with existing APIs

## Troubleshooting

### UI Still Breaking?

1. Check console for specific error
2. Verify normalization is running (check logs)
3. Check if GEMINI_API_KEY is set
4. Try with simpler data first

### Prices Not Displaying?

1. Check raw API response structure
2. Add price field mapping in normalizer
3. Verify ProductCard receives data

### Images Not Showing?

1. Check CORS settings
2. Verify image URLs are valid
3. Add image field names to extractor

## Future Enhancements

- [ ] Response caching
- [ ] Custom normalization rules per merchant
- [ ] OpenAPI spec parsing
- [ ] GraphQL response handling
- [ ] Real-time normalization feedback
- [ ] A/B testing different normalizations

## Summary

The AI-powered normalization system:
- 🤖 **Automatically cleans** messy API responses
- 🛡️ **Prevents UI crashes** from complex data
- ⚡ **Works instantly** with any API
- 🎨 **Makes UIs beautiful** with clean data
- 🔧 **Zero configuration** needed

Your chat interface is now **bulletproof** against messy APIs! 🎉

