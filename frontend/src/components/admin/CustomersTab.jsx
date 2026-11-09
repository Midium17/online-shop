import React, { useState } from 'react';
import api from '../../services/api';
import { Users, Search, Edit2, Trash2, Check, X } from 'lucide-react';

export default function CustomersTab({ customers, fetchData, setError, setSuccess }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    country: ''
  });

  const handleStartEdit = (cust) => {
    setEditingId(cust.id);
    setEditForm({
      first_name: cust.first_name && cust.first_name !== 'N/A' ? cust.first_name : '',
      last_name: cust.last_name && cust.last_name !== 'N/A' ? cust.last_name : '',
      email: cust.email || '',
      phone: cust.phone && cust.phone !== 'No phone provided' ? cust.phone : '',
      address: cust.address && cust.address !== 'N/A' ? cust.address : '',
      city: cust.city || '',
      country: cust.country || ''
    });
  };

  const handleCancelEdit = () => {
    setEditingId(null);
  };

  const handleSaveEdit = async (customerId) => {
    setError('');
    setSuccess('');
    try {
      await api.put(`/auth/admin/customers/${customerId}`, editForm);
      setSuccess(`Customer #${customerId} profile updated successfully!`);
      setEditingId(null);
      fetchData();
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to update customer profile.');
    }
  };

  const handleDeleteCustomer = async (customerId) => {
    if (!window.confirm(`Are you sure you want to delete customer account #${customerId}?`)) return;
    setError('');
    setSuccess('');
    try {
      await api.delete(`/auth/admin/customers/${customerId}`);
      setSuccess(`Customer #${customerId} deleted successfully.`);
      fetchData();
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to delete customer.');
    }
  };

  const filteredCustomers = customers.filter((c) => {
    const query = searchTerm.toLowerCase();
    const fullName = `${c.first_name || ''} ${c.last_name || ''}`.toLowerCase();
    const addressStr = `${c.address || ''} ${c.city || ''} ${c.country || ''}`.toLowerCase();
    return (
      c.email?.toLowerCase().includes(query) ||
      fullName.includes(query) ||
      addressStr.includes(query) ||
      c.id.toString().includes(query)
    );
  });

  return (
    <div className="space-y-6">
      {/* Header & Search Bar */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-2xl border border-gray-100 shadow-2xs">
        <div>
          <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
            <Users className="w-5 h-5 text-emerald-600" /> Complete Customer Information & Shipping Profiles
          </h2>
          <p className="text-xs text-gray-400 mt-0.5">Manage customer directory, view order activity, and edit shipping context.</p>
        </div>

        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-3" />
          <input
            type="text"
            placeholder="Search by name, email, or city..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>
      </div>

      {/* Main Customers Table Card */}
      <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-2xs space-y-4">
        {filteredCustomers.length === 0 ? (
          <div className="p-12 text-center text-gray-400">
            <Users className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="font-medium">No registered customers found matching your criteria.</p>
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
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-sm">
                {filteredCustomers.map((cust) => {
                  const isEditing = editingId === cust.id;
                  const fullName = cust.first_name && cust.first_name !== 'N/A' 
                    ? `${cust.first_name} ${cust.last_name || ''}`.trim() 
                    : 'Guest Account';

                  return (
                    <tr key={cust.id} className="hover:bg-gray-50/50 transition">
                      {/* Customer Column */}
                      <td className="py-4 px-4 font-semibold text-gray-900">
                        {isEditing ? (
                          <div className="space-y-1.5 max-w-xs">
                            <div className="flex gap-1.5">
                              <input
                                type="text"
                                placeholder="First Name"
                                value={editForm.first_name}
                                onChange={(e) => setEditForm({ ...editForm, first_name: e.target.value })}
                                className="w-full px-2 py-1 border rounded-lg text-xs outline-none focus:ring-2 focus:ring-emerald-500"
                              />
                              <input
                                type="text"
                                placeholder="Last Name"
                                value={editForm.last_name}
                                onChange={(e) => setEditForm({ ...editForm, last_name: e.target.value })}
                                className="w-full px-2 py-1 border rounded-lg text-xs outline-none focus:ring-2 focus:ring-emerald-500"
                              />
                            </div>
                            <input
                              type="email"
                              placeholder="Email Address"
                              value={editForm.email}
                              onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                              className="w-full px-2 py-1 border rounded-lg text-xs outline-none focus:ring-2 focus:ring-emerald-500"
                            />
                          </div>
                        ) : (
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-full bg-emerald-50 text-emerald-700 flex items-center font-bold justify-center text-xs shrink-0">
                              {cust.email ? cust.email[0].toUpperCase() : 'C'}
                            </div>
                            <div>
                              <p className="text-xs font-bold text-gray-900">{fullName}</p>
                              <p className="text-xs text-gray-400 font-normal">{cust.email}</p>
                            </div>
                          </div>
                        )}
                      </td>

                      {/* Phone Column */}
                      <td className="py-4 px-4 text-xs text-gray-600 font-medium">
                        {isEditing ? (
                          <input
                            type="text"
                            placeholder="Phone number"
                            value={editForm.phone}
                            onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                            className="w-full px-2 py-1 border rounded-lg text-xs outline-none focus:ring-2 focus:ring-emerald-500"
                          />
                        ) : (
                          cust.phone || 'No phone provided'
                        )}
                      </td>

                      {/* Shipping Address Column */}
                      <td className="py-4 px-4 text-xs text-gray-600">
                        {isEditing ? (
                          <div className="space-y-1.5 max-w-xs">
                            <input
                              type="text"
                              placeholder="Street Address"
                              value={editForm.address}
                              onChange={(e) => setEditForm({ ...editForm, address: e.target.value })}
                              className="w-full px-2 py-1 border rounded-lg text-xs outline-none focus:ring-2 focus:ring-emerald-500"
                            />
                            <div className="flex gap-1.5">
                              <input
                                type="text"
                                placeholder="City"
                                value={editForm.city}
                                onChange={(e) => setEditForm({ ...editForm, city: e.target.value })}
                                className="w-full px-2 py-1 border rounded-lg text-xs outline-none focus:ring-2 focus:ring-emerald-500"
                              />
                              <input
                                type="text"
                                placeholder="Country"
                                value={editForm.country}
                                onChange={(e) => setEditForm({ ...editForm, country: e.target.value })}
                                className="w-full px-2 py-1 border rounded-lg text-xs outline-none focus:ring-2 focus:ring-emerald-500"
                              />
                            </div>
                          </div>
                        ) : cust.address && cust.address !== 'N/A' ? (
                          <div>
                            <p>{cust.address}</p>
                            <p className="text-gray-400">{cust.city}, {cust.country}</p>
                          </div>
                        ) : (
                          <span className="text-gray-400 italic">No address on file</span>
                        )}
                      </td>

                      {/* Total Orders */}
                      <td className="py-4 px-4 font-medium text-gray-700">
                        {cust.total_orders || 0} orders
                      </td>

                      {/* Total Spent */}
                      <td className="py-4 px-4 font-bold text-emerald-700">
                        ${(cust.total_spent || 0).toFixed(2)}
                      </td>

                      {/* Actions */}
                      <td className="py-4 px-4 text-right">
                        {isEditing ? (
                          <div className="flex justify-end gap-1">
                            <button onClick={() => handleSaveEdit(cust.id)} className="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded-lg" title="Save Changes">
                              <Check className="w-4 h-4" />
                            </button>
                            <button onClick={handleCancelEdit} className="p-1.5 text-gray-400 hover:bg-gray-100 rounded-lg" title="Cancel">
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        ) : (
                          <div className="flex justify-end gap-1">
                            <button
                              onClick={() => handleStartEdit(cust)}
                              className="p-1.5 text-gray-500 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg transition"
                              title="Edit Customer Profile"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDeleteCustomer(cust.id)}
                              className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                              title="Delete Account"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}