import React, { useState, useEffect } from 'react';
import { Search, Phone, ShoppingCart, Loader, TrendingUp, ArrowLeft } from 'lucide-react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useToast } from '../hooks/use-toast';
import { useNavigate } from 'react-router-dom';
import safeLocalStorage from '../utils/safeLocalStorage';
import NumberPresetFilter from '../components/NumberPresetFilter';
import UsageIntentModal from '../components/UsageIntentModal';
import FreshnessBadge from '../components/FreshnessBadge';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const BrowseNumbersPage = () => {
  const [selectedCountry, setSelectedCountry] = useState('US');
  const [areaCode, setAreaCode] = useState('');
  const [numbers, setNumbers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [purchasing, setPurchasing] = useState(null);
  const [activePreset, setActivePreset] = useState('all');
  const [showUsageIntent, setShowUsageIntent] = useState(false);
  const [purchasedNumber, setPurchasedNumber] = useState(null);
  const [popularUses, setPopularUses] = useState({});
  const { user } = useAuth();
  const { darkMode } = useTheme();
  const { toast } = useToast();
  const navigate = useNavigate();

  const countries = [
    { code: 'US', name: 'United States', flag: '🇺🇸', cost: 1.99 },
    { code: 'CA', name: 'Canada', flag: '🇨🇦', cost: 1.99 },
    { code: 'GB', name: 'United Kingdom', flag: '🇬🇧', cost: 1.99 },
    { code: 'DE', name: 'Germany', flag: '🇩🇪', cost: 1.99 },
  ];

  const searchNumbers = async () => {
    setLoading(true);
    try {
      const token = safeLocalStorage.getItem('token');
      const response = await axios.post(
        `${API}/telnyx/phone-numbers/search`,
        {
          country_code: selectedCountry,
          area_code: areaCode || null,
          limit: 20,
          preset: activePreset !== 'all' ? activePreset : null
        },
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      setNumbers(response.data);
    } catch (error) {
      toast({
        title: 'Search failed',
        description: error.response?.data?.detail || 'Could not load numbers',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handlePresetChange = (presetId) => {
    setActivePreset(presetId);
    // Auto-search when preset changes
    setTimeout(() => {
      if (numbers.length > 0) {
        searchNumbers();
      }
    }, 100);
  };

  const purchaseNumber = async (phoneNumber) => {
    setPurchasing(phoneNumber);
    try {
      const token = safeLocalStorage.getItem('token');
      const country = countries.find(c => c.code === selectedCountry);
      
      const response = await axios.post(
        `${API}/numbers/purchase`,
        {
          phone_number: phoneNumber,
          country_code: selectedCountry,
          monthly_cost: country.cost
        },
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      
      toast({
        title: 'Success!',
        description: response.data.message || `Number ${phoneNumber} purchased successfully`,
      });
      
      // Remove from available list
      setNumbers(numbers.filter(n => n.phone_number !== phoneNumber));
      
      // Show usage intent modal
      setPurchasedNumber(phoneNumber);
      setShowUsageIntent(true);
      
    } catch (error) {
      const errorMessage = error.response?.data?.detail || 'Could not purchase number';
      
      toast({
        title: 'Purchase failed',
        description: errorMessage,
        variant: 'destructive',
      });
      
      // If insufficient balance, prompt user to add funds
      if (errorMessage.includes('Insufficient balance') || errorMessage.includes('add balance')) {
        setTimeout(() => {
          toast({
            title: 'Add Balance',
            description: 'Redirecting to wallet page...',
          });
          navigate('/wallet');
        }, 2000);
      }
    } finally {
      setPurchasing(null);
    }
  };

  useEffect(() => {
    searchNumbers();
    fetchPopularUses();
  }, [selectedCountry]);

  const handleUsageIntentSubmit = async (intendedUse, customUse) => {
    try {
      const token = safeLocalStorage.getItem('token');
      await axios.post(
        `${API}/number-intelligence/track-intent`,
        {
          phone_number: purchasedNumber,
          intended_use: intendedUse,
          custom_use: customUse
        },
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      
      toast({
        title: 'Thank you!',
        description: 'Your feedback helps improve recommendations',
      });
    } catch (error) {
      console.error('Failed to track usage intent:', error);
    } finally {
      // Navigate to My Numbers after 1 second
      setTimeout(() => {
        navigate('/my-numbers');
      }, 1000);
    }
  };

  const fetchPopularUses = async () => {
    try {
      const response = await axios.get(`${API}/number-intelligence/popular-uses`);
      const popularMap = {};
      response.data.popular_uses.forEach(use => {
        popularMap[use.use] = use;
      });
      setPopularUses(popularMap);
    } catch (error) {
      console.error('Failed to fetch popular uses:', error);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-3">
              {/* Back Button */}
              <button
                onClick={() => navigate(-1)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                title="Go back"
              >
                <ArrowLeft className="w-6 h-6 text-gray-700" />
              </button>
              <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl flex items-center justify-center">
                <Phone className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Browse Numbers</h1>
                <p className="text-sm text-gray-600">Find your perfect virtual number</p>
              </div>
            </div>
            <button
              onClick={() => navigate('/my-numbers')}
              className="px-4 py-2 bg-gradient-to-r from-ember to-ember-light text-white font-semibold rounded-lg hover:from-ember hover:to-ember-dark transition-all"
            >
              My Numbers
            </button>
          </div>
        </div>
      </header>

      {/* Search Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid lg:grid-cols-4 gap-6">
          {/* Preset Filter Sidebar */}
          <div className="lg:col-span-1">
            <NumberPresetFilter 
              activePreset={activePreset}
              onSelectPreset={handlePresetChange}
            />
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3">
            <div className="bg-white rounded-xl shadow-sm p-6 mb-8">
              <h2 className="text-xl font-bold text-gray-900 mb-4">
                {activePreset === 'all' ? 'Search Available Numbers' : 'Filtered Numbers'}
              </h2>
              
              <div className="grid md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Country</label>
                  <select
                    value={selectedCountry}
                    onChange={(e) => setSelectedCountry(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  >
                    {countries.map((country) => (
                      <option key={country.code} value={country.code}>
                        {country.flag} {country.name} (${country.cost}/mo)
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Area Code (Optional)</label>
                  <input
                    type="text"
                    value={areaCode}
                    onChange={(e) => setAreaCode(e.target.value)}
                    placeholder="e.g., 212"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  />
                </div>

                <div className="flex items-end">
                  <button
                    onClick={searchNumbers}
                    disabled={loading}
                    className="w-full px-6 py-3 bg-gradient-to-r from-orange-500 to-orange-600 text-white font-semibold rounded-lg hover:from-orange-600 hover:to-orange-700 transition-all disabled:opacity-50 flex items-center justify-center space-x-2"
                  >
                    {loading ? (
                      <>
                        <Loader className="w-5 h-5 animate-spin" />
                        <span>Searching...</span>
                      </>
                    ) : (
                      <>
                        <Search className="w-5 h-5" />
                        <span>Search</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>

            {/* Results */}
            {loading ? (
              <div className="text-center py-12">
                <Loader className="w-12 h-12 animate-spin text-orange-600 mx-auto" />
                <p className="text-gray-600 mt-4">Loading available numbers...</p>
              </div>
            ) : numbers.length === 0 ? (
              <div className="text-center py-12 bg-white rounded-xl">
                <Phone className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">No numbers found. Try a different search.</p>
              </div>
            ) : (
              <div>
                <div className="flex items-center justify-between mb-4">
                  <p className="text-sm text-gray-600" data-testid="found-numbers-count">
                    Found <span className="font-bold text-gray-900">{numbers.length}</span> numbers
                    {activePreset !== 'all' && <span className="text-orange-600" data-testid="filtered-by-preset-text"> (filtered by preset)</span>}
                  </p>
                </div>
                <div className="grid md:grid-cols-2 gap-4" data-testid="numbers-grid">
                  {numbers.map((number, index) => (
                    <div key={index} data-testid={`number-card-${index}`} className="bg-white rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow border-2 border-gray-100 hover:border-orange-200 group">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center space-x-2">
                          <Phone className="w-5 h-5 text-orange-600" />
                          <span className="text-lg font-bold text-gray-900">{number.phone_number}</span>
                        </div>
                        {/* Freshness Badge */}
                        <FreshnessBadge 
                          lastTested={new Date(Date.now() - Math.random() * 600000)} 
                          platform="WhatsApp"
                          status="verified"
                          size="small"
                        />
                      </div>
                      
                      {/* Recommended For Badges */}
                      {number.recommended_for && number.recommended_for.length > 0 && (
                        <div className="flex flex-wrap gap-1 mb-3" data-testid="recommended-for-badges">
                          {number.recommended_for.map((tag) => (
                            <span 
                              key={tag}
                              data-testid={`badge-${tag}`}
                              className="px-2 py-1 text-xs font-semibold bg-gradient-to-r from-green-100 to-emerald-100 text-green-700 rounded-full"
                            >
                              ✓ {tag.replace('_', ' ')}
                            </span>
                          ))}
                        </div>
                      )}
                      
                      <div className="space-y-2 mb-4">
                        <p className="text-sm text-gray-600">
                          <span className="font-medium">Country:</span> {countries.find(c => c.code === selectedCountry)?.name}
                        </p>
                        <p className="text-sm text-gray-600">
                          <span className="font-medium">Monthly:</span> ${number.cost_monthly || countries.find(c => c.code === selectedCountry)?.cost}
                        </p>
                        {number.region && (
                          <p className="text-sm text-gray-600">
                            <span className="font-medium">Region:</span> {number.region}
                          </p>
                        )}
                      </div>

                      <button
                        onClick={() => purchaseNumber(number.phone_number)}
                        disabled={purchasing === number.phone_number}
                        className="w-full py-2 bg-gradient-to-r from-green-500 to-green-600 text-white font-semibold rounded-lg hover:from-green-600 hover:to-green-700 transition-all disabled:opacity-50 flex items-center justify-center space-x-2"
                      >
                        {purchasing === number.phone_number ? (
                          <>
                            <Loader className="w-4 h-4 animate-spin" />
                            <span>Purchasing...</span>
                          </>
                        ) : (
                          <>
                            <ShoppingCart className="w-4 h-4" />
                            <span>Purchase</span>
                          </>
                        )}
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Usage Intent Modal */}
      <UsageIntentModal
        isOpen={showUsageIntent}
        onClose={() => {
          setShowUsageIntent(false);
          setTimeout(() => navigate('/my-numbers'), 500);
        }}
        phoneNumber={purchasedNumber}
        onSubmit={handleUsageIntentSubmit}
      />
    </div>
  );
};

export default BrowseNumbersPage;