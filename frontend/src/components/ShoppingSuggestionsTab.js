import { useState, useEffect } from 'react';
import axios from 'axios';
import { Button } from './ui/button';
import { AlertCircle, Check, X } from 'lucide-react';

export default function ShoppingSuggestionsTab() {
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSuggestions();
  }, []);

  const fetchSuggestions = async () => {
    try {
      const { data } = await axios.get(
        `${process.env.REACT_APP_BACKEND_URL}/api/shopping-suggestions`,
        { withCredentials: true }
      );
      setSuggestions(data);
    } catch (error) {
      console.error('Error fetching suggestions:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (suggestionId) => {
    try {
      await axios.post(
        `${process.env.REACT_APP_BACKEND_URL}/api/shopping-suggestions/${suggestionId}/approve`,
        {},
        { withCredentials: true }
      );
      fetchSuggestions();
    } catch (error) {
      console.error('Error approving suggestion:', error);
    }
  };

  const handleReject = async (suggestionId) => {
    try {
      await axios.delete(
        `${process.env.REACT_APP_BACKEND_URL}/api/shopping-suggestions/${suggestionId}`,
        { withCredentials: true }
      );
      fetchSuggestions();
    } catch (error) {
      console.error('Error rejecting suggestion:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#4A5D23]"></div>
      </div>
    );
  }

  if (suggestions.length === 0) {
    return (
      <div className="text-center py-12 bg-white rounded-2xl border border-[#E6E8E3]" data-testid="no-suggestions">
        <AlertCircle className="w-12 h-12 mx-auto mb-3" style={{ color: '#6B7262' }} />
        <p className="text-sm" style={{ color: '#6B7262' }}>No shopping suggestions at the moment</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="text-sm mb-4 p-4 rounded-xl" style={{ background: '#FFF8EC', color: '#9B6B15', border: '1px solid #F3E1C5' }}>
        <AlertCircle className="w-4 h-4 inline mr-2" />
        Items below need restocking. Approve to add them to your shopping list.
      </div>
      
      <div className="bg-white rounded-2xl border border-[#E6E8E3] overflow-hidden" data-testid="suggestions-list">
        {suggestions.map((suggestion, index) => (
          <div
            key={suggestion.id}
            className={`px-6 py-4 flex items-center justify-between ${index !== suggestions.length - 1 ? 'border-b border-[#E6E8E3]' : ''}`}
            data-testid={`suggestion-${suggestion.id}`}
          >
            <div className="flex-1">
              <h3 className="font-medium mb-1" style={{ color: '#1A2015' }}>{suggestion.name}</h3>
              <div className="flex items-center gap-3 text-sm" style={{ color: '#6B7262' }}>
                <span>{suggestion.category}</span>
                <span>•</span>
                <span>{suggestion.quantity} {suggestion.unit}</span>
                <span>•</span>
                <span className="font-medium" style={{ color: '#9B6B15' }}>Reason: {suggestion.reason}</span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button
                onClick={() => handleApprove(suggestion.id)}
                className="rounded-lg px-4"
                style={{ background: '#4A5D23', color: '#FFFFFF' }}
                data-testid={`approve-${suggestion.id}`}
              >
                <Check className="w-4 h-4 mr-1" />
                Approve
              </Button>
              <Button
                onClick={() => handleReject(suggestion.id)}
                variant="outline"
                className="rounded-lg px-4 border-[#F5D8D5] hover:bg-[#FDF2F1]"
                style={{ color: '#90352A' }}
                data-testid={`reject-${suggestion.id}`}
              >
                <X className="w-4 h-4 mr-1" />
                Reject
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}