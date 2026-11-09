import React from 'react';
import { FolderTree } from 'lucide-react';

export default function CategoriesTab({ newCategory, setNewCategory, handleCreateCategory, categories }) {
  return (
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
  );
}