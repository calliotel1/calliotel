import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { UserCircle, Upload, Download, Loader2, Crown } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { useAuth } from '../context/AuthContext';
import { toast } from 'sonner';

const API_URL = process.env.REACT_APP_BACKEND_URL;

const AvatarCreatorPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [myAvatars, setMyAvatars] = useState([]);

  // Form state
  const [avatarName, setAvatarName] = useState('');
  const [avatarStyle, setAvatarStyle] = useState('realistic');
  const [selfieFile, setSelfieFile] = useState(null);
  const [selfiePreview, setSelfiePreview] = useState(null);

  useEffect(() => {
    fetchMyAvatars();
  }, []);

  const fetchMyAvatars = async () => {
    try {
      const response = await fetch(`${API_URL}/api/avatar-creator/my-avatars`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      const data = await response.json();
      if (data.success) {
        setMyAvatars(data.avatars);
      }
    } catch (error) {
      console.error('Error fetching avatars:', error);
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelfieFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setSelfiePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const createAvatar = async () => {
    if (!avatarName.trim() || !selfieFile) {
      toast.error('Please provide avatar name and upload a selfie');
      return;
    }

    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('selfie', selfieFile);

      const requestData = {
        name: avatarName,
        style: avatarStyle
      };

      const response = await fetch(`${API_URL}/api/avatar-creator/create?${new URLSearchParams(requestData)}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: formData
      });

      const data = await response.json();

      if (response.status === 402) {
        toast.error('Insufficient balance! Need $9.99 to create 3D avatar.');
        setTimeout(() => navigate('/wallet'), 2000);
        return;
      }

      if (data.success) {
        toast.success('✅ Generating your 3D avatar! This takes 2-3 minutes.');
        fetchMyAvatars();
        // Reset form
        setAvatarName('');
        setSelfieFile(null);
        setSelfiePreview(null);
      } else {
        toast.error(data.detail || 'Failed to create avatar');
      }
    } catch (error) {
      console.error('Error creating avatar:', error);
      toast.error('Failed to create avatar');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-cyan-50 via-blue-50 to-indigo-50">
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            <UserCircle className="w-12 h-12 text-ember mr-3" />
            <h1 className="text-4xl sm:text-5xl font-bold text-gray-900">
              🦸 3D Avatar Creator
            </h1>
          </div>
          <p className="text-lg text-gray-600">
            Upload selfie → Get amazing 3D avatar! Use in videos & metaverse! 🌎
          </p>
        </div>

        {/* Price Banner */}
        <Card className="mb-6 bg-gradient-to-r from-ember to-ember-light text-white">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm opacity-90">One-Time Creation Fee</p>
                <p className="text-4xl font-bold">$9.99</p>
              </div>
              <div className="text-right">
                <p className="text-sm opacity-90">Use avatar in:</p>
                <p className="font-semibold">• Videos • Messages • Metaverse</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Left: Create Avatar */}
          <div>
            <Card className="shadow-xl">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Upload className="mr-2 text-ember" />
                  Create Your 3D Avatar
                </CardTitle>
                <CardDescription>
                  Upload a clear selfie and we'll generate your 3D avatar!
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Avatar Name
                  </label>
                  <Input
                    value={avatarName}
                    onChange={(e) => setAvatarName(e.target.value)}
                    placeholder="e.g., My Gaming Avatar"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Avatar Style
                  </label>
                  <Select value={avatarStyle} onValueChange={setAvatarStyle}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="realistic">👤 Realistic</SelectItem>
                      <SelectItem value="cartoon">🎨 Cartoon</SelectItem>
                      <SelectItem value="anime">💁 Anime</SelectItem>
                      <SelectItem value="voxel">🧊 Voxel (Minecraft-like)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Upload Selfie
                  </label>
                  <Input
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                  />
                  {selfiePreview && (
                    <div className="mt-4">
                      <img
                        src={selfiePreview}
                        alt="Selfie preview"
                        className="w-full h-48 object-cover rounded-lg"
                      />
                    </div>
                  )}
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <p className="text-sm text-blue-800 font-semibold mb-2">
                    📸 Tips for best results:
                  </p>
                  <ul className="text-sm text-blue-800 space-y-1 list-disc list-inside">
                    <li>Use clear, well-lit photo</li>
                    <li>Face the camera directly</li>
                    <li>Neutral expression works best</li>
                    <li>Remove glasses if possible</li>
                  </ul>
                </div>

                <Button
                  onClick={createAvatar}
                  disabled={loading}
                  className="w-full bg-gradient-to-r from-cyan-600 to-ember-light hover:from-cyan-700 hover:to-ember-dark"
                  size="lg"
                >
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                      Creating Avatar...
                    </>
                  ) : (
                    <>
                      <UserCircle className="mr-2 h-5 w-5" />
                      Create 3D Avatar ($9.99)
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Right: My Avatars */}
          <div>
            <Card className="shadow-xl">
              <CardHeader>
                <CardTitle>🦸 My 3D Avatars</CardTitle>
                <CardDescription>
                  Your avatar collection
                </CardDescription>
              </CardHeader>
              <CardContent>
                {myAvatars.length === 0 ? (
                  <div className="text-center py-12 text-gray-500">
                    <UserCircle className="w-16 h-16 mx-auto mb-4 opacity-50" />
                    <p>No avatars yet. Create your first 3D avatar!</p>
                  </div>
                ) : (
                  <div className="space-y-3 max-h-[600px] overflow-y-auto">
                    {myAvatars.map((avatar) => (
                      <Card key={avatar.avatar_id} className="border-2">
                        <CardContent className="pt-4">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <p className="font-semibold text-gray-900">{avatar.name}</p>
                              <p className="text-sm text-gray-600 mt-1">
                                Style: {avatar.style}
                              </p>
                              <div className="mt-2">
                                {avatar.status === 'completed' && (
                                  <div className="flex space-x-2">
                                    <Button
                                      size="sm"
                                      onClick={() => window.open(`${API_URL}/api/avatar-creator/avatar/${avatar.avatar_id}`, '_blank')}
                                      className="bg-green-600 hover:bg-green-700"
                                    >
                                      <Download className="mr-1 h-4 w-4" />
                                      Download Model
                                    </Button>
                                  </div>
                                )}
                                {avatar.status === 'processing' && (
                                  <div className="flex items-center text-ember">
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    <span className="text-sm">{avatar.progress}</span>
                                  </div>
                                )}
                                {avatar.status === 'failed' && (
                                  <p className="text-red-600 text-sm">❌ Failed to generate</p>
                                )}
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Use Cases */}
        <div className="mt-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-4 text-center">
            🌟 Where to Use Your Avatar
          </h2>
          <div className="grid md:grid-cols-4 gap-4">
            <Card className="bg-gradient-to-br from-ember/5 to-ember-light/10 border-ember/20">
              <CardContent className="pt-6 text-center">
                <div className="text-4xl mb-2">🎬</div>
                <h3 className="font-bold text-gray-900 mb-1">Video Messages</h3>
                <p className="text-sm text-gray-600">Appear as your avatar</p>
              </CardContent>
            </Card>
            <Card className="bg-gradient-to-br from-ember/5 to-ember-light/10 border-ember/20">
              <CardContent className="pt-6 text-center">
                <div className="text-4xl mb-2">🎮</div>
                <h3 className="font-bold text-gray-900 mb-1">Gaming</h3>
                <p className="text-sm text-gray-600">Use in games & VR</p>
              </CardContent>
            </Card>
            <Card className="bg-gradient-to-br from-ember/5 to-ember-light/10 border-blue-200">
              <CardContent className="pt-6 text-center">
                <div className="text-4xl mb-2">🌎</div>
                <h3 className="font-bold text-gray-900 mb-1">Metaverse</h3>
                <p className="text-sm text-gray-600">Your digital identity</p>
              </CardContent>
            </Card>
            <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
              <CardContent className="pt-6 text-center">
                <div className="text-4xl mb-2">📱</div>
                <h3 className="font-bold text-gray-900 mb-1">Social Media</h3>
                <p className="text-sm text-gray-600">Profile pictures & posts</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AvatarCreatorPage;