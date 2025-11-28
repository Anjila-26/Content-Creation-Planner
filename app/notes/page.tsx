'use client';

import { Save, Plus, Trash2, Loader2 } from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import Sidebar from '../../components/Sidebar';
import { getNotes, createNote, updateNote, deleteNote, type Note } from '../../lib/notes';

export default function NotesPage() {
  const [notes, setNotes] = useState<Note[]>([]);
  const [selectedNote, setSelectedNote] = useState<Note | null>(null);
  const [editedContent, setEditedContent] = useState('');
  const [editedTitle, setEditedTitle] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    loadNotes();
    
    // Cleanup save timeout on unmount
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (selectedNote) {
      setEditedTitle(selectedNote.title);
      setEditedContent(selectedNote.content);
    }
  }, [selectedNote]);

  const loadNotes = async () => {
    try {
      setLoading(true);
      setError('');
      const data = await getNotes();
      setNotes(data);
      if (data.length > 0 && !selectedNote) {
        setSelectedNote(data[0]);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load notes');
      console.error('Error loading notes:', err);
    } finally {
      setLoading(false);
    }
  };

  const createNewNote = async () => {
    try {
      setSaving(true);
      setError('');
      const newNote = await createNote({
        title: 'Untitled Note',
        content: '',
      });
      setNotes([newNote, ...notes]);
      setSelectedNote(newNote);
      setEditedTitle(newNote.title);
      setEditedContent(newNote.content);
    } catch (err: any) {
      setError(err.message || 'Failed to create note');
      console.error('Error creating note:', err);
    } finally {
      setSaving(false);
    }
  };

  const saveNote = async (immediate = false) => {
    if (!selectedNote) return;

    // Clear existing timeout
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    const performSave = async () => {
      try {
        setSaving(true);
        setError('');
        const updatedNote = await updateNote(selectedNote.id, {
          title: editedTitle,
          content: editedContent,
        });
        setNotes(notes.map(note =>
          note.id === updatedNote.id ? updatedNote : note
        ));
        setSelectedNote(updatedNote);
      } catch (err: any) {
        setError(err.message || 'Failed to save note');
        console.error('Error saving note:', err);
      } finally {
        setSaving(false);
      }
    };

    // Debounce save operation unless immediate
    if (immediate) {
      await performSave();
    } else {
      saveTimeoutRef.current = setTimeout(performSave, 1000);
    }
  };

  const handleDeleteNote = async (id: number) => {
    if (!confirm('Are you sure you want to delete this note?')) {
      return;
    }

    try {
      setError('');
      await deleteNote(id);
      const updatedNotes = notes.filter(note => note.id !== id);
      setNotes(updatedNotes);
      if (selectedNote?.id === id) {
        setSelectedNote(updatedNotes[0] || null);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to delete note');
      console.error('Error deleting note:', err);
    }
  };

  const selectNote = (note: Note) => {
    // Save current note before switching
    if (selectedNote && (selectedNote.title !== editedTitle || selectedNote.content !== editedContent)) {
      saveNote(true);
    }
    setSelectedNote(note);
    setEditedTitle(note.title);
    setEditedContent(note.content);
  };

  // Auto-save on content change (debounced)
  useEffect(() => {
    if (!selectedNote) return;
    
    // Skip if content hasn't actually changed
    if (selectedNote.title === editedTitle && selectedNote.content === editedContent) {
      return;
    }

    // Only auto-save if we have a selected note and content has changed
    const timeoutId = setTimeout(() => {
      if (selectedNote && (selectedNote.title !== editedTitle || selectedNote.content !== editedContent)) {
        saveNote();
      }
    }, 1000);

    return () => clearTimeout(timeoutId);
  }, [editedTitle, editedContent, selectedNote?.id]);

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
      
      <div className="flex-1 flex overflow-hidden">
        {/* Notes List */}
        <div className="w-80 bg-white border-r border-gray-200 flex flex-col">
          {/* Header */}
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-800 font-handwriting">Notes</h2>
              <button
                onClick={createNewNote}
                disabled={saving}
                className="p-2 bg-blue-700 text-white rounded-lg hover:bg-blue-800 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {saving ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <Plus className="w-5 h-5" />
                )}
              </button>
            </div>
            <p className="text-sm text-gray-500">{notes.length} notes</p>
            {error && (
              <p className="text-sm text-red-500 mt-2">{error}</p>
            )}
          </div>

          {/* Notes List */}
          <div className="flex-1 overflow-y-auto p-4 space-y-2">
            {notes.length === 0 ? (
              <div className="text-center text-gray-400 py-8">
                <p>No notes yet</p>
                <button
                  onClick={createNewNote}
                  className="mt-4 px-4 py-2 bg-blue-700 text-white rounded-lg hover:bg-blue-800 text-sm"
                >
                  Create your first note
                </button>
              </div>
            ) : (
              notes.map((note) => (
                <div
                  key={note.id}
                  onClick={() => selectNote(note)}
                  className={`p-4 rounded-xl cursor-pointer transition-all group ${
                    selectedNote?.id === note.id
                      ? 'bg-blue-50 border-2 border-blue-500'
                      : 'bg-gray-50 hover:bg-gray-100 border-2 border-transparent'
                  }`}
                >
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="font-semibold text-gray-800 flex-1">{note.title}</h3>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteNote(note.id);
                      }}
                      className="opacity-0 group-hover:opacity-100 p-1 hover:bg-red-100 rounded transition-all"
                    >
                      <Trash2 className="w-4 h-4 text-red-500" />
                    </button>
                  </div>
                  <p className="text-sm text-gray-600 line-clamp-2 mb-2">{note.content}</p>
                  <p className="text-xs text-gray-400">
                    {new Date(note.created_at).toLocaleDateString()}
                  </p>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Note Editor */}
        {selectedNote ? (
          <div className="flex-1 flex flex-col">
            {/* Editor Header */}
            <div className="bg-white border-b border-gray-200 px-8 py-4 flex items-center justify-between">
              <input
                type="text"
                value={editedTitle}
                onChange={(e) => setEditedTitle(e.target.value)}
                className="text-2xl font-bold text-gray-800 bg-transparent border-none focus:outline-none font-handwriting flex-1"
                placeholder="Note title..."
              />
              <div className="flex items-center gap-2">
                {saving && (
                  <Loader2 className="w-4 h-4 animate-spin text-gray-400" />
                )}
                <button
                  onClick={() => saveNote(true)}
                  disabled={saving}
                  className="px-6 py-2 bg-blue-700 text-white rounded-lg hover:bg-blue-800 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Save className="w-4 h-4" />
                  <span className="text-sm font-medium">Save</span>
                </button>
              </div>
            </div>

            {/* Editor Content */}
            <div className="flex-1 p-8 overflow-y-auto">
              <textarea
                value={editedContent}
                onChange={(e) => setEditedContent(e.target.value)}
                className="w-full h-full p-6 bg-white rounded-2xl shadow-sm border border-gray-200 focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none text-gray-800 leading-relaxed"
                placeholder="Start writing..."
              />
            </div>
          </div>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <p className="text-gray-400 mb-4">No notes yet</p>
              <button
                onClick={createNewNote}
                className="px-6 py-3 bg-purple-500 text-white rounded-lg hover:bg-purple-600"
              >
                Create Your First Note
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
