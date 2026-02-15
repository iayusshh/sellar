import { useMemo, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/hooks/useAuth';
import {
  useCreateProduct,
  useDeleteProduct,
  useProducts,
  useUpdateProduct,
} from '@/integrations/supabase/hooks';
import { supabase } from '@/integrations/supabase/client';
import { formatCurrency } from '@/lib/currency';
import { toast } from 'sonner';
import {
  Plus,
  Package,
  Edit3,
  Trash2,
  Eye,
  EyeOff,
  X,
  Save,
  ShoppingCart,
  IndianRupee,
  Image as ImageIcon,
  FileText,
  Loader2,
  Search,
  Link as LinkIcon,
  Upload,
} from 'lucide-react';
import CreatorLayout from '@/components/layout/CreatorLayout';

export default function Products() {
  const { user } = useAuth();
  const userId = user?.id ?? '';

  const productsQuery = useProducts(userId, true);
  const products = productsQuery.data?.data ?? [];

  const createProduct = useCreateProduct();
  const updateProduct = useUpdateProduct();
  const deleteProduct = useDeleteProduct();

  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [contentUrl, setContentUrl] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [search, setSearch] = useState('');
  const [uploadingImage, setUploadingImage] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isSubmitting = createProduct.isPending || updateProduct.isPending || deleteProduct.isPending;

  const canSubmit = useMemo(() => {
    const parsedPrice = Number(price);
    return title.trim().length > 0 && description.trim().length > 0 && parsedPrice > 0;
  }, [title, description, price]);

  const filteredProducts = useMemo(() => {
    if (!search.trim()) return products;
    const q = search.toLowerCase();
    return products.filter((p: any) =>
      p.title.toLowerCase().includes(q) || p.description.toLowerCase().includes(q)
    );
  }, [products, search]);

  const resetForm = () => {
    setEditingId(null);
    setTitle('');
    setDescription('');
    setPrice('');
    setImageUrl('');
    setContentUrl('');
    setIsActive(true);
    setShowForm(false);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleImageUpload = async (file: File) => {
    if (!userId) return;
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image must be under 5MB.');
      return;
    }
    if (!file.type.startsWith('image/')) {
      toast.error('Only image files are allowed.');
      return;
    }
    setUploadingImage(true);
    try {
      const ext = file.name.split('.').pop();
      const filePath = `${userId}/${Date.now()}.${ext}`;
      const { error: uploadError } = await supabase.storage
        .from('products')
        .upload(filePath, file, { upsert: true });
      if (uploadError) throw uploadError;
      const { data: urlData } = supabase.storage
        .from('products')
        .getPublicUrl(filePath);
      setImageUrl(urlData.publicUrl);
      toast.success('Image uploaded!');
    } catch (e: any) {
      toast.error(e.message || 'Failed to upload image.');
    } finally {
      setUploadingImage(false);
    }
  };

  const handleSubmit = async () => {
    if (!userId) { toast.error('You must be signed in.'); return; }
    if (!canSubmit) { toast.error('Please fill in all required fields.'); return; }

    const payload = {
      creator_id: userId,
      title: title.trim(),
      description: description.trim(),
      price: Number(price),
      currency: 'INR',
      image_url: imageUrl.trim() || null,
      content_url: contentUrl.trim() || null,
      is_active: isActive,
    };

    if (editingId) {
      const { error } = await updateProduct.mutateAsync({ productId: editingId, updates: payload });
      if (error) { toast.error(error.message || 'Failed to update.'); return; }
      toast.success('Product updated.');
    } else {
      const { error } = await createProduct.mutateAsync(payload);
      if (error) { toast.error(error.message || 'Failed to create.'); return; }
      toast.success('Product created.');
    }
    resetForm();
  };

  const handleEdit = (product: any) => {
    setEditingId(product.id);
    setTitle(product.title);
    setDescription(product.description);
    setPrice(String(product.price));
    setImageUrl(product.image_url ?? '');
    setContentUrl(product.content_url ?? '');
    setIsActive(product.is_active);
    setShowForm(true);
  };

  const handleToggle = async (product: any) => {
    const { error } = await updateProduct.mutateAsync({
      productId: product.id,
      updates: { is_active: !product.is_active },
    });
    if (error) { toast.error(error.message || 'Failed to update.'); return; }
    toast.success(product.is_active ? 'Product hidden.' : 'Product activated.');
  };

  const handleDelete = async (productId: string) => {
    const { error } = await deleteProduct.mutateAsync(productId);
    if (error) { toast.error(error.message || 'Failed to delete.'); return; }
    toast.success('Product removed.');
  };

  const activeCount = products.filter((p: any) => p.is_active).length;
  const totalRevenue = products.reduce((sum: number, p: any) => sum + Number(p.price || 0), 0);

  return (
    <CreatorLayout>
      {/* Header */}
      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-white mb-1">Products</h1>
          <p className="text-slate-500 text-sm">Create and manage your digital products</p>
        </div>
        <button
          onClick={() => { resetForm(); setShowForm(true); }}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 text-sm font-medium text-white shadow-lg shadow-emerald-500/20 hover:from-emerald-400 hover:to-emerald-500 transition-all"
        >
          <Plus className="w-4 h-4" />
          New Product
        </button>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0 }}
          className="rounded-2xl border border-slate-800/60 bg-gradient-to-br from-blue-500/15 to-blue-600/5 backdrop-blur-xl p-5">
          <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">Total Products</span>
          <div className="text-2xl font-bold text-white mt-2">{products.length}</div>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.06 }}
          className="rounded-2xl border border-slate-800/60 bg-gradient-to-br from-emerald-500/15 to-emerald-600/5 backdrop-blur-xl p-5">
          <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">Active</span>
          <div className="text-2xl font-bold text-white mt-2">{activeCount}</div>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.12 }}
          className="rounded-2xl border border-slate-800/60 bg-gradient-to-br from-violet-500/15 to-violet-600/5 backdrop-blur-xl p-5">
          <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">Catalog Value</span>
          <div className="text-2xl font-bold text-white mt-2">{formatCurrency(totalRevenue)}</div>
        </motion.div>
      </div>

      {/* Create/Edit Form Modal */}
      <AnimatePresence>
        {showForm && (
          <motion.div
            initial={{ opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            className="mb-8 bg-slate-900/60 backdrop-blur-xl border border-slate-800/60 rounded-2xl p-6"
          >
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-semibold text-white">
                {editingId ? 'Edit Product' : 'Create New Product'}
              </h2>
              <button onClick={resetForm} className="text-slate-500 hover:text-white transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm text-slate-400 flex items-center gap-2">
                  <FileText className="w-3.5 h-3.5" /> Title
                </label>
                <input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. React Masterclass"
                  className="w-full h-11 px-4 rounded-xl bg-white/[0.05] border border-white/[0.1] text-white placeholder:text-slate-500 focus:outline-none focus:border-emerald-500/50 transition-colors text-sm"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm text-slate-400 flex items-center gap-2">
                  <IndianRupee className="w-3.5 h-3.5" /> Price (INR)
                </label>
                <input
                  type="number"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  placeholder="499"
                  className="w-full h-11 px-4 rounded-xl bg-white/[0.05] border border-white/[0.1] text-white placeholder:text-slate-500 focus:outline-none focus:border-emerald-500/50 transition-colors text-sm"
                />
              </div>
              <div className="md:col-span-2 space-y-2">
                <label className="text-sm text-slate-400 flex items-center gap-2">
                  <FileText className="w-3.5 h-3.5" /> Description
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Describe your product — what the buyer gets and why it's valuable"
                  rows={3}
                  className="w-full px-4 py-3 rounded-xl bg-white/[0.05] border border-white/[0.1] text-white placeholder:text-slate-500 focus:outline-none focus:border-emerald-500/50 transition-colors text-sm resize-none"
                />
              </div>
              <div className="md:col-span-2 space-y-2">
                <label className="text-sm text-slate-400 flex items-center gap-2">
                  <ImageIcon className="w-3.5 h-3.5" /> Product Image (optional)
                </label>
                <div className="flex items-start gap-4">
                  <div className="w-28 h-28 rounded-xl bg-slate-800 border border-slate-700/50 flex items-center justify-center overflow-hidden flex-shrink-0">
                    {imageUrl ? (
                      <img src={imageUrl} alt="Preview" className="w-full h-full object-cover" />
                    ) : (
                      <ImageIcon className="w-8 h-8 text-slate-600" />
                    )}
                  </div>
                  <div className="flex-1 space-y-3">
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleImageUpload(file);
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={uploadingImage}
                      className="w-full h-20 rounded-xl border-2 border-dashed border-slate-700 hover:border-emerald-500/50 bg-white/[0.02] flex flex-col items-center justify-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {uploadingImage ? (
                        <Loader2 className="w-5 h-5 text-emerald-400 animate-spin" />
                      ) : (
                        <Upload className="w-5 h-5 text-slate-500" />
                      )}
                      <span className="text-xs text-slate-500">
                        {uploadingImage ? 'Uploading...' : 'Click to upload image (max 5MB)'}
                      </span>
                    </button>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] text-slate-600 uppercase">or paste URL</span>
                      <input
                        value={imageUrl}
                        onChange={(e) => setImageUrl(e.target.value)}
                        placeholder="https://..."
                        className="flex-1 h-8 px-3 rounded-lg bg-white/[0.03] border border-white/[0.08] text-white placeholder:text-slate-600 focus:outline-none focus:border-emerald-500/50 transition-colors text-xs"
                      />
                    </div>
                    {imageUrl && (
                      <button
                        type="button"
                        onClick={() => { setImageUrl(''); if (fileInputRef.current) fileInputRef.current.value = ''; }}
                        className="text-xs text-red-400 hover:text-red-300 transition-colors"
                      >
                        Remove image
                      </button>
                    )}
                  </div>
                </div>
              </div>
              <div className="md:col-span-2 space-y-2">
                <label className="text-sm text-slate-400 flex items-center gap-2">
                  <LinkIcon className="w-3.5 h-3.5" /> Content URL (delivered after purchase)
                </label>
                <input
                  value={contentUrl}
                  onChange={(e) => setContentUrl(e.target.value)}
                  placeholder="https://drive.google.com/... or a download link"
                  className="w-full h-11 px-4 rounded-xl bg-white/[0.05] border border-white/[0.1] text-white placeholder:text-slate-500 focus:outline-none focus:border-emerald-500/50 transition-colors text-sm"
                />
                <p className="text-[11px] text-slate-600">Paste a link to the file buyers will receive — Google Drive, Notion, Dropbox, etc.</p>
              </div>
              <div className="flex items-end">
                <label className="flex items-center gap-3 h-11 px-4 rounded-xl bg-white/[0.05] border border-white/[0.1] cursor-pointer w-full">
                  <input
                    type="checkbox"
                    checked={isActive}
                    onChange={(e) => setIsActive(e.target.checked)}
                    className="accent-emerald-500"
                  />
                  <span className="text-sm text-slate-300">Active on storefront</span>
                </label>
              </div>
            </div>

            <div className="flex items-center gap-3 mt-5">
              <button
                onClick={handleSubmit}
                disabled={!canSubmit || isSubmitting}
                className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 text-sm font-medium text-white shadow-lg shadow-emerald-500/20 hover:from-emerald-400 hover:to-emerald-500 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Save className="w-4 h-4" />
                )}
                {editingId ? 'Save Changes' : 'Create Product'}
              </button>
              <button onClick={resetForm} className="px-4 py-2.5 rounded-xl text-sm text-slate-400 hover:text-white transition-colors">
                Cancel
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Product List */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="bg-slate-900/50 backdrop-blur-xl border border-slate-800/60 rounded-2xl"
      >
        {/* Search */}
        <div className="p-4 border-b border-slate-800/40">
          <div className="relative max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search products..."
              className="w-full h-10 pl-10 pr-4 rounded-xl bg-white/[0.05] border border-white/[0.08] text-white placeholder:text-slate-500 focus:outline-none focus:border-emerald-500/50 transition-colors text-sm"
            />
          </div>
        </div>

        {/* List */}
        <div className="divide-y divide-slate-800/40">
          {filteredProducts.length === 0 && !productsQuery.isLoading ? (
            <div className="text-center py-16">
              <Package className="w-12 h-12 text-slate-700 mx-auto mb-4" />
              <p className="text-slate-500 text-sm mb-1">{search ? 'No products match your search' : 'No products yet'}</p>
              {!search && (
                <p className="text-slate-600 text-xs">Click "New Product" to get started</p>
              )}
            </div>
          ) : (
            filteredProducts.map((product: any) => (
              <div key={product.id} className="flex items-center justify-between px-6 py-4 hover:bg-slate-800/30 transition-colors group">
                <div className="flex items-center gap-4 min-w-0 flex-1">
                  {/* Thumbnail */}
                  <div className="w-14 h-14 rounded-xl bg-slate-800 border border-slate-700/50 flex items-center justify-center flex-shrink-0 overflow-hidden">
                    {product.image_url ? (
                      <img src={product.image_url} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <ShoppingCart className="w-5 h-5 text-slate-600" />
                    )}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-white truncate">{product.title}</p>
                    <p className="text-xs text-slate-500 truncate max-w-md mt-0.5">{product.description}</p>
                    <div className="flex items-center gap-3 mt-1.5">
                      <span className="text-sm font-semibold text-emerald-400">{formatCurrency(product.price)}</span>
                      <span className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full ${product.is_active
                        ? 'bg-emerald-500/15 text-emerald-400'
                        : 'bg-slate-700/50 text-slate-500'
                        }`}>
                        {product.is_active ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
                        {product.is_active ? 'Active' : 'Hidden'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => handleEdit(product)}
                    className="w-9 h-9 rounded-lg flex items-center justify-center text-slate-400 hover:text-blue-400 hover:bg-blue-500/10 transition-colors"
                    title="Edit"
                  >
                    <Edit3 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleToggle(product)}
                    className="w-9 h-9 rounded-lg flex items-center justify-center text-slate-400 hover:text-amber-400 hover:bg-amber-500/10 transition-colors"
                    title={product.is_active ? 'Hide' : 'Activate'}
                  >
                    {product.is_active ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                  <button
                    onClick={() => handleDelete(product.id)}
                    className="w-9 h-9 rounded-lg flex items-center justify-center text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                    title="Delete"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </motion.div>
    </CreatorLayout>
  );
}
