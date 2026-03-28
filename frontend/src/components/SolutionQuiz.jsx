import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MessageSquare, Briefcase, TrendingUp, ArrowRight, Check, X, ShoppingCart, Loader } from 'lucide-react';
import { Card, CardContent } from './ui/card';
import { Button } from './ui/button';
import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const SolutionQuiz = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [selectedSolution, setSelectedSolution] = useState(null);
  const [showPurchaseModal, setShowPurchaseModal] = useState(false);
  const [selectedCountry, setSelectedCountry] = useState(null);
  const [purchasing, setPurchasing] = useState(false);
  const [purchaseError, setPurchaseError] = useState('');

  const solutions = [
    {
      id: 'verification',
      title: 'WhatsApp/Telegram Verification',
      icon: <MessageSquare className="w-8 h-8" />,
      description: 'Get verified on messaging apps instantly',
      color: 'from-green-600 to-emerald-600',
      borderColor: 'border-green-500',
      iconColor: 'text-green-400',
      recommendations: {
        countries: ['United States', 'United Kingdom', 'Canada'],
        features: ['4G SMS', 'Instant Activation', 'Low Cost'],
        priceRange: '$0.99 - $1.49/mo',
        bestFor: 'Quick verification, disposable numbers',
        popular: [
          { country: '🇺🇸 USA', price: '$0.99', code: '+1' },
          { country: '🇬🇧 UK', price: '$1.49', code: '+44' },
          { country: '🇨🇦 Canada', price: '$1.29', code: '+1' }
        ]
      }
    },
    {
      id: 'business',
      title: 'Business Calls (UK/USA)',
      icon: <Briefcase className="w-8 h-8" />,
      description: 'Professional numbers for client communication',
      color: 'from-ember to-ember-light',
      borderColor: 'border-ember',
      iconColor: 'text-blue-400',
      recommendations: {
        countries: ['United States', 'United Kingdom'],
        features: ['Voice Calls', 'SMS', 'Professional Numbers'],
        priceRange: '$1.49 - $2.49/mo',
        bestFor: 'Client calls, business presence',
        popular: [
          { country: '🇺🇸 USA', price: '$0.99', code: '+1', features: 'Voice + SMS' },
          { country: '🇬🇧 UK', price: '$1.49', code: '+44', features: 'Voice + SMS' },
          { country: '🇨🇦 Canada', price: '$1.29', code: '+1', features: 'Voice + SMS + MMS' }
        ]
      }
    },
    {
      id: 'marketing',
      title: 'High-Volume Marketing',
      icon: <TrendingUp className="w-8 h-8" />,
      description: 'Bulk SMS campaigns and promotions',
      color: 'from-ember to-ember-light',
      borderColor: 'border-ember',
      iconColor: 'text-ember',
      recommendations: {
        countries: ['United States', 'United Kingdom', 'Canada', 'Australia'],
        features: ['High-Volume SMS', 'MMS Support', 'API Access'],
        priceRange: '$1.99 - $2.99/mo',
        bestFor: 'Marketing campaigns, mass messaging',
        popular: [
          { country: '🇺🇸 USA', price: '$0.99', code: '+1', features: 'SMS + MMS + API' },
          { country: '🇬🇧 UK', price: '$1.49', code: '+44', features: 'SMS + API' },
          { country: '🇦🇺 Australia', price: '$1.99', code: '+61', features: 'SMS + Voice' }
        ]
      }
    }
  ];

  const handleSelectSolution = (solution) => {
    setSelectedSolution(solution);
    setStep(2);
  };

  const handleReset = () => {
    setStep(1);
    setSelectedSolution(null);
  };

  const handleGetNumbers = () => {
    // Navigate to virtual numbers page with filter
    navigate(`/virtual-numbers?filter=${selectedSolution.id}`);
  };

  const handleBuyNumber = (option) => {
    setSelectedCountry(option);
    setShowPurchaseModal(true);
  };

  const handleConfirmPurchase = async () => {
    if (!selectedCountry) return;
    
    setPurchasing(true);
    setPurchaseError('');
    
    // FORCE REDIRECT TO CHECKOUT (bypassing smart balance API for now)
    // TODO: Re-enable smart balance check once backend API is stable in production
    const checkoutUrl = `/verification-checkout?country=${encodeURIComponent(selectedCountry.country)}&price=${selectedCountry.price}&code=${selectedCountry.code}&service=${encodeURIComponent(selectedSolution.title)}`;
    
    setShowPurchaseModal(false);
    navigate(checkoutUrl, { replace: true });
    setPurchasing(false);
  };

  return (
    <div className="bg-gradient-to-br from-gray-900 via-olive-dark/20 to-gray-900 border border-ember/30 rounded-xl p-6 mb-8">
      {/* Step 1: Choose Solution */}
      {step === 1 && (
        <div>
          <div className="text-center mb-6">
            <h2 className="text-2xl font-bold text-white mb-2">
              🎯 What do you need a number for?
            </h2>
            <p className="text-gray-400">
              Tell us your use case and we'll recommend the perfect numbers
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-4">
            {solutions.map((solution) => (
              <Card
                key={solution.id}
                onClick={() => handleSelectSolution(solution)}
                className="group cursor-pointer hover:scale-105 transition-all duration-300 bg-gray-800/50 border-gray-700 hover:border-ember"
              >
                <CardContent className="p-6 text-center">
                  <div className={`w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-br ${solution.color} flex items-center justify-center`}>
                    <div className="text-white">
                      {solution.icon}
                    </div>
                  </div>
                  <h3 className="text-white font-bold mb-2">{solution.title}</h3>
                  <p className="text-gray-400 text-sm mb-4">{solution.description}</p>
                  <Button className={`w-full bg-gradient-to-r ${solution.color} hover:opacity-90`}>
                    Choose This
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Step 2: Show Recommendations */}
      {step === 2 && selectedSolution && (
        <div>
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold text-white mb-2">
                ✨ Perfect Numbers for {selectedSolution.title}
              </h2>
              <p className="text-gray-400">
                Based on your selection, here are our top recommendations
              </p>
            </div>
            <Button onClick={handleReset} variant="ghost" className="text-gray-400">
              <X className="w-4 h-4 mr-2" />
              Change
            </Button>
          </div>

          {/* Recommendations Summary */}
          <Card className={`bg-gradient-to-br ${selectedSolution.color} bg-opacity-20 border-2 ${selectedSolution.borderColor} mb-6`}>
            <CardContent className="p-6">
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-white font-bold mb-3">Best For:</h3>
                  <p className="text-gray-300 mb-4">{selectedSolution.recommendations.bestFor}</p>
                  
                  <h3 className="text-white font-bold mb-3">Key Features:</h3>
                  <div className="space-y-2">
                    {selectedSolution.recommendations.features.map((feature, index) => (
                      <div key={index} className="flex items-center space-x-2">
                        <Check className="w-4 h-4 text-green-400" />
                        <span className="text-gray-300 text-sm">{feature}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <h3 className="text-white font-bold mb-3">Recommended Countries:</h3>
                  <div className="space-y-2 mb-4">
                    {selectedSolution.recommendations.countries.map((country, index) => (
                      <div key={index} className="flex items-center space-x-2">
                        <Check className="w-4 h-4 text-green-400" />
                        <span className="text-gray-300 text-sm">{country}</span>
                      </div>
                    ))}
                  </div>

                  <div className="bg-gray-900/30 p-3 rounded-lg">
                    <p className="text-gray-400 text-sm">Price Range</p>
                    <p className="text-white text-xl font-bold">{selectedSolution.recommendations.priceRange}</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Popular Options */}
          <h3 className="text-white font-bold mb-4">🌟 Most Popular Options:</h3>
          <div className="grid md:grid-cols-3 gap-4 mb-6">
            {selectedSolution.recommendations.popular.map((option, index) => (
              <Card key={index} className="bg-gray-800/70 border-gray-700 hover:border-ember transition-all group">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-2xl">{option.country.split(' ')[0]}</span>
                    <span className="px-2 py-1 bg-green-900/30 text-green-300 text-xs font-bold rounded-full">
                      Available
                    </span>
                  </div>
                  <p className="text-white font-bold mb-1">{option.country.split(' ')[1]}</p>
                  <p className="text-gray-400 text-sm mb-2">{option.code}</p>
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-ember font-bold text-lg">{option.price}/mo</span>
                    {index === 0 && (
                      <span className="px-2 py-1 bg-ember/20 text-ember text-xs font-bold rounded-full animate-pulse">
                        🔥 Hot Deal
                      </span>
                    )}
                  </div>
                  {option.features && (
                    <p className="text-xs text-gray-500 mb-3">{option.features}</p>
                  )}
                  
                  {/* BUY BUTTON - THE MONEY MAKER! */}
                  <Button
                    onClick={() => handleBuyNumber(option)}
                    className="w-full bg-gradient-to-r from-ember to-ember-light hover:from-ember-light hover:to-ember text-white font-bold py-2 transition-all group-hover:scale-105"
                  >
                    <ShoppingCart className="w-4 h-4 mr-2" />
                    Get {option.country.split(' ')[1]} Number
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Action Buttons */}
          <div className="flex space-x-4">
            <Button
              onClick={handleGetNumbers}
              className={`flex-1 bg-gradient-to-r ${selectedSolution.color} hover:opacity-90 text-white font-bold py-3`}
            >
              View All {selectedSolution.title} Numbers
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
            <Button
              onClick={() => navigate('/coverage')}
              variant="outline"
              className="border-ember text-ember hover:bg-olive/30"
            >
              See All Countries
            </Button>
          </div>
        </div>
      )}

      {/* PURCHASE CONFIRMATION MODAL - THE TRUST BUILDER */}
      {showPurchaseModal && selectedCountry && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <Card className="bg-gray-900 border-ember/50 max-w-md w-full animate-in fade-in zoom-in duration-300">
            <CardContent className="p-6">
              {/* Header */}
              <div className="text-center mb-6">
                <div className="text-4xl mb-3">{selectedCountry.country.split(' ')[0]}</div>
                <h3 className="text-2xl font-bold text-white mb-2">
                  Confirm Purchase
                </h3>
                <p className="text-gray-400 text-sm">
                  You're about to get a premium number
                </p>
              </div>

              {/* Details */}
              <div className="bg-gray-800/50 rounded-lg p-4 mb-6 space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-gray-400">Country:</span>
                  <span className="text-white font-bold">{selectedCountry.country.split(' ')[1]}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-400">Dial Code:</span>
                  <span className="text-white font-mono">{selectedCountry.code}</span>
                </div>
                {selectedCountry.features && (
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400">Features:</span>
                    <span className="text-white text-sm">{selectedCountry.features}</span>
                  </div>
                )}
                <div className="border-t border-gray-700 pt-3 flex justify-between items-center">
                  <span className="text-gray-400">Monthly Cost:</span>
                  <span className="text-ember font-bold text-xl">{selectedCountry.price}/mo</span>
                </div>
              </div>

              {/* Success Animation Preview */}
              <div className="mb-6 text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-ember/20 animate-pulse">
                  <ShoppingCart className="w-8 h-8 text-ember" />
                </div>
              </div>

              {/* Error Message */}
              {purchaseError && (
                <div className="mb-4 p-3 bg-red-900/30 border border-red-500/50 rounded-lg">
                  <p className="text-red-300 text-sm text-center">{purchaseError}</p>
                </div>
              )}

              {/* Actions */}
              <div className="flex space-x-3">
                <Button
                  onClick={() => setShowPurchaseModal(false)}
                  variant="outline"
                  className="flex-1 border-gray-600 text-gray-300 hover:bg-gray-800"
                  disabled={purchasing}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleConfirmPurchase}
                  disabled={purchasing}
                  className="flex-1 bg-gradient-to-r from-ember to-ember-light hover:from-ember-light hover:to-ember text-white font-bold disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {purchasing ? (
                    <>
                      <Loader className="w-4 h-4 mr-2 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>🔥 Confirm Purchase</>
                  )}
                </Button>
              </div>

              {/* Trust Badge */}
              <p className="text-center text-xs text-gray-500 mt-4">
                ✓ Instant activation • ✓ Secure payment • ✓ 24/7 support
              </p>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};

export default SolutionQuiz;
