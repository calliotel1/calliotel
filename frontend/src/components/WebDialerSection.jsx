import React from 'react';
import { Monitor, Phone, MessageCircle, Lock } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const WebDialerSection = () => {
  const navigate = useNavigate();

  const features = [
    {
      icon: <Monitor className="w-6 h-6" />,
      text: 'Compatible with all major browsers'
    },
    {
      icon: <Phone className="w-6 h-6" />,
      text: 'Real-time call management'
    },
    {
      icon: <MessageCircle className="w-6 h-6" />,
      text: 'Global SMS capabilities'
    },
    {
      icon: <Lock className="w-6 h-6" />,
      text: 'Bank-grade encryption and security'
    }
  ];

  const handleAccessPortal = () => {
    navigate('/login');
  };

  return (
    <section className="py-20 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left Content */}
          <div>
            <h2 className="text-4xl lg:text-5xl font-bold text-gray-900 mb-6">
              Calliotel Web Portal
            </h2>
            <p className="text-xl text-gray-600 mb-8 leading-relaxed">
              Access your virtual numbers from any desktop or laptop. Make calls, manage messages, and control all features directly from your browser - zero downloads required.
            </p>
            <p className="text-lg text-gray-600 mb-8">
              The Calliotel Web Portal seamlessly syncs with your mobile app, providing flexibility to communicate from wherever you work best.
            </p>

            {/* Features List */}
            <div className="space-y-4 mb-8">
              {features.map((feature, index) => (
                <div key={index} className="flex items-center space-x-3">
                  <div className="flex-shrink-0 w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center text-ember">
                    {feature.icon}
                  </div>
                  <span className="text-gray-700">{feature.text}</span>
                </div>
              ))}
            </div>

            <button 
              onClick={handleAccessPortal}
              className="px-8 py-4 bg-gradient-to-r from-ember to-ember-light text-white font-semibold rounded-full hover:from-ember hover:to-ember-dark transition-all transform hover:scale-105 shadow-lg cursor-pointer"
            >
              ACCESS WEB PORTAL
            </button>
          </div>

          {/* Right Content - Browser Mockup */}
          <div className="relative">
            <div className="bg-white rounded-2xl shadow-2xl overflow-hidden border border-gray-200">
              {/* Browser Header */}
              <div className="bg-gray-100 px-4 py-3 flex items-center space-x-2 border-b border-gray-200">
                <div className="flex space-x-2">
                  <div className="w-3 h-3 rounded-full bg-red-400"></div>
                  <div className="w-3 h-3 rounded-full bg-yellow-400"></div>
                  <div className="w-3 h-3 rounded-full bg-green-400"></div>
                </div>
                <div className="flex-1 mx-4 bg-white rounded px-3 py-1 text-sm text-gray-500">
                  portal.calliotel.com
                </div>
              </div>
              
              {/* Browser Content */}
              <div className="bg-gradient-to-br from-ember/5 to-ember-light/5 p-8 h-96 flex items-center justify-center">
                <div className="text-center">
                  <div className="w-20 h-20 bg-gradient-to-br from-ember to-ember-light rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <Phone className="w-10 h-10 text-white" />
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">Web Portal</h3>
                  <p className="text-gray-600">Manage calls from your browser</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default WebDialerSection;