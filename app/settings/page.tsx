'use client';

import { Save, Key, Loader2, Eye, EyeOff, CheckCircle2, AlertCircle } from 'lucide-react';
import { useState, useEffect } from 'react';
import Sidebar from '../../components/Sidebar';
import { getSettings, updateSettings, type UserSettings } from '../../lib/settings';

export default function SettingsPage() {
  const [settings, setSettings] = useState<UserSettings | null>(null);
  const [geminiApiKey, setGeminiApiKey] = useState('');
  const [showApiKey, setShowApiKey] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      setLoading(true);
      setError('');
      const data = await getSettings();
      setSettings(data);
      // If API key exists, show masked version
      if (data.gemini_api_key && data.gemini_api_key !== '***') {
        setGeminiApiKey(data.gemini_api_key);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load settings');
      console.error('Error loading settings:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      setError('');
      setSuccess(false);
      
      await updateSettings({
        gemini_api_key: geminiApiKey.trim() || null,
      });
      
      setSuccess(true);
      // Reload settings to get updated data
      await loadSettings();
      
      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(false), 3000);
    } catch (err: any) {
      setError(err.message || 'Failed to save settings');
      console.error('Error saving settings:', err);
    } finally {
      setSaving(false);
    }
  };

  const handleClear = () => {
    setGeminiApiKey('');
    setError('');
    setSuccess(false);
  };

  if (loading) {
    return (
      <div className="flex h-screen bg-gradient-to-br from-blue-100 via-blue-50 to-cyan-100">
        <Sidebar />
        <div className="flex-1 flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-blue-700" />
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gradient-to-br from-blue-100 via-blue-50 to-cyan-100">
      <Sidebar />
      
      <div className="flex-1 overflow-y-auto p-8">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-3xl font-bold text-gray-800 mb-8 font-handwriting">Settings</h1>

          {/* API Keys Section */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 mb-6">
            <div className="flex items-center gap-3 mb-4">
              <Key className="w-6 h-6 text-blue-700" />
              <h2 className="text-xl font-semibold text-gray-800">API Keys</h2>
            </div>

            <div className="space-y-4">
              {/* Gemini API Key */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Gemini API Key
                </label>
                <div className="relative">
                  <input
                    type={showApiKey ? 'text' : 'password'}
                    value={geminiApiKey}
                    onChange={(e) => setGeminiApiKey(e.target.value)}
                    placeholder="Enter your Gemini API key"
                    className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <button
                    type="button"
                    onClick={() => setShowApiKey(!showApiKey)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                  >
                    {showApiKey ? (
                      <EyeOff className="w-5 h-5" />
                    ) : (
                      <Eye className="w-5 h-5" />
                    )}
                  </button>
                </div>
                <p className="mt-2 text-sm text-gray-500">
                  Your API key is stored securely and only used for your account. 
                  Get your key from{' '}
                  <a
                    href="https://makersuite.google.com/app/apikey"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:text-blue-800 underline"
                  >
                    Google AI Studio
                  </a>
                  .
                </p>
                {settings?.gemini_api_key && settings.gemini_api_key !== '***' && (
                  <p className="mt-2 text-sm text-green-600 flex items-center gap-1">
                    <CheckCircle2 className="w-4 h-4" />
                    API key is saved
                  </p>
                )}
              </div>
            </div>

            {/* Success/Error Messages */}
            {success && (
              <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg flex items-center gap-2 text-green-700">
                <CheckCircle2 className="w-5 h-5" />
                <span className="text-sm font-medium">Settings saved successfully!</span>
              </div>
            )}

            {error && (
              <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-red-700">
                <AlertCircle className="w-5 h-5" />
                <span className="text-sm font-medium">{error}</span>
              </div>
            )}

            {/* Action Buttons */}
            <div className="mt-6 flex items-center gap-3">
              <button
                onClick={handleSave}
                disabled={saving}
                className="px-6 py-3 bg-blue-700 text-white rounded-lg hover:bg-blue-800 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {saving ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Saving...</span>
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    <span>Save Settings</span>
                  </>
                )}
              </button>
              <button
                onClick={handleClear}
                disabled={saving || !geminiApiKey}
                className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Clear
              </button>
            </div>
          </div>

          {/* Info Section */}
          <div className="bg-blue-50 rounded-2xl border border-blue-200 p-6">
            <h3 className="text-lg font-semibold text-blue-900 mb-2">About API Keys</h3>
            <p className="text-sm text-blue-800 mb-4">
              Your Gemini API key is used to generate video ideas, hooks, and suggestions. 
              The key is stored securely in your account and is only accessible by you.
            </p>
            <ul className="text-sm text-blue-800 space-y-1 list-disc list-inside">
              <li>Your API key is encrypted and stored securely</li>
              <li>Only you can view and manage your API keys</li>
              <li>You can update or remove your API key at any time</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

