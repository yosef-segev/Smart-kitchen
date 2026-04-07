import { useState, useEffect } from 'react';
import { Route, Routes, Navigate, useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';
import { Button } from '../components/ui/button';
import { Package, ShoppingCart, ChefHat, BarChart3, LogOut, Bell, BookOpen } from 'lucide-react';
import InventoryTab from '../components/InventoryTab';
import ShoppingListTab from '../components/ShoppingListTab';
import ShoppingSuggestionsTab from '../components/ShoppingSuggestionsTab';
import RecipesTab from '../components/RecipesTab';
import MyRecipesTab from '../components/MyRecipesTab';
import AnalyticsTab from '../components/AnalyticsTab';

export default function Dashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const currentPath = location.pathname;

  const navItems = [
    { path: '/dashboard/inventory', icon: Package, label: 'Inventory' },
    { path: '/dashboard/shopping', icon: ShoppingCart, label: 'Shopping' },
    { path: '/dashboard/suggestions', icon: Bell, label: 'Suggestions' },
    { path: '/dashboard/recipes', icon: ChefHat, label: 'AI Recipes' },
    { path: '/dashboard/my-recipes', icon: BookOpen, label: 'My Recipes' },
    { path: '/dashboard/analytics', icon: BarChart3, label: 'Analytics' },
  ];

  return (
    <div className="min-h-screen" style={{ background: '#FDFDF9', fontFamily: 'Manrope, sans-serif' }}>
      {/* Desktop Sidebar */}
      <div className="hidden md:fixed md:inset-y-0 md:flex md:w-64 md:flex-col">
        <div className="flex flex-col flex-grow border-r border-[#E6E8E3] bg-white">
          <div className="flex items-center h-20 px-6 border-b border-[#E6E8E3]">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#4A5D23] flex items-center justify-center">
                <ChefHat className="w-6 h-6 text-white" />
              </div>
              <h1 className="text-xl font-semibold" style={{ fontFamily: 'Outfit, sans-serif', color: '#1A2015' }}>
                FreshTrack
              </h1>
            </div>
          </div>
          <nav className="flex-1 px-4 py-6 space-y-2">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentPath.startsWith(item.path);
              return (
                <button
                  key={item.path}
                  onClick={() => navigate(item.path)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-all duration-300 ${
                    isActive ? 'bg-[#F2F7EC] text-[#4A5D23]' : 'text-[#6B7262] hover:bg-[#F2F7EC]/50'
                  }`}
                  data-testid={`nav-${item.label.toLowerCase()}`}
                >
                  <Icon className="w-5 h-5" />
                  {item.label}
                </button>
              );
            })}
          </nav>
          <div className="p-4 border-t border-[#E6E8E3]">
            <div className="px-4 py-3 mb-3 rounded-xl bg-[#F2F7EC]">
              <p className="text-xs uppercase tracking-wider mb-1" style={{ color: '#6B7262' }}>Signed in as</p>
              <p className="text-sm font-medium" style={{ color: '#1A2015' }}>{user?.name}</p>
            </div>
            <Button
              onClick={handleLogout}
              variant="outline"
              className="w-full justify-start gap-3 rounded-xl border-[#E6E8E3] hover:bg-[#FDF2F1] hover:border-[#F5D8D5] hover:text-[#90352A]"
              data-testid="logout-button"
            >
              <LogOut className="w-5 h-5" />
              Logout
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="md:pl-64">
        <div className="p-6 md:p-8">
          <Routes>
            <Route path="/" element={<Navigate to="/dashboard/inventory" replace />} />
            <Route path="/inventory" element={<InventoryTab />} />
            <Route path="/shopping" element={<ShoppingListTab />} />
            <Route path="/suggestions" element={<ShoppingSuggestionsTab />} />
            <Route path="/recipes" element={<RecipesTab />} />
            <Route path="/my-recipes" element={<MyRecipesTab />} />
            <Route path="/analytics" element={<AnalyticsTab />} />
          </Routes>
        </div>
      </div>

      {/* Mobile Bottom Navigation */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-[#E6E8E3] z-50">
        <nav className="flex items-center justify-around px-2 py-3">
          {navItems.filter(item => ['Inventory', 'Shopping', 'Suggestions', 'My Recipes'].includes(item.label)).map((item) => {
            const Icon = item.icon;
            const isActive = currentPath.startsWith(item.path);
            return (
              <button
                key={item.path}
                onClick={() => navigate(item.path)}
                className={`flex flex-col items-center gap-1 px-2 py-2 rounded-xl transition-all duration-300 ${
                  isActive ? 'text-[#4A5D23]' : 'text-[#6B7262]'
                }`}
                data-testid={`mobile-nav-${item.label.toLowerCase().replace(' ', '-')}`}
              >
                <Icon className="w-5 h-5" />
                <span className="text-xs font-medium">{item.label}</span>
              </button>
            );
          })}
        </nav>
      </div>
    </div>
  );
}