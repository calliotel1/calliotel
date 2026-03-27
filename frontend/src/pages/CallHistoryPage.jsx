import React, { useState, useEffect } from 'react';
import { Phone, Loader, PhoneIncoming, PhoneOutgoing, Clock, ArrowLeft } from 'lucide-react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useToast } from '../hooks/use-toast';
import { useNavigate } from 'react-router-dom';
import BottomNav from '../components/BottomNav';
import safeLocalStorage from '../utils/safeLocalStorage';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const CallHistoryPage = () => {
  const [calls, setCalls] = useState([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const { darkMode } = useTheme();
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    fetchCallHistory();
  }, []);

  const fetchCallHistory = async () => {
    setLoading(true);
    try {
      const token = safeLocalStorage.getItem('token');
      const response = await axios.get(`${API}/calls/history`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setCalls(response.data.calls);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Could not load call history',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const formatDuration = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-3">
              {/* Back Button */}
              <button
                onClick={() => navigate(-1)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                title="Go back"
              >
                <ArrowLeft className="w-6 h-6 text-gray-700" />
              </button>
              <div className="w-10 h-10 bg-gradient-to-br from-ember to-ember-light rounded-xl flex items-center justify-center">
                <Phone className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Call History</h1>
                <p className="text-sm text-gray-600">View your recent calls</p>
              </div>
            </div>
            <button
              onClick={() => navigate('/dashboard')}
              className="px-4 py-2 text-gray-700 hover:text-orange-600 transition-colors"
            >
              Dashboard
            </button>
          </div>
        </div>
      </header>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {loading ? (
          <div className="text-center py-12">
            <Loader className="w-12 h-12 animate-spin text-ember mx-auto" />
            <p className="text-gray-600 mt-4">Loading call history...</p>
          </div>
        ) : calls.length === 0 ? (
          <div className="bg-white rounded-xl p-12 text-center">
            <Phone className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-gray-900 mb-2">No Calls Yet</h3>
            <p className="text-gray-600">Your call history will appear here once you start making calls</p>
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">From</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">To</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Duration</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Cost</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {calls.map((call) => (
                    <tr key={call.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        {call.direction === 'outbound' ? (
                          <PhoneOutgoing className="w-5 h-5 text-ember" />
                        ) : (
                          <PhoneIncoming className="w-5 h-5 text-green-600" />
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{call.from_number}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{call.to_number}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        <div className="flex items-center space-x-1">
                          <Clock className="w-4 h-4 text-gray-400" />
                          <span>{formatDuration(call.duration)}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                          call.status === 'completed' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'
                        }`}>
                          {call.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        {new Date(call.created_at).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        ${call.cost || '0.00'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      <BottomNav />
    </div>
  );
};

export default CallHistoryPage;