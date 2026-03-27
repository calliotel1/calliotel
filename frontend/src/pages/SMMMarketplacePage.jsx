import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { FaInstagram, FaTiktok, FaYoutube, FaFacebook, FaTwitter, FaTelegram, FaFire, FaCrown, FaChartLine, FaShoppingCart, FaCheckCircle, FaExclamationTriangle } from 'react-icons/fa';

const API_URL = process.env.REACT_APP_BACKEND_URL;

const SMMMarketplacePage = () => {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();

  const [services, setServices] = useState([]);
  const [filteredServices, setFilteredServices] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [wallet, setWallet] = useState(null);
  const [showOrderModal, setShowOrderModal] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [servicesPerPage] = useState(20);
  const [sortBy, setSortBy] = useState('default'); // default, profit-high, profit-low, price-low
  const [selectedService, setSelectedService] = useState(null);
  const [orderQuantity, setOrderQuantity] = useState(0);
  const [targetInput, setTargetInput] = useState('');
  const [orderProcessing, setOrderProcessing] = useState(false);
  const [orderSuccess, setOrderSuccess] = useState(null);

  // Category icons mapping
  const categoryIcons = {
    instagram: <FaInstagram className="text-xl" />,
    tiktok: <FaTiktok className="text-xl" />,
    youtube: <FaYoutube className="text-xl" />,
    facebook: <FaFacebook className="text-xl" />,
    twitter: <FaTwitter className="text-xl" />,
    telegram: <FaTelegram className="text-xl" />
  };

  useEffect(() => {
    fetchServicesAndWallet();
  }, [user]);

  useEffect(() => {
    // Filter services by category and reset to page 1
    let filtered = selectedCategory === 'all' 
      ? services 
      : services.filter(s => s.category === selectedCategory);
    
    // Apply sorting
    if (sortBy === 'profit-high') {
      filtered = [...filtered].sort((a, b) => b.profit_margin - a.profit_margin);
    } else if (sortBy === 'profit-low') {
      filtered = [...filtered].sort((a, b) => a.profit_margin - b.profit_margin);
    } else if (sortBy === 'price-low') {
      filtered = [...filtered].sort((a, b) => a.reseller_price - b.reseller_price);
    }
    
    setFilteredServices(filtered);
    setCurrentPage(1); // Reset pagination when category or sort changes
  }, [selectedCategory, services, sortBy]);

  const fetchServicesAndWallet = async () => {
    setLoading(true);
    setError(null);

    try {
      const token = localStorage.getItem('token');
      const headers = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      };

      // Fetch services
      const servicesRes = await fetch(`${API_URL}/api/smm/services`, { headers });
      const servicesData = await servicesRes.json();

      if (servicesData.success) {
        setServices(servicesData.services);
        setFilteredServices(servicesData.services);
      }

      // Fetch categories
      const categoriesRes = await fetch(`${API_URL}/api/smm/categories`, { headers });
      const categoriesData = await categoriesRes.json();

      if (categoriesData.success) {
        setCategories(categoriesData.categories);
      }

      // Fetch wallet
      const walletRes = await fetch(`${API_URL}/api/wallet/balance`, { headers });
      const walletData = await walletRes.json();

      if (walletData.balance !== undefined) {
        setWallet({ balance: walletData.balance });
      }
    } catch (err) {
      console.error('Failed to fetch data:', err);
      setError('Failed to load marketplace. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const openOrderModal = (service) => {
    // Check if user is logged in before allowing order
    if (!user) {
      alert('Please login or sign up to place an order');
      navigate('/login');
      return;
    }
    
    setSelectedService(service);
    setOrderQuantity(service.min_quantity);
    setTargetInput('');
    setShowOrderModal(true);
    setOrderSuccess(null);
  };

  const closeOrderModal = () => {
    setShowOrderModal(false);
    setSelectedService(null);
    setOrderProcessing(false);
    setOrderSuccess(null);
  };

  const handlePlaceOrder = async () => {
    if (!selectedService || !targetInput.trim()) {
      alert('Please provide a target URL or username');
      return;
    }

    const totalCost = (selectedService.reseller_price * orderQuantity) / 1000;

    if (!wallet || wallet.balance < totalCost) {
      alert(`Insufficient balance. You need $${totalCost.toFixed(2)} but have $${wallet?.balance?.toFixed(2) || 0}`);
      return;
    }

    setOrderProcessing(true);
    setError(null);

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/api/smm/order`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          service_id: selectedService.service_id,
          quantity: orderQuantity,
          target_url: targetInput.startsWith('http') ? targetInput : null,
          target_username: !targetInput.startsWith('http') ? targetInput : null
        })
      });

      const data = await response.json();

      if (data.success) {
        setOrderSuccess(data);
        setWallet(prev => ({ ...prev, balance: data.new_balance }));
        
        // Close modal after 3 seconds
        setTimeout(() => {
          closeOrderModal();
        }, 3000);
      } else {
        throw new Error(data.message || 'Order failed');
      }
    } catch (err) {
      console.error('Order failed:', err);
      setError(err.message || 'Failed to place order');
    } finally {
      setOrderProcessing(false);
    }
  };

  const calculateTotalCost = () => {
    if (!selectedService || !orderQuantity) return 0;
    return (selectedService.reseller_price * orderQuantity) / 1000;
  };

  const calculateProfit = () => {
    if (!selectedService || !orderQuantity) return 0;
    return (selectedService.profit_margin * orderQuantity) / 1000;
  };

  // Pagination logic
  const indexOfLastService = currentPage * servicesPerPage;
  const indexOfFirstService = indexOfLastService - servicesPerPage;
  const currentServices = filteredServices.slice(indexOfFirstService, indexOfLastService);
  const totalPages = Math.ceil(filteredServices.length / servicesPerPage);

  const handlePageChange = (pageNumber) => {
    setCurrentPage(pageNumber);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <FaChartLine className="text-6xl text-[#C74E1E] animate-pulse mx-auto mb-4" />
          <p className="text-[#C74E1E] text-lg">Loading SMM Arsenal...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white pb-20">
      {/* Header Section */}
      <div className="bg-gradient-to-r from-black via-[#2a2a1f] to-black border-b border-[#C74E1E]/20 py-8">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center justify-between mb-4">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <FaFire className="text-4xl text-[#C74E1E]" />
                <h1 className="text-4xl font-bold text-white">
                  SMM <span className="text-[#C74E1E]">Marketplace</span>
                </h1>
              </div>
              <p className="text-gray-400 text-sm">Expand Your Digital Empire with Premium Social Boosts</p>
            </div>

            {/* Wallet Display - Only show if logged in */}
            {user && wallet && (
              <div className="bg-[#2a2a1f] border border-[#C74E1E]/30 rounded-lg px-6 py-3">
                <p className="text-gray-400 text-xs mb-1">Available Balance</p>
                <p className="text-2xl font-bold text-[#C74E1E]">${wallet.balance.toFixed(2)}</p>
              </div>
            )}
            
            {/* Login CTA - Show if not logged in */}
            {!user && (
              <div className="flex gap-3">
                <button
                  onClick={() => navigate('/login')}
                  className="px-6 py-2 bg-[#2a2a1f] border-2 border-[#C74E1E] text-white font-bold rounded-lg hover:bg-[#C74E1E]/20 transition-all"
                >
                  Login
                </button>
                <button
                  onClick={() => navigate('/signup')}
                  className="px-6 py-2 bg-[#C74E1E] text-white font-bold rounded-lg hover:bg-[#C74E1E]/80 transition-all"
                >
                  Sign Up to Order
                </button>
              </div>
            )}
          </div>

          {/* Stats Bar */}
          <div className="grid grid-cols-3 gap-4 mt-6">
            <div className="bg-[#2a2a1f] border border-[#C74E1E]/20 rounded-lg p-4 text-center">
              <p className="text-gray-400 text-xs mb-1">Total Services</p>
              <p className="text-2xl font-bold text-white">{services.length}</p>
            </div>
            <div className="bg-[#2a2a1f] border border-[#C74E1E]/20 rounded-lg p-4 text-center">
              <p className="text-gray-400 text-xs mb-1">Categories</p>
              <p className="text-2xl font-bold text-white">{categories.length}</p>
            </div>
            <div className="bg-[#2a2a1f] border border-[#C74E1E]/20 rounded-lg p-4 text-center">
              <FaCrown className="text-2xl text-[#C74E1E] mx-auto mb-1" />
              <p className="text-xs text-gray-400">Empire Mode</p>
            </div>
          </div>
        </div>
      </div>

      {/* Category Filter */}
      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-4">
          {/* Category Buttons */}
          <div className="flex items-center gap-3 overflow-x-auto pb-2">
            <button
              onClick={() => setSelectedCategory('all')}
              className={`px-6 py-2 rounded-lg font-semibold whitespace-nowrap transition-all ${
                selectedCategory === 'all'
                  ? 'bg-[#C74E1E] text-white'
                  : 'bg-[#2a2a1f] text-gray-400 hover:bg-[#C74E1E]/20 border border-[#C74E1E]/30'
              }`}
            >
              All Services
            </button>

            {categories.map(cat => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`flex items-center gap-2 px-6 py-2 rounded-lg font-semibold whitespace-nowrap transition-all ${
                  selectedCategory === cat
                    ? 'bg-[#C74E1E] text-white'
                    : 'bg-[#2a2a1f] text-gray-400 hover:bg-[#C74E1E]/20 border border-[#C74E1E]/30'
                }`}
              >
                {categoryIcons[cat]}
                <span className="capitalize">{cat}</span>
              </button>
            ))}
          </div>

          {/* Sort Dropdown - Empire Profit Filter */}
          <div className="flex items-center gap-2">
            <FaChartLine className="text-[#C74E1E]" />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="bg-[#2a2a1f] border border-[#C74E1E]/30 text-white rounded-lg px-4 py-2 font-semibold focus:outline-none focus:border-[#C74E1E] cursor-pointer"
            >
              <option value="default">Default Order</option>
              <option value="profit-high">💎 Highest Profit First</option>
              <option value="profit-low">Lowest Profit First</option>
              <option value="price-low">Cheapest First</option>
            </select>
          </div>
        </div>
      </div>

      {/* Services Grid */}
      <div className="max-w-7xl mx-auto px-4">
        {error && (
          <div className="bg-red-900/20 border border-red-500/50 rounded-lg p-4 mb-6 flex items-center gap-3">
            <FaExclamationTriangle className="text-red-500 text-xl" />
            <p className="text-red-400">{error}</p>
          </div>
        )}

        {/* Pagination Info */}
        {filteredServices.length > 0 && (
          <div className="flex items-center justify-between mb-4">
            <p className="text-gray-400 text-sm">
              Showing {indexOfFirstService + 1}-{Math.min(indexOfLastService, filteredServices.length)} of {filteredServices.length} services
            </p>
            <p className="text-gray-400 text-sm">
              Page {currentPage} of {totalPages}
            </p>
          </div>
        )}

        {filteredServices.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-gray-400 text-lg">No services available in this category</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
              {currentServices.map(service => (
              <div
                key={service.service_id}
                className="bg-[#2a2a1f] border border-[#C74E1E]/30 rounded-lg p-6 hover:border-[#C74E1E] transition-all hover:shadow-lg hover:shadow-[#C74E1E]/20"
              >
                {/* Service Header */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    {categoryIcons[service.category]}
                    <div>
                      <h3 className="text-white font-bold text-lg leading-tight">{service.name}</h3>
                      <p className="text-gray-400 text-xs capitalize">{service.category}</p>
                    </div>
                  </div>
                </div>

                {/* Description */}
                <p className="text-gray-400 text-sm mb-4 line-clamp-2">{service.description}</p>

                {/* Pricing */}
                <div className="bg-black/50 rounded-lg p-4 mb-4">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-gray-400 text-xs">Provider Cost</span>
                    <span className="text-gray-500 line-through text-sm">${service.provider_price.toFixed(2)}/1k</span>
                  </div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-white font-semibold">Your Price</span>
                    <span className="text-[#C74E1E] font-bold text-xl">${service.reseller_price.toFixed(2)}/1k</span>
                  </div>
                  <div className="flex justify-between items-center pt-2 border-t border-[#C74E1E]/20">
                    <span className="text-[#C74E1E] text-xs font-semibold">💎 Profit Margin</span>
                    <span className="text-[#C74E1E] font-bold">${service.profit_margin.toFixed(2)}/1k</span>
                  </div>
                </div>

                {/* Quantity Range */}
                <div className="flex justify-between text-xs text-gray-400 mb-4">
                  <span>Min: {service.min_quantity}</span>
                  <span>Max: {service.max_quantity.toLocaleString()}</span>
                </div>

                {/* Deploy Button */}
                <button
                  onClick={() => openOrderModal(service)}
                  className="w-full bg-[#C74E1E] hover:bg-[#C74E1E]/80 text-white font-bold py-3 rounded-lg transition-all flex items-center justify-center gap-2"
                >
                  <FaShoppingCart />
                  Deploy Boost
                </button>
              </div>
              ))}
            </div>

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 mt-8 pb-8">
                <button
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="px-4 py-2 bg-[#2a2a1f] border border-[#C74E1E]/30 text-white rounded-lg hover:bg-[#C74E1E]/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                >
                  Previous
                </button>

                {/* Page Numbers */}
                <div className="flex gap-2">
                  {[...Array(Math.min(5, totalPages))].map((_, idx) => {
                    let pageNum;
                    if (totalPages <= 5) {
                      pageNum = idx + 1;
                    } else if (currentPage <= 3) {
                      pageNum = idx + 1;
                    } else if (currentPage >= totalPages - 2) {
                      pageNum = totalPages - 4 + idx;
                    } else {
                      pageNum = currentPage - 2 + idx;
                    }

                    return (
                      <button
                        key={pageNum}
                        onClick={() => handlePageChange(pageNum)}
                        className={`px-4 py-2 rounded-lg transition-all ${
                          currentPage === pageNum
                            ? 'bg-[#C74E1E] text-white font-bold'
                            : 'bg-[#2a2a1f] border border-[#C74E1E]/30 text-white hover:bg-[#C74E1E]/20'
                        }`}
                      >
                        {pageNum}
                      </button>
                    );
                  })}
                </div>

                <button
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className="px-4 py-2 bg-[#2a2a1f] border border-[#C74E1E]/30 text-white rounded-lg hover:bg-[#C74E1E]/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                >
                  Next
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {/* Order Modal */}
      {showOrderModal && selectedService && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-[#2a2a1f] border-2 border-[#C74E1E] rounded-lg max-w-md w-full p-6 relative">
            {!orderSuccess ? (
              <>
                {/* Modal Header */}
                <div className="flex items-center gap-3 mb-6">
                  {categoryIcons[selectedService.category]}
                  <div>
                    <h2 className="text-white font-bold text-xl">{selectedService.name}</h2>
                    <p className="text-gray-400 text-sm capitalize">{selectedService.category}</p>
                  </div>
                </div>

                {/* Target Input */}
                <div className="mb-4">
                  <label className="block text-gray-400 text-sm mb-2">Target URL or Username</label>
                  <input
                    type="text"
                    value={targetInput}
                    onChange={(e) => setTargetInput(e.target.value)}
                    placeholder="@username or https://..."
                    className="w-full bg-black border border-[#C74E1E]/30 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-[#C74E1E]"
                    disabled={orderProcessing}
                  />
                </div>

                {/* Quantity Input */}
                <div className="mb-4">
                  <label className="block text-gray-400 text-sm mb-2">Quantity</label>
                  <input
                    type="number"
                    value={orderQuantity}
                    onChange={(e) => setOrderQuantity(parseInt(e.target.value) || selectedService.min_quantity)}
                    min={selectedService.min_quantity}
                    max={selectedService.max_quantity}
                    className="w-full bg-black border border-[#C74E1E]/30 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-[#C74E1E]"
                    disabled={orderProcessing}
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Min: {selectedService.min_quantity} | Max: {selectedService.max_quantity.toLocaleString()}
                  </p>
                </div>

                {/* Order Summary */}
                <div className="bg-black/50 rounded-lg p-4 mb-6">
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-gray-400">Total Cost</span>
                    <span className="text-white font-bold">${calculateTotalCost().toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-gray-400">Your Profit</span>
                    <span className="text-[#C74E1E] font-bold">${calculateProfit().toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm pt-2 border-t border-[#C74E1E]/20">
                    <span className="text-gray-400">Balance After</span>
                    <span className="text-white font-bold">
                      ${((wallet?.balance || 0) - calculateTotalCost()).toFixed(2)}
                    </span>
                  </div>
                </div>

                {error && (
                  <div className="bg-red-900/20 border border-red-500/50 rounded-lg p-3 mb-4 flex items-center gap-2">
                    <FaExclamationTriangle className="text-red-500" />
                    <p className="text-red-400 text-sm">{error}</p>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex gap-3">
                  <button
                    onClick={closeOrderModal}
                    className="flex-1 bg-black border border-[#C74E1E]/30 hover:bg-[#C74E1E]/10 text-white font-semibold py-3 rounded-lg transition-all"
                    disabled={orderProcessing}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handlePlaceOrder}
                    className="flex-1 bg-[#C74E1E] hover:bg-[#C74E1E]/80 text-white font-bold py-3 rounded-lg transition-all flex items-center justify-center gap-2"
                    disabled={orderProcessing}
                  >
                    {orderProcessing ? (
                      <>
                        <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent" />
                        Processing...
                      </>
                    ) : (
                      <>
                        <FaShoppingCart />
                        Place Order
                      </>
                    )}
                  </button>
                </div>
              </>
            ) : (
              // Success State
              <div className="text-center py-8">
                <FaCheckCircle className="text-6xl text-green-500 mx-auto mb-4" />
                <h3 className="text-white font-bold text-2xl mb-2">Order Placed Successfully!</h3>
                <p className="text-gray-400 mb-4">Your SMM boost is being processed</p>
                <div className="bg-black/50 rounded-lg p-4 mb-6">
                  <p className="text-sm text-gray-400 mb-1">Order ID</p>
                  <p className="text-white font-mono">{orderSuccess.order.order_id}</p>
                </div>
                <button
                  onClick={closeOrderModal}
                  className="bg-[#C74E1E] hover:bg-[#C74E1E]/80 text-white font-bold py-3 px-8 rounded-lg transition-all"
                >
                  Continue
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default SMMMarketplacePage;
