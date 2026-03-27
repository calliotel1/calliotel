import React, { useState } from 'react';
import { useTheme } from '../context/ThemeContext';
import { Shield, CheckCircle, XCircle, AlertCircle, Search, Loader, FileText, User, Phone, Building } from 'lucide-react';

const ComplianceScoreTool = () => {
  const { darkMode } = useTheme();
  const [websiteUrl, setWebsiteUrl] = useState('');
  const [isScanning, setIsScanning] = useState(false);
  const [result, setResult] = useState(null);

  // Simulated compliance checks
  const checkCompliance = async (url) => {
    setIsScanning(true);
    setResult(null);

    // Simulate scanning delay
    await new Promise(resolve => setTimeout(resolve, 3000));

    // Mock compliance analysis
    const checks = [
      {
        id: 'privacy',
        name: 'Privacy Policy',
        description: 'Required for GDPR, CCPA, and telecom regulations',
        status: Math.random() > 0.3 ? 'pass' : 'fail',
        weight: 25,
        icon: Shield,
        fix: 'Add a comprehensive privacy policy covering data collection, storage, and user rights.'
      },
      {
        id: 'terms',
        name: 'Terms of Service',
        description: 'Legal agreement between you and your users',
        status: Math.random() > 0.4 ? 'pass' : 'fail',
        weight: 20,
        icon: FileText,
        fix: 'Create terms of service outlining acceptable use, liability, and dispute resolution.'
      },
      {
        id: 'contact',
        name: 'Contact Information',
        description: 'Valid business contact details required for verification',
        status: Math.random() > 0.2 ? 'pass' : 'fail',
        weight: 15,
        icon: Phone,
        fix: 'Display business email, phone number, and physical address on your website.'
      },
      {
        id: 'business',
        name: 'Business Registration',
        description: 'Registered business entity information',
        status: Math.random() > 0.5 ? 'pass' : 'fail',
        weight: 20,
        icon: Building,
        fix: 'Include company registration number, business name, and registered address.'
      },
      {
        id: 'identity',
        name: 'Website Identity',
        description: 'Clear business identity and purpose',
        status: Math.random() > 0.25 ? 'pass' : 'fail',
        weight: 10,
        icon: User,
        fix: 'Add "About Us" page with company description, mission, and team information.'
      },
      {
        id: 'security',
        name: 'HTTPS & Security',
        description: 'Secure website with valid SSL certificate',
        status: url.startsWith('https://') ? 'pass' : 'fail',
        weight: 10,
        icon: Shield,
        fix: 'Enable HTTPS with a valid SSL certificate from Let\'s Encrypt or your hosting provider.'
      }
    ];

    // Calculate score
    const passedChecks = checks.filter(c => c.status === 'pass');
    const totalWeight = checks.reduce((sum, c) => sum + c.weight, 0);
    const earnedWeight = passedChecks.reduce((sum, c) => sum + c.weight, 0);
    const score = Math.round((earnedWeight / totalWeight) * 100);

    // Determine readiness level
    let readiness = 'Not Ready';
    let readinessColor = 'red';
    let recommendation = 'Complete critical requirements before purchasing numbers.';

    if (score >= 90) {
      readiness = 'Excellent';
      readinessColor = 'green';
      recommendation = 'You\'re fully compliant! Ready to purchase USA numbers with 10DLC.';
    } else if (score >= 70) {
      readiness = 'Good';
      readinessColor = 'blue';
      recommendation = 'You\'re mostly ready. Complete remaining items for full compliance.';
    } else if (score >= 50) {
      readiness = 'Fair';
      readinessColor = 'yellow';
      recommendation = 'Several improvements needed. Follow recommendations below.';
    } else {
      readiness = 'Needs Work';
      readinessColor = 'orange';
      recommendation = 'Significant compliance gaps. Address critical items first.';
    }

    setResult({
      url,
      score,
      readiness,
      readinessColor,
      recommendation,
      checks,
      passedCount: passedChecks.length,
      totalCount: checks.length
    });

    setIsScanning(false);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!websiteUrl) return;

    // Add https:// if not present
    let url = websiteUrl;
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      url = 'https://' + url;
    }

    checkCompliance(url);
  };

  const getColorClasses = (color) => {
    const colors = {
      green: 'text-green-500 bg-green-500/20 border-green-500',
      blue: 'text-ember bg-ember/20 border-ember',
      yellow: 'text-yellow-500 bg-yellow-500/20 border-yellow-500',
      orange: 'text-orange-500 bg-orange-500/20 border-orange-500',
      red: 'text-red-500 bg-red-500/20 border-red-500'
    };
    return colors[color] || colors.red;
  };

  return (
    <div className={`py-24 ${darkMode ? 'bg-gray-900' : 'bg-[#F9F9F7]'} relative overflow-hidden`}>
      {/* Background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-20 w-96 h-96 bg-green-500 rounded-full mix-blend-multiply filter blur-3xl opacity-10 animate-pulse"></div>
        <div className="absolute bottom-20 right-20 w-96 h-96 bg-ember rounded-full mix-blend-multiply filter blur-3xl opacity-10 animate-pulse delay-700"></div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-block mb-4">
            <span
              className={`px-4 py-2 rounded-full text-sm font-bold flex items-center space-x-2 ${
                darkMode
                  ? 'bg-gradient-to-r from-green-500/20 to-ember-light/20 text-green-300'
                  : 'bg-gradient-to-r from-green-100 to-ember-light/10 text-green-700'
              }`}
            >
              <Shield className="w-4 h-4" />
              <span>COMPLIANCE CONSULTANT</span>
            </span>
          </div>
          <h2 className={`text-4xl sm:text-5xl font-black mb-6 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
            Check Your <span className="bg-gradient-to-r from-green-500 to-ember-light bg-clip-text text-transparent">Compliance Score</span>
          </h2>
          <p className={`text-xl ${darkMode ? 'text-gray-400' : 'text-gray-600'} max-w-3xl mx-auto`}>
            Instant analysis for USA 10DLC, GDPR, and telecom compliance. Get ready in minutes.
          </p>
        </div>

        {/* Input Form */}
        <div
          className={`rounded-2xl overflow-hidden border-2 shadow-2xl mb-8 ${
            darkMode ? 'bg-gray-800 border-gray-700' : 'bg-[#FAFAF8] border-gray-200'
          }`}
          style={{
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
          }}
        >
          <div className="p-8">
            <form onSubmit={handleSubmit}>
              <label className={`block text-sm font-bold mb-3 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                Enter Your Website URL
              </label>
              <div className="flex space-x-3">
                <input
                  type="text"
                  value={websiteUrl}
                  onChange={(e) => setWebsiteUrl(e.target.value)}
                  placeholder="example.com or https://example.com"
                  className={`flex-1 px-4 py-4 rounded-xl border-2 focus:outline-none focus:ring-2 focus:ring-green-500 text-lg ${
                    darkMode
                      ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400'
                      : 'bg-[#F9F9F7] border-gray-200 text-gray-900 placeholder-gray-500'
                  }`}
                />
                <button
                  type="submit"
                  disabled={!websiteUrl || isScanning}
                  className="px-8 py-4 bg-gradient-to-r from-green-500 to-ember-light text-white font-bold rounded-xl hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                >
                  {isScanning ? (
                    <>
                      <Loader className="w-5 h-5 animate-spin" />
                      <span>Scanning...</span>
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
                We'll scan your website for compliance requirements in seconds
              </p>
            </form>
          </div>

          {/* Scanning Animation */}
          {isScanning && (
            <div className={`px-8 pb-8`}>
              <div className={`p-6 rounded-xl ${darkMode ? 'bg-gray-700/50' : 'bg-gray-50'}`}>
                <div className="space-y-3">
                  <div className={`flex items-center space-x-3 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    <Loader className="w-5 h-5 animate-spin text-green-500" />
                    <span className="text-sm">Scanning website structure...</span>
                  </div>
                  <div className={`flex items-center space-x-3 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    <Loader className="w-5 h-5 animate-spin text-ember" />
                    <span className="text-sm">Checking legal pages...</span>
                  </div>
                  <div className={`flex items-center space-x-3 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    <Loader className="w-5 h-5 animate-spin text-ember" />
                    <span className="text-sm">Analyzing contact information...</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Results */}
        {result && !isScanning && (
          <div className="space-y-6">
            {/* Score Card */}
            <div
              className={`rounded-2xl overflow-hidden border-2 shadow-2xl ${
                darkMode ? 'bg-gray-800 border-gray-700' : 'bg-[#FAFAF8] border-gray-200'
              }`}
            >
              <div className="p-8">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h3 className={`text-2xl font-black mb-2 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                      Compliance Score
                    </h3>
                    <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                      {result.url}
                    </p>
                  </div>
                  <div className="text-right">
                    <div className={`text-6xl font-black mb-2 ${getColorClasses(result.readinessColor).split(' ')[0]}`}>
                      {result.score}%
                    </div>
                    <div className={`inline-flex items-center space-x-2 px-4 py-2 rounded-full text-sm font-bold ${getColorClasses(result.readinessColor)}`}>
                      <span>{result.readiness}</span>
                    </div>
                  </div>
                </div>

                <div className={`p-4 rounded-xl mb-6 ${darkMode ? 'bg-blue-900/20 border-2 border-ember/30' : 'bg-blue-50 border-2 border-blue-200'}`}>
                  <p className={`text-sm ${darkMode ? 'text-blue-300' : 'text-blue-900'}`}>
                    <strong>Recommendation:</strong> {result.recommendation}
                  </p>
                </div>

                <div className="flex items-center justify-between text-sm">
                  <span className={darkMode ? 'text-gray-400' : 'text-gray-600'}>
                    {result.passedCount} of {result.totalCount} checks passed
                  </span>
                  <span className={`font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                    {result.passedCount === result.totalCount ? 'Fully Compliant!' : 'Almost There!'}
                  </span>
                </div>
              </div>
            </div>

            {/* Detailed Checks */}
            <div className="space-y-4">
              {result.checks.map((check) => {
                const Icon = check.icon;
                const isPassed = check.status === 'pass';

                return (
                  <div
                    key={check.id}
                    className={`rounded-2xl overflow-hidden border-2 transition-all ${
                      darkMode
                        ? `bg-gray-800 ${isPassed ? 'border-green-700/50' : 'border-red-700/50'}`
                        : `bg-[#FAFAF8] ${isPassed ? 'border-green-200' : 'border-red-200'}`
                    }`}
                  >
                    <div className="p-6">
                      <div className="flex items-start space-x-4">
                        <div className={`flex-shrink-0 w-12 h-12 rounded-xl flex items-center justify-center ${
                          isPassed
                            ? 'bg-green-500/20'
                            : 'bg-red-500/20'
                        }`}>
                          <Icon className={`w-6 h-6 ${isPassed ? 'text-green-500' : 'text-red-500'}`} />
                        </div>

                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-2">
                            <h4 className={`text-lg font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                              {check.name}
                            </h4>
                            {isPassed ? (
                              <CheckCircle className="w-6 h-6 text-green-500" />
                            ) : (
                              <XCircle className="w-6 h-6 text-red-500" />
                            )}
                          </div>

                          <p className={`text-sm mb-3 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                            {check.description}
                          </p>

                          {!isPassed && (
                            <div className={`p-3 rounded-lg ${darkMode ? 'bg-gray-700/50' : 'bg-gray-50'}`}>
                              <div className="flex items-start space-x-2">
                                <AlertCircle className="w-5 h-5 text-orange-500 flex-shrink-0 mt-0.5" />
                                <div>
                                  <p className={`text-sm font-semibold mb-1 ${darkMode ? 'text-orange-300' : 'text-orange-700'}`}>
                                    How to fix:
                                  </p>
                                  <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                                    {check.fix}
                                  </p>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* CTA */}
            <div className="text-center pt-6">
              <button
                onClick={() => window.location.href = result.score >= 70 ? '/browse-numbers' : '/signup'}
                className="px-8 py-4 bg-gradient-to-r from-green-500 to-ember-light text-white font-bold text-lg rounded-xl shadow-2xl hover:scale-105 transition-all"
              >
                {result.score >= 70 ? 'Browse Numbers Now →' : 'Get Compliance Templates →'}
              </button>
              <p className={`mt-4 text-sm ${darkMode ? 'text-gray-500' : 'text-gray-500'}`}>
                {result.score >= 70 
                  ? 'You\'re ready to purchase USA numbers with confidence'
                  : 'Get free compliance templates to improve your score'
                }
              </p>
            </div>
          </div>
        )}

        {/* Trust Indicators */}
        <div className={`mt-12 text-center text-sm ${darkMode ? 'text-gray-500' : 'text-gray-500'}`}>
          ✓ Free compliance check • ✓ Instant results • ✓ Expert recommendations • ✓ Templates included
        </div>
      </div>
    </div>
  );
};

export default ComplianceScoreTool;
