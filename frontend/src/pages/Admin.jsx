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
  Truck,
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

  // Form States
  const [newProduct, setNewProduct] = useState({
    title: '',
    description: '',
    price: '',
    stock: '',
    image_url: '',
    category_id: '',
  });
  const [newCategory, setNewCategory] = useState({ name: '', description: '' });
  const [uploading, setUploading] = useState(false);
  const [imagePreview, setImagePreview] = useState(null);

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

  // Metrics Calculations
  const totalSales = orders.reduce((sum, order) => sum + (order.total_amount || 0), 0);
  const totalOrders = orders.length;
  const netSales = totalSales * 0.92; // Simulated net calculation (after fees/tax)
  const totalVariants = products.length;

  // Image Upload Handler
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

  // Product Handlers
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
          {/* Logo */}
        {/*  <div className="mb-8 flex items-center gap-2">
            <span className="text-2xl font-black tracking-tight text-emerald-900">nxtbn</span>
          </div>*/} 

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
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl font-medium text-sm transition ${
                activeTab === 'customers' ? 'bg-emerald-50 text-emerald-700 font-semibold' : 'text-gray-500 hover:bg-gray-50'
              }`}
            >
              <Users className="w-4 h-4" /> Customers
            </button>
          </nav>
        </div>

        {/* Footer Nav Links */}
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

          {/* Search bar & Admin profile */}
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
            
            {/* Top 4 Metric KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
              {/* Total Sales */}
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

              {/* Total Order */}
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

              {/* Net Sales */}
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

              {/* Total Variant */}
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

            {/* Total Order Overview & Stock Unit Section */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              
              {/* Sales Statistics Graph Panel */}
              <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-gray-100 shadow-2xs space-y-6">
                <div className="flex justify-between items-center">
                  <h2 className="text-base font-bold text-gray-900 flex items-center gap-2">
                    Total Order Overview
                  </h2>
                  <span className="text-xs text-gray-400 flex items-center gap-1">
                    Last update: {new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    <RefreshCw className="w-3 h-3 text-gray-400 cursor-pointer" onClick={fetchData} />
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
                  {/* Total Orders Metric Badge */}
                  <div className="bg-[#1A382B] text-white p-5 rounded-2xl space-y-2">
                    <p className="text-xs text-emerald-200">Total orders</p>
                    <h3 className="text-3xl font-black">{totalOrders}</h3>
                    <p className="text-[10px] text-emerald-300">Live store order count</p>
                  </div>

                  {/* SVG Line Chart Representation */}
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
                    <div className="flex justify-between text-[10px] text-gray-400 pt-2 border-t">
                      <span>Nov</span><span>Dec</span><span>Jan</span><span>Feb</span><span>Mar</span><span>Apr</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Stock Unit Donut Visualization */}
              <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-2xs flex flex-col justify-between">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-base font-bold text-gray-900">Stock Unit</h2>
                  <span className="text-xs text-gray-400 flex items-center gap-1 border px-2 py-0.5 rounded-lg">Month <ChevronDown className="w-3 h-3" /></span>
                </div>

                {/* Donut Chart representation */}
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
                    <path
                      d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                      fill="none"
                      stroke="#EF4444"
                      strokeWidth="4"
                      strokeDasharray="30, 100"
                      strokeDashoffset="-50"
                    />
                    <path
                      d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                      fill="none"
                      stroke="#F59E0B"
                      strokeWidth="4"
                      strokeDasharray="20, 100"
                      strokeDashoffset="-80"
                    />
                  </svg>
                  <div className="absolute text-center">
                    <span className="text-xs font-bold text-gray-900">50%</span>
                    <p className="text-[9px] text-gray-400">In Stock</p>
                  </div>
                </div>

                {/* Donut Legend */}
                <div className="flex justify-center gap-4 text-[11px] text-gray-500 pt-4 border-t">
                  <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span> Production</span>
                  <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span> Store</span>
                  <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-rose-500"></span> Stock</span>
                </div>
              </div>
            </div>

            {/* Most Selling Products Section */}
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h2 className="text-lg font-bold text-gray-900">Most Selling Products</h2>
                <div className="flex items-center gap-3">
                  <span className="text-xs text-gray-400">Sort by: <strong className="text-gray-700">Most sales</strong></span>
                  <button onClick={() => setActiveTab('products')} className="bg-[#1A382B] text-white px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 hover:bg-emerald-900 transition">
                    <Plus className="w-4 h-4" /> Add products
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                {products.slice(0, 6).map((product) => (
                  <div key={product.id} className="bg-white p-3 rounded-2xl border border-gray-100 shadow-2xs flex flex-col justify-between">
                    <div className="aspect-square bg-amber-100 rounded-xl mb-3 overflow-hidden flex items-center justify-center">
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

        {/* ================= TAB 2: PRODUCTS MANAGEMENT ================= */}
        {activeTab === 'products' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="bg-white p-6 rounded-2xl border shadow-2xs h-fit space-y-4">
              <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                <Plus className="w-5 h-5 text-emerald-600" /> Create Product
              </h2>
              <form onSubmit={handleCreateProduct} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Title</label>
                  <input type="text" required value={newProduct.title} onChange={(e) => setNewProduct({ ...newProduct, title: e.target.value })} className="w-full px-3 py-2 border rounded-xl text-sm outline-none focus:ring-2 focus:ring-emerald-500" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Description</label>
                  <textarea rows="2" value={newProduct.description} onChange={(e) => setNewProduct({ ...newProduct, description: e.target.value })} className="w-full px-3 py-2 border rounded-xl text-sm outline-none focus:ring-2 focus:ring-emerald-500" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">Price ($)</label>
                    <input type="number" step="0.01" required value={newProduct.price} onChange={(e) => setNewProduct({ ...newProduct, price: e.target.value })} className="w-full px-3 py-2 border rounded-xl text-sm outline-none focus:ring-2 focus:ring-emerald-500" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">Stock</label>
                    <input type="number" required value={newProduct.stock} onChange={(e) => setNewProduct({ ...newProduct, stock: e.target.value })} className="w-full px-3 py-2 border rounded-xl text-sm outline-none focus:ring-2 focus:ring-emerald-500" />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Category</label>
                  <select value={newProduct.category_id} onChange={(e) => setNewProduct({ ...newProduct, category_id: e.target.value })} className="w-full px-3 py-2 border rounded-xl text-sm outline-none focus:ring-2 focus:ring-emerald-500 bg-white">
                    <option value="">Select Category</option>
                    {categories.map((cat) => (
                      <option key={cat.id} value={cat.id}>{cat.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Product Image File</label>
                  <div className="flex items-center gap-3">
                    <label className="cursor-pointer flex items-center gap-2 bg-emerald-50 text-emerald-700 px-4 py-2 rounded-xl font-medium text-xs hover:bg-emerald-100 transition">
                      <Upload className="w-4 h-4" />
                      <span>{uploading ? 'Uploading...' : 'Choose File'}</span>
                      <input type="file" accept="image/*" onChange={handleImageFileChange} className="hidden" />
                    </label>
                    {imagePreview && <img src={imagePreview} alt="Preview" className="w-10 h-10 object-cover rounded-xl border" />}
                  </div>
                </div>
                <button type="submit" disabled={uploading} className="w-full bg-[#1A382B] text-white py-2.5 rounded-xl text-sm font-semibold hover:bg-emerald-900 transition">
                  {uploading ? 'Uploading...' : 'Create Product'}
                </button>
              </form>
            </div>

            <div className="lg:col-span-2 space-y-4">
              <h2 className="text-lg font-bold text-gray-900">Store Inventory ({products.length})</h2>
              {products.map((product) => (
                <div key={product.id} className="bg-white p-4 rounded-2xl border border-gray-100 flex items-center justify-between shadow-2xs">
                  <div className="flex items-center gap-4">
                    <img src={product.image_url || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30'} alt={product.title} className="w-14 h-14 object-cover rounded-xl bg-gray-50" />
                    <div>
                      <h3 className="font-bold text-gray-900 text-sm">{product.title}</h3>
                      <p className="text-xs text-emerald-700 font-extrabold">${product.price.toFixed(2)} | Stock: {product.stock}</p>
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
                  <input type="text" required value={newCategory.name} onChange={(e) => setNewCategory({ ...newCategory, name: e.target.value })} className="w-full px-3 py-2 border rounded-xl text-sm outline-none focus:ring-2 focus:ring-emerald-500" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Description</label>
                  <textarea rows="3" value={newCategory.description} onChange={(e) => setNewCategory({ ...newCategory, description: e.target.value })} className="w-full px-3 py-2 border rounded-xl text-sm outline-none focus:ring-2 focus:ring-emerald-500" />
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

      </main>
    </div>
  );
}