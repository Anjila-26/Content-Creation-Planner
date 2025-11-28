'use client';

import { X, Loader2 } from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import { getVideoProject, updateVideoProject, type VideoProject } from '../lib/video-projects';
import VideoChecklist from './VideoChecklist';

interface VideoDetailModalProps {
  videoId: number;
  isOpen: boolean;
  onClose: () => void;
}

export default function VideoDetailModal({ videoId, isOpen, onClose }: VideoDetailModalProps) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [video, setVideo] = useState<VideoProject | null>(null);
  const [saving, setSaving] = useState(false);
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const hasConceptRef = useRef(false);

  useEffect(() => {
    if (isOpen && videoId) {
      loadVideo();
    }
    
    // Cleanup save timeout on unmount
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, [isOpen, videoId]);

  // Trigger concept generation if project exists but no concept yet
  useEffect(() => {
    if (!video || video.generated_concept || !isOpen) return;
    
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

    const timeoutId = setTimeout(generateConcept, 500);
    return () => clearTimeout(timeoutId);
  }, [video, isOpen]);

  const loadVideo = async () => {
    try {
      setLoading(true);
      setError('');
      const data = await getVideoProject(videoId);
      setVideo(data);
      hasConceptRef.current = !!data.generated_concept;
    } catch (err: any) {
      setError(err.message || 'Failed to load video project');
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

  // Poll for generated concept if it doesn't exist yet
  const videoIdNum = video?.id;
  const hasConcept = video?.generated_concept;
  
  useEffect(() => {
    if (!video || hasConceptRef.current || hasConcept || !isOpen) return;

    let isPolling = true;
    let pollCount = 0;
    const maxPolls = 10;
    const pollInterval = 4000;

    const pollForConcept = async () => {
      if (!isPolling) return;
      
      pollCount++;
      if (pollCount > maxPolls) {
        isPolling = false;
        return;
      }
      
      try {
        const data = await getVideoProject(videoId);
        if (data.generated_concept) {
          setVideo(data);
          hasConceptRef.current = true;
          isPolling = false;
          return;
        }
      } catch (err) {
        // Ignore errors during polling
      }
    };

    const initialDelay = setTimeout(() => {
      if (!isPolling) return;
      
      pollForConcept();
      
      const intervalId = setInterval(() => {
        if (!isPolling) {
          clearInterval(intervalId);
          return;
        }
        pollForConcept();
      }, pollInterval);

      return () => clearInterval(intervalId);
    }, 3000);

    return () => {
      isPolling = false;
      clearTimeout(initialDelay);
    };
  }, [videoId, videoIdNum, hasConcept, isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black bg-opacity-50"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-5xl max-h-[90vh] overflow-hidden flex flex-col m-4">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-white">
          <h2 className="text-2xl font-bold text-gray-800 font-handwriting">Video Details</h2>
          <div className="flex items-center gap-4">
            {saving && (
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Saving...</span>
              </div>
            )}
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="w-5 h-5 text-gray-600" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-8 bg-gradient-to-br from-blue-100 via-blue-50 to-cyan-100">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
              <span className="ml-3 text-gray-600">Loading video project...</span>
            </div>
          ) : error ? (
            <div className="p-4 rounded-lg bg-red-50 text-red-700 border border-red-200">
              {error}
            </div>
          ) : !video ? (
            <div className="text-center py-12 text-gray-600">
              Video project not found
            </div>
          ) : (
            <div className="space-y-8">
              {/* Video Details */}
              <div className="bg-white rounded-2xl shadow-sm p-8">
                <h3 className="text-2xl font-bold text-gray-800 mb-6 font-handwriting">Video Details</h3>
                
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
                <h3 className="text-2xl font-bold text-gray-800 mb-6 font-handwriting">Generated Concept</h3>
                
                {video.generated_concept ? (
                  <div className="prose prose-sm max-w-none">
                    <div className="text-gray-700 bg-gray-50 p-6 rounded-lg border border-gray-200 leading-relaxed font-handwriting">
                      <ReactMarkdown
                        components={{
                          h1: ({node, ...props}) => <h1 className="text-2xl font-bold text-gray-900 mb-4 mt-6 first:mt-0 font-handwriting" {...props} />,
                          h2: ({node, ...props}) => <h2 className="text-xl font-bold text-gray-900 mb-3 mt-5 first:mt-0 font-handwriting" {...props} />,
                          h3: ({node, ...props}) => <h3 className="text-lg font-semibold text-gray-900 mb-2 mt-4 first:mt-0 font-handwriting" {...props} />,
                          p: ({node, ...props}) => <p className="mb-4 text-gray-700 leading-relaxed font-handwriting" {...props} />,
                          ul: ({node, ...props}) => <ul className="list-none mb-4 space-y-3 text-gray-700 font-handwriting" {...props} />,
                          ol: ({node, ...props}) => <ol className="list-none mb-4 space-y-3 text-gray-700 font-handwriting" {...props} />,
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

              {/* Checklist */}
              <VideoChecklist videoId={videoId.toString()} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

