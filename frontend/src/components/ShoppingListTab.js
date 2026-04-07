import { useState, useEffect } from 'react';
import axios from 'axios';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Plus, Trash2, Check, ShoppingBag } from 'lucide-react';

const CATEGORIES = ['Vegetables', 'Fruits', 'Dairy', 'Meat', 'Grains', 'Beverages', 'Snacks', 'Other'];
const UNITS = ['kg', 'g', 'L', 'ml', 'unit', 'pack', 'dozen'];

export default function ShoppingListTab() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    category: 'Other',
    quantity: '1',
    unit: 'unit',
  });

  useEffect(() => {
    fetchShoppingList();
  }, []);

  const fetchShoppingList = async () => {
    try {
      const { data } = await axios.get(
        `${process.env.REACT_APP_BACKEND_URL}/api/shopping-list`,
        { withCredentials: true }
      );
      setItems(data);
    } catch (error) {
      console.error('Error fetching shopping list:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.post(
        `${process.env.REACT_APP_BACKEND_URL}/api/shopping-list`,
        formData,
        { withCredentials: true }
      );
      setDialogOpen(false);
      setFormData({ name: '', category: 'Other', quantity: '1', unit: 'unit' });
      fetchShoppingList();
    } catch (error) {
      console.error('Error adding item:', error);
    }
  };

  const handleToggle = async (itemId) => {
    try {
      await axios.put(
        `${process.env.REACT_APP_BACKEND_URL}/api/shopping-list/${itemId}/toggle`,
        {},
        { withCredentials: true }
      );
      fetchShoppingList();
    } catch (error) {
      console.error('Error toggling item:', error);
    }
  };

  const handleDelete = async (itemId) => {
    try {
      await axios.delete(
        `${process.env.REACT_APP_BACKEND_URL}/api/shopping-list/${itemId}`,
        { withCredentials: true }
      );
      fetchShoppingList();
    } catch (error) {
      console.error('Error deleting item:', error);
    }
  };

  const pendingItems = items.filter((item) => !item.purchased);
  const purchasedItems = items.filter((item) => item.purchased);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#4A5D23]"></div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight" style={{ fontFamily: 'Outfit, sans-serif', color: '#1A2015' }}>
            Shopping List
          </h1>
          <p className="text-base mt-1" style={{ color: '#6B7262' }}>
            Keep track of items you need to buy
          </p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={(open) => {
          setDialogOpen(open);
          if (!open) {
            setFormData({ name: '', category: 'Other', quantity: '1', unit: 'unit' });
          }
        }}>
          <DialogTrigger asChild>
            <Button className="rounded-xl" style={{ background: '#4A5D23', color: '#FFFFFF' }} data-testid="add-shopping-item-button">
              <Plus className="w-5 h-5 mr-2" />
              Add Item
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle style={{ fontFamily: 'Outfit, sans-serif' }}>Add Shopping Item</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Item Name</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                  data-testid="shopping-item-name-input"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="category">Category</Label>
                <Select
                  value={formData.category}
                  onValueChange={(value) => setFormData({ ...formData, category: value })}
                >
                  <SelectTrigger data-testid="shopping-item-category-select">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CATEGORIES.map((cat) => (
                      <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="quantity">Quantity</Label>
                  <Input
                    id="quantity"
                    type="number"
                    step="0.1"
                    value={formData.quantity}
                    onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                    required
                    data-testid="shopping-item-quantity-input"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="unit">Unit</Label>
                  <Select
                    value={formData.unit}
                    onValueChange={(value) => setFormData({ ...formData, unit: value })}
                  >
                    <SelectTrigger data-testid="shopping-item-unit-select">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {UNITS.map((unit) => (
                        <SelectItem key={unit} value={unit}>{unit}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <Button type="submit" className="w-full rounded-xl" style={{ background: '#4A5D23', color: '#FFFFFF' }} data-testid="save-shopping-item-button">
                Add to List
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="space-y-6">
        {/* Pending Items */}
        <div>
          <h2 className="text-xl font-medium mb-4" style={{ fontFamily: 'Outfit, sans-serif', color: '#1A2015' }}>
            To Buy ({pendingItems.length})
          </h2>
          {pendingItems.length === 0 ? (
            <div className="text-center py-8 bg-white rounded-2xl border border-[#E6E8E3]" data-testid="empty-shopping-list">
              <ShoppingBag className="w-12 h-12 mx-auto mb-3" style={{ color: '#6B7262' }} />
              <p className="text-sm" style={{ color: '#6B7262' }}>No items to buy</p>
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-[#E6E8E3] overflow-hidden" data-testid="pending-shopping-list">
              {pendingItems.map((item, index) => (
                <div
                  key={item.id}
                  className={`px-6 py-4 flex items-center justify-between ${index !== pendingItems.length - 1 ? 'border-b border-[#E6E8E3]' : ''}`}
                  data-testid={`shopping-item-${item.id}`}
                >
                  <div className="flex items-center gap-4 flex-1">
                    <button
                      onClick={() => handleToggle(item.id)}
                      className="w-6 h-6 rounded-md border-2 border-[#E6E8E3] hover:border-[#4A5D23] transition-colors flex items-center justify-center"
                      data-testid={`toggle-shopping-${item.id}`}
                    >
                      {item.purchased && <Check className="w-4 h-4" style={{ color: '#4A5D23' }} />}
                    </button>
                    <div>
                      <h3 className="font-medium" style={{ color: '#1A2015' }}>{item.name}</h3>
                      <div className="flex items-center gap-3 text-sm" style={{ color: '#6B7262' }}>
                        <span>{item.category}</span>
                        <span>•</span>
                        <span>{item.quantity} {item.unit}</span>
                      </div>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDelete(item.id)}
                    className="rounded-lg hover:bg-[#FDF2F1]"
                    data-testid={`delete-shopping-${item.id}`}
                  >
                    <Trash2 className="w-4 h-4" style={{ color: '#90352A' }} />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Purchased Items */}
        {purchasedItems.length > 0 && (
          <div>
            <h2 className="text-xl font-medium mb-4" style={{ fontFamily: 'Outfit, sans-serif', color: '#1A2015' }}>
              Purchased ({purchasedItems.length})
            </h2>
            <div className="bg-white rounded-2xl border border-[#E6E8E3] overflow-hidden" data-testid="purchased-shopping-list">
              {purchasedItems.map((item, index) => (
                <div
                  key={item.id}
                  className={`px-6 py-4 flex items-center justify-between opacity-60 ${index !== purchasedItems.length - 1 ? 'border-b border-[#E6E8E3]' : ''}`}
                  data-testid={`purchased-item-${item.id}`}
                >
                  <div className="flex items-center gap-4 flex-1">
                    <button
                      onClick={() => handleToggle(item.id)}
                      className="w-6 h-6 rounded-md border-2 flex items-center justify-center"
                      style={{ borderColor: '#4A5D23', background: '#4A5D23' }}
                      data-testid={`untoggle-shopping-${item.id}`}
                    >
                      <Check className="w-4 h-4 text-white" />
                    </button>
                    <div>
                      <h3 className="font-medium line-through" style={{ color: '#1A2015' }}>{item.name}</h3>
                      <div className="flex items-center gap-3 text-sm" style={{ color: '#6B7262' }}>
                        <span>{item.category}</span>
                        <span>•</span>
                        <span>{item.quantity} {item.unit}</span>
                      </div>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDelete(item.id)}
                    className="rounded-lg hover:bg-[#FDF2F1]"
                    data-testid={`delete-purchased-${item.id}`}
                  >
                    <Trash2 className="w-4 h-4" style={{ color: '#90352A' }} />
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}