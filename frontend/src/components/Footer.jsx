import React from 'react';
import { Phone, Mail } from 'lucide-react';

const Footer = () => {
  return (
    <footer className="bg-gray-900 text-white py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid md:grid-cols-4 gap-8 mb-12">
          {/* Brand */}
          <div className="col-span-1">
            <div className="flex items-center space-x-2 mb-4">
              <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl flex items-center justify-center">
                <Phone className="w-6 h-6 text-white" />
              </div>
              <span className="text-2xl font-bold bg-gradient-to-r from-orange-400 to-ember-light/40 bg-clip-text text-transparent">CALLIOTEL</span>
            </div>
            <p className="text-gray-400 text-sm">
              Premium virtual phone numbers for global communication and business growth.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="font-semibold text-lg mb-4 text-orange-400">Quick Links</h3>
            <ul className="space-y-2">
              <li><a href="#pricing" className="text-gray-400 hover:text-orange-400 transition-colors">Pricing</a></li>
              <li><a href="#features" className="text-gray-400 hover:text-orange-400 transition-colors">Features</a></li>
              <li><a href="#faq" className="text-gray-400 hover:text-orange-400 transition-colors">FAQ</a></li>
              <li><a href="#" className="text-gray-400 hover:text-orange-400 transition-colors">About Us</a></li>
            </ul>
          </div>

          {/* Services */}
          <div>
            <h3 className="font-semibold text-lg mb-4 text-orange-400">Coverage</h3>
            <ul className="space-y-2">
              <li><a href="#" className="text-gray-400 hover:text-orange-400 transition-colors">US Numbers</a></li>
              <li><a href="#" className="text-gray-400 hover:text-orange-400 transition-colors">UK Numbers</a></li>
              <li><a href="#" className="text-gray-400 hover:text-orange-400 transition-colors">Canada Numbers</a></li>
              <li><a href="#" className="text-gray-400 hover:text-orange-400 transition-colors">Germany Numbers</a></li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="font-semibold text-lg mb-4 text-orange-400">Contact</h3>
            <ul className="space-y-3">
              <li className="flex items-start space-x-2">
                <Mail className="w-5 h-5 text-orange-500 flex-shrink-0 mt-0.5" />
                <a href="mailto:support@calliotel.com" className="text-gray-400 text-sm hover:text-orange-400 transition-colors">support@calliotel.com</a>
              </li>
              <li className="flex items-start space-x-2">
                <Phone className="w-5 h-5 text-orange-500 flex-shrink-0 mt-0.5" />
                <span className="text-gray-400 text-sm">24/7 Customer Support</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Payment Methods Section */}
        <div className="border-t border-gray-800 pt-8 pb-8">
          <div className="text-center mb-6">
            <h3 className="text-lg font-semibold text-gray-300 mb-4">We Accept</h3>
            
            {/* Credit Cards with Stripe */}
            <div className="mb-6">
              <div className="flex items-center justify-center space-x-4 mb-3 flex-wrap gap-4">
                {/* Visa */}
                <div className="bg-white px-4 py-2 rounded-lg shadow-md">
                  <svg className="h-8 w-14" viewBox="0 0 48 32" fill="none">
                    <rect width="48" height="32" rx="4" fill="white"/>
                    <text x="8" y="22" fill="#1A1F71" fontSize="14" fontWeight="bold" fontFamily="Arial">VISA</text>
                  </svg>
                </div>
                
                {/* Mastercard */}
                <div className="bg-white px-4 py-2 rounded-lg shadow-md">
                  <svg className="h-8 w-14" viewBox="0 0 48 32" fill="none">
                    <circle cx="18" cy="16" r="8" fill="#EB001B"/>
                    <circle cx="30" cy="16" r="8" fill="#F79E1B"/>
                  </svg>
                </div>
                
                {/* Maestro */}
                <div className="bg-white px-4 py-2 rounded-lg shadow-md">
                  <svg className="h-8 w-14" viewBox="0 0 48 32" fill="none">
                    <circle cx="18" cy="16" r="8" fill="#0099DF"/>
                    <circle cx="30" cy="16" r="8" fill="#ED1C2E"/>
                  </svg>
                </div>
                
                {/* American Express */}
                <div className="bg-white px-4 py-2 rounded-lg shadow-md">
                  <svg className="h-8 w-14" viewBox="0 0 48 32" fill="none">
                    <rect width="48" height="32" rx="4" fill="#006FCF"/>
                    <text x="6" y="20" fill="white" fontSize="10" fontWeight="bold" fontFamily="Arial">AMEX</text>
                  </svg>
                </div>
              </div>
              
              {/* Powered by Stripe */}
              <div className="flex items-center justify-center space-x-2 text-gray-400">
                <span className="text-sm">Powered by</span>
                <svg className="h-6 w-16" viewBox="0 0 60 25" fill="none">
                  <text x="0" y="18" fill="#635BFF" fontSize="14" fontWeight="bold" fontFamily="Arial">stripe</text>
                </svg>
              </div>
            </div>

            {/* Cryptocurrencies */}
            <div className="border-t border-gray-800 pt-6">
              <p className="text-sm text-gray-500 mb-3">Cryptocurrency</p>
              <div className="flex items-center justify-center space-x-6 flex-wrap gap-4">
                {/* Bitcoin */}
                <div className="flex items-center space-x-2 bg-gray-800 px-4 py-2 rounded-lg">
                  <div className="w-8 h-8 bg-orange-500 rounded-full flex items-center justify-center">
                    <span className="text-white font-bold text-lg">₿</span>
                  </div>
                  <span className="text-gray-300 text-sm font-semibold">Bitcoin</span>
                </div>

                {/* Ethereum */}
                <div className="flex items-center space-x-2 bg-gray-800 px-4 py-2 rounded-lg">
                  <div className="w-8 h-8 bg-ember rounded-full flex items-center justify-center">
                    <svg className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M11.944 17.97L4.58 13.62 11.943 24l7.37-10.38-7.372 4.35h.003zM12.056 0L4.69 12.223l7.365 4.354 7.365-4.35L12.056 0z"/>
                    </svg>
                  </div>
                  <span className="text-gray-300 text-sm font-semibold">Ethereum</span>
                </div>

                {/* USDT */}
                <div className="flex items-center space-x-2 bg-gray-800 px-4 py-2 rounded-lg">
                  <div className="w-8 h-8 bg-green-600 rounded-full flex items-center justify-center">
                    <span className="text-white font-bold text-sm">₮</span>
                  </div>
                  <span className="text-gray-300 text-sm font-semibold">USDT</span>
                </div>

                {/* USDC */}
                <div className="flex items-center space-x-2 bg-gray-800 px-4 py-2 rounded-lg">
                  <div className="w-8 h-8 bg-ember rounded-full flex items-center justify-center">
                    <span className="text-white font-bold text-xs">USDC</span>
                  </div>
                  <span className="text-gray-300 text-sm font-semibold">USDC</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-gray-800 pt-8">
          <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
            <div className="text-center md:text-left">
              <p className="text-gray-400 text-sm">
                © 2025 Calliotel. All rights reserved.
              </p>
              <p className="text-gray-500 text-xs mt-1">
                Developed by <span className="font-semibold text-ember">G & A Group</span> 💜
              </p>
            </div>
            <div className="flex space-x-6">
              <a href="#" className="text-gray-400 hover:text-orange-400 transition-colors text-sm">Privacy Policy</a>
              <a href="#" className="text-gray-400 hover:text-orange-400 transition-colors text-sm">Terms of Service</a>
              <a href="#" className="text-gray-400 hover:text-orange-400 transition-colors text-sm">Refund Policy</a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;