'use client';

import { Sparkles, Lightbulb, Video, RefreshCw } from 'lucide-react';
import { useState } from 'react';
import { GoogleGenerativeAI } from '@google/generative-ai';

interface HookSuggestion {
  hook: string;
  reasoning: string;
}

interface VideoSuggestion {
  title: string;
  description: string;
  reasoning: string;
}

interface VideoSuggestionsProps {
  videoTitle: string;
  onSelectHook?: (hook: string) => void;
  onSelectVideo?: (video: VideoSuggestion) => void;
}

export default function VideoSuggestions({ 
  videoTitle, 
  onSelectHook, 
  onSelectVideo 
}: VideoSuggestionsProps) {
  const [hooks, setHooks] = useState<HookSuggestion[]>([]);
  const [relatedVideos, setRelatedVideos] = useState<VideoSuggestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasGenerated, setHasGenerated] = useState(false);

  const generateSuggestions = async () => {
    if (!videoTitle.trim()) {
      setError('Please enter a video title first');
      return;
    }

    const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY;
    if (!apiKey || apiKey === 'your_gemini_api_key_here') {
      setError('Please configure NEXT_PUBLIC_GEMINI_API_KEY in .env.local');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Initialize Gemini
      const genAI = new GoogleGenerativeAI(apiKey);
      const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

      // Craft the prompt
      const prompt = `You are a content strategist helping a YouTube creator. Given the video idea below, provide:

1. **5 engaging hooks** for the video (these are opening lines or attention-grabbing statements to start the video)
2. **3 related video ideas** that complement or extend this topic

Video Title: "${videoTitle}"

Return your response as valid JSON with this exact structure:
{
  "hooks": [
    {"hook": "hook text here", "reasoning": "why this hook works"},
    ...
  ],
  "related_videos": [
    {"title": "video title", "description": "brief description", "reasoning": "why this is related"},
    ...
  ]
}

Make the hooks engaging, curiosity-driven, and suitable for YouTube. Make the related videos complementary to the main topic.
Return ONLY the JSON, no markdown formatting or additional text.`;

      // Generate content
      const result = await model.generateContent(prompt);
      const response = await result.response;
      let responseText = response.text().trim();
      
      // Remove markdown code blocks if present
      if (responseText.startsWith('```json')) {
        responseText = responseText.slice(7);
      }
      if (responseText.startsWith('```')) {
        responseText = responseText.slice(3);
      }
      if (responseText.endsWith('```')) {
        responseText = responseText.slice(0, -3);
      }
      responseText = responseText.trim();
      
      // Parse JSON response
      const suggestions = JSON.parse(responseText);
      
      setHooks(suggestions.hooks || []);
      setRelatedVideos(suggestions.related_videos || []);
      setHasGenerated(true);
        
    } catch (err) {
      console.error('Error generating suggestions:', err);
      setError(err instanceof Error ? err.message : 'Failed to generate suggestions');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Generate Button */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-purple-600" />
          <h3 className="text-lg font-semibold text-gray-800">AI Suggestions</h3>
        </div>
        <button
          onClick={generateSuggestions}
          disabled={loading || !videoTitle.trim()}
          className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg hover:from-purple-700 hover:to-pink-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
        >
          {loading ? (
            <>
              <RefreshCw className="w-4 h-4 animate-spin" />
              Generating...
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4" />
              {hasGenerated ? 'Regenerate' : 'Generate Suggestions'}
            </>
          )}
        </button>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
          {error}
        </div>
      )}

      {/* Hooks Section */}
      {hooks.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Lightbulb className="w-5 h-5 text-amber-600" />
            <h4 className="font-semibold text-gray-800">Engaging Hooks</h4>
          </div>
          <div className="space-y-2">
            {hooks.map((hookItem, index) => (
              <div
                key={index}
                className="p-4 bg-amber-50 border border-amber-200 rounded-lg hover:bg-amber-100 transition-colors cursor-pointer group"
                onClick={() => onSelectHook?.(hookItem.hook)}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1">
                    <p className="text-gray-800 font-medium mb-1 group-hover:text-amber-700">
                      "{hookItem.hook}"
                    </p>
                    <p className="text-sm text-gray-600">{hookItem.reasoning}</p>
                  </div>
                  <button className="opacity-0 group-hover:opacity-100 px-3 py-1 bg-amber-600 text-white text-sm rounded hover:bg-amber-700 transition-all">
                    Use
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Related Videos Section */}
      {relatedVideos.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Video className="w-5 h-5 text-blue-600" />
            <h4 className="font-semibold text-gray-800">Related Video Ideas</h4>
          </div>
          <div className="space-y-2">
            {relatedVideos.map((video, index) => (
              <div
                key={index}
                className="p-4 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 transition-colors cursor-pointer group"
                onClick={() => onSelectVideo?.(video)}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1">
                    <h5 className="text-gray-800 font-medium mb-1 group-hover:text-blue-700">
                      {video.title}
                    </h5>
                    <p className="text-sm text-gray-700 mb-2">{video.description}</p>
                    <p className="text-xs text-gray-600 italic">{video.reasoning}</p>
                  </div>
                  <button className="opacity-0 group-hover:opacity-100 px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 transition-all">
                    Create
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Empty State */}
      {!loading && !error && hooks.length === 0 && (
        <div className="text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
          <Sparkles className="w-12 h-12 text-gray-400 mx-auto mb-3" />
          <p className="text-gray-600 mb-2">Ready to get inspired?</p>
          <p className="text-sm text-gray-500">
            Click "Generate Suggestions" to get AI-powered hooks and video ideas
          </p>
        </div>
      )}
    </div>
  );
}
