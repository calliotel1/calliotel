import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Phone, Search, ChevronRight, Loader, CheckCircle, Globe, Zap } from 'lucide-react';
import SEO from '../components/SEO';

const API_URL = process.env.REACT_APP_BACKEND_URL;

const VirtualNumberMarketplace = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [numbers, setNumbers] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCountry, setSelectedCountry] = useState('all');
  const [userBalance, setUserBalance] = useState(0);
  const [bulkMode, setBulkMode] = useState(false);
  const [selectedNumbers, setSelectedNumbers] = useState([]);
  const [selectedTier, setSelectedTier] = useState(null);

  // Bulk pricing tiers (Empire Margin Strategy)
  const bulkTiers = [
    { 
      quantity: 10, 
      total: 25.00, 
      perNumber: 2.50, 
      savings: 4.90,
      profit: 15.10,
      badge: 'STARTER PACK'
    },
    { 
      quantity: 25, 
      total: 60.00, 
      perNumber: 2.40, 
      savings: 14.75,
      profit: 35.25,
      badge: 'POWER USER',
      popular: true
    },
    { 
      quantity: 50, 
      total: 110.00, 
      perNumber: 2.20, 
      savings: 39.50,
      profit: 60.50,
      badge: 'WHALE TIER'
    }
  ];

  const countries = [
    { code: 'US', name: 'United States', flag: '🇺🇸' },
    { code: 'UK', name: 'United Kingdom', flag: '🇬🇧' },
    { code: 'CA', name: 'Canada', flag: '🇨🇦' },
    { code: 'AU', name: 'Australia', flag: '🇦🇺' },
    { code: 'DE', name: 'Germany', flag: '🇩🇪' },
    { code: 'FR', name: 'France', flag: '🇫🇷' }
  ];

  useEffect(() => {
    fetchNumbers();
    fetchBalance();
  }, [selectedCountry]);

  const fetchNumbers = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const params = selectedCountry !== 'all' ? `?country_code=${selectedCountry}` : '?country_code=US';
      
      const response = await fetch(`${API_URL}/api/telecom/numbers/search${params}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      });
      
      if (response.ok) {
        const data = await response.json();
        setNumbers(data.numbers || []);
      }
    } catch (error) {
      console.error('Failed to fetch numbers:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchBalance = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;
      
      const response = await fetch(`${API_URL}/api/wallet/balance`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.ok) {
        const data = await response.json();
        setUserBalance(data.balance || 0);
      }
    } catch (error) {
      console.error('Failed to fetch balance:', error);
    }
  };

  const purchaseNumber = async (number) => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login');
      return;
    }

    if (userBalance < 2.99) {

  const toggleNumberSelection = (number) => {
    if (selectedNumbers.includes(number.number)) {
      setSelectedNumbers(selectedNumbers.filter(n => n !== number.number));
    } else {
      // Check if we've reached tier limit
      if (selectedTier && selectedNumbers.length >= selectedTier.quantity) {
        alert(`You can only select ${selectedTier.quantity} numbers for this tier`);
        return;
      }
      setSelectedNumbers([...selectedNumbers, number.number]);
    }
  };

  const bulkPurchaseNumbers = async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login');
      return;
    }

    if (!selectedTier) {
      alert('Please select a bulk tier first');
      return;
    }

    if (selectedNumbers.length !== selectedTier.quantity) {
      alert(`Please select exactly ${selectedTier.quantity} numbers for the ${selectedTier.badge} tier`);
      return;
    }

    if (userBalance < selectedTier.total) {
      alert(`Insufficient balance! Please add $${selectedTier.total.toFixed(2)} to your wallet.`);
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/api/telecom/numbers/bulk-purchase`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          numbers: selectedNumbers,
          provider: 'msg91',
          quantity: selectedTier.quantity
        })
      });

      if (response.ok) {
        const data = await response.json();
        alert(`✅ Success! Purchased ${data.numbers.length} numbers for $${data.total_cost}! You saved $${data.savings.toFixed(2)}!`);
        setSelectedNumbers([]);
        setSelectedTier(null);
        setBulkMode(false);
        fetchNumbers();
        fetchBalance();
      } else {
        const data = await response.json();
        alert(`❌ ${data.detail || 'Purchase failed'}`);
      }
    } catch (error) {
      alert('❌ Purchase failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

      alert('Insufficient balance! Please add $2.99 to your wallet to purchase this premium number.');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/api/telecom/numbers/purchase`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          number: number.number,
          provider: number.provider
        })
      });

      if (response.ok) {
        alert('✅ Number purchased successfully!');
        fetchNumbers();
        fetchBalance();
      } else {
        const data = await response.json();
        alert(`❌ ${data.detail || 'Purchase failed'}`);
      }
    } catch (error) {
      alert('❌ Purchase failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#0a0b0f] via-[#0f1015] to-[#0a0b0f]">
      <SEO 
        title="Bulk Virtual Numbers - Buy 10, 25, or 50 & Save Up To $39.50 | Calliotel"
        description="🐋 Whale tiers for power users: 10 numbers for $25 ($2.50/ea), 25 for $60 ($2.40/ea), or 50 for $110 ($2.20/ea). Business-grade virtual numbers with instant activation, voice + SMS. Save big on bulk purchases!"
        keywords="bulk virtual numbers, buy virtual numbers in bulk, cheap sms verification, wholesale phone numbers, temporary phone numbers bulk, power user numbers, whale tier pricing, business phone numbers, bulk phone numbers discount"
        url="https://calliotel.com/virtual-numbers"
      />

      {/* Header */}
      <div className="bg-[#16181f] border-b border-gray-800 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-white">Virtual Number Marketplace</h1>
              <p className="text-gray-400 text-sm">Business-grade numbers • $2.99/month</p>
            </div>
            {userBalance > 0 && (
              <div className="bg-green-900/30 px-4 py-2 rounded-lg border border-green-700/50">
                <div className="text-xs text-green-400">Balance</div>
                <div className="text-xl font-bold text-green-400">${userBalance.toFixed(2)}</div>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Premium Banner - OBSIDIAN & EMBER */}
        <div className="bg-gradient-to-r from-ember-dark to-ember rounded-2xl p-6 mb-8 text-white shadow-[0_0_40px_rgba(199,78,30,0.4)]">
          <div className="flex items-center gap-4">
            <Zap className="w-12 h-12" />
            <div>
              <div className="text-2xl font-bold">🏛️ PREMIUM BUSINESS-GRADE NUMBERS</div>
              <div className="text-orange-100">Private, encrypted virtual numbers with instant activation • $2.99/month</div>
            </div>
          </div>
        </div>

        {/* Bulk Purchase Mode Toggle */}
        <div className="flex items-center justify-center gap-4 mb-8">
          <button
            onClick={() => {
              setBulkMode(false);
              setSelectedNumbers([]);
              setSelectedTier(null);
            }}
            className={`px-6 py-3 rounded-lg font-bold transition-all ${
              !bulkMode 
                ? 'bg-ember hover:bg-ember-light text-white shadow-[0_0_20px_rgba(199,78,30,0.4)]' 
                : 'bg-olive-dark text-gray-400 hover:bg-olive'
            }`}
          >
            📱 Single Purchase ($2.99)
          </button>
          <button
            onClick={() => setBulkMode(true)}
            className={`px-6 py-3 rounded-lg font-bold transition-all ${
              bulkMode 
                ? 'bg-gradient-to-r from-ember to-ember-light text-white shadow-[0_0_20px_rgba(147,51,234,0.4)]' 
                : 'bg-olive-dark text-gray-400 hover:bg-olive'
            }`}
          >
            🏛️ Bulk Discount (Save up to $39.50!)
          </button>
        </div>

        {/* Bulk Tier Selection (Whale Tiers) */}
        {bulkMode && (
          <div className="mb-8">
            <div className="text-center mb-6">
              <h2 className="text-3xl font-bold text-white mb-2">🐋 HIGH-VOLUME WHALE TIERS 🐋</h2>
              <p className="text-gray-400">Select more, save more. Built for power users.</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {bulkTiers.map((tier) => (
                <button
                  key={tier.quantity}
                  onClick={() => {
                    setSelectedTier(tier);
                    setSelectedNumbers([]);
                  }}
                  className={`relative p-6 rounded-xl border-2 transition-all ${
                    selectedTier?.quantity === tier.quantity
                      ? 'border-ember bg-olive/20 shadow-[0_0_30px_rgba(147,51,234,0.3)]'
                      : 'border-ember/30 bg-olive hover:border-ember/60 hover:shadow-[0_0_20px_rgba(199,78,30,0.2)]'
                  } ${tier.popular ? 'ring-2 ring-ember animate-pulse-glow' : ''}`}
                >
                  {tier.popular && (
                    <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-ember text-white px-4 py-1 rounded-full text-xs font-bold shadow-[0_0_20px_rgba(199,78,30,0.5)]">
                      🔥 MOST POPULAR
                    </div>
                  )}
                  
                  <div className="text-center">
                    <div className="text-sm font-bold text-orange-500 mb-2">{tier.badge}</div>
                    <div className="text-4xl font-black text-white mb-2">{tier.quantity}</div>
                    <div className="text-sm text-gray-400 mb-4">Numbers</div>
                    
                    <div className="bg-ember hover:bg-ember-light rounded-lg p-3 mb-3 shadow-[0_0_20px_rgba(199,78,30,0.3)] transition">
                      <div className="text-2xl font-bold text-white">${tier.total}</div>
                      <div className="text-xs text-orange-100">${tier.perNumber}/number</div>
                    </div>
                    
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center justify-between text-green-400">
                        <span>You Save:</span>
                        <span className="font-bold">${tier.savings.toFixed(2)}</span>
                      </div>
                      <div className="flex items-center justify-between text-gray-400">
                        <span>vs Individual:</span>
                        <span className="line-through">${(tier.quantity * 2.99).toFixed(2)}</span>
                      </div>
                    </div>
                  </div>
                </button>
              ))}
            </div>

            {selectedTier && (
              <div className="mt-6 p-4 bg-olive/20 border border-ember/30 rounded-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-white font-bold">
                      {selectedTier.badge}: Select {selectedTier.quantity} numbers below
                    </div>
                    <div className="text-gray-400 text-sm">
                      {selectedNumbers.length} / {selectedTier.quantity} selected
                    </div>
                  </div>
                  {selectedNumbers.length === selectedTier.quantity && (
                    <button
                      onClick={bulkPurchaseNumbers}
                      disabled={loading}
                      className="px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white font-bold rounded-lg hover:shadow-lg transition disabled:opacity-50"
                    >
                      {loading ? 'Processing...' : `Checkout $${selectedTier.total}`}
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Search & Filter */}
        <div className="flex gap-4 mb-8">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-4 top-3.5 w-5 h-5 text-gray-500" />
              <input
                type="text"
                placeholder="Search by number or area code..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-12 pr-4 py-3 bg-[#16181f] border border-gray-800 rounded-lg text-white focus:border-ember focus:outline-none"
              />
            </div>
          </div>
          <select
            value={selectedCountry}
            onChange={(e) => setSelectedCountry(e.target.value)}
            className="px-4 py-3 bg-[#16181f] border border-gray-800 rounded-lg text-white focus:border-ember focus:outline-none"
          >
            <option value="all">All Countries</option>
            {countries.map(country => (
              <option key={country.code} value={country.code}>
                {country.flag} {country.name}
              </option>
            ))}
          </select>
        </div>

        {/* Numbers Grid */}
        {loading ? (
          <div className="text-center py-20">
            <Loader className="w-12 h-12 animate-spin text-ember mx-auto mb-4" />
            <div className="text-gray-400">Loading available numbers...</div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {numbers.map((number, index) => {
              const isSelected = selectedNumbers.includes(number.number);
              const canSelect = bulkMode && selectedTier && selectedNumbers.length < selectedTier.quantity;
              
              return (
                <button
                  key={index}
                  onClick={() => bulkMode ? toggleNumberSelection(number) : purchaseNumber(number)}
                  disabled={bulkMode && !selectedTier}
                  className={`group flex items-center gap-4 rounded-xl p-4 transition-all duration-200 ${
                    isSelected 
                      ? 'bg-olive/30 border-2 border-ember shadow-[0_0_20px_rgba(147,51,234,0.3)]' 
                      : 'bg-olive border border-ember/20 hover:bg-olive-light hover:border-ember/40 hover:shadow-[0_0_15px_rgba(199,78,30,0.2)]'
                  } ${bulkMode && !selectedTier ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  {/* Selection Checkbox (Bulk Mode Only) */}
                  {bulkMode && (
                    <div className={`flex-shrink-0 w-6 h-6 rounded border-2 flex items-center justify-center ${
                      isSelected ? 'bg-ember border-ember' : 'border-gray-600'
                    }`}>
                      {isSelected && <CheckCircle className="w-4 h-4 text-white" />}
                    </div>
                  )}

                  {/* Country Flag */}
                  <div className="flex-shrink-0 w-12 h-12 bg-olive-dark rounded-full flex items-center justify-center text-2xl border border-ember/20">
                    🇺🇸
                  </div>

                  {/* Number Info */}
                  <div className="flex-1 text-left">
                    <div className="text-white font-bold text-lg mb-1 font-mono">
                      {number.number}
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <span className="text-blue-400 flex items-center gap-1">
                        <Zap className="w-3 h-3" />
                        Instant Activation
                      </span>
                      <span className="text-green-400 flex items-center gap-1">
                        <CheckCircle className="w-3 h-3" />
                        Voice + SMS
                      </span>
                      <span className="text-ember text-xs">🔒 Private</span>
                    </div>
                  </div>

                  {/* Price */}
                  {!bulkMode && (
                    <div className="flex-shrink-0">
                      <div className="bg-ember hover:bg-ember-light px-4 py-2 rounded-lg shadow-[0_0_20px_rgba(199,78,30,0.3)] transition">
                        <div className="text-white font-bold text-xl">$2.99</div>
                        <div className="text-orange-200 text-xs">per month</div>
                      </div>
                    </div>
                  )}

                  {/* Bulk Price (if tier selected) */}
                  {bulkMode && selectedTier && (
                    <div className="flex-shrink-0">
                      <div className="bg-gradient-to-r from-ember to-ember-light px-4 py-2 rounded-lg">
                        <div className="text-white font-bold text-xl">${selectedTier.perNumber}</div>
                        <div className="text-ember-light text-xs line-through">$2.99</div>
                      </div>
                    </div>
                  )}

                  {/* Arrow */}
                  {!bulkMode && (
                    <ChevronRight className="w-5 h-5 text-gray-600 group-hover:text-ember transition flex-shrink-0" />
                  )}
                </button>
              );
            })}
          </div>
        )}

        {!loading && numbers.length === 0 && (
          <div className="text-center py-20">
            <Phone className="w-16 h-16 text-gray-600 mx-auto mb-4" />
            <div className="text-gray-400 text-xl">No numbers available in this region</div>
            <div className="text-gray-500 text-sm mt-2">Try selecting a different country</div>
          </div>
        )}
      </div>
    </div>
  );
};

export default VirtualNumberMarketplace;
