import React, { useState } from 'react';
import { Package, ExternalLink, ChevronDown, ChevronUp, Check, X, Star, Tag, ShoppingBag } from 'lucide-react';

/**
 * AI-Normalized Tool Result Renderer
 * 
 * Renders products from AI-normalized API responses in a clean, consistent format.
 * The backend uses Gemini to parse ANY API response into this structure:
 * {
 *   products: [{ id, name, price, originalPrice, currency, image, description, brand, url, rating }],
 *   totalCount: number,
 *   summary: string
 * }
 */
const ToolResultRenderer = ({ result, toolName }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [showAll, setShowAll] = useState(false);

  if (!result) return null;

  // Handle the normalized structure from backend
  const { products = [], totalCount, summary, raw } = result;
  const displayProducts = showAll ? products : products.slice(0, 6);

  return (
    <div className="mt-3 pt-3 border-t border-gray-700/50">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-400">Tool Results:</span>
          <span className="text-xs font-mono px-2 py-0.5 bg-green-500/20 text-green-400 rounded">
            {toolName}
          </span>
          <Check className="w-3 h-3 text-green-500" />
        </div>
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1"
        >
          {isExpanded ? 'Hide' : 'Show'}
          {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
        </button>
      </div>

      {/* Products Count */}
      {products.length > 0 && (
        <div className="flex items-center gap-2 mb-3">
          <Package className="w-4 h-4 text-green-500" />
          <span className="text-sm font-medium text-white">
            {totalCount || products.length} Products Found
          </span>
        </div>
      )}

      {/* Products Grid */}
      {products.length > 0 && (
        <div className="grid grid-cols-2 gap-3">
          {displayProducts.map((product, idx) => (
            <ProductCard key={product.id || idx} product={product} />
          ))}
        </div>
      )}

      {/* Show More Button */}
      {products.length > 6 && (
        <button
          onClick={() => setShowAll(!showAll)}
          className="w-full mt-3 py-2 text-sm text-blue-400 hover:text-blue-300 hover:bg-blue-500/10 rounded-lg transition-colors"
        >
          {showAll ? 'Show Less' : `+${products.length - 6} more products`}
        </button>
      )}

      {/* No Products Found */}
      {products.length === 0 && summary && (
        <div className="text-sm text-gray-400 py-2">
          {summary}
        </div>
      )}

      {/* Raw JSON (collapsed) */}
      {isExpanded && raw && (
        <div className="mt-3">
          <div className="text-xs text-gray-500 mb-1">Raw API Response:</div>
          <pre className="text-xs bg-gray-900 border border-gray-700 rounded-lg p-3 overflow-x-auto max-h-48 text-gray-400">
            {JSON.stringify(raw, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
};

/**
 * Product Card - Renders a single product with consistent styling
 */
const ProductCard = ({ product }) => {
  const [imgError, setImgError] = useState(false);
  
  const {
    name,
    price,
    originalPrice,
    currency = '₹',
    discount,
    image,
    description,
    brand,
    url,
    rating,
    category
  } = product;

  // Format price with currency
  const formatPrice = (p) => {
    if (!p && p !== 0) return null;
    const num = typeof p === 'number' ? p : parseFloat(p);
    if (isNaN(num)) return p;
    return num.toLocaleString('en-IN');
  };

  const hasDiscount = originalPrice && originalPrice > price;

  return (
    <div className="bg-white rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow">
      {/* Image */}
      {image && !imgError ? (
        <div className="relative aspect-square bg-gray-100">
          <img
            src={image}
            alt={name}
            className="w-full h-full object-cover"
            onError={() => setImgError(true)}
          />
          {/* Discount Badge */}
          {discount && (
            <div className="absolute top-2 left-2 bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded">
              {discount}
            </div>
          )}
          {/* Rating Badge */}
          {rating && (
            <div className="absolute top-2 right-2 bg-yellow-400 text-yellow-900 text-xs font-bold px-1.5 py-0.5 rounded flex items-center gap-0.5">
              <Star className="w-3 h-3 fill-current" />
              {rating}
            </div>
          )}
        </div>
      ) : (
        <div className="aspect-square bg-gray-100 flex items-center justify-center">
          <ShoppingBag className="w-8 h-8 text-gray-300" />
        </div>
      )}

      {/* Content */}
      <div className="p-3">
        {/* Brand */}
        {brand && (
          <p className="text-xs text-gray-500 font-medium mb-0.5 truncate">
            {brand}
          </p>
        )}

        {/* Name */}
        <h4 className="text-sm font-medium text-gray-900 line-clamp-2 mb-1.5 min-h-[2.5rem]">
          {name}
        </h4>

        {/* Category Tag */}
        {category && (
          <div className="flex items-center gap-1 mb-2">
            <Tag className="w-3 h-3 text-gray-400" />
            <span className="text-xs text-gray-500">{category}</span>
          </div>
        )}

        {/* Price */}
        <div className="flex items-baseline gap-2">
          <span className="text-base font-bold text-green-600">
            {currency}{formatPrice(price)}
          </span>
          {hasDiscount && (
            <span className="text-xs text-gray-400 line-through">
              {currency}{formatPrice(originalPrice)}
            </span>
          )}
        </div>

        {/* Description */}
        {description && (
          <p className="text-xs text-gray-500 mt-1.5 line-clamp-2">
            {description}
          </p>
        )}

        {/* View Link */}
        {url && (
          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-2 flex items-center gap-1 text-xs text-blue-600 hover:text-blue-700 font-medium"
          >
            View Product
            <ExternalLink className="w-3 h-3" />
          </a>
        )}
      </div>
    </div>
  );
};

export default ToolResultRenderer;
