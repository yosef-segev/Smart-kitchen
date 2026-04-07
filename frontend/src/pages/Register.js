import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { ChefHat } from 'lucide-react';

export default function Register() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const result = await register(email, password, name);
    setLoading(false);

    if (result.success) {
      navigate('/dashboard');
    } else {
      setError(result.error);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6" style={{ background: '#FDFDF9' }}>
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-[#4A5D23] mb-4">
            <ChefHat className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-4xl font-semibold tracking-tight mb-2" style={{ fontFamily: 'Outfit, sans-serif', color: '#1A2015' }}>
            Get Started
          </h1>
          <p className="text-base" style={{ fontFamily: 'Manrope, sans-serif', color: '#6B7262' }}>
            Create your account to start organizing
          </p>
        </div>

        <div className="bg-white rounded-2xl p-8 border border-[#E6E8E3] shadow-sm">
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="p-4 rounded-xl bg-[#FDF2F1] border border-[#F5D8D5]" data-testid="register-error">
                <p className="text-sm" style={{ color: '#90352A' }}>{error}</p>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="name" className="text-sm font-medium" style={{ color: '#1A2015' }}>Name</Label>
              <Input
                id="name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="h-12 border-[#E6E8E3] focus:ring-[#4A5D23] focus:border-[#4A5D23]"
                data-testid="register-name-input"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-medium" style={{ color: '#1A2015' }}>Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="h-12 border-[#E6E8E3] focus:ring-[#4A5D23] focus:border-[#4A5D23]"
                data-testid="register-email-input"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-sm font-medium" style={{ color: '#1A2015' }}>Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="h-12 border-[#E6E8E3] focus:ring-[#4A5D23] focus:border-[#4A5D23]"
                data-testid="register-password-input"
              />
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="w-full h-12 rounded-xl font-medium"
              style={{ background: '#4A5D23', color: '#FFFFFF' }}
              data-testid="register-submit-button"
            >
              {loading ? 'Creating account...' : 'Create Account'}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm" style={{ fontFamily: 'Manrope, sans-serif', color: '#6B7262' }}>
              Already have an account?{' '}
              <Link to="/login" className="font-medium hover:underline" style={{ color: '#4A5D23' }} data-testid="login-link">
                Sign in
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}