import { useState } from 'react';
import { Search, Filter, BookOpen, Video, FileText, Link as LinkIcon, Star, Download, Eye, Plus } from 'lucide-react';

type Resource = {
  id: number;
  title: string;
  description: string;
  type: 'video' | 'pdf' | 'article' | 'link';
  subject: string;
  rating: number;
  views: number;
  saved: boolean;
  thumbnail?: string;
  url?: string;
};

const resources: Resource[] = [
  {
    id: 1,
    title: 'Introduction to Derivatives',
    description: 'Comprehensive video tutorial covering the basics of derivatives with examples',
    type: 'video',
    subject: 'Mathematics',
    rating: 4.8,
    views: 1234,
    saved: true
  },
  {
    id: 2,
    title: 'Organic Chemistry Study Guide',
    description: 'Complete PDF guide with reactions, mechanisms, and practice problems',
    type: 'pdf',
    subject: 'Chemistry',
    rating: 4.6,
    views: 892,
    saved: false
  },
  {
    id: 3,
    title: 'Quantum Mechanics Explained',
    description: 'Interactive article breaking down complex quantum physics concepts',
    type: 'article',
    subject: 'Physics',
    rating: 4.9,
    views: 2341,
    saved: true
  },
  {
    id: 4,
    title: 'Cell Division Process',
    description: 'Animated explanation of mitosis and meiosis with diagrams',
    type: 'video',
    subject: 'Biology',
    rating: 4.7,
    views: 1567,
    saved: false
  },
  {
    id: 5,
    title: 'Shakespeare Analysis',
    description: 'Deep dive into major themes and literary devices in Hamlet',
    type: 'article',
    subject: 'English',
    rating: 4.5,
    views: 678,
    saved: true
  },
  {
    id: 6,
    title: 'World War II Timeline',
    description: 'Interactive timeline with key events, battles, and historical context',
    type: 'link',
    subject: 'History',
    rating: 4.8,
    views: 1890,
    saved: false
  },
  {
    id: 7,
    title: 'Calculus Practice Problems',
    description: '100+ problems with step-by-step solutions for exam preparation',
    type: 'pdf',
    subject: 'Mathematics',
    rating: 4.9,
    views: 3421,
    saved: true
  },
  {
    id: 8,
    title: 'Thermodynamics Laws',
    description: 'Video series explaining the four laws with real-world applications',
    type: 'video',
    subject: 'Physics',
    rating: 4.7,
    views: 987,
    saved: false
  },
];

const subjects = ['All', 'Mathematics', 'Physics', 'Chemistry', 'Biology', 'English', 'History'];
const types = ['All', 'Video', 'PDF', 'Article', 'Link'];

export default function ResourceLibrary() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('All');
  const [selectedType, setSelectedType] = useState('All');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [savedResources, setSavedResources] = useState<number[]>(
    resources.filter(r => r.saved).map(r => r.id)
  );

  const toggleSave = (id: number) => {
    setSavedResources(prev =>
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const filteredResources = resources.filter(resource => {
    const matchesSearch = resource.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         resource.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesSubject = selectedSubject === 'All' || resource.subject === selectedSubject;
    const matchesType = selectedType === 'All' || resource.type === selectedType.toLowerCase();
    return matchesSearch && matchesSubject && matchesType;
  });

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'video': return <Video size={20} />;
      case 'pdf': return <FileText size={20} />;
      case 'article': return <BookOpen size={20} />;
      case 'link': return <LinkIcon size={20} />;
      default: return <FileText size={20} />;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'video': return 'text-red-600 bg-red-100';
      case 'pdf': return 'text-blue-600 bg-blue-100';
      case 'article': return 'text-green-600 bg-green-100';
      case 'link': return 'text-purple-600 bg-purple-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  return (
    <div className="max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold">Resource Library</h1>
          <p className="text-gray-600">Curated study materials and learning resources</p>
        </div>
        <button className="px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl font-bold hover:shadow-xl transition-all">
          <Plus className="inline mb-1 mr-2" size={20} />
          Add Resource
        </button>
      </div>

      {/* Search and Filters */}
      <div className="bg-white rounded-xl p-6 shadow-md mb-6">
        <div className="flex flex-col md:flex-row gap-4">
          {/* Search */}
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search resources..."
              className="w-full pl-10 pr-4 py-3 rounded-lg border-2 border-gray-200 focus:border-indigo-500 focus:outline-none"
            />
          </div>

          {/* Subject Filter */}
          <select
            value={selectedSubject}
            onChange={(e) => setSelectedSubject(e.target.value)}
            className="px-4 py-3 rounded-lg border-2 border-gray-200 focus:border-indigo-500 focus:outline-none"
          >
            {subjects.map(subject => (
              <option key={subject} value={subject}>{subject}</option>
            ))}
          </select>

          {/* Type Filter */}
          <select
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
            className="px-4 py-3 rounded-lg border-2 border-gray-200 focus:border-indigo-500 focus:outline-none"
          >
            {types.map(type => (
              <option key={type} value={type}>{type}</option>
            ))}
          </select>
        </div>

        <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-200">
          <p className="text-sm text-gray-600">
            Showing <span className="font-bold">{filteredResources.length}</span> resources
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => setViewMode('grid')}
              className={`px-4 py-2 rounded-lg font-medium transition-all ${
                viewMode === 'grid'
                  ? 'bg-indigo-100 text-indigo-700'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Grid
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`px-4 py-2 rounded-lg font-medium transition-all ${
                viewMode === 'list'
                  ? 'bg-indigo-100 text-indigo-700'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              List
            </button>
          </div>
        </div>
      </div>

      {/* Resources Grid/List */}
      {viewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredResources.map(resource => (
            <div key={resource.id} className="bg-white rounded-xl shadow-md hover:shadow-xl transition-all overflow-hidden group">
              {/* Thumbnail */}
              <div className="h-40 bg-gradient-to-br from-indigo-100 to-purple-100 flex items-center justify-center relative">
                <div className={`w-16 h-16 rounded-full ${getTypeColor(resource.type)} flex items-center justify-center`}>
                  {getTypeIcon(resource.type)}
                </div>
                <button
                  onClick={() => toggleSave(resource.id)}
                  className="absolute top-3 right-3 p-2 bg-white rounded-full shadow-md hover:shadow-lg transition-all"
                >
                  <Star
                    size={20}
                    className={savedResources.includes(resource.id) ? 'text-yellow-500 fill-yellow-500' : 'text-gray-400'}
                  />
                </button>
              </div>

              {/* Content */}
              <div className="p-5">
                <div className="flex items-center gap-2 mb-2">
                  <span className={`px-2 py-1 rounded text-xs font-bold uppercase ${getTypeColor(resource.type)}`}>
                    {resource.type}
                  </span>
                  <span className="px-2 py-1 bg-purple-100 text-purple-700 rounded text-xs font-bold">
                    {resource.subject}
                  </span>
                </div>

                <h3 className="font-bold text-lg mb-2 line-clamp-2">{resource.title}</h3>
                <p className="text-sm text-gray-600 mb-4 line-clamp-2">{resource.description}</p>

                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1">
                      <Star className="text-yellow-500 fill-yellow-500" size={16} />
                      <span className="font-bold">{resource.rating}</span>
                    </div>
                    <div className="flex items-center gap-1 text-gray-600">
                      <Eye size={16} />
                      <span>{resource.views}</span>
                    </div>
                  </div>
                  <button className="px-3 py-1 bg-indigo-100 text-indigo-700 rounded-lg font-medium hover:bg-indigo-200 transition-colors">
                    View
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="space-y-4">
          {filteredResources.map(resource => (
            <div key={resource.id} className="bg-white rounded-xl shadow-md hover:shadow-lg transition-all p-6">
              <div className="flex items-start gap-4">
                <div className={`w-12 h-12 rounded-lg ${getTypeColor(resource.type)} flex items-center justify-center flex-shrink-0`}>
                  {getTypeIcon(resource.type)}
                </div>

                <div className="flex-1">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <h3 className="font-bold text-lg mb-1">{resource.title}</h3>
                      <div className="flex items-center gap-2 mb-2">
                        <span className={`px-2 py-1 rounded text-xs font-bold uppercase ${getTypeColor(resource.type)}`}>
                          {resource.type}
                        </span>
                        <span className="px-2 py-1 bg-purple-100 text-purple-700 rounded text-xs font-bold">
                          {resource.subject}
                        </span>
                      </div>
                    </div>
                    <button
                      onClick={() => toggleSave(resource.id)}
                      className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                      <Star
                        size={20}
                        className={savedResources.includes(resource.id) ? 'text-yellow-500 fill-yellow-500' : 'text-gray-400'}
                      />
                    </button>
                  </div>

                  <p className="text-gray-600 mb-3">{resource.description}</p>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4 text-sm">
                      <div className="flex items-center gap-1">
                        <Star className="text-yellow-500 fill-yellow-500" size={16} />
                        <span className="font-bold">{resource.rating}</span>
                      </div>
                      <div className="flex items-center gap-1 text-gray-600">
                        <Eye size={16} />
                        <span>{resource.views} views</span>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button className="px-4 py-2 bg-gray-100 rounded-lg font-medium hover:bg-gray-200 transition-colors">
                        <Download size={16} className="inline mb-1 mr-1" />
                        Download
                      </button>
                      <button className="px-4 py-2 bg-indigo-100 text-indigo-700 rounded-lg font-medium hover:bg-indigo-200 transition-colors">
                        View Resource
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Empty State */}
      {filteredResources.length === 0 && (
        <div className="bg-white rounded-xl p-12 text-center">
          <div className="text-gray-400 mb-4">
            <BookOpen size={64} className="mx-auto" />
          </div>
          <h3 className="text-xl font-bold mb-2">No resources found</h3>
          <p className="text-gray-600">Try adjusting your search or filters</p>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-8">
        <div className="bg-gradient-to-br from-blue-50 to-cyan-50 border-2 border-blue-200 rounded-xl p-6">
          <p className="text-sm text-gray-600 mb-1">Total Resources</p>
          <p className="text-3xl font-bold text-blue-600">{resources.length}</p>
        </div>
        <div className="bg-gradient-to-br from-yellow-50 to-amber-50 border-2 border-yellow-200 rounded-xl p-6">
          <p className="text-sm text-gray-600 mb-1">Saved</p>
          <p className="text-3xl font-bold text-yellow-600">{savedResources.length}</p>
        </div>
        <div className="bg-gradient-to-br from-green-50 to-emerald-50 border-2 border-green-200 rounded-xl p-6">
          <p className="text-sm text-gray-600 mb-1">Subjects</p>
          <p className="text-3xl font-bold text-green-600">{subjects.length - 1}</p>
        </div>
        <div className="bg-gradient-to-br from-purple-50 to-pink-50 border-2 border-purple-200 rounded-xl p-6">
          <p className="text-sm text-gray-600 mb-1">Avg Rating</p>
          <p className="text-3xl font-bold text-purple-600">4.7</p>
        </div>
      </div>
    </div>
  );
}
