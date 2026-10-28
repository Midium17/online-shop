import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { ShoppingCart, Check, Tag } from 'lucide-react';

export default function Storefront({ addToCart }) {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [loading, setLoading] = useState(true);
  const [addedId, setAddedId] = useState(null);

  useEffect(() => {
    fetchCategories();
    fetchProducts();
  }, []);

  const fetchCategories = async () => {
    try {
      const res = await api.get('/categories/');
      setCategories(res.data);
    } catch (err) {
      console.error('Error fetching categories:', err);
    }
  };

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const res = await api.get('/products/');
      setProducts(res.data);
    } catch (err) {
      console.error('Error fetching products:', err);
    } finally {
      setLoading(false);
    }
  };

  const filteredProducts = selectedCategory
    ? products.filter((p) => p.category?.id === selectedCategory)
    : products;

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Explore Products</h1>
        <p className="text-gray-500 mt-1">Discover tech, gadgets, and lifestyle items.</p>
      </div>

      {/* Category Filter Pills */}
      <div className="flex items-center gap-2 overflow-x-auto pb-4 mb-8">
        <button
          onClick={() => setSelectedCategory(null)}
          className={`px-4 py-2 rounded-xl text-sm font-medium transition whitespace-nowrap ${
            selectedCategory === null
              ? 'bg-indigo-600 text-white'
              : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
          }`}
        >
          All Categories
        </button>
        {categories.map((cat) => (
          <button
            key={cat.id}
            onClick={() => setSelectedCategory(cat.id)}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition whitespace-nowrap ${
              selectedCategory === cat.id
                ? 'bg-indigo-600 text-white'
                : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
            }`}
          >
            {cat.name}
          </button>
        ))}
      </div>

      {/* Product Grid */}
      {loading ? (
        <p className="text-gray-500">Loading catalog...</p>
      ) : filteredProducts.length === 0 ? (
        <div className="bg-white p-12 rounded-2xl border text-center text-gray-500">
          No products found in this category.
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProducts.map((product) => (
            <div key={product.id} className="bg-white rounded-2xl border overflow-hidden flex flex-col hover:shadow-md transition">
              <div className="h-48 bg-gray-100 relative">
                <img src={product.image_url || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30'} alt={product.title} className="w-full h-full object-cover" />
                {product.category && (
                  <span className="absolute top-3 left-3 bg-white/90 backdrop-blur-sm text-xs font-semibold px-2.5 py-1 rounded-lg text-gray-700 flex items-center gap-1 shadow-sm">
                    <Tag className="w-3 h-3 text-indigo-600" /> {product.category.name}
                  </span>
                )}
              </div>
              <div className="p-5 flex flex-col flex-grow">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-semibold text-lg text-gray-900">{product.title}</h3>
                  <span className="text-indigo-600 font-bold">${product.price.toFixed(2)}</span>
                </div>
                <p className="text-gray-600 text-sm mb-4 flex-grow">{product.description}</p>
                <button
                  onClick={() => {
                    addToCart(product);
                    setAddedId(product.id);
                    setTimeout(() => setAddedId(null), 1500);
                  }}
                  className="w-full bg-indigo-600 text-white py-2 rounded-xl font-medium text-sm flex items-center justify-center gap-2 hover:bg-indigo-700 transition"
                >
                  {addedId === product.id ? <Check className="w-4 h-4" /> : <ShoppingCart className="w-4 h-4" />}
                  {addedId === product.id ? 'Added' : 'Add to Cart'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}