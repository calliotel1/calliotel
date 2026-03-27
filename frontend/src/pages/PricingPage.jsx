import React from 'react';
import Navbar from '../components/Navbar';
import InteractivePricingCalculator from '../components/InteractivePricingCalculator';
import ProfessionalFooter from '../components/ProfessionalFooter';
import { useTheme } from '../context/ThemeContext';
import { Shield, Zap, Globe, HeadphonesIcon } from 'lucide-react';
import { KineticHeading, KineticText } from '../components/KineticTypography';

const PricingPage = () => {
  const { darkMode } = useTheme();

  const benefits = [
    {
      icon: <Shield className="w-8 h-8" />,
      title: "No Hidden Fees",
      description: "What you see is what you pay. Zero surprise charges."
    },
    {
      icon: <Zap className="w-8 h-8" />,
      title: "Instant Activation",
      description: "Numbers activated within seconds of purchase."
    },
    {
      icon: <Globe className="w-8 h-8" />,
      title: "Global Coverage",
      description: "Virtual numbers from 50+ countries worldwide."
    },
    {
      icon: <HeadphonesIcon className="w-8 h-8" />,
      title: "24/7 Support",
      description: "Expert support team ready to help anytime."
    }
  ];

  return (
    <div className={`min-h-screen ${darkMode ? 'bg-gray-900' : 'bg-[#FAFAF8]'}`}>
      <Navbar />
      
      {/* Hero Section */}
      <div className={`pt-32 pb-12 ${darkMode ? 'bg-gradient-to-b from-gray-900 to-gray-800' : 'bg-gradient-to-b from-[#F9F9F7] to-[#FAFAF8]'}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <KineticHeading size="hero" className="mb-6">
            Simple, Transparent Pricing
          </KineticHeading>
          <KineticText variant="fade" as="p" className={`text-xl ${darkMode ? 'text-gray-400' : 'text-gray-600'} max-w-3xl mx-auto`}>
            Volume discounts up to <span className="text-orange-500 font-bold">50% OFF</span>. 
            No contracts, no setup fees, cancel anytime.
          </KineticText>
        </div>
      </div>

      {/* Pricing Calculator */}
      <InteractivePricingCalculator />

      {/* Benefits Grid */}
      <div className={`py-20 ${darkMode ? 'bg-gray-800' : 'bg-[#F9F9F7]'}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className={`text-3xl sm:text-4xl font-black text-center mb-12 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
            Why Choose Calliotel?
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {benefits.map((benefit, index) => (
              <div
                key={index}
                className={`p-6 rounded-2xl text-center transition-transform hover:scale-105 ${
                  darkMode ? 'bg-gray-700/50' : 'bg-[#FAFAF8]'
                }`}
              >
                <div className="flex justify-center mb-4 text-orange-500">
                  {benefit.icon}
                </div>
                <h3 className={`text-xl font-bold mb-2 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                  {benefit.title}
                </h3>
                <p className={`${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                  {benefit.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* FAQ Section */}
      <div className={`py-20 ${darkMode ? 'bg-gray-900' : 'bg-white'}`}>
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className={`text-3xl sm:text-4xl font-black text-center mb-12 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
            Pricing FAQs
          </h2>
          <div className="space-y-6">
            <div className={`p-6 rounded-2xl ${darkMode ? 'bg-gray-800' : 'bg-gray-50'}`}>
              <h3 className={`text-xl font-bold mb-2 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                How does billing work?
              </h3>
              <p className={`${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                All numbers are billed monthly. Your subscription automatically renews unless canceled. 
                No setup fees, no hidden charges.
              </p>
            </div>
            <div className={`p-6 rounded-2xl ${darkMode ? 'bg-gray-800' : 'bg-gray-50'}`}>
              <h3 className={`text-xl font-bold mb-2 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                Can I cancel anytime?
              </h3>
              <p className={`${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                Yes! Cancel any number at any time from your dashboard. No questions asked, no cancellation fees.
              </p>
            </div>
            <div className={`p-6 rounded-2xl ${darkMode ? 'bg-gray-800' : 'bg-gray-50'}`}>
              <h3 className={`text-xl font-bold mb-2 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                Do bulk discounts apply to existing numbers?
              </h3>
              <p className={`${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                Absolutely! When you reach a new tier, the discount applies to your entire portfolio, 
                including previously purchased numbers.
              </p>
            </div>
            <div className={`p-6 rounded-2xl ${darkMode ? 'bg-gray-800' : 'bg-gray-50'}`}>
              <h3 className={`text-xl font-bold mb-2 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                What payment methods do you accept?
              </h3>
              <p className={`${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                We accept Visa, Mastercard, American Express, PayPal, and cryptocurrency (USDT). 
                All payments are processed securely via Stripe.
              </p>
            </div>
          </div>
        </div>
      </div>

      <ProfessionalFooter />
    </div>
  );
};

export default PricingPage;
