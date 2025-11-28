'use client';

import { Plus, Search, Bell, Calendar, CheckSquare, Clock, Trash2 } from 'lucide-react';
import { useState, useEffect } from 'react';
import Sidebar from '../../components/Sidebar';
import { useRouter } from 'next/navigation';
import { getVideoProjects, createVideoProject, deleteVideoProject, type VideoProject } from '../../lib/video-projects';

export default function VideosPage() {
  const router = useRouter();
  const [videos, setVideos] = useState<VideoProject[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [newVideoTitle, setNewVideoTitle] = useState('');
  const [newVideoRoughSketch, setNewVideoRoughSketch] = useState('');

  useEffect(() => {
    loadVideos();
  }, []);

  const loadVideos = async () => {
    try {
      setLoading(true);
      setError('');
      const data = await getVideoProjects();
      setVideos(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load video projects');
    } finally {
      setLoading(false);
    }
  };

  const createVideo = async () => {
    if (!newVideoTitle.trim()) return;
    
    try {
      setError('');
      const newProject = await createVideoProject({
        title: newVideoTitle.trim(),
        rough_sketch: newVideoRoughSketch.trim() || undefined,
        status: 'ideation',
        progress: 0,
      });
      setVideos([newProject, ...videos]);
      setNewVideoTitle('');
      setNewVideoRoughSketch('');
      setIsCreating(false);
      // Redirect to video detail page to see generated concept
      router.push(`/video/${newProject.id}`);
    } catch (err: any) {
      setError(err.message || 'Failed to create video project');
    }
  };

  const handleDelete = async (e: React.MouseEvent, videoId: number) => {
    e.stopPropagation(); // Prevent card click
    
    if (!confirm('Are you sure you want to delete this video project? This action cannot be undone.')) {
      return;
    }
    
    try {
      setError('');
      await deleteVideoProject(videoId);
      setVideos(videos.filter(v => v.id !== videoId));
    } catch (err: any) {
      setError(err.message || 'Failed to delete video project');
    }
  };


  const statusColors = {
    ideation: 'bg-blue-100 text-blue-700 border-blue-300',
    filming: 'bg-rose-100 text-rose-700 border-rose-300',
    editing: 'bg-amber-100 text-amber-700 border-amber-300',
    publishing: 'bg-green-100 text-green-700 border-green-300',
    completed: 'bg-gray-100 text-gray-700 border-gray-300',
  };

  const statusLabels = {
    ideation: '💡 Ideation',
    filming: '🎬 Filming',
    editing: '✂️ Editing',
    publishing: '📤 Publishing',
    completed: '✅ Completed',
  };

  return (
    <div className="flex h-screen bg-gradient-to-br from-blue-100 via-blue-50 to-cyan-100">
      <Sidebar />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="bg-white border-b border-gray-200 px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4 flex-1">
              <h1 className="text-2xl font-bold text-gray-800 font-handwriting">Video Projects</h1>
              <span className="text-gray-400">-</span>
              <span className="text-sm text-gray-600">{videos.length} videos in production</span>
            </div>

            <div className="flex items-center gap-4">
              <button className="p-2 hover:bg-gray-100 rounded-lg">
                <Search className="w-5 h-5 text-gray-600" />
              </button>
              <button className="p-2 hover:bg-gray-100 rounded-lg">
                <Bell className="w-5 h-5 text-gray-600" />
              </button>
              <button 
                onClick={() => setIsCreating(true)}
                className="px-6 py-2 bg-blue-700 text-white rounded-lg hover:bg-blue-800 flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                <span className="text-sm font-medium">New Video Project</span>
              </button>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto p-8">
          <div className="max-w-7xl mx-auto">
            {error && (
              <div className="mb-6 p-4 rounded-lg bg-red-50 text-red-700 border border-red-200">
                {error}
              </div>
            )}

            {loading ? (
              <div className="flex items-center justify-center h-64">
                <div className="text-gray-500">Loading video projects...</div>
              </div>
            ) : (
              <>
                {/* New Video Input */}
                {isCreating && (
              <div className="bg-white rounded-2xl p-6 shadow-sm mb-6 border-2 border-blue-500">
                <h3 className="font-semibold text-gray-800 mb-4">Create New Video Project</h3>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Video Title *
                    </label>
                    <input
                      type="text"
                      value={newVideoTitle}
                      onChange={(e) => setNewVideoTitle(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && !e.shiftKey && createVideo()}
                      placeholder="Enter video title..."
                      autoFocus
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Rough Sketch (Optional)
                    </label>
                    <textarea
                      value={newVideoRoughSketch}
                      onChange={(e) => setNewVideoRoughSketch(e.target.value)}
                      placeholder="Brief description of your video idea, concept, or any notes..."
                      rows={4}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                    />
                    <p className="text-xs text-gray-500 mt-1">This will help generate a better concept for your video</p>
                  </div>
                </div>

                <div className="flex gap-3 mt-4">
                  <button
                    onClick={createVideo}
                    className="px-6 py-2 bg-blue-700 text-white rounded-lg hover:bg-blue-800 font-medium"
                  >
                    Create Project
                  </button>
                  <button
                    onClick={() => {
                      setIsCreating(false);
                      setNewVideoTitle('');
                      setNewVideoRoughSketch('');
                    }}
                    className="px-6 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 font-medium"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}

            {/* Video Projects Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {videos.map((video) => (
                <div
                  key={video.id}
                  onClick={() => router.push(`/video/${video.id}`)}
                  className="bg-white rounded-2xl shadow-sm hover:shadow-md transition-all cursor-pointer overflow-hidden border border-gray-200 hover:border-gray-300"
                >
                  {/* Header */}
                  <div className="p-5 border-b border-gray-100">
                    <div className="flex items-start justify-between mb-3">
                      <h3 className="font-semibold text-gray-800 text-lg leading-snug flex-1">
                        {video.title}
                      </h3>
                      <button
                        onClick={(e) => handleDelete(e, video.id)}
                        className="p-2 hover:bg-red-50 rounded-lg transition-colors text-gray-400 hover:text-red-600"
                        title="Delete video project"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                    <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium border ${statusColors[video.status]}`}>
                        <span className="font-bold text-gray-800">
                          {(() => {
                            switch (video.status) {
                              case 'ideation': return 'Not Started';
                              case 'filming': return 'Shooting';
                              case 'editing': return 'Editing';
                              case 'publishing': return 'Published';
                              default: return 'Not Started';
                            }
                          })()}
                        </span>
                    </span>
                  </div>

                  {/* Content */}
                  <div className="p-5 space-y-3">
                    {/* Dates */}
                    {(video.production_date || video.release_date) && (
                      <div className="space-y-2 text-sm">
                        {video.production_date && (
                          <div className="flex items-center gap-2 text-gray-600">
                            <Clock className="w-4 h-4" />
                            <span>Production: {new Date(video.production_date).toLocaleDateString()}</span>
                          </div>
                        )}
                        {video.release_date && (
                          <div className="flex items-center gap-2 text-gray-600">
                            <Calendar className="w-4 h-4" />
                            <span>Release: {new Date(video.release_date).toLocaleDateString()}</span>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Notes Preview */}
                    {video.notes && (
                      <p className="text-sm text-gray-500 line-clamp-2">
                        {video.notes}
                      </p>
                    )}
                  </div>

                  {/* Footer */}
                  <div className="px-5 py-3 bg-gray-50 border-t border-gray-100">
                    <div className="flex items-center justify-between text-xs text-gray-500">
                      <span className="flex items-center gap-1">
                        <CheckSquare className="w-3 h-3" />
                        View Checklist
                      </span>
                      <span>→</span>
                    </div>
                  </div>
                </div>
              ))}
                </div>
              </>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
