import React from "react";
import { Sparkles } from "lucide-react";

interface ProductSuggestionsProps {
  products: string[];
  onProductClick: (product: string) => void;
}

const ProductSuggestions: React.FC<ProductSuggestionsProps> = ({
  products,
  onProductClick,
}) => {
  if (!products || products.length === 0) {
    return null;
  }

  return (
    <div className="flex justify-start mb-4">
      <div className="max-w-xs lg:max-w-md ml-10">
        <div className="flex items-center space-x-1 mb-2">
          <Sparkles className="w-4 h-4 text-secondary-500" />
          <span className="text-sm font-medium text-gray-600">Sugestões:</span>
        </div>

        <div className="suggested-products">
          {products.map((product, index) => (
            <button
              key={index}
              onClick={() => onProductClick(`Quero ${product}`)}
              className="product-chip group"
            >
              <span className="group-hover:font-semibold transition-all">
                {product}
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ProductSuggestions;
