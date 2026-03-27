import React, { useState, useEffect } from 'react';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { Mail, Lock, User, ArrowRight, Gift, Eye, EyeOff, Key } from 'lucide-react';
import { useToast } from '../hooks/use-toast';

// REMINDER: DO NOT HARDCODE THE URL, OR ADD ANY FALLBACKS OR REDIRECT URLS, THIS BREAKS THE AUTH
const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

const SignupPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [fullName, setFullName] = useState('');
  const [birthday, setBirthday] = useState('');
  const [referralCode, setReferralCode] = useState('');
  const [loading, setLoading] = useState(false);
  const { signup } = useAuth();
  const { darkMode } = useTheme();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [searchParams] = useSearchParams();

  // Generate strong random password
  const generatePassword = () => {
    const length = 12;
    const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const lowercase = 'abcdefghijklmnopqrstuvwxyz';
    const numbers = '0123456789';
    const symbols = '!@#$%^&*';
    const allChars = uppercase + lowercase + numbers + symbols;
    
    let generatedPassword = '';
    // Ensure at least one of each type
    generatedPassword += uppercase[Math.floor(Math.random() * uppercase.length)];
    generatedPassword += lowercase[Math.floor(Math.random() * lowercase.length)];
    generatedPassword += numbers[Math.floor(Math.random() * numbers.length)];
    generatedPassword += symbols[Math.floor(Math.random() * symbols.length)];
    
    // Fill the rest randomly
    for (let i = generatedPassword.length; i < length; i++) {
      generatedPassword += allChars[Math.floor(Math.random() * allChars.length)];
    }
    
    // Shuffle the password
    generatedPassword = generatedPassword.split('').sort(() => Math.random() - 0.5).join('');
    
    setPassword(generatedPassword);
    setShowPassword(true); // Show the generated password
    
    toast({
      title: "🔐 Strong Password Generated!",
      description: "A secure password has been created for you",
    });
  };

  useEffect(() => {
    // Auto-fill referral code from URL if present
    const refCode = searchParams.get('ref');
    if (refCode) {
      setReferralCode(refCode);
    }
  }, [searchParams]);

  const handleGoogleSignup = () => {
    // REMINDER: DO NOT HARDCODE THE URL, OR ADD ANY FALLBACKS OR REDIRECT URLS, THIS BREAKS THE AUTH
    const redirectUrl = window.location.origin + '/dashboard';
    window.location.href = `https://auth.emergentagent.com/?redirect=${encodeURIComponent(redirectUrl)}`;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!birthday) {
      toast({
        title: "Birthday required",
        description: "Please enter your birth date",
        variant: "destructive",
      });
      return;
    }
    
    setLoading(true);

    const result = await signup(email, password, fullName, birthday, referralCode);
    
    if (result.success) {
      const bonusMsg = referralCode 
        ? "We've sent a verification email! Check your inbox (and spam/junk folder if needed)." 
        : "We've sent a verification email! Check your inbox and spam/junk folder.";
      toast({
        title: "✅ Account Created!",
        description: bonusMsg,
        duration: 8000,
      });
      navigate('/verify-email-pending');
    } else {
      toast({
        title: "Signup failed",
        description: result.error,
        variant: "destructive",
      });
    }
    
    setLoading(false);
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
            Join the Empire, Commander
          </h2>
          <p className="text-gray-400 mt-2">
            🏛️ Secure Your Position in the Digital Colosseum
          </p>
        </div>

        {/* Google Sign-In Button */}
        <button
          type="button"
          onClick={handleGoogleSignup}
          className="w-full py-3 bg-obsidian-light border border-ember/30 text-white font-semibold rounded-lg hover:bg-olive-dark hover:border-ember/50 transition-all flex items-center justify-center space-x-3 mb-4 shadow-[0_0_15px_rgba(199,78,30,0.2)]"
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
          </svg>
          <span>Sign up with Google</span>
        </button>

        <div className="flex items-center my-6">
          <div className="flex-1 border-t border-ember/20"></div>
          <span className="px-4 text-sm text-gray-400">or sign up with email</span>
          <div className="flex-1 border-t border-ember/20"></div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Full Name (Optional)
            </label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 w-5 h-5" />
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-obsidian-light border border-ember/20 text-white placeholder-gray-500 rounded-lg focus:ring-2 focus:ring-ember focus:border-ember transition-all"
                placeholder="John Doe"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Email Address *
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 w-5 h-5" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full pl-10 pr-4 py-3 bg-obsidian-light border border-ember/20 text-white placeholder-gray-500 rounded-lg focus:ring-2 focus:ring-ember focus:border-ember transition-all"
                placeholder="you@example.com"
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-medium text-gray-300">
                Password *
              </label>
              <button
                type="button"
                onClick={generatePassword}
                className="flex items-center space-x-1 text-xs text-ember hover:text-ember-light font-semibold transition-colors"
              >
                <Key className="w-3.5 h-3.5" />
                <span>Generate Strong Password</span>
              </button>
            </div>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 w-5 h-5" />
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
                className="w-full pl-10 pr-12 py-3 bg-obsidian-light border border-ember/20 text-white placeholder-gray-500 rounded-lg focus:ring-2 focus:ring-ember focus:border-ember transition-all"
                placeholder="Minimum 6 characters"
              />
              {/* Show/Hide Password Toggle */}
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 hover:opacity-70 transition-opacity"
                title={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? (
                  <EyeOff className="w-5 h-5 text-gray-500" />
                ) : (
                  <Eye className="w-5 h-5 text-gray-500" />
                )}
              </button>
            </div>
            <p className="text-xs text-gray-400 mt-1">
              {password.length >= 6 ? '✅ Strong password' : 'Minimum 6 characters required'}
            </p>
          </div>

          {/* Birthday (Required) */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              🎂 Birthday * (Required)
            </label>
            <input
              type="date"
              value={birthday}
              onChange={(e) => setBirthday(e.target.value)}
              required
              max={new Date().toISOString().split('T')[0]}
              className="w-full px-4 py-3 bg-obsidian-light border border-ember/20 text-white rounded-lg focus:ring-2 focus:ring-ember focus:border-ember transition-all"
            />
            <p className="text-xs text-gray-400 mt-1">You must be at least 13 years old. Friends will be notified on your birthday! 🎉</p>
          </div>

          {/* Referral Code (Optional) */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Referral Code (Optional)
            </label>
            <div className="relative">
              <Gift className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 w-5 h-5" />
              <input
                type="text"
                value={referralCode}
                onChange={(e) => setReferralCode(e.target.value.toUpperCase())}
                className="w-full pl-10 pr-4 py-3 bg-obsidian-light border border-ember/20 text-white placeholder-gray-500 rounded-lg focus:ring-2 focus:ring-ember focus:border-ember transition-all"
                placeholder="ABCD1234"
              />
            </div>
            {referralCode && (
              <p className="text-xs text-green-400 mt-1">🎁 Get $10 bonus with referral code!</p>
            )}
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-ember text-white font-bold rounded-lg hover:bg-ember-light transition-all transform hover:scale-105 shadow-[0_0_20px_rgba(199,78,30,0.4)] hover:shadow-[0_0_30px_rgba(199,78,30,0.6)] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
          >
            {loading ? (
              <span>Creating account...</span>
            ) : (
              <>
                <span>Sign Up</span>
                <ArrowRight className="w-5 h-5" />
              </>
            )}
          </button>
        </form>

        <p className="text-center mt-6 text-gray-400">
          Already have an account?{' '}
          <Link to="/login" className="text-ember font-semibold hover:text-ember-light transition-colors">
            Log in
          </Link>
        </p>
      </div>
    </div>
  );
};

export default SignupPage;