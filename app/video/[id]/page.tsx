'use client';

import { ArrowLeft, Loader2 } from 'lucide-react';
import { useState, use, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import ReactMarkdown from 'react-markdown';
import Sidebar from '../../../components/Sidebar';
import VideoChecklist from '../../../components/VideoChecklist';
import { getVideoProject, updateVideoProject, type VideoProject } from '../../../lib/video-projects';

export default function VideoDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [video, setVideo] = useState<VideoProject | null>(null);
  const [saving, setSaving] = useState(false);
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const hasConceptRef = useRef(false);

  useEffect(() => {
    loadVideo();
    
    // Cleanup save timeout on unmount
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, [id]);

  // Trigger concept generation if project exists but no concept yet
  useEffect(() => {
    if (!video || video.generated_concept) return;
    
    // Trigger concept generation in background
    const generateConcept = async () => {
      try {
        await fetch('/api/video-projects/generate-concept', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            video_project_id: video.id,
            title: video.title,
            hook: video.hook || null,
            rough_sketch: video.rough_sketch || null,
          }),
        });
      } catch (err) {
        console.error('Failed to trigger concept generation:', err);
      }
    };

    // Trigger after a small delay to let page load first
    const timeoutId = setTimeout(generateConcept, 500);
    
    return () => clearTimeout(timeoutId);
  }, [video]);

  const loadVideo = async () => {
    try {
      setLoading(true);
      setError('');
      const data = await getVideoProject(parseInt(id));
      setVideo(data);
      hasConceptRef.current = !!data.generated_concept;
    } catch (err: any) {
      setError(err.message || 'Failed to load video project');
      if (err.message?.includes('404')) {
        router.push('/videos');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleFieldChange = (field: keyof VideoProject, value: any) => {
    if (!video) return;
    
    // Optimistic update
    const updatedVideo = { ...video, [field]: value };
    setVideo(updatedVideo);
    
    // Clear existing timeout
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }
    
    // Auto-save after 1 second of no changes
    saveTimeoutRef.current = setTimeout(async () => {
      try {
        setSaving(true);
        setError('');
        const updated = await updateVideoProject(video.id, { [field]: value });
        setVideo(updated);
      } catch (err: any) {
        setError(err.message || 'Failed to update video project');
        // Revert on error
        setVideo(video);
      } finally {
        setSaving(false);
      }
    }, 1000);
  };

  // Poll for generated concept if it doesn't exist yet (smarter polling)
  const videoId = video?.id;
  const hasConcept = video?.generated_concept;
  
  useEffect(() => {
    if (!video || hasConceptRef.current || hasConcept) return;

    let isPolling = true;
    let pollCount = 0;
    const maxPolls = 10; // Reduced max polls
    const pollInterval = 4000; // Poll every 4 seconds (less frequent)
    const projectId = id;

    const pollForConcept = async () => {
      if (!isPolling) return;
      
      pollCount++;
      if (pollCount > maxPolls) {
        isPolling = false;
        return;
      }
      
      try {
        const data = await getVideoProject(parseInt(projectId));
        if (data.generated_concept) {
          setVideo(data);
          hasConceptRef.current = true;
          isPolling = false; // Stop immediately when concept is found
          return;
        }
      } catch (err) {
        // Ignore errors during polling
      }
    };

    // Wait 3 seconds before starting to poll (give backend time to generate)
    const initialDelay = setTimeout(() => {
      if (!isPolling) return;
      
      pollForConcept(); // First poll
      
      const intervalId = setInterval(() => {
        if (!isPolling) {
          clearInterval(intervalId);
          return;
        }
        pollForConcept();
      }, pollInterval);

      // Cleanup on unmount or when concept is found
      return () => clearInterval(intervalId);
    }, 3000);

    return () => {
      isPolling = false;
      clearTimeout(initialDelay);
    };
    // Use stable dependencies - always 2 items: id (string) and videoId (number | undefined)
  }, [id, videoId]);

  if (loading) {
    return (
      <div className="flex h-screen bg-gray-50">
        <Sidebar />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-gray-500">Loading video project...</div>
        </div>
      </div>
    );
  }

  if (!video) {
    return (
      <div className="flex h-screen bg-gray-50">
        <Sidebar />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-red-500">Video project not found</div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gradient-to-br from-blue-100 via-blue-50 to-cyan-100">
      <Sidebar />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="bg-white border-b border-gray-200 px-8 py-4">
            <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => router.push('/videos')}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ArrowLeft className="w-5 h-5 text-gray-600" />
              </button>
              <div>
                <h1 className="text-xl font-bold text-gray-800 font-handwriting">Video Details</h1>
                <p className="text-sm text-gray-500">{video.title}</p>
              </div>
            </div>

            {saving && (
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Saving...</span>
              </div>
            )}
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-8">
          <div className="max-w-7xl mx-auto space-y-8">
            {error && (
              <div className="p-4 rounded-lg bg-red-50 text-red-700 border border-red-200">
                {error}
              </div>
            )}

            <div className="bg-white rounded-2xl shadow-sm p-8">
              <h2 className="text-2xl font-bold text-gray-800 mb-6 font-handwriting">Video Details</h2>
              
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Title :
                  </label>
                  <input
                    type="text"
                    value={video.title || ''}
                    onChange={(e) => handleFieldChange('title', e.target.value)}
                    className="w-full px-0 py-2 border-0 border-b-2 border-gray-300 focus:ring-0 focus:outline-none text-gray-800 bg-transparent font-sans"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Hook (Optional) :
                  </label>
                  <input
                    type="text"
                    value={video.hook || ''}
                    onChange={(e) => handleFieldChange('hook', e.target.value)}
                    placeholder="Your 3-second hook line..."
                    className="w-full px-0 py-2 border-0 border-b-2 border-gray-300 focus:ring-0 focus:outline-none text-gray-800 bg-transparent font-handwriting"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Rough Sketch (Optional) :
                  </label>
                  <textarea
                    value={video.rough_sketch || ''}
                    onChange={(e) => handleFieldChange('rough_sketch', e.target.value)}
                    rows={3}
                    className="w-full px-0 py-2 border-0 border-b-2 border-gray-300 focus:ring-0 focus:outline-none text-gray-800 resize-none bg-transparent font-handwriting"
                    placeholder="Brief description of your video idea..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Production Date :
                  </label>
                  <input
                    type="date"
                    value={video.production_date || ''}
                    onChange={(e) => handleFieldChange('production_date', e.target.value || null)}
                    className="w-full px-0 py-2 border-0 border-b-2 border-gray-300 focus:ring-0 focus:outline-none text-gray-800 bg-transparent font-handwriting"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Release Date :
                  </label>
                  <input
                    type="date"
                    value={video.release_date || ''}
                    onChange={(e) => handleFieldChange('release_date', e.target.value || null)}
                    className="w-full px-0 py-2 border-0 border-b-2 border-gray-300 focus:ring-0 focus:outline-none text-gray-800 bg-transparent font-handwriting"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Notes :
                  </label>
                  <textarea
                    value={video.notes || ''}
                    onChange={(e) => handleFieldChange('notes', e.target.value)}
                    rows={4}
                    className="w-full px-0 py-2 border-0 border-b-2 border-gray-300 focus:ring-0 focus:outline-none text-gray-800 resize-none bg-transparent font-handwriting"
                    placeholder="Add your notes here..."
                  />
                </div>
              </div>
            </div>

            {/* Generated Concept */}
            <div className="bg-white rounded-2xl shadow-sm p-8">
              <h2 className="text-2xl font-bold text-gray-800 mb-6 font-handwriting">Generated Concept</h2>
              
              {video.generated_concept ? (
                <div className="prose prose-sm max-w-none">
                  <div className="text-gray-700 bg-gray-50 p-6 rounded-lg border border-gray-200 leading-relaxed font-handwriting">
                    <ReactMarkdown
                      components={{
                        h1: ({node, ...props}) => <h1 className="text-2xl font-bold text-gray-900 mb-4 mt-6 first:mt-0 font-handwriting" {...props} />,
                        h2: ({node, ...props}) => <h2 className="text-xl font-bold text-gray-900 mb-3 mt-5 first:mt-0 font-handwriting" {...props} />,
                        h3: ({node, ...props}) => <h3 className="text-lg font-semibold text-gray-900 mb-2 mt-4 first:mt-0 font-handwriting" {...props} />,
                        p: ({node, ...props}) => <p className="mb-4 text-gray-700 leading-relaxed font-handwriting" {...props} />,
                        ul: ({node, ...props}) => <ul className="list-disc list-inside mb-4 space-y-2 text-gray-700 font-handwriting" {...props} />,
                        ol: ({node, ...props}) => <ol className="list-decimal list-inside mb-4 space-y-2 text-gray-700 font-handwriting" {...props} />,
                        li: ({node, ...props}) => <li className="text-gray-700 font-handwriting" {...props} />,
                        strong: ({node, ...props}) => <strong className="font-semibold text-gray-900 font-handwriting" {...props} />,
                        em: ({node, ...props}) => <em className="italic text-gray-800 font-handwriting" {...props} />,
                      }}
                    >
                      {video.generated_concept}
                    </ReactMarkdown>
                  </div>
                </div>
              ) : (
                <div className="text-center py-12">
                  <Loader2 className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-4" />
                  <p className="text-gray-600 font-medium">Generating your video concept...</p>
                  <p className="text-sm text-gray-500 mt-2">This may take a few moments</p>
                </div>
              )}
            </div>

            <VideoChecklist videoId={id} />
          </div>
        </main>
      </div>
    </div>
  );
}
