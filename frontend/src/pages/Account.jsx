import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import { User, Package, Truck, CheckCircle2, Clock, XCircle, ChevronRight, ShoppingBag } from 'lucide-react';

export default function Account() {
  const [user, setUser] = useState(null);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchUserData();
  }, []);

  const fetchUserData = async () => {
    try {
      const [userRes, ordersRes] = await Promise.all([
        api.get('/auth/me'),
        api.get('/orders/my-orders'),
      ]);
      setUser(userRes.data);
      setOrders(ordersRes.data);
    } catch (err) {
      setError('Failed to load account information. Please login again.');
    } finally {
      setLoading(false);
    }
  };

  const getStatusStep = (status) => {
    switch (status?.toLowerCase()) {
      case 'pending': return 1;
      case 'processing': return 2;
      case 'completed': return 3;
      default: return 0;
    }
  };

  if (loading) return <div className="max-w-7xl mx-auto px-4 py-16 text-center text-gray-500">Loading your profile...</div>;

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Profile Banner */}
      <div className="bg-white p-6 rounded-2xl border shadow-sm mb-8 flex items-center gap-4">
        <div className="w-16 h-16 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold text-2xl">
          {user?.email?.[0].toUpperCase()}
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Welcome Back!</h1>
          <p className="text-gray-500 text-sm">{user?.email}</p>
        </div>
      </div>

      <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
        <Package className="w-5 h-5 text-indigo-600" /> My Orders & Live Tracking ({orders.length})
      </h2>

      {error && <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl mb-6 text-sm">{error}</div>}

      {orders.length === 0 ? (
        <div className="bg-white p-12 rounded-2xl border text-center">
          <ShoppingBag className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <h3 className="font-semibold text-gray-800 text-lg mb-1">No Orders Placed Yet</h3>
          <p className="text-gray-500 text-sm mb-6">Start shopping to place your first order!</p>
          <Link to="/" className="inline-block bg-indigo-600 text-white px-6 py-2.5 rounded-xl font-medium hover:bg-indigo-700 transition">
            Explore Products
          </Link>
        </div>
      ) : (
        <div className="space-y-6">
          {orders.map((order) => {
            const step = getStatusStep(order.status);
            return (
              <div key={order.id} className="bg-white p-6 rounded-2xl border shadow-sm space-y-6">
                
                {/* Order Summary Line */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center border-b pb-4 gap-2">
                  <div>
                    <h3 className="font-bold text-gray-900 text-lg">Order #{order.id}</h3>
                    <p className="text-xs text-gray-500">Shipping to: {order.address}, {order.city}, {order.country}</p>
                  </div>
                  <div className="text-right">
                    <span className="text-indigo-600 font-bold text-lg">${order.total_amount.toFixed(2)}</span>
                  </div>
                </div>

                {/* Progress Tracking Bar */}
                {order.status !== 'Cancelled' ? (
                  <div className="py-2">
                    <div className="relative flex items-center justify-between max-w-xl mx-auto">
                      <div className="absolute top-1/2 left-0 right-0 h-1 bg-gray-200 -z-0 transform -translate-y-1/2"></div>
                      <div
                        className="absolute top-1/2 left-0 h-1 bg-indigo-600 -z-0 transform -translate-y-1/2 transition-all duration-500"
                        style={{ width: step === 1 ? '0%' : step === 2 ? '50%' : '100%' }}
                      ></div>

                      {/* Step 1: Placed */}
                      <div className="flex flex-col items-center bg-white z-10 px-2">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm ${step >= 1 ? 'bg-indigo-600 text-white' : 'bg-gray-200 text-gray-500'}`}>
                          <Clock className="w-5 h-5" />
                        </div>
                        <span className="text-xs font-semibold text-gray-700 mt-2">Order Placed</span>
                      </div>

                      {/* Step 2: Processing */}
                      <div className="flex flex-col items-center bg-white z-10 px-2">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm ${step >= 2 ? 'bg-indigo-600 text-white' : 'bg-gray-200 text-gray-500'}`}>
                          <Truck className="w-5 h-5" />
                        </div>
                        <span className="text-xs font-semibold text-gray-700 mt-2">Processing</span>
                      </div>

                      {/* Step 3: Delivered */}
                      <div className="flex flex-col items-center bg-white z-10 px-2">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm ${step >= 3 ? 'bg-green-600 text-white' : 'bg-gray-200 text-gray-500'}`}>
                          <CheckCircle2 className="w-5 h-5" />
                        </div>
                        <span className="text-xs font-semibold text-gray-700 mt-2">Delivered</span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="bg-red-50 p-3 rounded-xl text-red-700 text-sm font-semibold flex items-center gap-2">
                    <XCircle className="w-5 h-5" /> Order Cancelled
                  </div>
                )}

                {/* Items List */}
                <div className="bg-gray-50 p-4 rounded-xl space-y-2 text-sm">
                  <h4 className="font-semibold text-gray-700 mb-2">Order Items</h4>
                  {order.items.map((item, index) => (
                    <div key={index} className="flex justify-between text-gray-800">
                      <span>Product ID: {item.product_id} × {item.quantity}</span>
                      <span className="font-semibold">${(item.price * item.quantity).toFixed(2)}</span>
                    </div>
                  ))}
                </div>

              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}