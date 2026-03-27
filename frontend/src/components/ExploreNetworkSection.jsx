import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, ChevronRight } from 'lucide-react';
import { Icon } from '@iconify/react';

const ExploreNetworkSection = () => {
  const navigate = useNavigate();

  const services = [
    { name: 'Whatsapp', icon: 'logos:whatsapp-icon', price: 0.14, countries: 193, iconBg: 'bg-green-500' },
    { name: 'Telegram', icon: 'logos:telegram', price: 0.12, countries: 194, iconBg: 'bg-blue-400' },
    { name: 'Google,youtube,Gmail', icon: 'logos:google-gmail', price: 0.06, countries: 183, iconBg: 'bg-red-500' },
    { name: 'Any other', icon: 'mdi:help-circle', price: 0.07, countries: 153, iconBg: 'bg-gray-600' },
    { name: 'Tinder', icon: 'mdi:fire', price: 0.06, countries: 193, iconBg: 'bg-ember/50' },
    { name: 'Signal', icon: 'simple-icons:signal', price: 0.06, countries: 79, iconBg: 'bg-ember' },
    { name: 'facebook', icon: 'logos:facebook', price: 0.07, countries: 192, iconBg: 'bg-ember' },
    { name: 'Instagram+Threads', icon: 'skill-icons:instagram', price: 0.07, countries: 192, iconBg: 'bg-gradient-to-br from-ember to-ember-light/50' },
    { name: 'Twitter', icon: 'logos:twitter', price: 0.06, countries: 192, iconBg: 'bg-sky-400' },
    { name: 'TikTok/Douyin', icon: 'logos:tiktok-icon', price: 0.06, countries: 189, iconBg: 'bg-black' },
    { name: 'Discord', icon: 'logos:discord-icon', price: 0.06, countries: 191, iconBg: 'bg-indigo-500' },
    { name: 'WeChat', icon: 'logos:wechat-icon', price: 0.06, countries: 193, iconBg: 'bg-green-500' }
  ];

  return (
    <div className="py-20 bg-gradient-to-b from-[#0a0b0f] via-[#0f1015] to-[#0a0b0f]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="text-orange-500 text-sm font-bold uppercase tracking-[0.2em] mb-4">
            BROWSE
          </div>
          <h3 className="text-5xl sm:text-6xl font-black text-white mb-4 tracking-tight">
            Explore Our Network
          </h3>
          <p className="text-gray-400 text-lg mb-6">
            804+ services across 250+ countries — find exactly what you need.
          </p>
          
          {/* Use Cases */}
          <div className="max-w-4xl mx-auto bg-gradient-to-r from-gray-800/30 to-gray-900/30 border border-gray-700/30 rounded-xl p-5 backdrop-blur-sm">
            <div className="text-orange-400 font-bold text-xs uppercase mb-3">Perfect For:</div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
              <div className="flex items-center gap-2 text-gray-300">
                <span className="text-green-400">✓</span>
                <span>Account Verification</span>
              </div>
              <div className="flex items-center gap-2 text-gray-300">
                <span className="text-blue-400">✓</span>
                <span>Privacy Protection</span>
              </div>
              <div className="flex items-center gap-2 text-gray-300">
                <span className="text-ember">✓</span>
                <span>Multi-Account Setup</span>
              </div>
              <div className="flex items-center gap-2 text-gray-300">
                <span className="text-ember-400">✓</span>
                <span>Business Testing</span>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex items-center justify-center gap-4 mb-8">
          <button className="px-6 py-3 bg-gradient-to-r from-orange-600 to-red-600 text-white font-bold rounded-lg flex items-center gap-2 shadow-lg">
            <span className="text-lg">💥</span>
            <span>Popular Services</span>
            <span className="text-orange-300 text-sm">804+</span>
          </button>
          <button className="px-6 py-3 bg-gray-900/50 hover:bg-gray-800/50 text-gray-400 hover:text-white font-bold rounded-lg flex items-center gap-2 transition border border-gray-800">
            <span className="text-lg">🌍</span>
            <span>Top Countries</span>
            <span className="text-gray-500 text-sm">250+</span>
          </button>
        </div>

        {/* Service Grid - HORIZONTAL CARDS LIKE NORTHSMS */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-w-5xl mx-auto mb-12">
          {services.map((service, index) => (
            <button
              key={index}
              onClick={() => navigate('/signup')}
              className="group flex items-center gap-4 bg-[#16181f] hover:bg-[#1c1f28] border border-gray-800/80 hover:border-gray-700 rounded-xl p-4 pr-5 transition-all duration-200"
            >
              {/* Icon Circle - Small & Clean */}
              <div className={`flex-shrink-0 w-11 h-11 ${service.iconBg} rounded-full flex items-center justify-center shadow-lg`}>
                <Icon icon={service.icon} className={`w-6 h-6 ${service.iconColor || 'text-white'}`} />
              </div>

              {/* Service Info */}
              <div className="flex-1 text-left">
                <div className="text-white font-semibold text-base mb-1">
                  {service.name}
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <span className="text-orange-500 font-bold">
                    from ${service.price.toFixed(2)}
                  </span>
                  <span className="text-gray-500 text-xs">
                    {service.countries} Countries
                  </span>
                </div>
              </div>

              {/* Arrow */}
              <ChevronRight className="w-5 h-5 text-gray-600 group-hover:text-gray-500 group-hover:translate-x-0.5 transition-all flex-shrink-0" />
            </button>
          ))}
        </div>

        {/* View All Button */}
        <div className="text-center">
          <button
            onClick={() => navigate('/verification')}
            className="group inline-flex items-center gap-3 text-orange-500 hover:text-orange-400 font-bold text-lg transition-all duration-300 hover:gap-4"
          >
            <span>View all 804+ services</span>
            <ArrowRight className="w-6 h-6 transition-transform duration-300 group-hover:translate-x-1" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default ExploreNetworkSection;
