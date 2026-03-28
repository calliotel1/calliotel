import React, { useState } from 'react';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { Mail, Lock, ArrowRight, Loader, AlertCircle, Eye, EyeOff } from 'lucide-react';
import { useToast } from '../hooks/use-toast';

const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [loading, setLoading] = useState(false);
  const [oauthLoading, setOauthLoading] = useState(null); // 'google' or 'microsoft'
  const [searchParams] = useSearchParams();
  const { login } = useAuth();
  const { darkMode } = useTheme();
  const navigate = useNavigate();
  const { toast } = useToast();

  // Check for OAuth error in URL
  React.useEffect(() => {
    const error = searchParams.get('error');
    if (error === 'authentication_failed') {
      toast({
        title: "Authentication Failed",
        description: "Unable to complete sign in. Please try again.",
        variant: "destructive",
      });
      // Clear the error from URL
      window.history.replaceState({}, '', '/login');
    }

    // Load saved credentials if "Remember me" was checked
    const savedEmail = localStorage.getItem('rememberedEmail');
    const savedRememberMe = localStorage.getItem('rememberMe') === 'true';
    
    if (savedEmail && savedRememberMe) {
      setEmail(savedEmail);
      setRememberMe(true);
    }
  }, [searchParams, toast]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    console.log('Login attempt started');
    console.log('Email:', email);
    
    setLoading(true);

    try {
      const result = await login(email, password);
      
      console.log('Login result:', result);
      
      if (result.success) {
        // Save email if "Remember me" is checked
        if (rememberMe) {
          localStorage.setItem('rememberedEmail', email);
          localStorage.setItem('rememberMe', 'true');
        } else {
          localStorage.removeItem('rememberedEmail');
          localStorage.removeItem('rememberMe');
        }

        toast({
          title: "Welcome back!",
          description: "You've successfully logged in",
        });
        
        // Force navigation to dashboard with a slight delay to ensure state updates
        setTimeout(() => {
          navigate('/dashboard', { replace: true });
        }, 100);
      } else {
        // Check if it's a wrong password error
        const isPasswordError = result.error?.toLowerCase().includes('password') || 
                                result.error?.toLowerCase().includes('invalid credentials');
        
        if (isPasswordError) {
          toast({
            title: "❌ Password Incorrect",
            description: (
              <div>
                <p className="mb-2">The password you entered is wrong.</p>
                <Link 
                  to="/forgot-password" 
                  className="text-orange-400 hover:text-orange-300 underline font-semibold"
                >
                  Reset Password →
                </Link>
              </div>
            ),
            variant: "destructive",
            duration: 6000,
          });
        } else {
          toast({
            title: "Login failed",
            description: result.error || "Please check your credentials",
            variant: "destructive",
          });
        }
      }
    } catch (error) {
      console.error('Login error:', error);
      toast({
        title: "Login error",
        description: "Something went wrong. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = () => {
    // REMINDER: DO NOT HARDCODE THE URL, OR ADD ANY FALLBACKS OR REDIRECT URLS, THIS BREAKS THE AUTH
    setOauthLoading('google');
    toast({
      title: "Redirecting to Google...",
      description: "Opening Google sign in",
    });
    
    // Small delay for visual feedback
    setTimeout(() => {
      const redirectUrl = window.location.origin + '/dashboard';
      window.location.href = `https://auth.emergentagent.com/?redirect=${encodeURIComponent(redirectUrl)}`;
    }, 500);
  };

  const handleMicrosoftLogin = () => {
    setOauthLoading('microsoft');
    toast({
      title: "Redirecting to Microsoft...",
      description: "Opening Microsoft sign in",
    });
    
    // Small delay for visual feedback
    setTimeout(() => {
      const redirectUrl = window.location.origin + '/auth/callback#provider=microsoft';
      window.location.href = `https://auth.emergentagent.com/microsoft?redirect=${encodeURIComponent(redirectUrl)}`;
    }, 500);
  };

  return (
    <div className="min-h-screen bg-obsidian flex items-center justify-center px-4">
      <div className="max-w-md w-full bg-olive border border-ember/40 rounded-2xl shadow-[0_0_40px_rgba(199,78,30,0.3)] p-8">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center space-x-2 mb-4">
            <div className="w-12 h-12 bg-ember rounded-xl flex items-center justify-center shadow-[0_0_20px_rgba(199,78,30,0.5)]">
              <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 20 20">
                <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z" />
              </svg>
            </div>
            <span className="text-3xl font-bold text-ember">CALLIOTEL</span>
          </div>
          <h2 className="text-2xl font-bold text-white">
            Welcome Back, Commander
          </h2>
          <p className="text-gray-400 mt-2">
            🏛️ Enter the Digital Colosseum
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className={`block text-sm font-medium ${
              darkMode ? 'text-gray-300' : 'text-gray-700'
            } mb-2`}>
              Email Address
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className={`w-full pl-10 pr-4 py-3 border ${
                  darkMode
                    ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400'
                    : 'bg-white border-gray-300 text-gray-900'
                } rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent`}
                placeholder="you@example.com"
              />
            </div>
          </div>

          <div>
            <label className={`block text-sm font-medium ${
              darkMode ? 'text-gray-300' : 'text-gray-700'
            } mb-2`}>
              Password
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className={`w-full pl-10 pr-12 py-3 border ${
                  darkMode
                    ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400'
                    : 'bg-white border-gray-300 text-gray-900'
                } rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent`}
                placeholder="Enter your password"
              />
              {/* Show/Hide Password Toggle */}
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 hover:opacity-70 transition-opacity"
                title={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? (
                  <EyeOff className={`w-5 h-5 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`} />
                ) : (
                  <Eye className={`w-5 h-5 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`} />
                )}
              </button>
            </div>
          </div>

          <div className="flex items-center justify-between mb-6">
            <label className="flex items-center cursor-pointer">
              <input 
                type="checkbox" 
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="rounded border-gray-300 text-orange-600 focus:ring-orange-500 cursor-pointer" 
              />
              <span className={`ml-2 text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                Remember me
              </span>
            </label>
            <Link to="/forgot-password" className={`text-sm ${
              darkMode ? 'text-ember' : 'text-orange-600'
            } hover:underline font-semibold`}>
              Forgot password?
            </Link>
          </div>

          <button
            type="submit"
            disabled={loading || oauthLoading}
            className={`w-full py-3 ${
              darkMode
                ? 'bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700'
                : 'bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700'
            } text-white font-semibold rounded-lg transition-all transform hover:scale-105 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center justify-center space-x-2`}
          >
            {loading ? (
              <>
                <Loader className="w-5 h-5 animate-spin" />
                <span>Logging in...</span>
              </>
            ) : (
              <>
                <span>Log In</span>
                <ArrowRight className="w-5 h-5" />
              </>
            )}
          </button>
        </form>

        <div className="mt-6">
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className={`w-full border-t ${darkMode ? 'border-gray-700' : 'border-gray-300'}`}></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className={`px-4 ${
                darkMode ? 'bg-gray-800 text-gray-400' : 'bg-white text-gray-500'
              }`}>Or continue with</span>
            </div>
          </div>

          <div className="mt-6 space-y-3">
            <button
              onClick={handleGoogleLogin}
              type="button"
              disabled={loading || oauthLoading}
              className={`w-full py-3 px-4 border-2 ${
                darkMode
                  ? 'border-gray-700 hover:bg-gray-700 text-white'
                  : 'border-gray-300 hover:bg-gray-50 text-gray-700'
              } rounded-lg transition-all flex items-center justify-center space-x-3 font-semibold disabled:opacity-50 disabled:cursor-not-allowed ${
                oauthLoading === 'google' ? 'ring-2 ring-blue-500' : ''
              }`}
            >
              {oauthLoading === 'google' ? (
                <>
                  <Loader className="w-5 h-5 animate-spin text-ember" />
                  <span>Connecting to Google...</span>
                </>
              ) : (
                <>
                  <svg className="w-5 h-5" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                  </svg>
                  <span>Sign in with Google</span>
                </>
              )}
            </button>

            <button
              onClick={handleMicrosoftLogin}
              type="button"
              disabled={loading || oauthLoading}
              className={`w-full py-3 px-4 border-2 ${
                darkMode
                  ? 'border-gray-700 hover:bg-gray-700 text-white'
                  : 'border-gray-300 hover:bg-gray-50 text-gray-700'
              } rounded-lg transition-all flex items-center justify-center space-x-3 font-semibold disabled:opacity-50 disabled:cursor-not-allowed ${
                oauthLoading === 'microsoft' ? 'ring-2 ring-blue-500' : ''
              }`}
            >
              {oauthLoading === 'microsoft' ? (
                <>
                  <Loader className="w-5 h-5 animate-spin text-ember" />
                  <span>Connecting to Microsoft...</span>
                </>
              ) : (
                <>
                  <svg className="w-5 h-5" viewBox="0 0 23 23">
                    <path fill="#f35325" d="M0 0h11v11H0z"/>
                    <path fill="#81bc06" d="M12 0h11v11H12z"/>
                    <path fill="#05a6f0" d="M0 12h11v11H0z"/>
                    <path fill="#ffba08" d="M12 12h11v11H12z"/>
                  </svg>
                  <span>Sign in with Microsoft</span>
                </>
              )}
            </button>
          </div>
        </div>

        <p className={`text-center mt-6 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
          Don't have an account?{' '}
          <Link to="/signup" className={`${
            darkMode ? 'text-ember' : 'text-orange-600'
          } font-semibold hover:underline`}>
            Sign up
          </Link>
        </p>
      </div>
    </div>
  );
};

export default LoginPage;