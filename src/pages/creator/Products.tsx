import { useMemo, useState } from 'react';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/hooks/useAuth';
import {
  useCreateProduct,
  useDeleteProduct,
  useProducts,
  useUpdateProduct,
} from '@/integrations/supabase/hooks';
import { formatCurrency } from '@/lib/currency';
import { toast } from 'sonner';

export default function Products() {
  const { user } = useAuth();
  const userId = user?.id ?? '';

  const productsQuery = useProducts(userId, true);
  const products = productsQuery.data?.data ?? [];

  const createProduct = useCreateProduct();
  const updateProduct = useUpdateProduct();
  const deleteProduct = useDeleteProduct();

  const [editingId, setEditingId] = useState<string | null>(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [isActive, setIsActive] = useState(true);

  const isSubmitting =
    createProduct.isPending || updateProduct.isPending || deleteProduct.isPending;

  const resetForm = () => {
    setEditingId(null);
    setTitle('');
    setDescription('');
    setPrice('');
    setImageUrl('');
    setIsActive(true);
  };

  const canSubmit = useMemo(() => {
    const parsedPrice = Number(price);
    return title.trim().length > 0 && description.trim().length > 0 && parsedPrice > 0;
  }, [title, description, price]);

  const handleSubmit = async () => {
    if (!userId) {
      toast.error('You must be signed in to manage products.');
      return;
    }
    if (!canSubmit) {
      toast.error('Please fill in all fields with valid values.');
      return;
    }

    const payload = {
      creator_id: userId,
      title: title.trim(),
      description: description.trim(),
      price: Number(price),
      currency: 'INR',
      image_url: imageUrl.trim() || null,
      is_active: isActive,
    };

    if (editingId) {
      const { error } = await updateProduct.mutateAsync({
        productId: editingId,
        updates: payload,
      });
      if (error) {
        toast.error(error.message || 'Failed to update product.');
        return;
      }
      toast.success('Product updated.');
    } else {
      const { error } = await createProduct.mutateAsync(payload);
      if (error) {
        toast.error(error.message || 'Failed to create product.');
        return;
      }
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
    setIsActive(product.is_active);
  };

  const handleToggle = async (product: any) => {
    const { error } = await updateProduct.mutateAsync({
      productId: product.id,
      updates: { is_active: !product.is_active },
    });
    if (error) {
      toast.error(error.message || 'Failed to update product.');
      return;
    }
    toast.success(product.is_active ? 'Product hidden.' : 'Product activated.');
  };

  const handleDelete = async (productId: string) => {
    const { error } = await deleteProduct.mutateAsync(productId);
    if (error) {
      toast.error(error.message || 'Failed to delete product.');
      return;
    }
    toast.success('Product removed.');
  };

  return (
    <div className="min-h-screen flex flex-col bg-muted/30">
      <Navbar />

      <main className="flex-1 pt-24 pb-12">
        <div className="container mx-auto px-4">
          <div className="mb-8">
            <h1 className="text-4xl font-display font-bold mb-2">Products</h1>
            <p className="text-muted-foreground">Create and manage what you sell.</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <Card className="lg:col-span-1">
              <CardHeader>
                <CardTitle>{editingId ? 'Edit Product' : 'Create Product'}</CardTitle>
                <CardDescription>Keep listings clear and price in INR.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Title</Label>
                  <Input
                    id="title"
                    placeholder="Ebook, course, consulting"
                    value={title}
                    onChange={(event) => setTitle(event.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Input
                    id="description"
                    placeholder="Short, benefit-focused description"
                    value={description}
                    onChange={(event) => setDescription(event.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="price">Price (INR)</Label>
                  <Input
                    id="price"
                    type="number"
                    placeholder="499"
                    value={price}
                    onChange={(event) => setPrice(event.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="imageUrl">Image URL (optional)</Label>
                  <Input
                    id="imageUrl"
                    placeholder="https://"
                    value={imageUrl}
                    onChange={(event) => setImageUrl(event.target.value)}
                  />
                </div>
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={isActive}
                    onChange={(event) => setIsActive(event.target.checked)}
                  />
                  Active on storefront
                </label>
                <div className="flex gap-2">
                  <Button
                    className="flex-1"
                    disabled={!canSubmit || isSubmitting}
                    onClick={handleSubmit}
                  >
                    {editingId ? 'Save Changes' : 'Create Product'}
                  </Button>
                  {editingId ? (
                    <Button variant="outline" onClick={resetForm}>
                      Cancel
                    </Button>
                  ) : null}
                </div>
              </CardContent>
            </Card>

            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle>Your Listings</CardTitle>
                <CardDescription>Toggle visibility or update details anytime.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {products.length === 0 && !productsQuery.isLoading ? (
                  <div className="text-sm text-muted-foreground">
                    No products yet. Create your first listing.
                  </div>
                ) : null}
                {products.map((product: any) => (
                  <div
                    key={product.id}
                    className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border rounded-lg p-4"
                  >
                    <div>
                      <div className="font-semibold">{product.title}</div>
                      <div className="text-sm text-muted-foreground">
                        {product.description}
                      </div>
                      <div className="text-sm font-medium text-accent mt-1">
                        {formatCurrency(product.price)}
                      </div>
                      <div className="text-xs text-muted-foreground mt-1">
                        {product.is_active ? 'Active' : 'Hidden'}
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Button variant="outline" onClick={() => handleEdit(product)}>
                        Edit
                      </Button>
                      <Button variant="outline" onClick={() => handleToggle(product)}>
                        {product.is_active ? 'Deactivate' : 'Activate'}
                      </Button>
                      <Button
                        variant="ghost"
                        className="text-red-600 hover:text-red-600"
                        onClick={() => handleDelete(product.id)}
                      >
                        Delete
                      </Button>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
