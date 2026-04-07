import { useState, useEffect } from 'react';
import axios from 'axios';
import { Button } from './ui/button';
import { Sparkles, Clock, ChefHat } from 'lucide-react';

export default function RecipesTab() {
  const [recipe, setRecipe] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const generateRecipe = async () => {
    setLoading(true);
    setError('');
    setRecipe(null);
    try {
      const { data } = await axios.post(
        `${process.env.REACT_APP_BACKEND_URL}/api/recipes/generate`,
        {},
        { withCredentials: true }
      );
      setRecipe(data);
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to generate recipe. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-3xl font-semibold tracking-tight" style={{ fontFamily: 'Outfit, sans-serif', color: '#1A2015' }}>
          Smart Recipes
        </h1>
        <p className="text-base mt-1" style={{ color: '#6B7262' }}>
          Get AI-powered recipe suggestions based on your fresh ingredients
        </p>
      </div>

      <div className="mb-8">
        <Button
          onClick={generateRecipe}
          disabled={loading}
          className="rounded-xl px-6 h-12"
          style={{ background: '#4A5D23', color: '#FFFFFF' }}
          data-testid="generate-recipe-button"
        >
          {loading ? (
            <>
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
              Generating Recipe...
            </>
          ) : (
            <>
              <Sparkles className="w-5 h-5 mr-2" />
              Generate Recipe
            </>
          )}
        </Button>
      </div>

      {error && (
        <div className="p-6 rounded-2xl bg-[#FDF2F1] border border-[#F5D8D5] mb-6" data-testid="recipe-error">
          <p style={{ color: '#90352A' }}>{error}</p>
        </div>
      )}

      {recipe && (
        <div className="bg-white rounded-2xl border border-[#E6E8E3] overflow-hidden" data-testid="recipe-result">
          <div
            className="h-48 bg-cover bg-center"
            style={{
              backgroundImage: 'url(https://images.unsplash.com/photo-1739656442968-c6b6bcb48752?crop=entropy&cs=srgb&fm=jpg&ixid=M3w4NjAzMjd8MHwxfHNlYXJjaHwzfHxjb29raW5nJTIwZnJlc2glMjBtZWFsfGVufDB8fHx8MTc3NTU1MzA5Mnww&ixlib=rb-4.1.0&q=85)',
            }}
          ></div>
          <div className="p-8">
            <div className="flex items-start justify-between mb-6">
              <div>
                <h2 className="text-2xl font-semibold mb-2" style={{ fontFamily: 'Outfit, sans-serif', color: '#1A2015' }} data-testid="recipe-name">
                  {recipe.recipe_name}
                </h2>
                {recipe.cooking_time && (
                  <div className="flex items-center gap-2 text-sm" style={{ color: '#6B7262' }}>
                    <Clock className="w-4 h-4" />
                    <span>{recipe.cooking_time}</span>
                  </div>
                )}
              </div>
              <div className="w-12 h-12 rounded-xl bg-[#F2F7EC] flex items-center justify-center">
                <ChefHat className="w-6 h-6" style={{ color: '#4A5D23' }} />
              </div>
            </div>

            <div className="mb-6">
              <h3 className="text-lg font-medium mb-3" style={{ fontFamily: 'Outfit, sans-serif', color: '#1A2015' }}>
                Ingredients
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {recipe.ingredients.map((ingredient, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full" style={{ background: '#4A5D23' }}></div>
                    <span className="text-sm" style={{ color: '#1A2015' }}>{ingredient}</span>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <h3 className="text-lg font-medium mb-3" style={{ fontFamily: 'Outfit, sans-serif', color: '#1A2015' }}>
                Instructions
              </h3>
              <div className="prose prose-sm max-w-none" style={{ color: '#1A2015' }}>
                <p className="whitespace-pre-line leading-relaxed" style={{ color: '#1A2015' }}>{recipe.instructions}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {!recipe && !loading && !error && (
        <div className="text-center py-16 bg-white rounded-2xl border border-[#E6E8E3]" data-testid="no-recipe-placeholder">
          <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-[#F2F7EC] flex items-center justify-center">
            <ChefHat className="w-10 h-10" style={{ color: '#4A5D23' }} />
          </div>
          <h3 className="text-xl font-medium mb-2" style={{ fontFamily: 'Outfit, sans-serif', color: '#1A2015' }}>
            No Recipe Yet
          </h3>
          <p className="text-base mb-6" style={{ color: '#6B7262' }}>
            Click the button above to generate a recipe based on your fresh inventory items
          </p>
        </div>
      )}
    </div>
  );
}