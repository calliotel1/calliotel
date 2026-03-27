import React, { useState, useEffect } from 'react';
import { Globe, Check, Clock, Star, Search } from 'lucide-react';
import { Card, CardContent } from './ui/card';

const API_URL = process.env.REACT_APP_BACKEND_URL;

const CoverageMap = () => {
  const [countries, setCountries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [stats, setStats] = useState({ total_countries: 0, available: 0, coming_soon: 0 });

  useEffect(() => {
    fetchCoverage();
  }, []);

  const fetchCoverage = async () => {
    try {
      const response = await fetch(`${API_URL}/api/coverage`);
      const data = await response.json();
      if (data.success) {
        setCountries(data.countries);
        setStats({
          total_countries: data.total_countries,
          available: data.available,
          coming_soon: data.coming_soon
        });
      }
    } catch (error) {
      console.error('Error fetching coverage:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredCountries = countries.filter(country =>
    country.country.toLowerCase().includes(searchTerm.toLowerCase()) ||
    country.code.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-ember mx-auto"></div>
        <p className="text-gray-400 mt-4">Loading coverage map...</p>
      </div>
    );
  }

  return (
    <div>
      {/* Stats Bar */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <Card className="bg-gradient-to-br from-blue-900/30 to-blue-800/20 border-ember/30/50">
          <CardContent className="p-6 text-center">
            <Globe className="w-8 h-8 mx-auto mb-2 text-blue-400" />
            <p className="text-3xl font-bold text-white">{stats.total_countries}</p>
            <p className="text-sm text-gray-400">Total Countries</p>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-green-900/30 to-green-800/20 border-green-700/50">
          <CardContent className="p-6 text-center">
            <Check className="w-8 h-8 mx-auto mb-2 text-green-400" />
            <p className="text-3xl font-bold text-white">{stats.available}</p>
            <p className="text-sm text-gray-400">Available Now</p>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-yellow-900/30 to-yellow-800/20 border-yellow-700/50">
          <CardContent className="p-6 text-center">
            <Clock className="w-8 h-8 mx-auto mb-2 text-yellow-400" />
            <p className="text-3xl font-bold text-white">{stats.coming_soon}</p>
            <p className="text-sm text-gray-400">Coming Soon</p>
          </CardContent>
        </Card>
      </div>

      {/* Search Bar */}
      <div className="mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Search countries..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
          />
        </div>
      </div>

      {/* Country Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {filteredCountries.map((country) => (
          <Card
            key={country.code}
            className={`group hover:scale-105 transition-all duration-300 cursor-pointer ${
              country.availability === 'available'
                ? 'bg-gradient-to-br from-gray-800/90 to-gray-900/90 border-gray-700 hover:border-ember'
                : 'bg-gradient-to-br from-gray-800/50 to-gray-900/50 border-gray-800 opacity-75'
            }`}
          >
            <CardContent className="p-5">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center space-x-2">
                  <span className="text-3xl">{country.flag}</span>
                  {country.popular && (
                    <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                  )}
                </div>
                {country.availability === 'available' ? (
                  <span className="px-2 py-1 bg-green-900/50 text-green-300 text-xs font-bold rounded-full">
                    Available
                  </span>
                ) : (
                  <span className="px-2 py-1 bg-yellow-900/50 text-yellow-300 text-xs font-bold rounded-full">
                    Soon
                  </span>
                )}
              </div>

              <h3 className="text-white font-bold mb-1">{country.country}</h3>
              <p className="text-gray-400 text-sm mb-3">{country.area_codes.join(', ')}</p>

              {country.availability === 'available' && (
                <>
                  <div className="mb-3">
                    <p className="text-ember text-xl font-bold">
                      ${country.price_from}/mo
                    </p>
                    <p className="text-gray-500 text-xs">Starting price</p>
                  </div>

                  <div className="flex flex-wrap gap-1">
                    {country.features.map((feature) => (
                      <span
                        key={feature}
                        className="px-2 py-1 bg-olive/30 text-ember text-xs rounded"
                      >
                        {feature}
                      </span>
                    ))}
                  </div>
                </>
              )}

              {country.availability === 'coming_soon' && (
                <div className="mt-3">
                  <p className="text-gray-400 text-sm">
                    We're working on bringing virtual numbers to {country.country}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredCountries.length === 0 && (
        <div className="text-center py-12">
          <Globe className="w-16 h-16 mx-auto mb-4 text-gray-600" />
          <p className="text-gray-400">No countries found matching "{searchTerm}"</p>
        </div>
      )}
    </div>
  );
};

export default CoverageMap;
