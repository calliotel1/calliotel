import React, { useState, useEffect } from 'react';
import { 
  Calendar, Clock, Send, Plus, Edit2, Trash2, Play, Pause, 
  MessageSquare, FileText, Zap, ChevronRight, BarChart3
} from 'lucide-react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useToast } from '../hooks/use-toast';
import BottomNav from '../components/BottomNav';
import safeLocalStorage from '../utils/safeLocalStorage';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const SMSAutomationPage = () => {
  const [automations, setAutomations] = useState([]);
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showTemplateModal, setShowTemplateModal] = useState(false);
  const [activeTab, setActiveTab] = useState('automations'); // 'automations' or 'templates'
  
  const { user } = useAuth();
  const { darkMode } = useTheme();
  const { toast } = useToast();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const token = safeLocalStorage.getItem('token');
      const headers = { Authorization: `Bearer ${token}` };

      const [automationsRes, templatesRes] = await Promise.all([
        axios.get(`${API}/sms-automation/automations`, { headers }),
        axios.get(`${API}/sms-automation/templates`, { headers })
      ]);

      setAutomations(automationsRes.data.automations || []);
      setTemplates(templatesRes.data.templates || []);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast({
        title: 'Error',
        description: 'Failed to load automations',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const toggleAutomation = async (automationId) => {
    try {
      const token = safeLocalStorage.getItem('token');
      const response = await axios.post(
        `${API}/sms-automation/automations/${automationId}/toggle`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setAutomations(automations.map(a => 
        a.id === automationId ? { ...a, active: response.data.active } : a
      ));

      toast({
        title: 'Success',
        description: `Automation ${response.data.active ? 'activated' : 'deactivated'}`,
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to toggle automation',
        variant: 'destructive'
      });
    }
  };

  const deleteAutomation = async (automationId) => {
    if (!window.confirm('Are you sure you want to delete this automation?')) return;

    try {
      const token = safeLocalStorage.getItem('token');
      await axios.delete(
        `${API}/sms-automation/automations/${automationId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setAutomations(automations.filter(a => a.id !== automationId));

      toast({
        title: 'Success',
        description: 'Automation deleted',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to delete automation',
        variant: 'destructive'
      });
    }
  };

  const deleteTemplate = async (templateId) => {
    if (!window.confirm('Are you sure you want to delete this template?')) return;

    try {
      const token = safeLocalStorage.getItem('token');
      await axios.delete(
        `${API}/sms-automation/templates/${templateId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setTemplates(templates.filter(t => t.id !== templateId));

      toast({
        title: 'Success',
        description: 'Template deleted',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to delete template',
        variant: 'destructive'
      });
    }
  };

  const getScheduleText = (automation) => {
    const { schedule_type, schedule_time, days_of_week, day_of_month, schedule_date } = automation;
    
    if (schedule_type === 'once') {
      return `Once on ${schedule_date} at ${schedule_time}`;
    } else if (schedule_type === 'daily') {
      return `Daily at ${schedule_time}`;
    } else if (schedule_type === 'weekly') {
      const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
      const dayNames = days_of_week?.map(d => days[d]).join(', ');
      return `Weekly on ${dayNames} at ${schedule_time}`;
    } else if (schedule_type === 'monthly') {
      return `Monthly on day ${day_of_month} at ${schedule_time}`;
    } else if (schedule_type === 'trigger') {
      return `Trigger-based: ${automation.trigger_type}`;
    }
    return 'Not scheduled';
  };

  if (loading) {
    return (
      <div className={`min-h-screen ${darkMode ? 'bg-gray-900' : 'bg-gray-50'} flex items-center justify-center pb-24`}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-ember mx-auto mb-4"></div>
          <p className={darkMode ? 'text-gray-300' : 'text-gray-600'}>Loading SMS Automation...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen pb-24 ${darkMode ? 'bg-gray-900' : 'bg-gradient-to-br from-ember/5 to-ember-light/5'}`}>
      {/* Header */}
      <header className={`${darkMode ? 'bg-gray-800 border-b border-gray-700' : 'bg-white'} shadow-sm sticky top-0 z-10`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-gradient-to-br from-ember to-ember-light rounded-xl flex items-center justify-center shadow-lg">
                <Zap className="w-7 h-7 text-white" />
              </div>
              <div>
                <h1 className={`text-2xl sm:text-3xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                  SMS Automation
                </h1>
                <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                  Schedule and automate your messages
                </p>
              </div>
            </div>
            <button
              onClick={() => activeTab === 'automations' ? setShowCreateModal(true) : setShowTemplateModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-ember text-white rounded-lg hover:bg-ember-light transition-colors shadow-sm"
            >
              <Plus size={18} />
              <span className="hidden sm:inline">
                {activeTab === 'automations' ? 'New Automation' : 'New Template'}
              </span>
            </button>
          </div>

          {/* Tabs */}
          <div className="flex gap-2 mt-4">
            <button
              onClick={() => setActiveTab('automations')}
              className={`px-4 py-2 rounded-lg font-medium transition-all ${
                activeTab === 'automations'
                  ? 'bg-ember text-white shadow-md'
                  : darkMode ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' : 'bg-white text-gray-700 hover:bg-gray-100'
              }`}
            >
              <span className="flex items-center gap-2">
                <Calendar size={18} />
                Automations ({automations.length})
              </span>
            </button>
            <button
              onClick={() => setActiveTab('templates')}
              className={`px-4 py-2 rounded-lg font-medium transition-all ${
                activeTab === 'templates'
                  ? 'bg-ember text-white shadow-md'
                  : darkMode ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' : 'bg-white text-gray-700 hover:bg-gray-100'
              }`}
            >
              <span className="flex items-center gap-2">
                <FileText size={18} />
                Templates ({templates.length})
              </span>
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'automations' ? (
          <div>
            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
              <div className={`${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white'} rounded-xl p-6 shadow-sm border`}>
                <div className="flex items-center justify-between">
                  <div>
                    <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Active Automations</p>
                    <p className={`text-3xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                      {automations.filter(a => a.active).length}
                    </p>
                  </div>
                  <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-green-600 rounded-xl flex items-center justify-center">
                    <Play className="w-6 h-6 text-white" />
                  </div>
                </div>
              </div>

              <div className={`${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white'} rounded-xl p-6 shadow-sm border`}>
                <div className="flex items-center justify-between">
                  <div>
                    <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Total Automations</p>
                    <p className={`text-3xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                      {automations.length}
                    </p>
                  </div>
                  <div className="w-12 h-12 bg-gradient-to-br from-ember to-ember-light rounded-xl flex items-center justify-center">
                    <Calendar className="w-6 h-6 text-white" />
                  </div>
                </div>
              </div>

              <div className={`${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white'} rounded-xl p-6 shadow-sm border`}>
                <div className="flex items-center justify-between">
                  <div>
                    <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Templates</p>
                    <p className={`text-3xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                      {templates.length}
                    </p>
                  </div>
                  <div className="w-12 h-12 bg-gradient-to-br from-ember to-ember-light rounded-xl flex items-center justify-center">
                    <FileText className="w-6 h-6 text-white" />
                  </div>
                </div>
              </div>
            </div>

            {/* Automations List */}
            {automations.length === 0 ? (
              <div className={`${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white'} rounded-xl p-12 text-center shadow-sm border`}>
                <Zap className={`w-16 h-16 mx-auto mb-4 ${darkMode ? 'text-gray-600' : 'text-gray-300'}`} />
                <h3 className={`text-xl font-bold mb-2 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                  No automations yet
                </h3>
                <p className={`mb-6 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                  Create your first SMS automation to get started
                </p>
                <button
                  onClick={() => setShowCreateModal(true)}
                  className="px-6 py-3 bg-ember text-white rounded-lg hover:bg-ember-light transition-colors"
                >
                  Create Automation
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {automations.map((automation) => (
                  <div
                    key={automation.id}
                    className={`${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white'} rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow border`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className={`text-lg font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                            {automation.name}
                          </h3>
                          <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                            automation.active
                              ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300'
                              : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
                          }`}>
                            {automation.active ? 'Active' : 'Paused'}
                          </span>
                        </div>

                        {automation.description && (
                          <p className={`text-sm mb-3 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                            {automation.description}
                          </p>
                        )}

                        <div className="flex flex-wrap gap-4 text-sm">
                          <div className="flex items-center gap-2">
                            <Clock className={`w-4 h-4 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`} />
                            <span className={darkMode ? 'text-gray-300' : 'text-gray-700'}>
                              {getScheduleText(automation)}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <MessageSquare className={`w-4 h-4 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`} />
                            <span className={darkMode ? 'text-gray-300' : 'text-gray-700'}>
                              {automation.recipients.length} recipient(s)
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Send className={`w-4 h-4 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`} />
                            <span className={darkMode ? 'text-gray-300' : 'text-gray-700'}>
                              From: {automation.from_number}
                            </span>
                          </div>
                        </div>

                        {automation.next_run && (
                          <div className="mt-3 text-sm">
                            <span className={`font-medium ${darkMode ? 'text-ember' : 'text-ember'}`}>
                              Next run: {new Date(automation.next_run).toLocaleString()}
                            </span>
                          </div>
                        )}
                      </div>

                      <div className="flex items-center gap-2 ml-4">
                        <button
                          onClick={() => toggleAutomation(automation.id)}
                          className={`p-2 rounded-lg transition-colors ${
                            darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'
                          }`}
                          title={automation.active ? 'Pause' : 'Activate'}
                        >
                          {automation.active ? (
                            <Pause className="w-5 h-5 text-orange-500" />
                          ) : (
                            <Play className="w-5 h-5 text-green-500" />
                          )}
                        </button>
                        <button
                          className={`p-2 rounded-lg transition-colors ${
                            darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'
                          }`}
                          title="View logs"
                        >
                          <BarChart3 className={`w-5 h-5 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`} />
                        </button>
                        <button
                          onClick={() => deleteAutomation(automation.id)}
                          className={`p-2 rounded-lg transition-colors ${
                            darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'
                          }`}
                          title="Delete"
                        >
                          <Trash2 className="w-5 h-5 text-red-500" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
          <div>
            {/* Templates List */}
            {templates.length === 0 ? (
              <div className={`${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white'} rounded-xl p-12 text-center shadow-sm border`}>
                <FileText className={`w-16 h-16 mx-auto mb-4 ${darkMode ? 'text-gray-600' : 'text-gray-300'}`} />
                <h3 className={`text-xl font-bold mb-2 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                  No templates yet
                </h3>
                <p className={`mb-6 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                  Create message templates to reuse in automations
                </p>
                <button
                  onClick={() => setShowTemplateModal(true)}
                  className="px-6 py-3 bg-ember text-white rounded-lg hover:bg-ember-light transition-colors"
                >
                  Create Template
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {templates.map((template) => (
                  <div
                    key={template.id}
                    className={`${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white'} rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow border`}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h3 className={`text-lg font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                          {template.name}
                        </h3>
                        <span className={`text-xs px-2 py-1 rounded-full mt-1 inline-block ${
                          darkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-600'
                        }`}>
                          {template.category}
                        </span>
                      </div>
                      <button
                        onClick={() => deleteTemplate(template.id)}
                        className={`p-2 rounded-lg transition-colors ${
                          darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'
                        }`}
                      >
                        <Trash2 className="w-4 h-4 text-red-500" />
                      </button>
                    </div>

                    <p className={`text-sm mb-3 line-clamp-3 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                      {template.content}
                    </p>

                    {template.variables && template.variables.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {template.variables.map((variable, idx) => (
                          <span
                            key={idx}
                            className="text-xs px-2 py-1 bg-ember/10 dark:bg-olive text-ember-dark dark:text-ember rounded"
                          >
                            {`{${variable}}`}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Modals would go here - CreateAutomationModal and TemplateModal components */}
      
      <BottomNav />
    </div>
  );
};

export default SMSAutomationPage;
