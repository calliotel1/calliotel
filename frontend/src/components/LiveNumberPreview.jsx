import React, { useState, useEffect, useRef } from 'react';
import { Phone, MapPin, CheckCircle, Sparkles } from 'lucide-react';

const API_URL = process.env.REACT_APP_BACKEND_URL;

const LiveNumberPreview = () => {
  const [numbers, setNumbers] = useState([]);
  const [displayNumbers, setDisplayNumbers] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const scrollRef = useRef(null);

  useEffect(() => {
    fetchNumbers();
    // Refresh numbers every 60 seconds
    const refreshInterval = setInterval(fetchNumbers, 60000);
    return () => clearInterval(refreshInterval);
  }, []);

  useEffect(() => {
    if (numbers.length > 0) {
      // Initialize with first 5 numbers
      setDisplayNumbers(numbers.slice(0, 5));
      
      // Scroll animation every 4 seconds
      const scrollInterval = setInterval(() => {
        setCurrentIndex((prevIndex) => {
          const nextIndex = (prevIndex + 1) % numbers.length;
          
          // Update display with next set
          const startIdx = nextIndex;
          const endIdx = (nextIndex + 5) % numbers.length;
          
          if (endIdx > startIdx) {
            setDisplayNumbers(numbers.slice(startIdx, endIdx));
          } else {
            setDisplayNumbers([...numbers.slice(startIdx), ...numbers.slice(0, endIdx)]);
          }
          
          return nextIndex;
        });
      }, 4000);
      
      return () => clearInterval(scrollInterval);
    }
  }, [numbers]);

  const fetchNumbers = async () => {
    try {
      const response = await fetch(`${API_URL}/api/numbers/live-preview?limit=15`);
      const data = await response.json();
      if (data.success) {
        setNumbers(data.numbers);
      }
    } catch (error) {
      console.error('Error fetching live numbers:', error);
    }
  };

  if (numbers.length === 0) return null;

  return (
    <div className="bg-gradient-to-r from-gray-900 via-olive-dark/30 to-gray-900 border border-ember/30 rounded-lg p-6 mb-8">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2">
          <Sparkles className="w-5 h-5 text-yellow-400 animate-pulse" />
          <h3 className="text-lg font-bold text-white">Live Number Marketplace</h3>
        </div>
        <div className="flex items-center space-x-2">
          <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
          <span className="text-sm text-gray-400">Live</span>
        </div>
      </div>

      <div className="relative overflow-hidden">
        <div
          ref={scrollRef}
          className="space-y-2 transition-all duration-1000 ease-in-out"
        >
          {displayNumbers.map((number, index) => (
            <div
              key={`${number.number}-${index}`}
              className="flex items-center justify-between p-3 bg-gray-800/50 rounded-lg border border-gray-700/50 hover:border-ember/50 transition-all group"
            >
              <div className="flex items-center space-x-3">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                  number.status === 'available' 
                    ? 'bg-green-900/30' 
                    : 'bg-yellow-900/30'
                }`}>
                  <Phone className={`w-5 h-5 ${
                    number.status === 'available' 
                      ? 'text-green-400' 
                      : 'text-yellow-400'
                  }`} />
                </div>
                <div>
                  <p className="text-white font-mono font-semibold">{number.number}</p>
                  <div className="flex items-center space-x-2 text-xs text-gray-400">
                    <MapPin className="w-3 h-3" />
                    <span>{number.location}</span>
                  </div>
                </div>
              </div>
              
              <div>
                {number.status === 'available' ? (
                  <span className="px-3 py-1 bg-green-900/30 text-green-300 text-xs font-bold rounded-full flex items-center space-x-1">
                    <CheckCircle className="w-3 h-3" />
                    <span>Available</span>
                  </span>
                ) : (
                  <span className="px-3 py-1 bg-yellow-900/30 text-yellow-300 text-xs font-bold rounded-full">
                    Just Claimed
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-4 text-center">
        <p className="text-sm text-gray-400">
          <span className="text-ember font-bold">{numbers.length}+</span> numbers available now
        </p>
      </div>
    </div>
  );
};

export default LiveNumberPreview;
