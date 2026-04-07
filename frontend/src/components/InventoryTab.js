import { useState, useEffect } from 'react';
import axios from 'axios';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Plus, Edit2, Trash2, AlertCircle } from 'lucide-react';

const CATEGORIES = ['Vegetables', 'Fruits', 'Dairy', 'Meat', 'Grains', 'Beverages', 'Snacks', 'Other'];
const UNITS = ['kg', 'g', 'L', 'ml', 'unit', 'pack', 'dozen'];

export default function InventoryTab() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    category: 'Other',
    quantity: '',
    unit: 'unit',
    expiration_date: '',
  });

  useEffect(() => {
    fetchInventory();
  }, []);

  const fetchInventory = async () => {
    try {
      const { data } = await axios.get(
        `${process.env.REACT_APP_BACKEND_URL}/api/inventory`,
        { withCredentials: true }
      );
      setItems(data);
    } catch (error) {
      console.error('Error fetching inventory:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingItem) {
        await axios.put(
          `${process.env.REACT_APP_BACKEND_URL}/api/inventory/${editingItem.id}`,
          formData,
          { withCredentials: true }
        );
      } else {
        await axios.post(
          `${process.env.REACT_APP_BACKEND_URL}/api/inventory`,
          formData,
          { withCredentials: true }
        );
      }
      setDialogOpen(false);
      setEditingItem(null);
      setFormData({ name: '', category: 'Other', quantity: '', unit: 'unit', expiration_date: '' });
      fetchInventory();
    } catch (error) {
      console.error('Error saving item:', error);
    }
  };

  const handleDelete = async (itemId) => {
    if (!window.confirm('Are you sure you want to delete this item?')) return;
    try {
      await axios.delete(
        `${process.env.REACT_APP_BACKEND_URL}/api/inventory/${itemId}`,
        { withCredentials: true }
      );
      fetchInventory();
    } catch (error) {
      console.error('Error deleting item:', error);
    }
  };

  const handleEdit = (item) => {
    setEditingItem(item);
    setFormData({
      name: item.name,
      category: item.category,
      quantity: item.quantity.toString(),
      unit: item.unit,
      expiration_date: item.expiration_date.split('T')[0],
    });
    setDialogOpen(true);
  };

  const getStatusStyle = (status) => {
    if (status === 'fresh') {
      return { bg: '#F2F7EC', text: '#416620', border: '#DCE8D0' };
    } else if (status === 'expiring') {
      return { bg: '#FFF8EC', text: '#9B6B15', border: '#F3E1C5' };
    } else {
      return { bg: '#FDF2F1', text: '#90352A', border: '#F5D8D5' };
    }
  };

  const getStatusLabel = (status) => {
    if (status === 'fresh') return 'Fresh';
    if (status === 'expiring') return 'Expiring Soon';
    return 'Expired';
  };

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
            Inventory
          </h1>
          <p className="text-base mt-1" style={{ color: '#6B7262' }}>
            Manage your kitchen items and track expiration dates
          </p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={(open) => {
          setDialogOpen(open);
          if (!open) {
            setEditingItem(null);
            setFormData({ name: '', category: 'Other', quantity: '', unit: 'unit', expiration_date: '' });
          }
        }}>
          <DialogTrigger asChild>
            <Button className="rounded-xl" style={{ background: '#4A5D23', color: '#FFFFFF' }} data-testid="add-inventory-button">
              <Plus className="w-5 h-5 mr-2" />
              Add Item
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle style={{ fontFamily: 'Outfit, sans-serif' }}>
                {editingItem ? 'Edit Item' : 'Add New Item'}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Item Name</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                  data-testid="item-name-input"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="category">Category</Label>
                <Select
                  value={formData.category}
                  onValueChange={(value) => setFormData({ ...formData, category: value })}
                >
                  <SelectTrigger data-testid="item-category-select">
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
                    data-testid="item-quantity-input"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="unit">Unit</Label>
                  <Select
                    value={formData.unit}
                    onValueChange={(value) => setFormData({ ...formData, unit: value })}
                  >
                    <SelectTrigger data-testid="item-unit-select">
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
              <div className="space-y-2">
                <Label htmlFor="expiration_date">Expiration Date</Label>
                <Input
                  id="expiration_date"
                  type="date"
                  value={formData.expiration_date}
                  onChange={(e) => setFormData({ ...formData, expiration_date: e.target.value })}
                  required
                  data-testid="item-expiration-input"
                />
              </div>
              <Button type="submit" className="w-full rounded-xl" style={{ background: '#4A5D23', color: '#FFFFFF' }} data-testid="save-item-button">
                {editingItem ? 'Update Item' : 'Add Item'}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {items.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-2xl border border-[#E6E8E3]" data-testid="empty-inventory">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-[#F2F7EC] flex items-center justify-center">
            <AlertCircle className="w-8 h-8" style={{ color: '#4A5D23' }} />
          </div>
          <h3 className="text-lg font-medium mb-2" style={{ color: '#1A2015' }}>No items in inventory</h3>
          <p className="text-sm" style={{ color: '#6B7262' }}>Start adding items to track your kitchen inventory</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-[#E6E8E3] overflow-hidden" data-testid="inventory-list">
          {items.map((item, index) => {
            const statusStyle = getStatusStyle(item.status);
            return (
              <div
                key={item.id}
                className={`px-6 py-4 flex items-center justify-between ${index !== items.length - 1 ? 'border-b border-[#E6E8E3]' : ''}`}
                data-testid={`inventory-item-${item.id}`}
              >
                <div className="flex-1">
                  <h3 className="font-medium mb-1" style={{ color: '#1A2015' }}>{item.name}</h3>
                  <div className="flex items-center gap-3 text-sm" style={{ color: '#6B7262' }}>
                    <span>{item.category}</span>
                    <span>•</span>
                    <span>{item.quantity} {item.unit}</span>
                    <span>•</span>
                    <span>Expires: {new Date(item.expiration_date).toLocaleDateString()}</span>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span
                    className="px-3 py-1 rounded-full text-xs font-medium"
                    style={{
                      background: statusStyle.bg,
                      color: statusStyle.text,
                      border: `1px solid ${statusStyle.border}`,
                    }}
                    data-testid={`item-status-${item.id}`}
                  >
                    {getStatusLabel(item.status)}
                  </span>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleEdit(item)}
                    className="rounded-lg hover:bg-[#F2F7EC]"
                    data-testid={`edit-item-${item.id}`}
                  >
                    <Edit2 className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDelete(item.id)}
                    className="rounded-lg hover:bg-[#FDF2F1]"
                    data-testid={`delete-item-${item.id}`}
                  >
                    <Trash2 className="w-4 h-4" style={{ color: '#90352A' }} />
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}