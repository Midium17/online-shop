import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { Package, Plus, Trash2, FolderPlus, ShoppingBag, Truck, Upload, CheckCircle, Clock, XCircle, Search } from 'lucide-react';

export default function Admin() {
  const [activeTab, setActiveTab] = useState('products');

  // State for Products
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [newProduct, setNewProduct] = useState({
    title: '',
    description: '',
    price: '',
    stock: '',
    image_url: '',
    category_id: '',
  });
  const [uploading, setUploading] = useState(false);
  const [imagePreview, setImagePreview] = useState(null);

  // State for Categories
  const [newCategory, setNewCategory] = useState({ name: '', description: '' });

  // State for Orders
  const [orders, setOrders] = useState([]);
  const [orderFilter, setOrderFilter] = useState('ALL');
  const [orderSearch, setOrderSearch] = useState('');

  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [prodRes, catRes, ordRes] = await Promise.all([
        api.get('/products/'),
        api.get('/categories/'),
        api.get('/orders/'),
      ]);
      setProducts(prodRes.data);
      setCategories(catRes.data);
      setOrders(ordRes.data);
    } catch (err) {
      setError('Failed to load admin data. Ensure you are logged in as admin.');
    }
  };

  // --- PRODUCT HANDLERS ---
  const handleImageFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setImagePreview(URL.createObjectURL(file));

    const formData = new FormData();
    formData.append('file', file);

    setUploading(true);
    setError('');
    try {
      const res = await api.post('/products/upload-image/', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setNewProduct((prev) => ({ ...prev, image_url: res.data.image_url }));
    } catch (err) {
      setError('Failed to upload image.');
    } finally {
      setUploading(false);
    }
  };

  const handleCreateProduct = async (e) => {
    e.preventDefault();
    if (uploading) return setError('Please wait for image upload to complete.');
    setError('');
    setSuccess('');

    try {
      await api.post('/products/', {
        ...newProduct,
        price: parseFloat(newProduct.price),
        stock: parseInt(newProduct.stock),
        category_id: newProduct.category_id ? parseInt(newProduct.category_id) : null,
      });
      setSuccess('Product created successfully!');
      setNewProduct({ title: '', description: '', price: '', stock: '', image_url: '', category_id: '' });
      setImagePreview(null);
      fetchData();
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to create product.');
    }
  };

  const handleDeleteProduct = async (id) => {
    if (!window.confirm('Are you sure you want to delete this product?')) return;
    try {
      await api.delete(`/products/${id}`);
      fetchData();
    } catch (err) {
      setError('Failed to delete product.');
    }
  };

  // --- CATEGORY HANDLERS ---
  const handleCreateCategory = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    try {
      await api.post('/categories/', newCategory);
      setSuccess('Category created successfully!');
      setNewCategory({ name: '', description: '' });
      fetchData();
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to create category.');
    }
  };

  // --- ORDER HANDLERS ---
  const handleUpdateOrderStatus = async (orderId, newStatus) => {
    setError('');
    setSuccess('');
    try {
      await api.patch(`/orders/${orderId}/status`, { status: newStatus });
      setSuccess(`Order #${orderId} status updated to ${newStatus}`);
      fetchData();
    } catch (err) {
      setError('Failed to update order status.');
    }
  };

  const filteredOrders = orders.filter((order) => {
    const matchesTab = orderFilter === 'ALL' || order.status.toUpperCase() === orderFilter.toUpperCase();
    const query = orderSearch.toLowerCase();
    const matchesSearch = 
      order.customer_email.toLowerCase().includes(query) ||
      (order.first_name && order.first_name.toLowerCase().includes(query)) ||
      (order.last_name && order.last_name.toLowerCase().includes(query)) ||
      order.id.toString().includes(query);
    return matchesTab && matchesSearch;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Dashboard Header & Tabs */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Admin Control Center</h1>
        <div className="flex space-x-2 bg-gray-100 p-1.5 rounded-2xl w-full md:w-auto">
          <button
            onClick={() => setActiveTab('products')}
            className={`flex-1 md:flex-none px-5 py-2.5 rounded-xl font-medium text-sm transition ${activeTab === 'products' ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-600 hover:text-gray-900'}`}
          >
            Products ({products.length})
          </button>
          <button
            onClick={() => setActiveTab('categories')}
            className={`flex-1 md:flex-none px-5 py-2.5 rounded-xl font-medium text-sm transition ${activeTab === 'categories' ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-600 hover:text-gray-900'}`}
          >
            Categories ({categories.length})
          </button>
          <button
            onClick={() => setActiveTab('orders')}
            className={`flex-1 md:flex-none px-5 py-2.5 rounded-xl font-medium text-sm transition ${activeTab === 'orders' ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-600 hover:text-gray-900'}`}
          >
            Customer Orders ({orders.length})
          </button>
        </div>
      </div>

      {error && <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl mb-6 text-sm">{error}</div>}
      {success && <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-xl mb-6 text-sm">{success}</div>}

      {/* ================= PRODUCTS SECTION ================= */}
      {activeTab === 'products' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="bg-white p-6 rounded-2xl border shadow-sm h-fit">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Plus className="w-5 h-5 text-indigo-600" /> Add New Product
            </h2>
            <form onSubmit={handleCreateProduct} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                <input type="text" required value={newProduct.title} onChange={(e) => setNewProduct({ ...newProduct, title: e.target.value })} className="w-full px-3 py-2 border rounded-xl outline-none focus:ring-2 focus:ring-indigo-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea rows="2" value={newProduct.description} onChange={(e) => setNewProduct({ ...newProduct, description: e.target.value })} className="w-full px-3 py-2 border rounded-xl outline-none focus:ring-2 focus:ring-indigo-500" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Price ($)</label>
                  <input type="number" step="0.01" required value={newProduct.price} onChange={(e) => setNewProduct({ ...newProduct, price: e.target.value })} className="w-full px-3 py-2 border rounded-xl outline-none focus:ring-2 focus:ring-indigo-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Stock</label>
                  <input type="number" required value={newProduct.stock} onChange={(e) => setNewProduct({ ...newProduct, stock: e.target.value })} className="w-full px-3 py-2 border rounded-xl outline-none focus:ring-2 focus:ring-indigo-500" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                <select value={newProduct.category_id} onChange={(e) => setNewProduct({ ...newProduct, category_id: e.target.value })} className="w-full px-3 py-2 border rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 bg-white">
                  <option value="">Select Category</option>
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Product Image File</label>
                <div className="flex items-center gap-3">
                  <label className="cursor-pointer flex items-center gap-2 bg-indigo-50 text-indigo-600 px-4 py-2.5 rounded-xl font-medium hover:bg-indigo-100 transition text-sm">
                    <Upload className="w-4 h-4" />
                    <span>{uploading ? 'Uploading...' : 'Choose Image File'}</span>
                    <input type="file" accept="image/*" onChange={handleImageFileChange} className="hidden" />
                  </label>
                  {imagePreview && <img src={imagePreview} alt="Preview" className="w-12 h-12 object-cover rounded-xl border" />}
                </div>
              </div>
              <button type="submit" disabled={uploading} className="w-full bg-indigo-600 text-white py-2.5 rounded-xl font-medium hover:bg-indigo-700 transition">
                {uploading ? 'Uploading...' : 'Create Product'}
              </button>
            </form>
          </div>

          <div className="lg:col-span-2 space-y-4">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Inventory Management</h2>
            {products.map((product) => (
              <div key={product.id} className="bg-white p-4 rounded-2xl border flex items-center justify-between shadow-sm">
                <div className="flex items-center gap-4">
                  <img src={product.image_url || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30'} alt={product.title} className="w-16 h-16 object-cover rounded-xl bg-gray-50" />
                  <div>
                    <h3 className="font-semibold text-gray-900">{product.title}</h3>
                    <p className="text-sm text-indigo-600 font-bold">${product.price.toFixed(2)} | Stock: <span className={product.stock <= 5 ? 'text-red-600 font-bold' : ''}>{product.stock}</span></p>
                  </div>
                </div>
                <button onClick={() => handleDeleteProduct(product.id)} className="text-gray-400 hover:text-red-600 p-2 transition">
                  <Trash2 className="w-5 h-5" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ================= CATEGORIES SECTION ================= */}
      {activeTab === 'categories' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="bg-white p-6 rounded-2xl border shadow-sm h-fit">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <FolderPlus className="w-5 h-5 text-indigo-600" /> Add Category
            </h2>
            <form onSubmit={handleCreateCategory} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Category Name</label>
                <input type="text" required value={newCategory.name} onChange={(e) => setNewCategory({ ...newCategory, name: e.target.value })} className="w-full px-3 py-2 border rounded-xl outline-none focus:ring-2 focus:ring-indigo-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea rows="3" value={newCategory.description} onChange={(e) => setNewCategory({ ...newCategory, description: e.target.value })} className="w-full px-3 py-2 border rounded-xl outline-none focus:ring-2 focus:ring-indigo-500" />
              </div>
              <button type="submit" className="w-full bg-indigo-600 text-white py-2.5 rounded-xl font-medium hover:bg-indigo-700 transition">
                Create Category
              </button>
            </form>
          </div>

          <div className="lg:col-span-2 space-y-4">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Existing Categories</h2>
            {categories.map((cat) => (
              <div key={cat.id} className="bg-white p-4 rounded-2xl border shadow-sm">
                <h3 className="font-semibold text-gray-900">{cat.name}</h3>
                <p className="text-sm text-gray-500">{cat.description || 'No description provided.'}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ================= CUSTOMER ORDERS SECTION ================= */}
      {activeTab === 'orders' && (
        <div className="space-y-6">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4 bg-white p-4 rounded-2xl border shadow-sm">
            {/* Status Filter Buttons */}
            <div className="flex flex-wrap gap-2">
              {['ALL', 'PENDING', 'PROCESSING', 'COMPLETED', 'CANCELLED'].map((status) => (
                <button
                  key={status}
                  onClick={() => setOrderFilter(status)}
                  className={`px-4 py-1.5 rounded-xl text-xs font-semibold transition ${orderFilter === status ? 'bg-indigo-600 text-white shadow-sm' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                >
                  {status}
                </button>
              ))}
            </div>

            {/* Order Search Input */}
            <div className="relative w-full md:w-72">
              <Search className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
              <input
                type="text"
                placeholder="Search by email, name, ID..."
                value={orderSearch}
                onChange={(e) => setOrderSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-2 border rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          {filteredOrders.length === 0 ? (
            <div className="bg-white p-12 rounded-2xl border text-center text-gray-500">
              <ShoppingBag className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="font-medium">No orders found matching your criteria.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredOrders.map((order) => (
                <div key={order.id} className="bg-white p-6 rounded-2xl border shadow-sm space-y-6">
                  
                  {/* Order Header & Status Actions */}
                  <div className="flex flex-col md:flex-row justify-between items-start md:items-center border-b pb-4 gap-4">
                    <div>
                      <div className="flex items-center gap-3">
                        <h3 className="font-bold text-gray-900 text-lg">Order #{order.id}</h3>
                        <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${
                          order.status === 'Completed' ? 'bg-green-100 text-green-700' :
                          order.status === 'Processing' ? 'bg-blue-100 text-blue-700' :
                          order.status === 'Cancelled' ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'
                        }`}>
                          {order.status}
                        </span>
                      </div>
                      <p className="text-sm text-gray-500 mt-1">Placed on customer checkout workflow</p>
                    </div>

                    {/* Status Update Actions */}
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-gray-500 font-medium mr-1">Update Status:</span>
                      <button onClick={() => handleUpdateOrderStatus(order.id, 'Pending')} className="px-3 py-1.5 bg-amber-50 text-amber-700 rounded-lg text-xs font-semibold hover:bg-amber-100 transition">Pending</button>
                      <button onClick={() => handleUpdateOrderStatus(order.id, 'Processing')} className="px-3 py-1.5 bg-blue-50 text-blue-700 rounded-lg text-xs font-semibold hover:bg-blue-100 transition">Processing</button>
                      <button onClick={() => handleUpdateOrderStatus(order.id, 'Completed')} className="px-3 py-1.5 bg-green-50 text-green-700 rounded-lg text-xs font-semibold hover:bg-green-100 transition">Complete</button>
                      <button onClick={() => handleUpdateOrderStatus(order.id, 'Cancelled')} className="px-3 py-1.5 bg-red-50 text-red-700 rounded-lg text-xs font-semibold hover:bg-red-100 transition">Cancel</button>
                    </div>
                  </div>

                  {/* Customer Contact & Full Shipping Details Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-gray-50 p-4 rounded-xl text-sm">
                    <div>
                      <h4 className="font-semibold text-gray-800 mb-2 flex items-center gap-1.5">
                        <Truck className="w-4 h-4 text-indigo-600" /> Customer & Contact Information
                      </h4>
                      <p><span className="text-gray-500">Name:</span> <span className="font-medium text-gray-900">{order.first_name} {order.last_name}</span></p>
                      <p><span className="text-gray-500">Email:</span> <span className="font-medium text-gray-900">{order.customer_email}</span></p>
                      <p><span className="text-gray-500">Phone:</span> <span className="font-medium text-gray-900">{order.phone || 'N/A'}</span></p>
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-800 mb-2">Shipping Destination</h4>
                      <p className="text-gray-700">{order.address || 'N/A'}</p>
                      <p className="text-gray-700">{order.city}, {order.postal_code}</p>
                      <p className="text-gray-700 font-medium">{order.country}</p>
                    </div>
                  </div>

                  {/* Ordered Items Breakdown */}
                  <div>
                    <h4 className="text-sm font-semibold text-gray-700 mb-3">Purchased Items</h4>
                    <div className="space-y-2">
                      {order.items.map((item, index) => (
                        <div key={index} className="flex justify-between items-center text-sm bg-white border border-gray-100 px-4 py-2.5 rounded-xl shadow-2xs">
                          <span className="text-gray-800">Product ID: <strong className="text-indigo-600">{item.product_id}</strong> × Qty: <strong>{item.quantity}</strong></span>
                          <span className="font-semibold text-gray-900">${(item.price * item.quantity).toFixed(2)}</span>
                        </div>
                      ))}
                    </div>
                    <div className="flex justify-between items-center mt-4 pt-3 border-t text-base font-bold text-gray-900">
                      <span>Total Amount (Incl. Shipping)</span>
                      <span className="text-indigo-600 text-lg">${order.total_amount.toFixed(2)}</span>
                    </div>
                  </div>

                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}