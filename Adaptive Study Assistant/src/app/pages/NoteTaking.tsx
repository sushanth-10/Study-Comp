import { useState, useEffect } from 'react';
import { Plus, Save, Trash2, FileText, Search, Lightbulb, Tag, Star } from 'lucide-react';
import { api, NoteData } from '../../lib/api';
import { toast } from 'sonner';

type Note = {
  id: number;
  title: string;
  content: string;
  subject: string;
  tags: string[];
  starred: boolean;
  aiSuggestions: string[];
  createdAt: string;
};

const initialNotes: Note[] = [
  {
    id: 1,
    title: 'Derivatives - Power Rule',
    content: 'The power rule states that if f(x) = x^n, then f\'(x) = nx^(n-1). This is one of the most fundamental rules in calculus.',
    subject: 'Mathematics',
    tags: ['calculus', 'derivatives'],
    starred: true,
    aiSuggestions: [
      'Add examples: d/dx(x³) = 3x²',
      'Link to chain rule notes',
      'Practice problem: Find derivative of 5x⁴'
    ],
    createdAt: '2026-05-15'
  },
  {
    id: 2,
    title: 'Photosynthesis Overview',
    content: 'Photosynthesis is the process by which plants convert light energy into chemical energy. 6CO2 + 6H2O + light → C6H12O6 + 6O2',
    subject: 'Biology',
    tags: ['biology', 'plants'],
    starred: false,
    aiSuggestions: [
      'Add details about chloroplasts',
      'Explain light-dependent vs light-independent reactions',
      'Create a diagram'
    ],
    createdAt: '2026-05-14'
  },
];

export default function NoteTaking() {
  const [notes, setNotes] = useState<Note[]>([]);
  const [selectedNote, setSelectedNote] = useState<Note | null>(null);

  useEffect(() => {
    api.getNotes().then((data) => {
      const mapped: Note[] = data.map((n) => ({
        id: n.id,
        title: n.title,
        content: n.content,
        subject: n.subject,
        tags: n.tags,
        starred: n.starred,
        aiSuggestions: [],
        createdAt: n.created_at.split('T')[0],
      }));
      setNotes(mapped);
      if (mapped.length) setSelectedNote(mapped[0]);
    }).catch(() => setNotes(initialNotes));
  }, []);
  const [searchTerm, setSearchTerm] = useState('');
  const [editMode, setEditMode] = useState(false);

  const filteredNotes = notes.filter(note =>
    note.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    note.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
    note.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const createNewNote = () => {
    const newNote: Note = {
      id: Math.max(...notes.map(n => n.id), 0) + 1,
      title: 'Untitled Note',
      content: '',
      subject: '',
      tags: [],
      starred: false,
      aiSuggestions: [],
      createdAt: new Date().toISOString().split('T')[0]
    };
    setNotes([newNote, ...notes]);
    setSelectedNote(newNote);
    setEditMode(true);
  };

  const updateNote = (updates: Partial<Note>) => {
    if (!selectedNote) return;
    const updated = { ...selectedNote, ...updates };
    setNotes(notes.map(n => n.id === selectedNote.id ? updated : n));
    setSelectedNote(updated);
  };

  const deleteNote = (id: number) => {
    setNotes(notes.filter(n => n.id !== id));
    if (selectedNote?.id === id) {
      setSelectedNote(notes[0] || null);
    }
  };

  const toggleStar = (id: number) => {
    setNotes(notes.map(n => n.id === id ? { ...n, starred: !n.starred } : n));
    if (selectedNote?.id === id) {
      setSelectedNote({ ...selectedNote, starred: !selectedNote.starred });
    }
  };

  const generateAISuggestions = () => {
    if (!selectedNote) return;
    const suggestions = [
      'Consider adding more examples to reinforce the concept',
      'This topic connects well with your other notes on ' + selectedNote.subject,
      'Key point: Break this into smaller subsections for better retention',
      'Suggested quiz question: Create a practice problem based on this'
    ];
    updateNote({ aiSuggestions: suggestions });
  };

  return (
    <div className="flex gap-6 h-[calc(100vh-8rem)] max-w-7xl mx-auto">
      {/* Sidebar */}
      <div className="w-80 flex flex-col gap-4">
        <h2 className="text-2xl font-bold text-white">Notes</h2>
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search notes..."
            className="w-full pl-10 pr-4 py-3 rounded-xl border-2 border-gray-200 focus:border-indigo-500 focus:outline-none"
          />
        </div>

        <button
          onClick={createNewNote}
          className="w-full py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl font-bold hover:shadow-xl transition-all"
        >
          <Plus className="inline mb-1 mr-2" size={20} />
          New Note
        </button>

        {/* Notes List */}
        <div className="flex-1 overflow-y-auto space-y-2 bg-white rounded-xl p-4 shadow-md">
          {filteredNotes.length === 0 ? (
            <p className="text-center text-gray-500 py-8">No notes found</p>
          ) : (
            filteredNotes.map((note) => (
              <button
                key={note.id}
                onClick={() => {
                  setSelectedNote(note);
                  setEditMode(false);
                }}
                className={`w-full text-left p-4 rounded-lg transition-all ${
                  selectedNote?.id === note.id
                    ? 'bg-indigo-100 border-2 border-indigo-500'
                    : 'bg-gray-50 hover:bg-gray-100 border-2 border-transparent'
                }`}
              >
                <div className="flex items-start justify-between mb-2">
                  <h3 className="font-bold truncate flex-1">{note.title}</h3>
                  {note.starred && <Star className="text-yellow-500 fill-yellow-500 flex-shrink-0" size={16} />}
                </div>
                <p className="text-sm text-gray-600 truncate mb-2">{note.content}</p>
                <div className="flex items-center gap-2 text-xs">
                  <span className="px-2 py-1 bg-purple-100 text-purple-700 rounded-full">{note.subject}</span>
                  <span className="text-gray-500">{note.createdAt}</span>
                </div>
              </button>
            ))
          )}
        </div>
      </div>

      {/* Main Content */}
      {selectedNote ? (
        <div className="flex-1 flex flex-col gap-4">
          {/* Editor */}
          <div className="flex-1 bg-white rounded-xl p-6 shadow-md overflow-y-auto">
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                {editMode ? (
                  <input
                    type="text"
                    value={selectedNote.title}
                    onChange={(e) => updateNote({ title: e.target.value })}
                    className="text-3xl font-bold w-full border-b-2 border-gray-200 focus:border-indigo-500 focus:outline-none mb-2"
                  />
                ) : (
                  <h1 className="text-3xl font-bold mb-2">{selectedNote.title}</h1>
                )}
                <div className="flex items-center gap-3">
                  {editMode ? (
                    <input
                      type="text"
                      value={selectedNote.subject}
                      onChange={(e) => updateNote({ subject: e.target.value })}
                      placeholder="Subject"
                      className="px-3 py-1 border-2 border-gray-200 rounded-lg focus:border-indigo-500 focus:outline-none"
                    />
                  ) : (
                    <span className="px-3 py-1 bg-purple-100 text-purple-700 rounded-lg font-medium">
                      {selectedNote.subject}
                    </span>
                  )}
                  <span className="text-sm text-gray-500">{selectedNote.createdAt}</span>
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => toggleStar(selectedNote.id)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <Star
                    className={selectedNote.starred ? 'text-yellow-500 fill-yellow-500' : 'text-gray-400'}
                    size={20}
                  />
                </button>
                <button
                  onClick={() => setEditMode(!editMode)}
                  className="px-4 py-2 bg-indigo-100 text-indigo-700 rounded-lg font-medium hover:bg-indigo-200 transition-colors"
                >
                  {editMode ? 'View' : 'Edit'}
                </button>
                <button
                  onClick={() => deleteNote(selectedNote.id)}
                  className="p-2 hover:bg-red-50 rounded-lg transition-colors"
                >
                  <Trash2 className="text-red-500" size={20} />
                </button>
              </div>
            </div>

            {editMode ? (
              <textarea
                value={selectedNote.content}
                onChange={(e) => updateNote({ content: e.target.value })}
                className="w-full h-[calc(100%-120px)] p-4 border-2 border-gray-200 rounded-lg focus:border-indigo-500 focus:outline-none resize-none"
                placeholder="Start typing your notes..."
              />
            ) : (
              <div className="prose max-w-none">
                <p className="whitespace-pre-wrap">{selectedNote.content}</p>
              </div>
            )}

            {/* Tags */}
            <div className="mt-4 flex items-center gap-2 flex-wrap">
              <Tag size={16} className="text-gray-400" />
              {selectedNote.tags.map((tag, index) => (
                <span key={index} className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-sm">
                  {tag}
                </span>
              ))}
              {editMode && (
                <button className="px-2 py-1 border-2 border-dashed border-gray-300 rounded text-sm text-gray-500 hover:border-indigo-300">
                  + Add tag
                </button>
              )}
            </div>
          </div>

          {/* AI Suggestions */}
          <div className="bg-gradient-to-r from-amber-50 to-orange-50 border-2 border-amber-200 rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold flex items-center gap-2">
                <Lightbulb className="text-amber-600" size={20} />
                AI Study Suggestions
              </h3>
              {selectedNote.aiSuggestions.length === 0 && (
                <button
                  onClick={generateAISuggestions}
                  className="px-4 py-2 bg-amber-500 text-white rounded-lg font-medium hover:bg-amber-600 transition-colors"
                >
                  Generate Suggestions
                </button>
              )}
            </div>

            {selectedNote.aiSuggestions.length > 0 ? (
              <ul className="space-y-2">
                {selectedNote.aiSuggestions.map((suggestion, index) => (
                  <li key={index} className="flex items-start gap-2 text-sm text-gray-700">
                    <span className="text-amber-600 font-bold">•</span>
                    <span>{suggestion}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-gray-600">
                Click "Generate Suggestions" to get AI-powered recommendations to improve your notes!
              </p>
            )}
          </div>
        </div>
      ) : (
        <div className="flex-1 bg-white rounded-xl p-6 shadow-md flex items-center justify-center">
          <div className="text-center text-gray-500">
            <FileText size={64} className="mx-auto mb-4 opacity-50" />
            <p className="text-xl font-medium">No note selected</p>
            <p className="text-sm mt-2">Create a new note or select one from the sidebar</p>
          </div>
        </div>
      )}
    </div>
  );
}
