import React from 'react';
import { Upload, RefreshCw, Plus, Trash2 } from 'lucide-react';

export default function ProductsTab({
  newProduct, setNewProduct, categories, editingProductId, imagePreviews,
  uploading, handleImageFilesChange, handleCreateProduct, handleUpdateProduct,
  handleStartEdit, handleCancelEdit, handleDeleteProduct, products, userRole, hasPermission
}) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      {(hasPermission(userRole, 'inventory:create') || hasPermission(userRole, 'inventory:update')) && (
        <div className="bg-white p-6 rounded-2xl border shadow-2xs h-fit space-y-4">
          <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
            {editingProductId ? <><RefreshCw className="w-5 h-5 text-amber-600" /> Edit Product #{editingProductId}</> : <><Plus className="w-5 h-5 text-emerald-600" /> Create Product</>}
          </h2>

          <form onSubmit={editingProductId ? handleUpdateProduct : handleCreateProduct} className="space-y-4">
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
                {categories.map((cat) => (<option key={cat.id} value={cat.id}>{cat.name}</option>))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Product Images</label>
              <div className="space-y-3">
                <label className="cursor-pointer inline-flex items-center gap-2 bg-emerald-50 text-emerald-700 px-4 py-2 rounded-xl font-medium text-xs hover:bg-emerald-100 transition">
                  <Upload className="w-4 h-4" />
                  <span>{uploading ? 'Uploading...' : 'Choose Images'}</span>
                  <input type="file" accept="image/*" multiple onChange={handleImageFilesChange} className="hidden" />
                </label>

                {imagePreviews.length > 0 && (
                  <div className="flex flex-wrap gap-2 pt-2">
                    {imagePreviews.map((src, index) => (
                      <div key={index} className="relative">
                        <img src={src} alt={`Preview ${index}`} className="w-14 h-14 object-cover rounded-xl border shadow-2xs" />
                        {index === 0 && <span className="absolute -bottom-2 -right-1 bg-emerald-600 text-white text-[9px] font-bold px-1 rounded-md">Main</span>}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="flex gap-2">
              <button type="submit" disabled={uploading} className={`flex-1 py-2.5 rounded-xl text-sm font-semibold transition text-white ${editingProductId ? 'bg-amber-600 hover:bg-amber-700' : 'bg-[#1A382B] hover:bg-emerald-900'}`}>
                {uploading ? 'Uploading...' : editingProductId ? 'Update Product' : 'Create Product'}
              </button>
              {editingProductId && (
                <button type="button" onClick={handleCancelEdit} className="px-4 py-2.5 bg-gray-100 text-gray-600 rounded-xl text-sm font-semibold hover:bg-gray-200 transition">
                  Cancel
                </button>
              )}
            </div>
          </form>
        </div>
      )}

      <div className={`${hasPermission(userRole, 'inventory:create') || hasPermission(userRole, 'inventory:update') ? 'lg:col-span-2' : 'lg:col-span-3'} space-y-4`}>
        <h2 className="text-lg font-bold text-gray-900">Store Inventory ({products.length})</h2>
        {products.map((product) => (
          <div key={product.id} className="bg-white p-4 rounded-2xl border border-gray-100 flex items-center justify-between shadow-2xs">
            <div className="flex items-center gap-4">
              <img src={product.image_url || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30'} alt={product.title} className="w-14 h-14 object-cover rounded-xl bg-gray-50 shrink-0" />
              <div>
                <h3 className="font-bold text-gray-900 text-sm">{product.title}</h3>
                <p className="text-xs text-emerald-700 font-extrabold">${product.price.toFixed(2)} | Stock: {product.stock}</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {hasPermission(userRole, 'inventory:update') && (
                <button onClick={() => handleStartEdit(product)} className="px-3 py-1.5 bg-amber-50 text-amber-700 rounded-xl text-xs font-semibold hover:bg-amber-100 transition">Edit</button>
              )}
              {hasPermission(userRole, 'inventory:delete') && (
                <button onClick={() => handleDeleteProduct(product.id)} className="p-2 text-gray-400 hover:text-red-600 transition"><Trash2 className="w-5 h-5" /></button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}