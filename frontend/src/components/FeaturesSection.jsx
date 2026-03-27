import React from 'react';
import { Globe, Star, Users, Lock, Phone, MessageSquare, TrendingDown, Zap } from 'lucide-react';

const FeaturesSection = () => {
  const features = [
    {
      icon: <Globe className="w-12 h-12 text-orange-600" />,
      title: 'International Coverage',
      description: 'Access virtual numbers from over 50 countries including USA, UK, Germany, Canada, and more. Expand your global presence instantly.'
    },
    {
      icon: <Star className="w-12 h-12 text-orange-600" />,
      title: 'Premium Quality Numbers',
      description: 'Choose from standard or premium numbers. Get memorable digit combinations perfect for marketing campaigns and brand recognition.'
    },
    {
      icon: <Users className="w-12 h-12 text-orange-600" />,
      title: 'Multi-Line Management',
      description: 'Manage unlimited virtual numbers from a single dashboard. Perfect for teams, departments, or multiple business ventures.'
    },
    {
      icon: <Lock className="w-12 h-12 text-orange-600" />,
      title: 'Complete Privacy',
      description: 'Keep your personal number private. Use virtual numbers for business, online transactions, and app verifications with confidence.'
    }
  ];

  const connectFeatures = [
    {
      icon: <Phone className="w-12 h-12 text-orange-500" />,
      title: 'HD Voice Quality',
      description: "Crystal-clear voice calls using advanced VoIP technology. Experience professional-grade audio quality on every call."
    },
    {
      icon: <MessageSquare className="w-12 h-12 text-orange-500" />,
      title: 'SMS & MMS Support',
      description: 'Send and receive text messages globally. Includes support for media messages. Free incoming, low-cost outgoing.'
    },
    {
      icon: <TrendingDown className="w-12 h-12 text-orange-500" />,
      title: 'Competitive Pricing',
      description: 'Save significantly on international communication. Transparent pricing with no hidden charges or long-term contracts.'
    },
    {
      icon: <Zap className="w-12 h-12 text-orange-500" />,
      title: 'Instant Activation',
      description: "Get your number activated within minutes. No paperwork, no verification delays. Start making calls immediately after signup."
    }
  ];

  return (
    <section id="features" className="py-20 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* First Set of Features */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 mb-20">
          {features.map((feature, index) => (
            <div key={index} className="bg-white p-8 rounded-2xl shadow-sm hover:shadow-xl transition-all duration-300 border-t-4 border-orange-500">
              <div className="mb-4">{feature.icon}</div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">{feature.title}</h3>
              <p className="text-gray-600 leading-relaxed">{feature.description}</p>
            </div>
          ))}
        </div>

        {/* Call, Text, and Connect Section */}
        <div className="text-center mb-16">
          <h2 className="text-4xl lg:text-5xl font-bold text-gray-900 mb-4">
            Communicate Globally with<br /><span className="bg-gradient-to-r from-ember to-ember-light bg-clip-text text-transparent">Calliotel</span>
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Your complete communication solution for voice, messaging, and seamless global connectivity.
          </p>
        </div>

        {/* Second Set of Features */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          {connectFeatures.map((feature, index) => (
            <div key={index} className="bg-white p-8 rounded-2xl shadow-sm hover:shadow-xl transition-all duration-300 hover:border-t-4 hover:border-orange-500">
              <div className="mb-4">{feature.icon}</div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">{feature.title}</h3>
              <p className="text-gray-600 leading-relaxed">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default FeaturesSection;