import { useState, useEffect } from 'react';
import axios from 'axios';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { TrendingUp, Package, ShoppingCart, AlertTriangle } from 'lucide-react';

export default function AnalyticsTab() {
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    try {
      const { data } = await axios.get(
        `${process.env.REACT_APP_BACKEND_URL}/api/analytics`,
        { withCredentials: true }
      );
      setAnalytics(data);
    } catch (error) {
      console.error('Error fetching analytics:', error);
    } finally {
      setLoading(false);
    }
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
      <div className="mb-6">
        <h1 className="text-3xl font-semibold tracking-tight" style={{ fontFamily: 'Outfit, sans-serif', color: '#1A2015' }}>
          Analytics
        </h1>
        <p className="text-base mt-1" style={{ color: '#6B7262' }}>
          Track your purchasing patterns and inventory insights
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white rounded-2xl border border-[#E6E8E3] p-6" data-testid="stat-inventory">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 rounded-xl bg-[#F2F7EC] flex items-center justify-center">
              <Package className="w-6 h-6" style={{ color: '#4A5D23' }} />
            </div>
          </div>
          <h3 className="text-3xl font-semibold mb-1" style={{ fontFamily: 'Outfit, sans-serif', color: '#1A2015' }}>
            {analytics?.total_inventory || 0}
          </h3>
          <p className="text-sm" style={{ color: '#6B7262' }}>Total Items in Inventory</p>
        </div>

        <div className="bg-white rounded-2xl border border-[#E6E8E3] p-6" data-testid="stat-shopping">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 rounded-xl bg-[#FFF8EC] flex items-center justify-center">
              <ShoppingCart className="w-6 h-6" style={{ color: '#9B6B15' }} />
            </div>
          </div>
          <h3 className="text-3xl font-semibold mb-1" style={{ fontFamily: 'Outfit, sans-serif', color: '#1A2015' }}>
            {analytics?.shopping_list_count || 0}
          </h3>
          <p className="text-sm" style={{ color: '#6B7262' }}>Items to Buy</p>
        </div>

        <div className="bg-white rounded-2xl border border-[#E6E8E3] p-6" data-testid="stat-expiring">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 rounded-xl bg-[#FDF2F1] flex items-center justify-center">
              <AlertTriangle className="w-6 h-6" style={{ color: '#90352A' }} />
            </div>
          </div>
          <h3 className="text-3xl font-semibold mb-1" style={{ fontFamily: 'Outfit, sans-serif', color: '#1A2015' }}>
            {analytics?.expiring_count || 0}
          </h3>
          <p className="text-sm" style={{ color: '#6B7262' }}>Expiring Soon</p>
        </div>
      </div>

      {/* Frequent Items Chart */}
      {analytics?.frequent_items && analytics.frequent_items.length > 0 && (
        <div className="bg-white rounded-2xl border border-[#E6E8E3] p-8" data-testid="frequent-items-chart">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-[#F2F7EC] flex items-center justify-center">
              <TrendingUp className="w-5 h-5" style={{ color: '#4A5D23' }} />
            </div>
            <div>
              <h2 className="text-xl font-semibold" style={{ fontFamily: 'Outfit, sans-serif', color: '#1A2015' }}>
                Frequently Purchased Items
              </h2>
              <p className="text-sm" style={{ color: '#6B7262' }}>Track which items you buy most often</p>
            </div>
          </div>

          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={analytics.frequent_items}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E6E8E3" />
              <XAxis dataKey="name" stroke="#6B7262" style={{ fontSize: '12px' }} />
              <YAxis stroke="#6B7262" style={{ fontSize: '12px' }} />
              <Tooltip
                contentStyle={{
                  background: '#FFFFFF',
                  border: '1px solid #E6E8E3',
                  borderRadius: '12px',
                  padding: '12px',
                }}
              />
              <Bar dataKey="count" fill="#4A5D23" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {(!analytics?.frequent_items || analytics.frequent_items.length === 0) && (
        <div className="text-center py-12 bg-white rounded-2xl border border-[#E6E8E3]" data-testid="no-analytics">
          <TrendingUp className="w-12 h-12 mx-auto mb-3" style={{ color: '#6B7262' }} />
          <p className="text-sm" style={{ color: '#6B7262' }}>No purchase history yet. Start adding items to see analytics.</p>
        </div>
      )}
    </div>
  );
}