import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { FaInstagram, FaTiktok, FaYoutube, FaFire, FaArrowRight, FaChartLine } from 'react-icons/fa';

const API_URL = process.env.REACT_APP_BACKEND_URL;

const SMMBoostWidget = () => {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  const [topServices, setTopServices] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchTopServices();
    }
  }, [user]);

  const fetchTopServices = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/api/smm/services`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await response.json();

      if (data.success && data.services.length > 0) {
        // Get top 3 popular services (Instagram, TikTok, YouTube)
        const popular = data.services
          .filter(s => ['instagram', 'tiktok', 'youtube'].includes(s.category))
          .slice(0, 3);
        setTopServices(popular);
      }
    } catch (err) {
      console.error('Failed to fetch services:', err);
    } finally {
      setLoading(false);
    }
  };

  const getServiceIcon = (category) => {
    const icons = {
      instagram: <FaInstagram className="text-pink-500" />,
      tiktok: <FaTiktok className="text-black" />,
      youtube: <FaYoutube className="text-red-500" />
    };
    return icons[category] || <FaChartLine />;
  };

  if (!user || loading) return null;

  return (
    <div className="bg-gradient-to-br from-[#2a2a1f] to-black border-2 border-[#C74E1E]/30 rounded-xl p-6 hover:border-[#C74E1E] transition-all hover:shadow-lg hover:shadow-[#C74E1E]/20">
      {/* Widget Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <FaFire className="text-3xl text-[#C74E1E]" />
          <div>
            <h3 className="text-white font-bold text-lg">Boost Your Reach</h3>
            <p className="text-gray-400 text-xs">SMM Empire Expansion</p>
          </div>
        </div>
      </div>

      {/* Quick Services */}
      {topServices.length > 0 ? (
        <div className="space-y-3 mb-4">
          {topServices.map((service, index) => (
            <div
              key={index}
              className="bg-black/50 border border-[#C74E1E]/20 rounded-lg p-3 hover:border-[#C74E1E]/50 transition-all cursor-pointer"
              onClick={() => navigate('/smm-marketplace')}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="text-2xl">{getServiceIcon(service.category)}</div>
                  <div>
                    <p className="text-white font-semibold text-sm">{service.name}</p>
                    <p className="text-gray-400 text-xs capitalize">{service.category}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-[#C74E1E] font-bold text-sm">${service.reseller_price.toFixed(2)}/1k</p>
                  <p className="text-gray-500 text-xs line-through">${service.provider_price.toFixed(2)}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-6">
          <FaChartLine className="text-4xl text-[#C74E1E]/50 mx-auto mb-2" />
          <p className="text-gray-400 text-sm">Loading services...</p>
        </div>
      )}

      {/* View Full Arsenal Button */}
      <button
        onClick={() => navigate('/smm-marketplace')}
        className="w-full bg-[#C74E1E] hover:bg-[#C74E1E]/80 text-white font-bold py-3 rounded-lg transition-all flex items-center justify-center gap-2"
      >
        View Full Arsenal
        <FaArrowRight />
      </button>

      {/* Empire Stamp */}
      <div className="mt-4 text-center">
        <p className="text-[#C74E1E] text-xs font-semibold">
          💎 100% Profit Margin
        </p>
      </div>
    </div>
  );
};

export default SMMBoostWidget;
