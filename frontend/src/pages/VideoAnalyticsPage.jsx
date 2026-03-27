import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { BarChart3, TrendingUp, Eye, Heart, Play, Award, Users, Clock } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Button } from '../components/ui/button';
import { useAuth } from '../context/AuthContext';
import { toast } from 'sonner';

const API_URL = process.env.REACT_APP_BACKEND_URL;

const VideoAnalyticsPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [myVideos, setMyVideos] = useState([]);
  const [selectedVideo, setSelectedVideo] = useState(null);
  const [analytics, setAnalytics] = useState(null);
  const [leaderboard, setLeaderboard] = useState([]);

  useEffect(() => {
    fetchMyVideos();
    fetchLeaderboard();
  }, []);

  const fetchMyVideos = async () => {
    try {
      const response = await fetch(`${API_URL}/api/video-messages/my-videos`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      const data = await response.json();
      if (data.videos) {
        setMyVideos(data.videos);
        if (data.videos.length > 0 && !selectedVideo) {
          setSelectedVideo(data.videos[0].message_id);
          fetchVideoAnalytics(data.videos[0].message_id);
        }
      }
    } catch (error) {
      console.error('Error fetching videos:', error);
      toast.error('Failed to load videos');
    } finally {
      setLoading(false);
    }
  };

  const fetchVideoAnalytics = async (videoId) => {
    try {
      const response = await fetch(`${API_URL}/api/video-reactions/analytics/${videoId}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      const data = await response.json();
      if (data.success) {
        setAnalytics(data.analytics);
      }
    } catch (error) {
      console.error('Error fetching analytics:', error);
    }
  };

  const fetchLeaderboard = async () => {
    try {
      const response = await fetch(`${API_URL}/api/video-reactions/leaderboard`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      const data = await response.json();
      if (data.success) {
        setLeaderboard(data.leaderboard);
      }
    } catch (error) {
      console.error('Error fetching leaderboard:', error);
    }
  };

  const handleVideoSelect = (videoId) => {
    setSelectedVideo(videoId);
    fetchVideoAnalytics(videoId);
  };

  const reactionEmojis = {
    like: '👍',
    love: '❤️',
    laugh: '😂',
    fire: '🔥',
    wow: '😮',
    sad: '😢',
    applause: '👏'
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-ember/5 via-pink-50 to-ember-light/5 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-ember mx-auto mb-4"></div>
          <p className="text-gray-600">Loading analytics...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-ember/5 via-pink-50 to-ember-light/5">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-4xl font-bold text-gray-900 flex items-center">
                <BarChart3 className="w-10 h-10 mr-3 text-ember" />
                Video Analytics
              </h1>
              <p className="text-lg text-gray-600 mt-2">
                Track your video performance & engagement
              </p>
            </div>
            <Button
              onClick={() => navigate('/chat')}
              className="bg-ember hover:bg-ember-light"
            >
              Back to Chat
            </Button>
          </div>
        </div>

        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="overview">
              <TrendingUp className="mr-2 h-4 w-4" />
              Overview
            </TabsTrigger>
            <TabsTrigger value="my-videos">
              <Play className="mr-2 h-4 w-4" />
              My Videos
            </TabsTrigger>
            <TabsTrigger value="leaderboard">
              <Award className="mr-2 h-4 w-4" />
              Leaderboard
            </TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview">
            {myVideos.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <Play className="w-16 h-16 mx-auto mb-4 text-gray-400" />
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">
                    No videos yet!
                  </h3>
                  <p className="text-gray-600 mb-4">
                    Send your first video message to see analytics here.
                  </p>
                  <Button onClick={() => navigate('/chat')}>
                    Start Chatting
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-6">
                {/* Total Stats Cards */}
                <div className="grid md:grid-cols-4 gap-6">
                  <Card>
                    <CardContent className="pt-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-gray-600">Total Videos</p>
                          <p className="text-3xl font-bold text-gray-900">{myVideos.length}</p>
                        </div>
                        <Play className="h-8 w-8 text-ember" />
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardContent className="pt-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-gray-600">Total Views</p>
                          <p className="text-3xl font-bold text-gray-900">
                            {myVideos.reduce((sum, v) => sum + (v.total_views || 0), 0)}
                          </p>
                        </div>
                        <Eye className="h-8 w-8 text-ember" />
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardContent className="pt-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-gray-600">Total Reactions</p>
                          <p className="text-3xl font-bold text-gray-900">
                            {myVideos.reduce((sum, v) => {
                              const counts = v.reaction_counts || {};
                              return sum + Object.values(counts).reduce((a, b) => a + b, 0);
                            }, 0)}
                          </p>
                        </div>
                        <Heart className="h-8 w-8 text-red-600" />
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardContent className="pt-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-gray-600">Avg Engagement</p>
                          <p className="text-3xl font-bold text-gray-900">
                            {myVideos.length > 0
                              ? Math.round(
                                  myVideos.reduce((sum, v) => {
                                    const views = v.total_views || 1;
                                    const reactions = Object.values(v.reaction_counts || {}).reduce((a, b) => a + b, 0);
                                    return sum + (reactions / views * 100);
                                  }, 0) / myVideos.length
                                )
                              : 0}%
                          </p>
                        </div>
                        <TrendingUp className="h-8 w-8 text-green-600" />
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Top Performing Videos */}
                <Card>
                  <CardHeader>
                    <CardTitle>🏆 Top Performing Videos</CardTitle>
                    <CardDescription>
                      Your most viewed and reacted videos
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {myVideos
                        .sort((a, b) => (b.total_views || 0) - (a.total_views || 0))
                        .slice(0, 5)
                        .map((video, index) => {
                          const reactions = Object.values(video.reaction_counts || {}).reduce((a, b) => a + b, 0);
                          const engagement = video.total_views > 0 ? (reactions / video.total_views * 100).toFixed(1) : 0;
                          
                          return (
                            <div
                              key={video.message_id}
                              className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
                              onClick={() => handleVideoSelect(video.message_id)}
                            >
                              <div className="flex items-center space-x-3">
                                <div className="text-2xl font-bold text-ember">
                                  #{index + 1}
                                </div>
                                <div>
                                  <p className="font-semibold text-gray-900">
                                    {video.caption || `Video ${video.message_id.substring(0, 8)}`}
                                  </p>
                                  <p className="text-sm text-gray-600">
                                    {new Date(video.sent_at).toLocaleDateString()}
                                  </p>
                                </div>
                              </div>
                              <div className="flex items-center space-x-4">
                                <div className="text-center">
                                  <p className="text-lg font-bold text-gray-900">{video.total_views || 0}</p>
                                  <p className="text-xs text-gray-500">views</p>
                                </div>
                                <div className="text-center">
                                  <p className="text-lg font-bold text-gray-900">{reactions}</p>
                                  <p className="text-xs text-gray-500">reactions</p>
                                </div>
                                <div className="text-center">
                                  <p className="text-lg font-bold text-green-600">{engagement}%</p>
                                  <p className="text-xs text-gray-500">engagement</p>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
          </TabsContent>

          {/* My Videos Tab */}
          <TabsContent value="my-videos">
            <div className="grid md:grid-cols-3 gap-6">
              {/* Video List */}
              <Card className="md:col-span-1">
                <CardHeader>
                  <CardTitle>My Videos ({myVideos.length})</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 max-h-[600px] overflow-y-auto">
                    {myVideos.map((video) => (
                      <div
                        key={video.message_id}
                        onClick={() => handleVideoSelect(video.message_id)}
                        className={`p-3 rounded-lg cursor-pointer transition-colors ${
                          selectedVideo === video.message_id
                            ? 'bg-ember/10 border-2 border-ember'
                            : 'bg-gray-50 hover:bg-gray-100'
                        }`}
                      >
                        <p className="font-semibold text-sm text-gray-900 truncate">
                          {video.caption || 'Video Message'}
                        </p>
                        <div className="flex items-center justify-between mt-2">
                          <span className="text-xs text-gray-600">
                            {video.total_views || 0} views
                          </span>
                          <span className="text-xs text-gray-500">
                            {new Date(video.sent_at).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Analytics Details */}
              <div className="md:col-span-2 space-y-6">
                {analytics ? (
                  <>
                    {/* Views & Engagement */}
                    <div className="grid md:grid-cols-3 gap-4">
                      <Card>
                        <CardContent className="pt-6">
                          <div className="text-center">
                            <Eye className="w-8 h-8 mx-auto mb-2 text-ember" />
                            <p className="text-3xl font-bold text-gray-900">
                              {analytics.views.total}
                            </p>
                            <p className="text-sm text-gray-600">Total Views</p>
                            <p className="text-xs text-gray-500 mt-1">
                              {analytics.views.unique} unique
                            </p>
                          </div>
                        </CardContent>
                      </Card>

                      <Card>
                        <CardContent className="pt-6">
                          <div className="text-center">
                            <Heart className="w-8 h-8 mx-auto mb-2 text-red-600" />
                            <p className="text-3xl font-bold text-gray-900">
                              {analytics.reactions.total}
                            </p>
                            <p className="text-sm text-gray-600">Total Reactions</p>
                          </div>
                        </CardContent>
                      </Card>

                      <Card>
                        <CardContent className="pt-6">
                          <div className="text-center">
                            <TrendingUp className="w-8 h-8 mx-auto mb-2 text-green-600" />
                            <p className="text-3xl font-bold text-gray-900">
                              {analytics.engagement.rate}%
                            </p>
                            <p className="text-sm text-gray-600">Engagement</p>
                          </div>
                        </CardContent>
                      </Card>
                    </div>

                    {/* Reaction Breakdown */}
                    <Card>
                      <CardHeader>
                        <CardTitle>Reaction Breakdown</CardTitle>
                      </CardHeader>
                      <CardContent>
                        {Object.keys(analytics.reactions.counts).length > 0 ? (
                          <div className="grid grid-cols-7 gap-4">
                            {Object.entries(analytics.reactions.counts).map(([reactionId, count]) => (
                              <div key={reactionId} className="text-center">
                                <div className="text-4xl mb-2">{reactionEmojis[reactionId]}</div>
                                <p className="text-2xl font-bold text-gray-900">{count}</p>
                                <p className="text-xs text-gray-600 capitalize">{reactionId}</p>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-center text-gray-500 py-8">No reactions yet</p>
                        )}
                      </CardContent>
                    </Card>

                    {/* View Sources */}
                    <Card>
                      <CardHeader>
                        <CardTitle>View Sources</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-3">
                          {Object.entries(analytics.views.sources).map(([source, count]) => {
                            const percentage = ((count / analytics.views.total) * 100).toFixed(1);
                            return (
                              <div key={source}>
                                <div className="flex justify-between mb-1">
                                  <span className="text-sm font-medium text-gray-700 capitalize">
                                    {source}
                                  </span>
                                  <span className="text-sm text-gray-600">
                                    {count} ({percentage}%)
                                  </span>
                                </div>
                                <div className="w-full bg-gray-200 rounded-full h-2">
                                  <div
                                    className="bg-ember h-2 rounded-full"
                                    style={{ width: `${percentage}%` }}
                                  ></div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </CardContent>
                    </Card>

                    {/* Watch Time */}
                    <Card>
                      <CardHeader>
                        <CardTitle>Watch Time Stats</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="grid md:grid-cols-2 gap-4">
                          <div className="text-center p-4 bg-blue-50 rounded-lg">
                            <Clock className="w-8 h-8 mx-auto mb-2 text-ember" />
                            <p className="text-2xl font-bold text-gray-900">
                              {analytics.engagement.total_watch_time}s
                            </p>
                            <p className="text-sm text-gray-600">Total Watch Time</p>
                          </div>
                          <div className="text-center p-4 bg-green-50 rounded-lg">
                            <Users className="w-8 h-8 mx-auto mb-2 text-green-600" />
                            <p className="text-2xl font-bold text-gray-900">
                              {analytics.engagement.avg_watch_time}s
                            </p>
                            <p className="text-sm text-gray-600">Avg Watch Time</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </>
                ) : (
                  <Card>
                    <CardContent className="py-12 text-center">
                      <p className="text-gray-500">Select a video to view analytics</p>
                    </CardContent>
                  </Card>
                )}
              </div>
            </div>
          </TabsContent>

          {/* Leaderboard Tab */}
          <TabsContent value="leaderboard">
            <Card>
              <CardHeader>
                <CardTitle>🏆 Top Reacted Videos (Platform-wide)</CardTitle>
                <CardDescription>
                  Most popular videos across all users
                </CardDescription>
              </CardHeader>
              <CardContent>
                {leaderboard.length > 0 ? (
                  <div className="space-y-3">
                    {leaderboard.map((video, index) => (
                      <div
                        key={video.message_id}
                        className="flex items-center justify-between p-4 bg-gradient-to-r from-ember/5 to-ember-light/5 rounded-lg"
                      >
                        <div className="flex items-center space-x-4">
                          <div className="text-3xl font-bold text-ember">#{index + 1}</div>
                          <div>
                            <p className="font-semibold text-gray-900">
                              {video.caption || 'Video Message'}
                            </p>
                            <p className="text-sm text-gray-600">by User {video.sender_id?.substring(0, 8)}</p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-6">
                          <div className="text-center">
                            <p className="text-xl font-bold text-gray-900">{video.total_views}</p>
                            <p className="text-xs text-gray-500">views</p>
                          </div>
                          <div className="text-center">
                            <p className="text-xl font-bold text-red-600">{video.total_reactions}</p>
                            <p className="text-xs text-gray-500">reactions</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12 text-gray-500">
                    <Award className="w-16 h-16 mx-auto mb-4 opacity-50" />
                    <p>No videos on leaderboard yet!</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default VideoAnalyticsPage;