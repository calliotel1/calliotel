import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Phone, Mail, MapPin, Facebook, Twitter, Linkedin, Instagram } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import MultiCarrierBadge from './MultiCarrierBadge';

const ProfessionalFooter = () => {
  const { darkMode } = useTheme();
  const navigate = useNavigate();
  const currentYear = new Date().getFullYear();

  const footerLinks = {
    product: [
      { name: 'Virtual Numbers', path: '/browse-numbers' },
      { name: 'Pricing', path: '/pricing' },
      { name: 'Features', path: '/#features' },
      { name: 'Coverage', path: '/#coverage' }
    ],
    company: [
      { name: 'About Us', path: '/about' },
      { name: 'Contact', path: '/help' },
      { name: 'Reseller Program', path: '/reseller-program' },
      { name: 'Careers', path: '/careers' },
      { name: 'Blog', path: '/blog' }
    ],
    legal: [
      { name: 'Privacy Policy', path: '/privacy' },
      { name: 'Terms of Service', path: '/terms' },
      { name: 'Refund Policy', path: '/refund' },
      { name: 'Cookie Policy', path: '/cookies' }
    ],
    support: [
      { name: 'Help Center', path: '/help' },
      { name: 'API Documentation', path: '/help' },
      { name: 'System Status', path: '/maintenance' },
      { name: 'Contact Support', path: '/help' }
    ]
  };

  const paymentMethods = [
    { name: 'Visa', logo: (
      <svg className="h-8 w-auto" viewBox="0 0 48 16" fill="none">
        <rect width="48" height="16" rx="2" fill="#1A1F71"/>
        <text x="24" y="12" fontFamily="Arial" fontSize="10" fontWeight="bold" fill="white" textAnchor="middle">VISA</text>
      </svg>
    )},
    { name: 'Mastercard', logo: (
      <svg className="h-8 w-auto" viewBox="0 0 48 16">
        <rect width="48" height="16" rx="2" fill="#EB001B"/>
        <circle cx="20" cy="8" r="6" fill="#FF5F00"/>
        <circle cx="28" cy="8" r="6" fill="#F79E1B"/>
      </svg>
    )},
    { name: 'Amex', logo: (
      <svg className="h-8 w-auto" viewBox="0 0 48 16">
        <rect width="48" height="16" rx="2" fill="#006FCF"/>
        <text x="24" y="11" fontFamily="Arial" fontSize="8" fontWeight="bold" fill="white" textAnchor="middle">AMEX</text>
      </svg>
    )},
    { name: 'PayPal', logo: (
      <svg className="h-8 w-auto" viewBox="0 0 48 16">
        <rect width="48" height="16" rx="2" fill="#003087"/>
        <text x="24" y="11" fontFamily="Arial" fontSize="8" fontWeight="bold" fill="#009CDE" textAnchor="middle">PayPal</text>
      </svg>
    )},
    { name: 'Crypto', logo: (
      <svg className="h-8 w-auto" viewBox="0 0 48 16">
        <rect width="48" height="16" rx="2" fill="#F7931A"/>
        <text x="24" y="11" fontFamily="Arial" fontSize="7" fontWeight="bold" fill="white" textAnchor="middle">CRYPTO</text>
      </svg>
    )}
  ];

  return (
    <>
      {/* Multi-Carrier Redundancy Badge */}
      <MultiCarrierBadge placement="footer" />
      
      <footer className={`${darkMode ? 'bg-gray-900 border-t border-gray-800' : 'bg-gray-50 border-t border-gray-200'} pt-16 pb-8`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Main Footer Content */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8 mb-12">
          {/* Company Info */}
          <div className="lg:col-span-2">
            <div className="flex items-center space-x-2 mb-4">
              <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl flex items-center justify-center">
                <Phone className="w-6 h-6 text-white" />
              </div>
              <span className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                CALLIOTEL
              </span>
            </div>
            <p className={`mb-6 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              Premium virtual phone numbers for businesses worldwide. Trusted by thousands of companies for reliable communication.
            </p>

            {/* Contact Info */}
            <div className={`space-y-3 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              <div className="flex items-start space-x-3">
                <MapPin className="w-5 h-5 flex-shrink-0 mt-0.5" />
                <div className="text-sm">
                  <div className="font-semibold mb-1">Registered Office:</div>
                  <div>123 Tech Avenue, Suite 500</div>
                  <div>San Francisco, CA 94105</div>
                  <div>United States</div>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <Mail className="w-5 h-5 flex-shrink-0" />
                <a href="mailto:support@calliotel.com" className="text-sm hover:text-orange-500 transition-colors">
                  support@calliotel.com
                </a>
              </div>
              <div className="flex items-center space-x-3">
                <Phone className="w-5 h-5 flex-shrink-0" />
                <a href="tel:+18001234567" className="text-sm hover:text-orange-500 transition-colors">
                  +1 (800) 123-4567
                </a>
              </div>
            </div>
          </div>

          {/* Product Links */}
          <div>
            <h3 className={`text-sm font-bold uppercase tracking-wide mb-4 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
              Product
            </h3>
            <ul className="space-y-2">
              {footerLinks.product.map((link, index) => (
                <li key={index}>
                  <button
                    onClick={() => navigate(link.path)}
                    className={`text-sm hover:text-orange-500 transition-colors ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}
                  >
                    {link.name}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          {/* Company Links */}
          <div>
            <h3 className={`text-sm font-bold uppercase tracking-wide mb-4 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
              Company
            </h3>
            <ul className="space-y-2">
              {footerLinks.company.map((link, index) => (
                <li key={index}>
                  <button
                    onClick={() => navigate(link.path)}
                    className={`text-sm hover:text-orange-500 transition-colors ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}
                  >
                    {link.name}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          {/* Support Links */}
          <div>
            <h3 className={`text-sm font-bold uppercase tracking-wide mb-4 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
              Support
            </h3>
            <ul className="space-y-2">
              {footerLinks.support.map((link, index) => (
                <li key={index}>
                  <button
                    onClick={() => navigate(link.path)}
                    className={`text-sm hover:text-orange-500 transition-colors ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}
                  >
                    {link.name}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Payment Methods */}
        <div className={`py-8 border-t border-b ${darkMode ? 'border-gray-800' : 'border-gray-200'}`}>
          <div className="text-center mb-4">
            <span className={`text-sm font-semibold ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              Accepted Payment Methods
            </span>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-4">
            {paymentMethods.map((method, index) => (
              <div
                key={index}
                className={`p-2 rounded-lg ${darkMode ? 'bg-gray-800' : 'bg-white'} shadow-sm`}
                title={method.name}
              >
                {method.logo}
              </div>
            ))}
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-8 flex flex-col md:flex-row items-center justify-between space-y-4 md:space-y-0">
          {/* Copyright */}
          <div className={`text-sm ${darkMode ? 'text-gray-500' : 'text-gray-500'}`}>
            © {currentYear} Calliotel. All rights reserved.
          </div>

          {/* Legal Links */}
          <div className="flex flex-wrap items-center justify-center gap-4">
            {footerLinks.legal.map((link, index) => (
              <button
                key={index}
                onClick={() => navigate(link.path)}
                className={`text-sm hover:text-orange-500 transition-colors ${darkMode ? 'text-gray-500' : 'text-gray-500'}`}
              >
                {link.name}
              </button>
            ))}
          </div>

          {/* Social Media */}
          <div className="flex items-center space-x-4">
            <a href="#" className={`${darkMode ? 'text-gray-500 hover:text-white' : 'text-gray-500 hover:text-gray-900'} transition-colors`}>
              <Facebook className="w-5 h-5" />
            </a>
            <a href="#" className={`${darkMode ? 'text-gray-500 hover:text-white' : 'text-gray-500 hover:text-gray-900'} transition-colors`}>
              <Twitter className="w-5 h-5" />
            </a>
            <a href="#" className={`${darkMode ? 'text-gray-500 hover:text-white' : 'text-gray-500 hover:text-gray-900'} transition-colors`}>
              <Linkedin className="w-5 h-5" />
            </a>
            <a href="#" className={`${darkMode ? 'text-gray-500 hover:text-white' : 'text-gray-500 hover:text-gray-900'} transition-colors`}>
              <Instagram className="w-5 h-5" />
            </a>
          </div>
        </div>

        {/* Compliance Notice */}
        <div className={`mt-8 pt-6 border-t ${darkMode ? 'border-gray-800' : 'border-gray-200'}`}>
          <p className={`text-xs text-center ${darkMode ? 'text-gray-600' : 'text-gray-500'}`}>
            Calliotel is a registered telecommunications service provider. All services are subject to our Terms of Service and Privacy Policy. 
            Virtual numbers are provided for legitimate business and personal use only. We comply with all applicable telecommunications regulations 
            and data protection laws including GDPR, CCPA, and TCPA.
          </p>
        </div>
      </div>
    </footer>
    </>
  );
};

export default ProfessionalFooter;
