import React, { useState } from 'react';
import { Image as ImageIcon, Package, ExternalLink, ChevronDown, ChevronUp, Check, X } from 'lucide-react';

/**
 * Dynamic renderer for MCP tool results
 * Automatically detects and renders:
 * - Images (URLs, base64, image arrays)
 * - Products (with images, prices, descriptions)
 * - Lists and arrays
 * - JSON data
 * - Success/Error states
 */
const ToolResultRenderer = ({ result, toolName }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  if (!result) return null;

  // Extract image URLs from various data structures
  const extractImages = (data) => {
    const images = [];
    
    const findImages = (obj, path = '') => {
      if (!obj) return;
      
      if (typeof obj === 'string') {
        // Check if it's an image URL
        if (obj.match(/\.(jpg|jpeg|png|gif|webp|svg)/i) || 
            obj.startsWith('data:image/') ||
            obj.includes('cloudinary') ||
            obj.includes('unsplash') ||
            obj.includes('images.')) {
          images.push({ url: obj, alt: path || 'Image' });
        }
      } else if (Array.isArray(obj)) {
        obj.forEach((item, idx) => findImages(item, `${path}[${idx}]`));
      } else if (typeof obj === 'object') {
        // Check for common image field names
        const imageFields = ['image', 'img', 'thumbnail', 'photo', 'picture', 'imageUrl', 'image_url'];
        imageFields.forEach(field => {
          if (obj[field]) {
            const imgUrl = typeof obj[field] === 'string' ? obj[field] : obj[field]?.url;
            if (imgUrl) {
              images.push({ 
                url: imgUrl, 
                alt: obj.title || obj.name || obj.alt || field 
              });
            }
          }
        });
        
        // Recursively search other fields
        Object.entries(obj).forEach(([key, value]) => {
          if (!imageFields.includes(key.toLowerCase())) {
            findImages(value, path ? `${path}.${key}` : key);
          }
        });
      }
    };
    
    findImages(data);
    return [...new Set(images.map(img => JSON.stringify(img)))].map(img => JSON.parse(img));
  };

  // Extract product data
  const extractProducts = (data) => {
    if (!data) return [];
    
    // Handle array of products
    if (Array.isArray(data)) {
      return data.filter(item => 
        item && (item.price || item.name || item.title || item.product_name)
      );
    }
    
    // Handle single product
    if (data.price || data.name || data.title) {
      return [data];
    }
    
    // Handle nested products array
    if (data.products && Array.isArray(data.products)) {
      return data.products;
    }
    
    if (data.items && Array.isArray(data.items)) {
      return data.items;
    }
    
    if (data.results && Array.isArray(data.results)) {
      return data.results;
    }
    
    return [];
  };

  const images = extractImages(result.data || result);
  const products = extractProducts(result.data || result);

  return (
    <div className="mt-3 pt-3 border-t border-gray-200/50">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-gray-700">Tool Results:</span>
          <span className="text-xs text-gray-500 font-mono">{toolName}</span>
          {result.success ? (
            <Check className="w-3 h-3 text-green-600" />
          ) : (
            <X className="w-3 h-3 text-red-600" />
          )}
        </div>
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="text-xs text-blue-600 hover:text-blue-800 flex items-center gap-1"
        >
          {isExpanded ? (
            <>
              Hide <ChevronUp className="w-3 h-3" />
            </>
          ) : (
            <>
              Show <ChevronDown className="w-3 h-3" />
            </>
          )}
        </button>
      </div>

      {/* Error Message */}
      {result.error && (
        <div className="mb-3 p-2 bg-red-50 border border-red-200 rounded text-xs text-red-700">
          <strong>Error:</strong> {result.error}
        </div>
      )}

      {/* Products Grid */}
      {products.length > 0 && (
        <div className="mb-3">
          <div className="flex items-center gap-1 mb-2">
            <Package className="w-3 h-3 text-blue-600" />
            <span className="text-xs font-medium text-gray-700">
              {products.length} Product{products.length > 1 ? 's' : ''} Found
            </span>
          </div>
          <div className="grid grid-cols-2 gap-2 max-h-64 overflow-y-auto">
            {products.slice(0, 8).map((product, idx) => (
              <ProductCard key={idx} product={product} />
            ))}
          </div>
          {products.length > 8 && (
            <p className="text-xs text-gray-500 mt-2 text-center">
              +{products.length - 8} more products
            </p>
          )}
        </div>
      )}

      {/* Images Grid */}
      {images.length > 0 && products.length === 0 && (
        <div className="mb-3">
          <div className="flex items-center gap-1 mb-2">
            <ImageIcon className="w-3 h-3 text-purple-600" />
            <span className="text-xs font-medium text-gray-700">
              {images.length} Image{images.length > 1 ? 's' : ''}
            </span>
          </div>
          <div className="grid grid-cols-3 gap-2 max-h-48 overflow-y-auto">
            {images.map((img, idx) => (
              <ImageCard key={idx} image={img} />
            ))}
          </div>
        </div>
      )}

      {/* Raw JSON Data (collapsed by default) */}
      {isExpanded && (
        <div className="mt-2">
          <pre className="text-xs bg-gray-50 border border-gray-200 rounded p-2 overflow-x-auto max-h-64">
            {JSON.stringify(result.data || result, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
};

// Product Card Component
const ProductCard = ({ product }) => {
  const [imgError, setImgError] = useState(false);
  
  const image = product.image || product.img || product.thumbnail || product.photo;
  const name = product.name || product.title || product.product_name || 'Product';
  const price = product.price || product.cost || product.amount;
  const url = product.url || product.link || product.product_url;

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-2 hover:shadow-md transition-shadow">
      {image && !imgError && (
        <img
          src={image}
          alt={name}
          className="w-full h-20 object-cover rounded mb-2"
          onError={() => setImgError(true)}
        />
      )}
      <h4 className="text-xs font-medium text-gray-800 line-clamp-2 mb-1">
        {name}
      </h4>
      {price && (
        <p className="text-xs font-semibold text-green-600">
          ₹{typeof price === 'number' ? price.toLocaleString() : price}
        </p>
      )}
      {url && (
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs text-blue-600 hover:underline flex items-center gap-1 mt-1"
        >
          View <ExternalLink className="w-3 h-3" />
        </a>
      )}
    </div>
  );
};

// Image Card Component
const ImageCard = ({ image }) => {
  const [imgError, setImgError] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  if (imgError) return null;

  return (
    <>
      <div 
        className="relative aspect-square bg-gray-100 rounded overflow-hidden cursor-pointer hover:opacity-90 transition-opacity"
        onClick={() => setIsOpen(true)}
      >
        <img
          src={image.url}
          alt={image.alt}
          className="w-full h-full object-cover"
          onError={() => setImgError(true)}
        />
      </div>

      {/* Image Modal */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4"
          onClick={() => setIsOpen(false)}
        >
          <div className="max-w-4xl max-h-[90vh] relative">
            <button
              onClick={() => setIsOpen(false)}
              className="absolute -top-10 right-0 text-white hover:text-gray-300"
            >
              <X className="w-6 h-6" />
            </button>
            <img
              src={image.url}
              alt={image.alt}
              className="max-w-full max-h-[90vh] object-contain rounded-lg"
            />
            {image.alt && (
              <p className="text-white text-sm text-center mt-2">{image.alt}</p>
            )}
          </div>
        </div>
      )}
    </>
  );
};

export default ToolResultRenderer;

