import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Globe } from 'lucide-react';
import { Button } from '../components/ui/button';
import CoverageMap from '../components/CoverageMap';

const CoveragePage = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-olive-dark to-gray-900 text-white">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <Button
            onClick={() => navigate('/dashboard')}
            variant="ghost"
            className="mb-4 text-gray-300 hover:text-white"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Dashboard
          </Button>
          
          <div className="text-center">
            <h1 className="text-5xl font-bold mb-4 flex items-center justify-center">
              <Globe className="w-12 h-12 mr-4 text-blue-400" />
              Global Coverage
            </h1>
            <p className="text-xl text-gray-400 max-w-2xl mx-auto">
              Virtual phone numbers available in <span className="text-ember font-bold">20+ countries</span> worldwide.
              Choose from our expanding network of premium locations.
            </p>
          </div>
        </div>

        {/* Coverage Map Component */}
        <CoverageMap />
      </div>
    </div>
  );
};

export default CoveragePage;
