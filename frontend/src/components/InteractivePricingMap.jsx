import React, { useState } from 'react';
import { ComposableMap, Geographies, Geography, ZoomableGroup } from 'react-simple-maps';
import { useTheme } from '../context/ThemeContext';
import { useNavigate } from 'react-router-dom';
import { TrendingDown, TrendingUp, Globe, Zap, DollarSign } from 'lucide-react';

const geoUrl = "https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json";

// Country pricing data (simulating real-time rates)
const countryPricing = {
  "United States": { price: 2.99, currency: "USD", trend: "down", change: "-5%" },
  "Canada": { price: 3.49, currency: "CAD", trend: "up", change: "+2%" },
  "United Kingdom": { price: 2.49, currency: "GBP", trend: "down", change: "-3%" },
  "Germany": { price: 3.99, currency: "EUR", trend: "stable", change: "0%" },
  "France": { price: 3.99, currency: "EUR", trend: "down", change: "-2%" },
  "Spain": { price: 3.49, currency: "EUR", trend: "up", change: "+1%" },
  "Italy": { price: 3.99, currency: "EUR", trend: "stable", change: "0%" },
  "Netherlands": { price: 3.49, currency: "EUR", trend: "down", change: "-4%" },
  "Australia": { price: 4.49, currency: "AUD", trend: "up", change: "+3%" },
  "Japan": { price: 4.99, currency: "JPY", trend: "stable", change: "0%" },
  "Brazil": { price: 2.49, currency: "BRL", trend: "down", change: "-6%" },
  "Mexico": { price: 1.99, currency: "MXN", trend: "down", change: "-8%" },
  "India": { price: 1.49, currency: "INR", trend: "down", change: "-10%" },
  "Singapore": { price: 3.99, currency: "SGD", trend: "up", change: "+2%" },
  "Hong Kong": { price: 3.49, currency: "HKD", trend: "stable", change: "0%" },
  "South Africa": { price: 2.99, currency: "ZAR", trend: "down", change: "-5%" },
  "Sweden": { price: 3.99, currency: "SEK", trend: "up", change: "+1%" },
  "Norway": { price: 4.49, currency: "NOK", trend: "up", change: "+2%" },
  "Switzerland": { price: 4.99, currency: "CHF", trend: "stable", change: "0%" },
  "Poland": { price: 2.99, currency: "PLN", trend: "down", change: "-3%" },
  "Turkey": { price: 2.49, currency: "TRY", trend: "down", change: "-7%" },
  "United Arab Emirates": { price: 3.99, currency: "AED", trend: "stable", change: "0%" },
  "Israel": { price: 3.49, currency: "ILS", trend: "up", change: "+1%" },
  "South Korea": { price: 3.99, currency: "KRW", trend: "stable", change: "0%" },
  "Indonesia": { price: 1.99, currency: "IDR", trend: "down", change: "-5%" },
  "Thailand": { price: 2.49, currency: "THB", trend: "down", change: "-4%" },
  "Malaysia": { price: 2.99, currency: "MYR", trend: "stable", change: "0%" },
  "Philippines": { price: 1.99, currency: "PHP", trend: "down", change: "-6%" },
  "Vietnam": { price: 1.49, currency: "VND", trend: "down", change: "-8%" },
  "Argentina": { price: 2.49, currency: "ARS", trend: "down", change: "-5%" },
  "Chile": { price: 2.99, currency: "CLP", trend: "stable", change: "0%" },
  "Colombia": { price: 2.49, currency: "COP", trend: "down", change: "-3%" },
  "Peru": { price: 2.49, currency: "PEN", trend: "down", change: "-4%" },
  "Egypt": { price: 1.99, currency: "EGP", trend: "down", change: "-7%" },
  "Nigeria": { price: 1.49, currency: "NGN", trend: "down", change: "-9%" },
  "Kenya": { price: 1.99, currency: "KES", trend: "down", change: "-6%" },
  "New Zealand": { price: 4.49, currency: "NZD", trend: "up", change: "+2%" },
  "Ireland": { price: 3.49, currency: "EUR", trend: "stable", change: "0%" },
  "Belgium": { price: 3.99, currency: "EUR", trend: "stable", change: "0%" },
  "Austria": { price: 3.99, currency: "EUR", trend: "stable", change: "0%" },
  "Denmark": { price: 3.99, currency: "DKK", trend: "up", change: "+1%" },
  "Finland": { price: 3.99, currency: "EUR", trend: "stable", change: "0%" },
  "Portugal": { price: 3.49, currency: "EUR", trend: "down", change: "-2%" },
  "Greece": { price: 3.49, currency: "EUR", trend: "stable", change: "0%" },
  "Czech Republic": { price: 2.99, currency: "CZK", trend: "down", change: "-3%" },
  "Romania": { price: 2.49, currency: "RON", trend: "down", change: "-4%" },
  "Hungary": { price: 2.99, currency: "HUF", trend: "stable", change: "0%" },
  "Ukraine": { price: 1.99, currency: "UAH", trend: "down", change: "-5%" },
  "Russia": { price: 2.49, currency: "RUB", trend: "down", change: "-6%" },
  "China": { price: 3.99, currency: "CNY", trend: "stable", change: "0%" }
};

const InteractivePricingMap = () => {
  const { darkMode } = useTheme();
  const navigate = useNavigate();
  const [hoveredCountry, setHoveredCountry] = useState(null);
  const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 });

  const handleCountryHover = (geo, event) => {
    const countryName = geo.properties.name;
    if (countryPricing[countryName]) {
      setHoveredCountry(countryName);
      setTooltipPosition({ x: event.clientX, y: event.clientY });
    }
  };

  const handleCountryClick = (countryName) => {
    if (countryPricing[countryName]) {
      navigate(`/browse-numbers?country=${encodeURIComponent(countryName)}`);
    }
  };

  const getCountryColor = (countryName) => {
    if (!countryPricing[countryName]) return darkMode ? '#374151' : '#E5E7EB';
    
    const pricing = countryPricing[countryName];
    // Color based on pricing tier
    if (pricing.price < 2.50) return darkMode ? '#10B981' : '#34D399'; // Green (cheap)
    if (pricing.price < 3.50) return darkMode ? '#F59E0B' : '#FBBF24'; // Yellow (medium)
    return darkMode ? '#EF4444' : '#F87171'; // Red (expensive)
  };

  const getTrendIcon = (trend) => {
    switch (trend) {
      case 'down': return <TrendingDown className="w-4 h-4 text-green-500" />;
      case 'up': return <TrendingUp className="w-4 h-4 text-red-500" />;
      default: return <span className="text-xs text-gray-500">—</span>;
    }
  };

  return (
    <div className={`relative ${darkMode ? 'bg-gray-900' : 'bg-black'} rounded-2xl p-8 overflow-hidden`}>
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center space-x-3 mb-3">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-ember to-ember-light flex items-center justify-center relative">
            <Globe className="w-7 h-7 text-white" />
            <div className="absolute inset-0 bg-ember rounded-xl animate-ping opacity-30"></div>
          </div>
          <div>
            <h2 className={`text-3xl font-black ${darkMode ? 'text-white' : 'text-gray-900'}`}>
              Global Pricing Exchange
            </h2>
            <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              Real-time rates across 50+ countries • Hover to view pricing
            </p>
          </div>
        </div>

        {/* Live Stats Bar */}
        <div className="flex items-center space-x-6 mt-4">
          <div className={`flex items-center space-x-2 ${darkMode ? 'text-green-400' : 'text-green-600'}`}>
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            <span className="text-sm font-bold">LIVE RATES</span>
          </div>
          <div className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
            <span className="font-semibold">Lowest:</span> $1.49/mo (India, Vietnam)
          </div>
          <div className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
            <span className="font-semibold">Avg Global:</span> $3.12/mo
          </div>
        </div>
      </div>

      {/* Map Container */}
      <div className={`relative rounded-xl overflow-hidden border-2 ${
        darkMode ? 'bg-gray-800 border-gray-700' : 'bg-gray-900 border-gray-800'
      }`}>
        <ComposableMap
          projection="geoMercator"
          projectionConfig={{
            scale: 147
          }}
          width={800}
          height={400}
          style={{ width: '100%', height: 'auto' }}
        >
          <ZoomableGroup>
            <Geographies geography={geoUrl}>
              {({ geographies }) =>
                geographies.map((geo) => {
                  const countryName = geo.properties.name;
                  const hasData = countryPricing[countryName];
                  
                  return (
                    <Geography
                      key={geo.rsmKey}
                      geography={geo}
                      onMouseEnter={(event) => handleCountryHover(geo, event)}
                      onMouseLeave={() => setHoveredCountry(null)}
                      onClick={() => handleCountryClick(countryName)}
                      style={{
                        default: {
                          fill: getCountryColor(countryName),
                          stroke: darkMode ? '#1F2937' : '#F3F4F6',
                          strokeWidth: 0.5,
                          outline: 'none',
                          cursor: hasData ? 'pointer' : 'default',
                          transition: 'all 0.3s'
                        },
                        hover: {
                          fill: hasData ? (darkMode ? '#3B82F6' : '#60A5FA') : getCountryColor(countryName),
                          stroke: darkMode ? '#1F2937' : '#F3F4F6',
                          strokeWidth: 1,
                          outline: 'none'
                        },
                        pressed: {
                          fill: hasData ? (darkMode ? '#2563EB' : '#3B82F6') : getCountryColor(countryName),
                          stroke: darkMode ? '#1F2937' : '#F3F4F6',
                          strokeWidth: 1,
                          outline: 'none'
                        }
                      }}
                    />
                  );
                })
              }
            </Geographies>
          </ZoomableGroup>
        </ComposableMap>

        {/* Tooltip */}
        {hoveredCountry && countryPricing[hoveredCountry] && (
          <div
            className={`fixed z-50 ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} border-2 rounded-xl p-4 shadow-2xl pointer-events-none`}
            style={{
              left: `${tooltipPosition.x + 20}px`,
              top: `${tooltipPosition.y - 80}px`
            }}
          >
            <div className="flex items-center space-x-2 mb-2">
              <DollarSign className="w-5 h-5 text-green-500" />
              <span className={`font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                {hoveredCountry}
              </span>
            </div>
            
            <div className="flex items-center space-x-3 mb-2">
              <div>
                <div className="text-2xl font-black bg-gradient-to-r from-orange-500 to-ember-light bg-clip-text text-transparent">
                  ${countryPricing[hoveredCountry].price}
                </div>
                <div className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                  per month
                </div>
              </div>
              <div className="flex items-center space-x-1">
                {getTrendIcon(countryPricing[hoveredCountry].trend)}
                <span className={`text-sm font-bold ${
                  countryPricing[hoveredCountry].trend === 'down' ? 'text-green-500' :
                  countryPricing[hoveredCountry].trend === 'up' ? 'text-red-500' :
                  'text-gray-500'
                }`}>
                  {countryPricing[hoveredCountry].change}
                </span>
              </div>
            </div>

            <button
              className="w-full py-2 bg-gradient-to-r from-orange-500 to-ember-light text-white text-sm font-bold rounded-lg hover:shadow-lg transition-all"
              onClick={() => handleCountryClick(hoveredCountry)}
            >
              Browse Numbers →
            </button>
          </div>
        )}
      </div>

      {/* Legend */}
      <div className="mt-6 flex items-center justify-center space-x-6">
        <div className="flex items-center space-x-2">
          <div className="w-4 h-4 rounded bg-green-500"></div>
          <span className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
            Low Rate (&lt;$2.50)
          </span>
        </div>
        <div className="flex items-center space-x-2">
          <div className="w-4 h-4 rounded bg-yellow-500"></div>
          <span className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
            Medium ($2.50-$3.50)
          </span>
        </div>
        <div className="flex items-center space-x-2">
          <div className="w-4 h-4 rounded bg-red-500"></div>
          <span className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
            High Rate (&gt;$3.50)
          </span>
        </div>
      </div>

      {/* CTA */}
      <div className={`mt-6 p-4 rounded-xl ${darkMode ? 'bg-blue-900/20 border border-ember/20' : 'bg-blue-50 border border-blue-200'}`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Zap className={`w-5 h-5 ${darkMode ? 'text-blue-400' : 'text-ember'}`} />
            <span className={`text-sm font-semibold ${darkMode ? 'text-blue-300' : 'text-blue-700'}`}>
              Rates update every 24 hours • Click any country to browse available numbers
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InteractivePricingMap;
