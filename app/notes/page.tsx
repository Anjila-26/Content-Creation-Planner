'use client';

import { Save, Plus, Trash2 } from 'lucide-react';
import { useState } from 'react';
import Sidebar from '../../components/Sidebar';

interface Note {
  id: number;
  title: string;
  content: string;
  createdAt: string;
}

const sampleNotes: Note[] = [
  {
    id: 1,
    title: 'Video Ideas Brainstorm',
    content: 'Ideas for next month:\n- Tutorial on React Server Components\n- Behind the scenes of my workflow\n- Q&A session\n- Collaboration with...',
    createdAt: '2025-06-15',
  },
  {
    id: 2,
    title: 'Equipment Wishlist',
    content: 'Items to upgrade:\n- New microphone (Rode NT1)\n- Softbox lighting setup\n- Camera lens (50mm f/1.8)',
    createdAt: '2025-06-14',
  },
];

export default function NotesPage() {
  const [notes, setNotes] = useState<Note[]>(sampleNotes);
  const [selectedNote, setSelectedNote] = useState<Note | null>(notes[0] || null);
  const [editedContent, setEditedContent] = useState(selectedNote?.content || '');
  const [editedTitle, setEditedTitle] = useState(selectedNote?.title || '');

  const createNewNote = () => {
    const newNote: Note = {
      id: Math.max(...notes.map(n => n.id), 0) + 1,
      title: 'Untitled Note',
      content: '',
      createdAt: new Date().toISOString().split('T')[0],
    };
    setNotes([newNote, ...notes]);
    setSelectedNote(newNote);
    setEditedTitle(newNote.title);
    setEditedContent(newNote.content);
  };

  const saveNote = () => {
    if (selectedNote) {
      setNotes(notes.map(note =>
        note.id === selectedNote.id
          ? { ...note, title: editedTitle, content: editedContent }
          : note
      ));
      setSelectedNote({ ...selectedNote, title: editedTitle, content: editedContent });
    }
  };

  const deleteNote = (id: number) => {
    setNotes(notes.filter(note => note.id !== id));
    if (selectedNote?.id === id) {
      setSelectedNote(notes[0] || null);
    }
  };

  const selectNote = (note: Note) => {
    setSelectedNote(note);
    setEditedTitle(note.title);
    setEditedContent(note.content);
  };

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
                className="p-2 bg-blue-700 text-white rounded-lg hover:bg-blue-800"
              >
                <Plus className="w-5 h-5" />
              </button>
            </div>
            <p className="text-sm text-gray-500">{notes.length} notes</p>
          </div>

          {/* Notes List */}
          <div className="flex-1 overflow-y-auto p-4 space-y-2">
            {notes.map((note) => (
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
                      deleteNote(note.id);
                    }}
                    className="opacity-0 group-hover:opacity-100 p-1 hover:bg-red-100 rounded transition-all"
                  >
                    <Trash2 className="w-4 h-4 text-red-500" />
                  </button>
                </div>
                <p className="text-sm text-gray-600 line-clamp-2 mb-2">{note.content}</p>
                <p className="text-xs text-gray-400">{note.createdAt}</p>
              </div>
            ))}
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
                className="text-2xl font-bold text-gray-800 bg-transparent border-none focus:outline-none font-handwriting"
                placeholder="Note title..."
              />
              <button
                onClick={saveNote}
                className="px-6 py-2 bg-blue-700 text-white rounded-lg hover:bg-blue-800 flex items-center gap-2"
              >
                <Save className="w-4 h-4" />
                <span className="text-sm font-medium">Save</span>
              </button>
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
