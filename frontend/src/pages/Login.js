import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Shield, Mail, Lock } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { useToast } from '../hooks/use-toast';

const Login = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const { toast } = useToast();
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await login(formData.email, formData.password);
      toast({ title: 'Success', description: 'Logged in successfully' });
      navigate('/dashboard');
    } catch (error) {
      toast({ 
        title: 'Error', 
        description: error.response?.data?.detail || 'Login failed',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-cyber-black flex items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute inset-0 bg-grid-pattern bg-[size:4rem_4rem] opacity-20" />
      
      <div className="relative z-10 w-full max-w-md">
        <div className="mb-8 text-center">
          <Shield className="w-12 h-12 text-cyber-cyan mx-auto mb-4" strokeWidth={1.5} />
          <h1 className="text-3xl font-mono font-bold mb-2">Welcome Back</h1>
          <p className="text-gray-400 font-sans">Login to SecureVision AI</p>
        </div>

        <div className="bg-cyber-gray/50 backdrop-blur-md border border-white/10 p-8">
          <form onSubmit={handleSubmit} className="space-y-6" data-testid="login-form">
            <div>
              <Label htmlFor="email" className="font-mono text-xs uppercase tracking-wider text-gray-400">
                Email
              </Label>
              <div className="relative mt-2">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-500" strokeWidth={1.5} />
                <Input
                  id="email"
                  data-testid="login-email-input"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="pl-10 bg-black/50 border-white/20 focus:border-cyber-cyan font-mono"
                  required
                />
              </div>
            </div>

            <div>
              <Label htmlFor="password" className="font-mono text-xs uppercase tracking-wider text-gray-400">
                Password
              </Label>
              <div className="relative mt-2">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-500" strokeWidth={1.5} />
                <Input
                  id="password"
                  data-testid="login-password-input"
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="pl-10 bg-black/50 border-white/20 focus:border-cyber-cyan font-mono"
                  required
                />
              </div>
            </div>

            <Button
              type="submit"
              data-testid="login-submit-btn"
              className="w-full font-mono uppercase bg-cyber-cyan text-black hover:bg-cyber-cyan/80"
              disabled={loading}
            >
              {loading ? 'Logging in...' : 'Login'}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-gray-400 font-sans text-sm">
              Don't have an account?{' '}
              <button
                data-testid="goto-register-link"
                onClick={() => navigate('/register')}
                className="text-cyber-cyan hover:underline font-mono"
              >
                Register
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;