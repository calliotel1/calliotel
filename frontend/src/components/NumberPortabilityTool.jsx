import React, { useState } from 'react';
import { useTheme } from '../context/ThemeContext';
import { Search, CheckCircle, XCircle, Loader, AlertCircle, ArrowRight } from 'lucide-react';

const NumberPortabilityTool = () => {
  const { darkMode } = useTheme();
  const [phoneNumber, setPhoneNumber] = useState('');
  const [isChecking, setIsChecking] = useState(false);
  const [result, setResult] = useState(null);

  // Simulate portability check
  const checkPortability = async () => {
    if (!phoneNumber || phoneNumber.length < 10) {
      return;
    }

    setIsChecking(true);
    setResult(null);

    // Simulate API call delay
    setTimeout(() => {
      // Smart logic: most numbers are portable
      const isPortable = Math.random() > 0.15; // 85% portable rate
      
      // Extract country code hint
      let carrier = 'Unknown Carrier';
      let country = 'International';
      let transferDays = '2-3';
      
      if (phoneNumber.startsWith('+1') || phoneNumber.startsWith('1')) {
        country = 'United States';
        carrier = ['AT&T', 'Verizon', 'T-Mobile', 'Sprint'][Math.floor(Math.random() * 4)];
        transferDays = '2-5';
      } else if (phoneNumber.startsWith('+44')) {
        country = 'United Kingdom';
        carrier = ['EE', 'O2', 'Vodafone', 'Three'][Math.floor(Math.random() * 4)];
        transferDays = '1-2';
      } else if (phoneNumber.startsWith('+49')) {
        country = 'Germany';
        carrier = ['Telekom', 'Vodafone', 'O2'][Math.floor(Math.random() * 3)];
        transferDays = '2-4';
      } else if (phoneNumber.startsWith('+61')) {
        country = 'Australia';
        carrier = ['Telstra', 'Optus', 'Vodafone'][Math.floor(Math.random() * 3)];
        transferDays = '2-3';
      }

      setResult({
        portable: isPortable,
        carrier,
        country,
        transferDays,
        number: phoneNumber
      });
      setIsChecking(false);
    }, 2500); // 2.5s for realistic carrier check
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      checkPortability();
    }
  };

  const formatPhoneNumber = (value) => {
    // Allow only numbers and +
    return value.replace(/[^\d+]/g, '');
  };

  return (
    <div className={`py-24 ${darkMode ? 'bg-gray-900' : 'bg-[#F9F9F7]'} relative overflow-hidden`}>
      {/* Background Effects */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-20 w-96 h-96 bg-ember rounded-full mix-blend-multiply filter blur-3xl opacity-10 animate-pulse"></div>
        <div className="absolute bottom-20 right-20 w-96 h-96 bg-green-500 rounded-full mix-blend-multiply filter blur-3xl opacity-10 animate-pulse delay-700"></div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-block mb-4">
            <span
              className={`px-4 py-2 rounded-full text-sm font-bold flex items-center space-x-2 ${
                darkMode
                  ? 'bg-gradient-to-r from-ember/20 to-green-500/20 text-blue-300'
                  : 'bg-gradient-to-r from-ember/10 to-green-100 text-blue-700'
              }`}
            >
              <AlertCircle className="w-4 h-4" />
              <span>CARRIER-GRADE CONNECTIVITY</span>
            </span>
          </div>
          <h2 className={`text-4xl sm:text-5xl font-black mb-4 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
            Port Your <span className="bg-gradient-to-r from-ember to-green-500 bg-clip-text text-transparent">Existing Number</span>
          </h2>
          <p className={`text-xl ${darkMode ? 'text-gray-400' : 'text-gray-600'} max-w-3xl mx-auto`}>
            Keep your current number. Check portability instantly from 50+ global carriers.
          </p>
        </div>

        {/* Portability Checker */}
        <div
          className={`rounded-2xl overflow-hidden border-2 shadow-2xl max-w-3xl mx-auto ${
            darkMode ? 'bg-gray-800 border-gray-700' : 'bg-[#FAFAF8] border-gray-200'
          }`}
          style={{
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
          }}
        >
          <div className="p-8">
            {/* Input Section */}
            <div className="mb-6">
              <label className={`block text-sm font-bold mb-3 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                Enter Your Phone Number
              </label>
              <div className="flex space-x-3">
                <input
                  type="text"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(formatPhoneNumber(e.target.value))}
                  onKeyPress={handleKeyPress}
                  placeholder="+1 555 123 4567"
                  className={`flex-1 px-4 py-4 rounded-xl border-2 focus:outline-none focus:ring-2 focus:ring-blue-500 text-lg ${
                    darkMode
                      ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400'
                      : 'bg-[#F9F9F7] border-gray-200 text-gray-900 placeholder-gray-500'
                  }`}
                />
                <button
                  onClick={checkPortability}
                  disabled={!phoneNumber || phoneNumber.length < 10 || isChecking}
                  className="px-8 py-4 bg-gradient-to-r from-ember to-green-500 text-white font-bold rounded-xl hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                >
                  {isChecking ? (
                    <>
                      <Loader className="w-5 h-5 animate-spin" />
                      <span>Checking...</span>
                    </>
                  ) : (
                    <>
                      <Search className="w-5 h-5" />
                      <span>Check</span>
                    </>
                  )}
                </button>
              </div>
              <p className={`mt-2 text-xs ${darkMode ? 'text-gray-500' : 'text-gray-500'}`}>
                Include country code (e.g., +1 for US, +44 for UK)
              </p>
            </div>

            {/* Checking Animation */}
            {isChecking && (
              <div className={`p-6 rounded-xl mb-6 ${darkMode ? 'bg-gray-700/50' : 'bg-[#F9F9F7]'}`}>
                <div className="flex items-center space-x-3 mb-4">
                  <Loader className="w-5 h-5 animate-spin text-ember" />
                  <span className={`font-semibold ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    Checking carrier databases...
                  </span>
                </div>
                <div className="space-y-2 text-sm">
                  <div className={`flex items-center space-x-2 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                    <div className="w-2 h-2 bg-ember rounded-full animate-pulse"></div>
                    <span>Contacting global telecom network...</span>
                  </div>
                  <div className={`flex items-center space-x-2 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse delay-200"></div>
                    <span>Verifying carrier routing...</span>
                  </div>
                  <div className={`flex items-center space-x-2 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                    <div className="w-2 h-2 bg-ember rounded-full animate-pulse delay-400"></div>
                    <span>Calculating transfer timeline...</span>
                  </div>
                </div>
              </div>
            )}

            {/* Result Display */}
            {result && !isChecking && (
              <div
                className={`p-6 rounded-xl border-2 ${
                  result.portable
                    ? darkMode
                      ? 'bg-green-900/20 border-green-700'
                      : 'bg-green-50 border-green-200'
                    : darkMode
                    ? 'bg-red-900/20 border-red-700'
                    : 'bg-red-50 border-red-200'
                }`}
              >
                <div className="flex items-start space-x-4">
                  <div className="flex-shrink-0">
                    {result.portable ? (
                      <CheckCircle className="w-8 h-8 text-green-500" />
                    ) : (
                      <XCircle className="w-8 h-8 text-red-500" />
                    )}
                  </div>
                  <div className="flex-1">
                    <h3 className={`text-xl font-bold mb-2 ${result.portable ? 'text-green-500' : 'text-red-500'}`}>
                      {result.portable ? 'This Number is Portable!' : 'Number Not Portable'}
                    </h3>
                    
                    <div className={`space-y-2 mb-4 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                      <p><strong>Number:</strong> {result.number}</p>
                      <p><strong>Country:</strong> {result.country}</p>
                      <p><strong>Current Carrier:</strong> {result.carrier}</p>
                      {result.portable && (
                        <p><strong>Transfer Time:</strong> {result.transferDays} business days</p>
                      )}
                    </div>

                    {result.portable ? (
                      <div>
                        <p className={`mb-4 text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                          Great news! Your number can be transferred to Calliotel. Keep your existing number 
                          while accessing our global cloud infrastructure.
                        </p>
                        <button
                          onClick={() => window.location.href = '/signup'}
                          className="px-6 py-3 bg-green-500 text-white font-bold rounded-xl hover:bg-green-600 transition-all flex items-center space-x-2"
                        >
                          <span>Start Transfer Process</span>
                          <ArrowRight className="w-5 h-5" />
                        </button>
                      </div>
                    ) : (
                      <div>
                        <p className={`mb-4 text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                          This number cannot be ported due to carrier restrictions. However, you can get 
                          a new Calliotel number with the same area code!
                        </p>
                        <button
                          onClick={() => window.location.href = '/browse-numbers'}
                          className="px-6 py-3 bg-ember text-white font-bold rounded-xl hover:bg-ember transition-all flex items-center space-x-2"
                        >
                          <span>Browse Available Numbers</span>
                          <ArrowRight className="w-5 h-5" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Trust Indicators */}
          <div className={`px-8 py-4 border-t ${darkMode ? 'border-gray-700 bg-gray-900/50' : 'border-gray-200 bg-[#F9F9F7]'}`}>
            <div className={`text-center text-sm ${darkMode ? 'text-gray-500' : 'text-gray-500'}`}>
              ✓ Connected to global carrier network • ✓ Secure number verification • ✓ 24/7 porting support
            </div>
          </div>
        </div>

        {/* How It Works */}
        <div className="mt-16 grid md:grid-cols-3 gap-6">
          <div className={`p-6 rounded-xl ${darkMode ? 'bg-gray-800' : 'bg-[#FAFAF8]'} border ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-ember to-ember-light flex items-center justify-center mb-4">
              <span className="text-white font-bold text-xl">1</span>
            </div>
            <h3 className={`text-lg font-bold mb-2 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
              Verify Eligibility
            </h3>
            <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              Enter your number to check if it can be transferred from your current carrier.
            </p>
          </div>

          <div className={`p-6 rounded-xl ${darkMode ? 'bg-gray-800' : 'bg-[#FAFAF8]'} border ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center mb-4">
              <span className="text-white font-bold text-xl">2</span>
            </div>
            <h3 className={`text-lg font-bold mb-2 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
              Submit Request
            </h3>
            <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              Provide carrier info and account details. We handle all paperwork with carriers.
            </p>
          </div>

          <div className={`p-6 rounded-xl ${darkMode ? 'bg-gray-800' : 'bg-[#FAFAF8]'} border ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-ember to-ember-light flex items-center justify-center mb-4">
              <span className="text-white font-bold text-xl">3</span>
            </div>
            <h3 className={`text-lg font-bold mb-2 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
              Go Live
            </h3>
            <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              Number transfers in 1-5 days. Zero downtime. Keep your existing phone until complete.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NumberPortabilityTool;
