import React, { useState, useEffect } from 'react';
import { Upload, Plus, Edit2, Trash2, Phone, Mail, MessageSquare, Search, Download, X, User, ArrowLeft } from 'lucide-react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useToast } from '../hooks/use-toast';
import { useNavigate } from 'react-router-dom';
import BottomNav from '../components/BottomNav';
import safeLocalStorage from '../utils/safeLocalStorage';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const ContactsPage = () => {
  const [contacts, setContacts] = useState([]);
  const [filteredContacts, setFilteredContacts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Modal states
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingContact, setEditingContact] = useState(null);
  
  // Form state
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    notes: ''
  });
  
  // Upload state
  const [uploading, setUploading] = useState(false);
  
  const { user } = useAuth();
  const { darkMode } = useTheme();
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    fetchContacts();
  }, []);

  useEffect(() => {
    // Filter contacts based on search query
    if (searchQuery.trim() === '') {
      setFilteredContacts(contacts);
    } else {
      const query = searchQuery.toLowerCase();
      const filtered = contacts.filter(contact =>
        contact.name.toLowerCase().includes(query) ||
        contact.phone.includes(query) ||
        (contact.email && contact.email.toLowerCase().includes(query))
      );
      setFilteredContacts(filtered);
    }
  }, [searchQuery, contacts]);

  const fetchContacts = async () => {
    setLoading(true);
    try {
      const token = safeLocalStorage.getItem('token');
      const response = await axios.get(`${API}/contacts/`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setContacts(response.data.contacts);
      setFilteredContacts(response.data.contacts);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Could not load contacts',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAddContact = async () => {
    if (!formData.name || !formData.phone) {
      toast({
        title: 'Missing Information',
        description: 'Name and phone are required',
        variant: 'destructive',
      });
      return;
    }

    try {
      const token = safeLocalStorage.getItem('token');
      await axios.post(`${API}/contacts/`, formData, {
        headers: { Authorization: `Bearer ${token}` }
      });

      toast({
        title: 'Success',
        description: 'Contact added successfully',
      });

      setShowAddModal(false);
      setFormData({ name: '', phone: '', email: '', notes: '' });
      fetchContacts();
    } catch (error) {
      toast({
        title: 'Error',
        description: error.response?.data?.detail || 'Could not add contact',
        variant: 'destructive',
      });
    }
  };

  const handleEditContact = async () => {
    if (!editingContact) return;

    try {
      const token = safeLocalStorage.getItem('token');
      await axios.put(`${API}/contacts/${editingContact.id}`, formData, {
        headers: { Authorization: `Bearer ${token}` }
      });

      toast({
        title: 'Success',
        description: 'Contact updated successfully',
      });

      setShowEditModal(false);
      setEditingContact(null);
      setFormData({ name: '', phone: '', email: '', notes: '' });
      fetchContacts();
    } catch (error) {
      toast({
        title: 'Error',
        description: error.response?.data?.detail || 'Could not update contact',
        variant: 'destructive',
      });
    }
  };

  const handleDeleteContact = async (contactId, contactName) => {
    if (!window.confirm(`Delete ${contactName}?`)) return;

    try {
      const token = safeLocalStorage.getItem('token');
      await axios.delete(`${API}/contacts/${contactId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      toast({
        title: 'Success',
        description: 'Contact deleted successfully',
      });

      fetchContacts();
    } catch (error) {
      toast({
        title: 'Error',
        description: error.response?.data?.detail || 'Could not delete contact',
        variant: 'destructive',
      });
    }
  };

  const handleFileUpload = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);

    setUploading(true);
    try {
      const token = safeLocalStorage.getItem('token');
      const response = await axios.post(`${API}/contacts/upload`, formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data'
        }
      });

      toast({
        title: 'Upload Complete',
        description: response.data.message,
      });

      if (response.data.errors && response.data.errors.length > 0) {
        console.log('Upload errors:', response.data.errors);
      }

      fetchContacts();
    } catch (error) {
      toast({
        title: 'Upload Failed',
        description: error.response?.data?.detail || 'Could not upload contacts',
        variant: 'destructive',
      });
    } finally {
      setUploading(false);
      event.target.value = '';
    }
  };

  const handleExport = async () => {
    try {
      const token = safeLocalStorage.getItem('token');
      const response = await axios.get(`${API}/contacts/export`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (!response.data.csv) {
        toast({
          title: 'No Contacts',
          description: 'No contacts to export',
        });
        return;
      }

      // Download CSV
      const blob = new Blob([response.data.csv], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `contacts_${new Date().toISOString().split('T')[0]}.csv`;
      a.click();
      window.URL.revokeObjectURL(url);

      toast({
        title: 'Export Complete',
        description: `Exported ${response.data.total_contacts} contacts`,
      });
    } catch (error) {
      toast({
        title: 'Export Failed',
        description: 'Could not export contacts',
        variant: 'destructive',
      });
    }
  };

  const openEditModal = (contact) => {
    setEditingContact(contact);
    setFormData({
      name: contact.name,
      phone: contact.phone,
      email: contact.email || '',
      notes: contact.notes || ''
    });
    setShowEditModal(true);
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
                <User className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Contacts</h1>
                <p className="text-sm text-gray-600">{contacts.length} contacts</p>
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

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Action Bar */}
        <div className="bg-white rounded-xl shadow-sm p-4 mb-6">
          <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
            {/* Search */}
            <div className="relative flex-1 w-full sm:max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search contacts..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Actions */}
            <div className="flex gap-2 w-full sm:w-auto">
              <button
                onClick={() => {
                  setFormData({ name: '', phone: '', email: '', notes: '' });
                  setShowAddModal(true);
                }}
                className="flex-1 sm:flex-none px-4 py-2 bg-gradient-to-r from-ember to-ember-light text-white rounded-lg hover:from-ember hover:to-ember-dark transition-all flex items-center justify-center space-x-2"
              >
                <Plus className="w-4 h-4" />
                <span>Add</span>
              </button>

              <label className="flex-1 sm:flex-none px-4 py-2 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-lg hover:from-orange-600 hover:to-orange-700 transition-all flex items-center justify-center space-x-2 cursor-pointer">
                <Upload className="w-4 h-4" />
                <span>{uploading ? 'Uploading...' : 'Upload'}</span>
                <input
                  type="file"
                  accept=".csv,.vcf"
                  onChange={handleFileUpload}
                  disabled={uploading}
                  className="hidden"
                />
              </label>

              <button
                onClick={handleExport}
                className="flex-1 sm:flex-none px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-all flex items-center justify-center space-x-2"
              >
                <Download className="w-4 h-4" />
                <span>Export</span>
              </button>
            </div>
          </div>
        </div>

        {/* Contacts Grid */}
        {loading ? (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-ember"></div>
          </div>
        ) : filteredContacts.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm p-12 text-center">
            <User className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              {searchQuery ? 'No contacts found' : 'No contacts yet'}
            </h3>
            <p className="text-gray-600 mb-6">
              {searchQuery ? 'Try a different search term' : 'Add your first contact or upload a CSV/vCard file'}
            </p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredContacts.map((contact) => (
              <div key={contact.id} className="bg-white rounded-xl shadow-sm p-6 hover:shadow-md transition-all">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 bg-gradient-to-br from-ember to-ember-light rounded-full flex items-center justify-center">
                      <span className="text-white font-bold text-lg">
                        {contact.name.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div>
                      <h3 className="font-bold text-gray-900">{contact.name}</h3>
                      <p className="text-sm text-gray-600">{contact.phone}</p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => openEditModal(contact)}
                      className="p-2 text-ember hover:bg-blue-50 rounded-lg transition-colors"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteContact(contact.id, contact.name)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {contact.email && (
                  <div className="flex items-center space-x-2 text-sm text-gray-600 mb-2">
                    <Mail className="w-4 h-4" />
                    <span>{contact.email}</span>
                  </div>
                )}

                {contact.notes && (
                  <p className="text-sm text-gray-600 mb-3 line-clamp-2">{contact.notes}</p>
                )}

                <div className="flex gap-2 mt-4">
                  <button
                    onClick={() => navigate(`/sms?to=${contact.phone}`)}
                    className="flex-1 px-3 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors flex items-center justify-center space-x-1"
                  >
                    <MessageSquare className="w-4 h-4" />
                    <span>SMS</span>
                  </button>
                  <button
                    className="flex-1 px-3 py-2 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition-colors flex items-center justify-center space-x-1"
                  >
                    <Phone className="w-4 h-4" />
                    <span>Call</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add Contact Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-gray-900">Add Contact</h2>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Name *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="John Doe"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Phone *</label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="+1234567890"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="john@example.com"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Notes</label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  rows="3"
                  placeholder="Additional notes..."
                />
              </div>

              <button
                onClick={handleAddContact}
                className="w-full py-3 bg-gradient-to-r from-ember to-ember-light text-white font-semibold rounded-lg hover:from-ember hover:to-ember-dark transition-all"
              >
                Add Contact
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Contact Modal */}
      {showEditModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-gray-900">Edit Contact</h2>
              <button
                onClick={() => setShowEditModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Name</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Phone</label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Notes</label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  rows="3"
                />
              </div>

              <button
                onClick={handleEditContact}
                className="w-full py-3 bg-gradient-to-r from-ember to-ember-light text-white font-semibold rounded-lg hover:from-ember hover:to-ember-dark transition-all"
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}

      <BottomNav />
    </div>
  );
};

export default ContactsPage;
