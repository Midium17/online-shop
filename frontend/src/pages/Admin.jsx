import React, { useState, useEffect } from 'react';
import api from '../services/api';
import {
  LayoutDashboard,
  ShoppingBag,
  Package,
  FolderTree,
  Users,
  Settings,
  HelpCircle,
  Plus,
  Trash2,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Upload,
  Search,
  Bell,
  Mail,
  RefreshCw,
  ChevronDown
} from 'lucide-react';

export default function Admin() {
  const [activeTab, setActiveTab] = useState('dashboard');

  // Backend Data States
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [orders, setOrders] = useState([]);
  const [customers, setCustomers] = useState([]);

  // Product Form & CRUD States
  const [newProduct, setNewProduct] = useState({
    title: '',
    description: '',
    price: '',
    stock: '',
    image_url: '',
    image_urls: [],
    category_id: '',
  });
  const [editingProductId, setEditingProductId] = useState(null);
  const [imagePreviews, setImagePreviews] = useState([]);
  const [uploading, setUploading] = useState(false);

  // Category Form State
  const [newCategory, setNewCategory] = useState({ name: '', description: '' });

  // Status Filter States
  const [orderFilter, setOrderFilter] = useState('ALL');
  const [orderSearch, setOrderSearch] = useState('');

  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [prodRes, catRes, ordRes, custRes] = await Promise.all([
        api.get('/products/'),
        api.get('/categories/'),
        api.get('/orders/'),
        api.get('/auth/admin/customers'),
      ]);
      setProducts(prodRes.data);
      setCategories(catRes.data);
      setOrders(ordRes.data);
      setCustomers(custRes.data);
    } catch (err) {
      setError('Failed to load admin data. Ensure you are logged in as admin.');
    }
  };

  // Metrics Calculations
  const totalSales = orders.reduce((sum, order) => sum + (order.total_amount || 0), 0);
  const totalOrders = orders.length;
  const netSales = totalSales * 0.92;
  const totalVariants = products.length;

  // Multi-Image Upload Handler
  const handleImageFilesChange = async (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    const previews = files.map(file => URL.createObjectURL(file));
    setImagePreviews(previews);

    const formData = new FormData();
    files.forEach(file => {
      formData.append('files', file);
    });

    setUploading(true);
    setError('');
    try {
      const res = await api.post('/products/upload-image/', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      
      setNewProduct((prev) => ({
        ...prev,
        image_url: res.data.image_url || '',
        image_urls: res.data.image_urls || [],
      }));
    } catch (err) {
      setError('Failed to upload images.');
    } finally {
      setUploading(false);
    }
  };

  // Product CRUD Handlers
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
      resetProductForm();
      fetchData();
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to create product.');
    }
  };

  const handleStartEdit = (product) => {
    setEditingProductId(product.id);
    setNewProduct({
      title: product.title,
      description: product.description || '',
      price: product.price,
      stock: product.stock,
      image_url: product.image_url || '',
      image_urls: product.image_urls || [],
      category_id: product.category_id || '',
    });
    setImagePreviews(product.image_urls?.length > 0 ? product.image_urls : product.image_url ? [product.image_url] : []);
  };

  const handleCancelEdit = () => {
    resetProductForm();
  };

  const resetProductForm = () => {
    setEditingProductId(null);
    setNewProduct({ title: '', description: '', price: '', stock: '', image_url: '', image_urls: [], category_id: '' });
    setImagePreviews([]);
  };

  const handleUpdateProduct = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    try {
      await api.put(`/products/${editingProductId}`, {
        ...newProduct,
        price: parseFloat(newProduct.price),
        stock: parseInt(newProduct.stock),
        category_id: newProduct.category_id ? parseInt(newProduct.category_id) : null,
      });
      setSuccess(`Product #${editingProductId} updated successfully!`);
      resetProductForm();
      fetchData();
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to update product.');
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

  // Category Handlers
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

  // Order Handlers
  const handleUpdateOrderStatus = async (orderId, newStatus) => {
    setError('');
    setSuccess('');
    try {
      await api.patch(`/orders/${orderId}/status`, { status: newStatus });
      setSuccess(`Order #${orderId} updated to ${newStatus}`);
      fetchData();
    } catch (err) {
      setError('Failed to update order status.');
    }
  };

  const filteredOrders = orders.filter((order) => {
    const matchesTab = orderFilter === 'ALL' || order.status.toUpperCase() === orderFilter.toUpperCase();
    const query = orderSearch.toLowerCase();
    const matchesSearch =
      order.customer_email?.toLowerCase().includes(query) ||
      order.first_name?.toLowerCase().includes(query) ||
      order.last_name?.toLowerCase().includes(query) ||
      order.id.toString().includes(query);
    return matchesTab && matchesSearch;
  });

  return (
    <div className="flex min-h-screen bg-[#F8F9FB] text-gray-800 font-sans">
      
      {/* LEFT SIDEBAR MENU */}
      <aside className="w-64 bg-white border-r border-gray-100 flex flex-col justify-between p-6 shrink-0">
        <div>
          <div className="mb-8 flex items-center gap-2">
            <span className="text-2xl font-black tracking-tight text-emerald-900">nxtbn</span>
          </div>

          <p className="text-[11px] font-bold text-gray-400 tracking-wider uppercase mb-3">MENU</p>

          <nav className="space-y-1">
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl font-medium text-sm transition ${
                activeTab === 'dashboard' ? 'bg-emerald-50 text-emerald-700 font-semibold' : 'text-gray-500 hover:bg-gray-50'
              }`}
            >
              <LayoutDashboard className="w-4 h-4" /> Dashboard
            </button>

            <button
              onClick={() => setActiveTab('orders')}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl font-medium text-sm transition ${
                activeTab === 'orders' ? 'bg-emerald-50 text-emerald-700 font-semibold' : 'text-gray-500 hover:bg-gray-50'
              }`}
            >
              <div className="flex items-center gap-3">
                <ShoppingBag className="w-4 h-4" /> Orders
              </div>
              <span className="bg-gray-900 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">{orders.length}</span>
            </button>

            <button
              onClick={() => setActiveTab('products')}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl font-medium text-sm transition ${
                activeTab === 'products' ? 'bg-emerald-50 text-emerald-700 font-semibold' : 'text-gray-500 hover:bg-gray-50'
              }`}
            >
              <Package className="w-4 h-4" /> Products
            </button>

            <button
              onClick={() => setActiveTab('categories')}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl font-medium text-sm transition ${
                activeTab === 'categories' ? 'bg-emerald-50 text-emerald-700 font-semibold' : 'text-gray-500 hover:bg-gray-50'
              }`}
            >
              <FolderTree className="w-4 h-4" /> Category
            </button>

            <button
              onClick={() => setActiveTab('customers')}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl font-medium text-sm transition ${
                activeTab === 'customers' ? 'bg-emerald-50 text-emerald-700 font-semibold' : 'text-gray-500 hover:bg-gray-50'
              }`}
            >
              <div className="flex items-center gap-3">
                <Users className="w-4 h-4" /> Customers
              </div>
              <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded-full">{customers.length}</span>
            </button>
          </nav>
        </div>

        <div className="space-y-1 pt-6 border-t border-gray-100">
          <button className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-gray-500 hover:bg-gray-50 text-sm font-medium">
            <Settings className="w-4 h-4" /> Settings
          </button>
          <button className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-gray-500 hover:bg-gray-50 text-sm font-medium">
            <HelpCircle className="w-4 h-4" /> Get Help
          </button>
        </div>
      </aside>

      {/* MAIN CONTENT AREA */}
      <main className="flex-1 p-8 overflow-y-auto">

        {/* Top Header Row */}
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Hi, Admin</h1>

          <div className="flex items-center gap-4">
            <div className="relative">
              <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-3" />
              <input
                type="text"
                placeholder="Search..."
                className="pl-10 pr-4 py-2 bg-white border border-gray-200 rounded-2xl text-sm outline-none focus:ring-2 focus:ring-emerald-500 w-64 shadow-2xs"
              />
            </div>

            <div className="flex items-center gap-2">
              <button className="p-2 bg-white border border-gray-200 rounded-xl text-gray-600 hover:bg-gray-50">
                <Mail className="w-4 h-4" />
              </button>
              <button className="p-2 bg-white border border-gray-200 rounded-xl text-gray-600 hover:bg-gray-50">
                <Bell className="w-4 h-4" />
              </button>
            </div>

            <div className="flex items-center gap-3 pl-2">
              <div className="w-10 h-10 rounded-full bg-gray-300 flex items-center justify-center font-bold text-gray-600">
                AD
              </div>
              <div>
                <p className="text-sm font-bold text-gray-900 leading-tight">Admin Store</p>
                <p className="text-xs text-gray-400">Main Account</p>
              </div>
            </div>
          </div>
        </div>

        {error && <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-2xl mb-6 text-sm">{error}</div>}
        {success && <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 px-4 py-3 rounded-2xl mb-6 text-sm">{success}</div>}

        {/* ================= TAB 1: DASHBOARD ANALYTICS ================= */}
        {activeTab === 'dashboard' && (
          <div className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
              <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-2xs flex justify-between items-start">
                <div>
                  <p className="text-xs font-medium text-gray-400 mb-1">Total Sales</p>
                  <h3 className="text-2xl font-black text-gray-900">${totalSales.toLocaleString('en-US', { minimumFractionDigits: 2 })}</h3>
                  <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-600 mt-2">
                    <TrendingUp className="w-3 h-3" /> +12.5% from last week
                  </span>
                </div>
                <div className="w-10 h-10 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-600">
                  <DollarSign className="w-5 h-5" />
                </div>
              </div>

              <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-2xs flex justify-between items-start">
                <div>
                  <p className="text-xs font-medium text-gray-400 mb-1">Total Order</p>
                  <h3 className="text-2xl font-black text-gray-900">{totalOrders.toLocaleString()}</h3>
                  <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-600 mt-2">
                    <TrendingUp className="w-3 h-3" /> +1.0% from last week
                  </span>
                </div>
                <div className="w-10 h-10 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-600">
                  <ShoppingBag className="w-5 h-5" />
                </div>
              </div>

              <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-2xs flex justify-between items-start">
                <div>
                  <p className="text-xs font-medium text-gray-400 mb-1">Net Sales</p>
                  <h3 className="text-2xl font-black text-gray-900">${netSales.toLocaleString('en-US', { minimumFractionDigits: 2 })}</h3>
                  <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-600 mt-2">
                    <TrendingUp className="w-3 h-3" /> +1.0% from last week
                  </span>
                </div>
                <div className="w-10 h-10 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-600">
                  <DollarSign className="w-5 h-5" />
                </div>
              </div>

              <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-2xs flex justify-between items-start">
                <div>
                  <p className="text-xs font-medium text-gray-400 mb-1">Total Variant</p>
                  <h3 className="text-2xl font-black text-gray-900">{totalVariants}</h3>
                  <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-rose-500 mt-2">
                    <TrendingDown className="w-3 h-3" /> -2.5% from last week
                  </span>
                </div>
                <div className="w-10 h-10 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-600">
                  <Package className="w-5 h-5" />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-gray-100 shadow-2xs space-y-6">
                <div className="flex justify-between items-center">
                  <h2 className="text-base font-bold text-gray-900">Total Order Overview</h2>
                  <span className="text-xs text-gray-400 flex items-center gap-1">
                    Last update: {new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    <RefreshCw className="w-3 h-3 text-gray-400 cursor-pointer" onClick={fetchData} />
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
                  <div className="bg-[#1A382B] text-white p-5 rounded-2xl space-y-2">
                    <p className="text-xs text-emerald-200">Total orders</p>
                    <h3 className="text-3xl font-black">{totalOrders}</h3>
                    <p className="text-[10px] text-emerald-300">Live store order count</p>
                  </div>

                  <div className="md:col-span-2 space-y-2">
                    <div className="flex justify-between items-center text-xs text-gray-400">
                      <span className="font-semibold text-gray-700">Statistics</span>
                      <span className="border px-2 py-0.5 rounded-lg text-[11px] flex items-center gap-1">All time <ChevronDown className="w-3 h-3" /></span>
                    </div>

                    <div className="h-36 w-full flex items-end pt-4">
                      <svg className="w-full h-full overflow-visible" viewBox="0 0 300 100">
                        <path
                          d="M 0,70 L 50,70 L 100,85 L 150,50 L 200,60 L 250,20 L 300,20"
                          fill="none"
                          stroke="#10B981"
                          strokeWidth="3"
                        />
                        <circle cx="150" cy="50" r="5" fill="#10B981" />
                      </svg>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-2xs flex flex-col justify-between">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-base font-bold text-gray-900">Stock Unit</h2>
                  <span className="text-xs text-gray-400 flex items-center gap-1 border px-2 py-0.5 rounded-lg">Month <ChevronDown className="w-3 h-3" /></span>
                </div>

                <div className="relative w-36 h-36 mx-auto my-2 flex items-center justify-center">
                  <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                    <path
                      d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                      fill="none"
                      stroke="#E5E7EB"
                      strokeWidth="4"
                    />
                    <path
                      d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                      fill="none"
                      stroke="#10B981"
                      strokeWidth="4"
                      strokeDasharray="50, 100"
                    />
                  </svg>
                  <div className="absolute text-center">
                    <span className="text-xs font-bold text-gray-900">100%</span>
                    <p className="text-[9px] text-gray-400">Inventory</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h2 className="text-lg font-bold text-gray-900">Most Selling Products</h2>
                <button onClick={() => setActiveTab('products')} className="bg-[#1A382B] text-white px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 hover:bg-emerald-900 transition">
                  <Plus className="w-4 h-4" /> Add products
                </button>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                {products.slice(0, 6).map((product) => (
                  <div key={product.id} className="bg-white p-3 rounded-2xl border border-gray-100 shadow-2xs flex flex-col justify-between">
                    <div className="aspect-square bg-gray-50 rounded-xl mb-3 overflow-hidden flex items-center justify-center">
                      <img
                        src={product.image_url || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30'}
                        alt={product.title}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-gray-900 truncate">{product.title}</h4>
                      <div className="flex justify-between items-center mt-1">
                        <span className="text-xs font-extrabold text-amber-600">${product.price.toFixed(2)}</span>
                        <span className="text-[10px] text-gray-400">{product.stock} left</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ================= TAB 2: PRODUCTS MANAGEMENT (CRUD + MULTI-IMAGE) ================= */}
        {activeTab === 'products' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="bg-white p-6 rounded-2xl border shadow-2xs h-fit space-y-4">
              <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                {editingProductId ? (
                  <>
                    <RefreshCw className="w-5 h-5 text-amber-600" /> Edit Product #{editingProductId}
                  </>
                ) : (
                  <>
                    <Plus className="w-5 h-5 text-emerald-600" /> Create Product
                  </>
                )}
              </h2>

              <form onSubmit={editingProductId ? handleUpdateProduct : handleCreateProduct} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Title</label>
                  <input
                    type="text"
                    required
                    value={newProduct.title}
                    onChange={(e) => setNewProduct({ ...newProduct, title: e.target.value })}
                    className="w-full px-3 py-2 border rounded-xl text-sm outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Description</label>
                  <textarea
                    rows="2"
                    value={newProduct.description}
                    onChange={(e) => setNewProduct({ ...newProduct, description: e.target.value })}
                    className="w-full px-3 py-2 border rounded-xl text-sm outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">Price ($)</label>
                    <input
                      type="number"
                      step="0.01"
                      required
                      value={newProduct.price}
                      onChange={(e) => setNewProduct({ ...newProduct, price: e.target.value })}
                      className="w-full px-3 py-2 border rounded-xl text-sm outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">Stock</label>
                    <input
                      type="number"
                      required
                      value={newProduct.stock}
                      onChange={(e) => setNewProduct({ ...newProduct, stock: e.target.value })}
                      className="w-full px-3 py-2 border rounded-xl text-sm outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Category</label>
                  <select
                    value={newProduct.category_id}
                    onChange={(e) => setNewProduct({ ...newProduct, category_id: e.target.value })}
                    className="w-full px-3 py-2 border rounded-xl text-sm outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
                  >
                    <option value="">Select Category</option>
                    {categories.map((cat) => (
                      <option key={cat.id} value={cat.id}>{cat.name}</option>
                    ))}
                  </select>
                </div>

                {/* Multi-Image Upload Section */}
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Product Images (Single or Multiple)</label>
                  <div className="space-y-3">
                    <label className="cursor-pointer inline-flex items-center gap-2 bg-emerald-50 text-emerald-700 px-4 py-2 rounded-xl font-medium text-xs hover:bg-emerald-100 transition">
                      <Upload className="w-4 h-4" />
                      <span>{uploading ? 'Uploading Images...' : 'Choose Images'}</span>
                      <input 
                        type="file" 
                        accept="image/*" 
                        multiple 
                        onChange={handleImageFilesChange} 
                        className="hidden" 
                      />
                    </label>

                    {imagePreviews.length > 0 && (
                      <div className="flex flex-wrap gap-2 pt-2">
                        {imagePreviews.map((src, index) => (
                          <div key={index} className="relative">
                            <img src={src} alt={`Preview ${index}`} className="w-14 h-14 object-cover rounded-xl border shadow-2xs" />
                            {index === 0 && (
                              <span className="absolute -bottom-2 -right-1 bg-emerald-600 text-white text-[9px] font-bold px-1 rounded-md">
                                Main
                              </span>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex gap-2">
                  <button
                    type="submit"
                    disabled={uploading}
                    className={`flex-1 py-2.5 rounded-xl text-sm font-semibold transition text-white ${
                      editingProductId ? 'bg-amber-600 hover:bg-amber-700' : 'bg-[#1A382B] hover:bg-emerald-900'
                    }`}
                  >
                    {uploading ? 'Uploading...' : editingProductId ? 'Update Product' : 'Create Product'}
                  </button>

                  {editingProductId && (
                    <button
                      type="button"
                      onClick={handleCancelEdit}
                      className="px-4 py-2.5 bg-gray-100 text-gray-600 rounded-xl text-sm font-semibold hover:bg-gray-200 transition"
                    >
                      Cancel
                    </button>
                  )}
                </div>
              </form>
            </div>

            <div className="lg:col-span-2 space-y-4">
              <h2 className="text-lg font-bold text-gray-900">Store Inventory ({products.length})</h2>
              {products.map((product) => (
                <div key={product.id} className="bg-white p-4 rounded-2xl border border-gray-100 flex items-center justify-between shadow-2xs">
                  <div className="flex items-center gap-4">
                    <img
                      src={product.image_url || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30'}
                      alt={product.title}
                      className="w-14 h-14 object-cover rounded-xl bg-gray-50 shrink-0"
                    />
                    <div>
                      <h3 className="font-bold text-gray-900 text-sm">{product.title}</h3>
                      <p className="text-xs text-emerald-700 font-extrabold">${product.price.toFixed(2)} | Stock: {product.stock}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleStartEdit(product)}
                      className="px-3 py-1.5 bg-amber-50 text-amber-700 rounded-xl text-xs font-semibold hover:bg-amber-100 transition"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDeleteProduct(product.id)}
                      className="p-2 text-gray-400 hover:text-red-600 transition"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ================= TAB 3: CATEGORIES MANAGEMENT ================= */}
        {activeTab === 'categories' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="bg-white p-6 rounded-2xl border shadow-2xs h-fit space-y-4">
              <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                <FolderTree className="w-5 h-5 text-emerald-600" /> Add Category
              </h2>
              <form onSubmit={handleCreateCategory} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Category Name</label>
                  <input
                    type="text"
                    required
                    value={newCategory.name}
                    onChange={(e) => setNewCategory({ ...newCategory, name: e.target.value })}
                    className="w-full px-3 py-2 border rounded-xl text-sm outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Description</label>
                  <textarea
                    rows="3"
                    value={newCategory.description}
                    onChange={(e) => setNewCategory({ ...newCategory, description: e.target.value })}
                    className="w-full px-3 py-2 border rounded-xl text-sm outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
                <button type="submit" className="w-full bg-[#1A382B] text-white py-2.5 rounded-xl text-sm font-semibold hover:bg-emerald-900 transition">
                  Create Category
                </button>
              </form>
            </div>

            <div className="lg:col-span-2 space-y-4">
              <h2 className="text-lg font-bold text-gray-900">Categories ({categories.length})</h2>
              {categories.map((cat) => (
                <div key={cat.id} className="bg-white p-4 rounded-2xl border border-gray-100 shadow-2xs">
                  <h3 className="font-bold text-gray-900 text-sm">{cat.name}</h3>
                  <p className="text-xs text-gray-500 mt-1">{cat.description || 'No description provided.'}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ================= TAB 4: ORDERS MANAGEMENT ================= */}
        {activeTab === 'orders' && (
          <div className="space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-center gap-4 bg-white p-4 rounded-2xl border border-gray-100 shadow-2xs">
              <div className="flex flex-wrap gap-2">
                {['ALL', 'PENDING', 'PROCESSING', 'COMPLETED', 'CANCELLED'].map((status) => (
                  <button
                    key={status}
                    onClick={() => setOrderFilter(status)}
                    className={`px-4 py-1.5 rounded-xl text-xs font-semibold transition ${orderFilter === status ? 'bg-[#1A382B] text-white shadow-xs' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                  >
                    {status}
                  </button>
                ))}
              </div>

              <div className="relative w-full md:w-72">
                <Search className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  placeholder="Search orders..."
                  value={orderSearch}
                  onChange={(e) => setOrderSearch(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 border rounded-xl text-sm outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>

            {filteredOrders.length === 0 ? (
              <div className="bg-white p-12 rounded-2xl border border-gray-100 text-center text-gray-400">
                <ShoppingBag className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="font-medium">No orders found.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredOrders.map((order) => (
                  <div key={order.id} className="bg-white p-6 rounded-2xl border border-gray-100 shadow-2xs space-y-4">
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center border-b pb-4 gap-4">
                      <div>
                        <div className="flex items-center gap-3">
                          <h3 className="font-bold text-gray-900 text-base">Order #{order.id}</h3>
                          <span className="px-3 py-0.5 rounded-full text-xs font-bold uppercase bg-emerald-100 text-emerald-800">
                            {order.status}
                          </span>
                        </div>
                        <p className="text-xs text-gray-500 mt-1">{order.first_name} {order.last_name} ({order.customer_email})</p>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="text-xs text-gray-400 font-medium mr-1">Status:</span>
                        <button onClick={() => handleUpdateOrderStatus(order.id, 'Pending')} className="px-3 py-1 bg-amber-50 text-amber-700 rounded-lg text-xs font-semibold hover:bg-amber-100">Pending</button>
                        <button onClick={() => handleUpdateOrderStatus(order.id, 'Processing')} className="px-3 py-1 bg-blue-50 text-blue-700 rounded-lg text-xs font-semibold hover:bg-blue-100">Processing</button>
                        <button onClick={() => handleUpdateOrderStatus(order.id, 'Completed')} className="px-3 py-1 bg-emerald-50 text-emerald-700 rounded-lg text-xs font-semibold hover:bg-emerald-100">Complete</button>
                      </div>
                    </div>

                    <div className="flex justify-between items-center text-sm font-bold text-gray-900 pt-2">
                      <span>Total Amount</span>
                      <span className="text-emerald-700 text-base">${order.total_amount.toFixed(2)}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ================= TAB 5: CUSTOMERS DIRECTORY & ANALYTICS ================= */}
        {activeTab === 'customers' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-2xs">
                <p className="text-xs font-medium text-gray-400 mb-1">Total Registered Customers</p>
                <h3 className="text-3xl font-black text-gray-900">{customers.length}</h3>
                <span className="text-xs text-emerald-600 font-semibold mt-2 block">Active user accounts</span>
              </div>
              <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-2xs">
                <p className="text-xs font-medium text-gray-400 mb-1">Customers with Purchases</p>
                <h3 className="text-3xl font-black text-gray-900">
                  {customers.filter((c) => c.total_orders > 0).length}
                </h3>
                <span className="text-xs text-emerald-600 font-semibold mt-2 block">Converted buyers</span>
              </div>
              <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-2xs">
                <p className="text-xs font-medium text-gray-400 mb-1">Average Customer Lifetime Value</p>
                <h3 className="text-3xl font-black text-gray-900">
                  ${customers.length > 0 ? (customers.reduce((acc, c) => acc + c.total_spent, 0) / customers.length).toFixed(2) : '0.00'}
                </h3>
                <span className="text-xs text-emerald-600 font-semibold mt-2 block">Revenue per user</span>
              </div>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-2xs space-y-4">
              <h2 className="text-lg font-bold text-gray-900">Complete Customer Information & Shipping Profiles</h2>
              
              {customers.length === 0 ? (
                <div className="p-12 text-center text-gray-400">
                  <Users className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p className="font-medium">No registered customers found yet.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b text-xs text-gray-400 uppercase">
                        <th className="py-3 px-4">Customer</th>
                        <th className="py-3 px-4">Contact & Phone</th>
                        <th className="py-3 px-4">Shipping Address</th>
                        <th className="py-3 px-4">Orders</th>
                        <th className="py-3 px-4">Total Spent</th>
                        <th className="py-3 px-4">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 text-sm">
                      {customers.map((cust) => (
                        <tr key={cust.id} className="hover:bg-gray-50/50 transition">
                          <td className="py-4 px-4 font-semibold text-gray-900 flex items-center gap-3">
                            <div className="w-9 h-9 rounded-full bg-emerald-50 text-emerald-700 flex items-center font-bold justify-center text-xs shrink-0">
                              {cust.email[0].toUpperCase()}
                            </div>
                            <div>
                              <p className="text-xs font-bold text-gray-900">
                                {cust.first_name && cust.first_name !== 'N/A' ? `${cust.first_name} ${cust.last_name || ''}` : 'Guest Account'}
                              </p>
                              <p className="text-xs text-gray-400">{cust.email}</p>
                            </div>
                          </td>

                          <td className="py-4 px-4 text-xs text-gray-600 font-medium">
                            {cust.phone || 'No phone provided'}
                          </td>

                          <td className="py-4 px-4 text-xs text-gray-600">
                            {cust.address && cust.address !== 'N/A' ? (
                              <div>
                                <p>{cust.address}</p>
                                <p className="text-gray-400">{cust.city}, {cust.country}</p>
                              </div>
                            ) : (
                              <span className="text-gray-400 italic">No address on file</span>
                            )}
                          </td>

                          <td className="py-4 px-4 font-medium text-gray-700">
                            {cust.total_orders} orders
                          </td>

                          <td className="py-4 px-4 font-bold text-emerald-700">
                            ${cust.total_spent.toFixed(2)}
                          </td>

                          <td className="py-4 px-4">
                            <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                              cust.total_orders > 0 ? 'bg-emerald-100 text-emerald-800' : 'bg-gray-100 text-gray-600'
                            }`}>
                              {cust.total_orders > 0 ? 'Active Buyer' : 'Registered Guest'}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

      </main>
    </div>
  );
}