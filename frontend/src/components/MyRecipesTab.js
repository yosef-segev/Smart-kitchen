import { useState, useEffect } from 'react';
import axios from 'axios';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { Plus, Edit2, Trash2, Upload, FileText, Download, X } from 'lucide-react';

export default function MyRecipesTab() {
  const [recipes, setRecipes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingRecipe, setEditingRecipe] = useState(null);
  const [uploadingFiles, setUploadingFiles] = useState({});
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    ingredients: '',
    instructions: '',
  });

  useEffect(() => {
    fetchRecipes();
  }, []);

  const fetchRecipes = async () => {
    try {
      const { data } = await axios.get(
        `${process.env.REACT_APP_BACKEND_URL}/api/my-recipes`,
        { withCredentials: true }
      );
      setRecipes(data);
    } catch (error) {
      console.error('Error fetching recipes:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        title: formData.title,
        description: formData.description,
        ingredients: formData.ingredients ? formData.ingredients.split('\n').filter(i => i.trim()) : [],
        instructions: formData.instructions,
      };

      if (editingRecipe) {
        await axios.put(
          `${process.env.REACT_APP_BACKEND_URL}/api/my-recipes/${editingRecipe.id}`,
          payload,
          { withCredentials: true }
        );
      } else {
        await axios.post(
          `${process.env.REACT_APP_BACKEND_URL}/api/my-recipes`,
          payload,
          { withCredentials: true }
        );
      }
      setDialogOpen(false);
      setEditingRecipe(null);
      setFormData({ title: '', description: '', ingredients: '', instructions: '' });
      fetchRecipes();
    } catch (error) {
      console.error('Error saving recipe:', error);
    }
  };

  const handleDelete = async (recipeId) => {
    if (!window.confirm('Are you sure you want to delete this recipe?')) return;
    try {
      await axios.delete(
        `${process.env.REACT_APP_BACKEND_URL}/api/my-recipes/${recipeId}`,
        { withCredentials: true }
      );
      fetchRecipes();
    } catch (error) {
      console.error('Error deleting recipe:', error);
    }
  };

  const handleEdit = (recipe) => {
    setEditingRecipe(recipe);
    setFormData({
      title: recipe.title,
      description: recipe.description || '',
      ingredients: recipe.ingredients ? recipe.ingredients.join('\n') : '',
      instructions: recipe.instructions || '',
    });
    setDialogOpen(true);
  };

  const handleFileUpload = async (recipeId, event) => {
    const file = event.target.files[0];
    if (!file) return;

    setUploadingFiles(prev => ({ ...prev, [recipeId]: true }));
    try {
      const formData = new FormData();
      formData.append('file', file);

      await axios.post(
        `${process.env.REACT_APP_BACKEND_URL}/api/my-recipes/${recipeId}/upload`,
        formData,
        {
          withCredentials: true,
          headers: { 'Content-Type': 'multipart/form-data' },
        }
      );
      fetchRecipes();
    } catch (error) {
      console.error('Error uploading file:', error);
    } finally {
      setUploadingFiles(prev => ({ ...prev, [recipeId]: false }));
    }
  };

  const handleFileDelete = async (recipeId, fileId) => {
    try {
      await axios.delete(
        `${process.env.REACT_APP_BACKEND_URL}/api/my-recipes/${recipeId}/files/${fileId}`,
        { withCredentials: true }
      );
      fetchRecipes();
    } catch (error) {
      console.error('Error deleting file:', error);
    }
  };

  const getFileDownloadUrl = (file) => {
    // If file has direct Cloudinary URL, use it; otherwise use API endpoint
    return file.url || `${process.env.REACT_APP_BACKEND_URL}/api/my-recipes/${file.recipe_id}/files/${file.id}/download`;
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
            My Recipes
          </h1>
          <p className="text-base mt-1" style={{ color: '#6B7262' }}>
            Save and organize your favorite recipes with attachments
          </p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={(open) => {
          setDialogOpen(open);
          if (!open) {
            setEditingRecipe(null);
            setFormData({ title: '', description: '', ingredients: '', instructions: '' });
          }
        }}>
          <DialogTrigger asChild>
            <Button className="rounded-xl" style={{ background: '#4A5D23', color: '#FFFFFF' }} data-testid="add-recipe-button">
              <Plus className="w-5 h-5 mr-2" />
              Add Recipe
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle style={{ fontFamily: 'Outfit, sans-serif' }}>
                {editingRecipe ? 'Edit Recipe' : 'Add New Recipe'}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">Recipe Title</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  required
                  data-testid="recipe-title-input"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={2}
                  data-testid="recipe-description-input"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="ingredients">Ingredients (one per line)</Label>
                <Textarea
                  id="ingredients"
                  value={formData.ingredients}
                  onChange={(e) => setFormData({ ...formData, ingredients: e.target.value })}
                  rows={4}
                  placeholder="Tomatoes\nOnions\nGarlic"
                  data-testid="recipe-ingredients-input"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="instructions">Instructions</Label>
                <Textarea
                  id="instructions"
                  value={formData.instructions}
                  onChange={(e) => setFormData({ ...formData, instructions: e.target.value })}
                  rows={6}
                  data-testid="recipe-instructions-input"
                />
              </div>
              <Button type="submit" className="w-full rounded-xl" style={{ background: '#4A5D23', color: '#FFFFFF' }} data-testid="save-recipe-button">
                {editingRecipe ? 'Update Recipe' : 'Add Recipe'}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {recipes.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-2xl border border-[#E6E8E3]" data-testid="empty-recipes">
          <FileText className="w-12 h-12 mx-auto mb-3" style={{ color: '#6B7262' }} />
          <p className="text-sm" style={{ color: '#6B7262' }}>No recipes yet. Start adding your favorites!</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6" data-testid="recipes-grid">
          {recipes.map((recipe) => (
            <div
              key={recipe.id}
              className="bg-white rounded-2xl border border-[#E6E8E3] p-6"
              data-testid={`recipe-card-${recipe.id}`}
            >
              <div className="flex items-start justify-between mb-4">
                <h3 className="text-xl font-semibold" style={{ fontFamily: 'Outfit, sans-serif', color: '#1A2015' }}>
                  {recipe.title}
                </h3>
                <div className="flex gap-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleEdit(recipe)}
                    className="rounded-lg hover:bg-[#F2F7EC]"
                    data-testid={`edit-recipe-${recipe.id}`}
                  >
                    <Edit2 className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDelete(recipe.id)}
                    className="rounded-lg hover:bg-[#FDF2F1]"
                    data-testid={`delete-recipe-${recipe.id}`}
                  >
                    <Trash2 className="w-4 h-4" style={{ color: '#90352A' }} />
                  </Button>
                </div>
              </div>

              {recipe.description && (
                <p className="text-sm mb-4" style={{ color: '#6B7262' }}>{recipe.description}</p>
              )}

              {recipe.ingredients && recipe.ingredients.length > 0 && (
                <div className="mb-4">
                  <h4 className="text-sm font-medium mb-2" style={{ color: '#1A2015' }}>Ingredients:</h4>
                  <ul className="text-sm space-y-1" style={{ color: '#6B7262' }}>
                    {recipe.ingredients.slice(0, 3).map((ing, idx) => (
                      <li key={idx}>• {ing}</li>
                    ))}
                    {recipe.ingredients.length > 3 && (
                      <li className="font-medium">...and {recipe.ingredients.length - 3} more</li>
                    )}
                  </ul>
                </div>
              )}

              <div className="border-t border-[#E6E8E3] pt-4 mt-4">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-sm font-medium" style={{ color: '#1A2015' }}>Attachments ({recipe.files?.length || 0})</h4>
                  <label>
                    <input
                      type="file"
                      className="hidden"
                      onChange={(e) => handleFileUpload(recipe.id, e)}
                      accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                      data-testid={`upload-file-${recipe.id}`}
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="rounded-lg"
                      disabled={uploadingFiles[recipe.id]}
                      onClick={() => {}}
                      as="span"
                    >
                      {uploadingFiles[recipe.id] ? (
                        <>Uploading...</>
                      ) : (
                        <>
                          <Upload className="w-4 h-4 mr-1" />
                          Upload
                        </>
                      )}
                    </Button>
                  </label>
                </div>

                {recipe.files && recipe.files.length > 0 && (
                  <div className="space-y-2">
                    {recipe.files.map((file) => (
                      <div
                        key={file.id}
                        className="flex items-center justify-between p-2 rounded-lg bg-[#F2F7EC]"
                        data-testid={`file-${file.id}`}
                      >
                        <div className="flex items-center gap-2 flex-1 min-w-0">
                          <FileText className="w-4 h-4 flex-shrink-0" style={{ color: '#4A5D23' }} />
                          <span className="text-sm truncate" style={{ color: '#1A2015' }}>{file.filename}</span>
                          <span className="text-xs" style={{ color: '#6B7262' }}>({Math.round(file.size / 1024)}KB)</span>
                        </div>
                        <div className="flex gap-1">
                          <a
                            href={getFileDownloadUrl(file)}
                            download
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 rounded-lg"
                              data-testid={`download-file-${file.id}`}
                            >
                              <Download className="w-3 h-3" />
                            </Button>
                          </a>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 rounded-lg hover:bg-[#FDF2F1]"
                            onClick={() => handleFileDelete(recipe.id, file.id)}
                            data-testid={`delete-file-${file.id}`}
                          >
                            <X className="w-3 h-3" style={{ color: '#90352A' }} />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}