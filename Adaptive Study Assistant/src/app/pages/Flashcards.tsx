import { useState } from 'react';
import { RotateCcw, ThumbsUp, ThumbsDown, Shuffle, Plus, BookOpen, Zap } from 'lucide-react';

type Flashcard = {
  id: number;
  front: string;
  back: string;
  subject: string;
  repetitions: number;
  easeFactor: number;
  nextReview: Date;
  interval: number;
};

const initialCards: Flashcard[] = [
  {
    id: 1,
    front: 'What is the Pythagorean theorem?',
    back: 'a² + b² = c², where c is the hypotenuse of a right triangle and a and b are the other two sides.',
    subject: 'Mathematics',
    repetitions: 0,
    easeFactor: 2.5,
    nextReview: new Date(),
    interval: 0
  },
  {
    id: 2,
    front: 'Define photosynthesis',
    back: 'The process by which plants use sunlight, water, and carbon dioxide to produce oxygen and energy in the form of sugar.',
    subject: 'Biology',
    repetitions: 0,
    easeFactor: 2.5,
    nextReview: new Date(),
    interval: 0
  },
  {
    id: 3,
    front: 'What is Newton\'s First Law?',
    back: 'An object at rest stays at rest, and an object in motion stays in motion unless acted upon by an external force.',
    subject: 'Physics',
    repetitions: 0,
    easeFactor: 2.5,
    nextReview: new Date(),
    interval: 0
  },
  {
    id: 4,
    front: 'What is the capital of France?',
    back: 'Paris',
    subject: 'Geography',
    repetitions: 0,
    easeFactor: 2.5,
    nextReview: new Date(),
    interval: 0
  },
  {
    id: 5,
    front: 'Define mitosis',
    back: 'Cell division that results in two daughter cells, each having the same number of chromosomes as the parent nucleus.',
    subject: 'Biology',
    repetitions: 0,
    easeFactor: 2.5,
    nextReview: new Date(),
    interval: 0
  },
];

export default function Flashcards() {
  const [cards, setCards] = useState<Flashcard[]>(initialCards);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [studyMode, setStudyMode] = useState<'all' | 'due'>('all');
  const [showStats, setShowStats] = useState(false);

  const currentCard = cards[currentIndex];
  const dueCards = cards.filter(card => card.nextReview <= new Date());

  const calculateNextReview = (card: Flashcard, quality: number) => {
    let newInterval = 0;
    let newRepetitions = card.repetitions;
    let newEaseFactor = card.easeFactor;

    if (quality >= 3) {
      if (newRepetitions === 0) {
        newInterval = 1;
      } else if (newRepetitions === 1) {
        newInterval = 6;
      } else {
        newInterval = Math.round(card.interval * card.easeFactor);
      }
      newRepetitions += 1;
    } else {
      newRepetitions = 0;
      newInterval = 1;
    }

    newEaseFactor = card.easeFactor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02));
    if (newEaseFactor < 1.3) {
      newEaseFactor = 1.3;
    }

    const nextReview = new Date();
    nextReview.setDate(nextReview.getDate() + newInterval);

    return {
      ...card,
      repetitions: newRepetitions,
      easeFactor: newEaseFactor,
      interval: newInterval,
      nextReview
    };
  };

  const handleResponse = (difficulty: 'hard' | 'good' | 'easy') => {
    if (!isFlipped) return;

    const quality = difficulty === 'hard' ? 2 : difficulty === 'good' ? 3 : 4;
    const updatedCard = calculateNextReview(currentCard, quality);

    const newCards = [...cards];
    newCards[currentIndex] = updatedCard;
    setCards(newCards);

    setIsFlipped(false);
    if (currentIndex < cards.length - 1) {
      setCurrentIndex(currentIndex + 1);
    } else {
      setCurrentIndex(0);
    }
  };

  const shuffleCards = () => {
    const shuffled = [...cards].sort(() => Math.random() - 0.5);
    setCards(shuffled);
    setCurrentIndex(0);
    setIsFlipped(false);
  };

  const resetProgress = () => {
    const resetCards = cards.map(card => ({
      ...card,
      repetitions: 0,
      easeFactor: 2.5,
      nextReview: new Date(),
      interval: 0
    }));
    setCards(resetCards);
    setCurrentIndex(0);
    setIsFlipped(false);
  };

  const masteredCount = cards.filter(c => c.repetitions >= 3).length;
  const learningCount = cards.filter(c => c.repetitions > 0 && c.repetitions < 3).length;
  const newCount = cards.filter(c => c.repetitions === 0).length;

  return (
    <div className="max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold">Flashcards</h1>
          <p className="text-gray-600">Spaced Repetition System</p>
        </div>
        <button
          onClick={() => setShowStats(!showStats)}
          className="px-4 py-2 bg-white rounded-lg shadow-md hover:shadow-lg transition-all border-2 border-indigo-200"
        >
          <BookOpen size={20} className="inline mr-2" />
          {showStats ? 'Hide' : 'Show'} Stats
        </button>
      </div>

      {showStats && (
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="bg-gradient-to-br from-green-50 to-emerald-50 border-2 border-green-200 rounded-xl p-6">
            <p className="text-sm text-gray-600 mb-1">Mastered</p>
            <p className="text-3xl font-bold text-green-600">{masteredCount}</p>
            <p className="text-xs text-gray-600 mt-1">3+ repetitions</p>
          </div>
          <div className="bg-gradient-to-br from-yellow-50 to-amber-50 border-2 border-yellow-200 rounded-xl p-6">
            <p className="text-sm text-gray-600 mb-1">Learning</p>
            <p className="text-3xl font-bold text-yellow-600">{learningCount}</p>
            <p className="text-xs text-gray-600 mt-1">1-2 repetitions</p>
          </div>
          <div className="bg-gradient-to-br from-blue-50 to-cyan-50 border-2 border-blue-200 rounded-xl p-6">
            <p className="text-sm text-gray-600 mb-1">New</p>
            <p className="text-3xl font-bold text-blue-600">{newCount}</p>
            <p className="text-xs text-gray-600 mt-1">Not studied yet</p>
          </div>
        </div>
      )}

      {/* Mode Selector */}
      <div className="flex gap-3 mb-6">
        <button
          onClick={() => setStudyMode('all')}
          className={`flex-1 py-3 rounded-xl font-bold transition-all ${
            studyMode === 'all'
              ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg'
              : 'bg-white border-2 border-gray-200 hover:border-gray-300'
          }`}
        >
          All Cards ({cards.length})
        </button>
        <button
          onClick={() => setStudyMode('due')}
          className={`flex-1 py-3 rounded-xl font-bold transition-all ${
            studyMode === 'due'
              ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg'
              : 'bg-white border-2 border-gray-200 hover:border-gray-300'
          }`}
        >
          Due for Review ({dueCards.length})
        </button>
      </div>

      {/* Flashcard */}
      <div className="relative mb-6">
        <div
          className="bg-white rounded-2xl shadow-2xl p-12 min-h-[400px] flex flex-col justify-center items-center cursor-pointer transition-all hover:shadow-3xl"
          onClick={() => setIsFlipped(!isFlipped)}
        >
          <div className="absolute top-4 left-4 flex items-center gap-2">
            <span className="px-3 py-1 bg-indigo-100 text-indigo-700 rounded-full text-sm font-bold">
              {currentIndex + 1}/{cards.length}
            </span>
            <span className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-sm font-bold">
              {currentCard.subject}
            </span>
          </div>

          {currentCard.repetitions > 0 && (
            <div className="absolute top-4 right-4">
              <div className="flex items-center gap-1">
                {[...Array(currentCard.repetitions)].map((_, i) => (
                  <Zap key={i} size={16} className="text-amber-400 fill-amber-400" />
                ))}
              </div>
            </div>
          )}

          <div className="text-center">
            <p className="text-sm text-gray-500 mb-4">{isFlipped ? 'Answer' : 'Question'}</p>
            <p className="text-2xl font-bold mb-6">
              {isFlipped ? currentCard.back : currentCard.front}
            </p>
            {!isFlipped && (
              <p className="text-gray-500 text-sm">Click to reveal answer</p>
            )}
          </div>

          <RotateCcw
            className={`absolute bottom-4 right-4 text-gray-400 transition-transform ${
              isFlipped ? 'rotate-180' : ''
            }`}
            size={24}
          />
        </div>
      </div>

      {/* Response Buttons */}
      {isFlipped && (
        <div className="grid grid-cols-3 gap-4 mb-6">
          <button
            onClick={() => handleResponse('hard')}
            className="py-4 px-6 bg-red-500 text-white rounded-xl font-bold hover:bg-red-600 transition-all hover:shadow-lg"
          >
            <ThumbsDown className="inline mb-1 mr-2" size={20} />
            Hard
            <p className="text-xs mt-1 opacity-80">Review soon</p>
          </button>
          <button
            onClick={() => handleResponse('good')}
            className="py-4 px-6 bg-yellow-500 text-white rounded-xl font-bold hover:bg-yellow-600 transition-all hover:shadow-lg"
          >
            <span className="text-2xl">👍</span>
            <p className="font-bold">Good</p>
            <p className="text-xs mt-1 opacity-80">Normal interval</p>
          </button>
          <button
            onClick={() => handleResponse('easy')}
            className="py-4 px-6 bg-green-500 text-white rounded-xl font-bold hover:bg-green-600 transition-all hover:shadow-lg"
          >
            <ThumbsUp className="inline mb-1 mr-2" size={20} />
            Easy
            <p className="text-xs mt-1 opacity-80">Longer interval</p>
          </button>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex gap-4">
        <button
          onClick={shuffleCards}
          className="flex-1 py-3 px-6 bg-white border-2 border-gray-200 rounded-xl font-bold hover:border-indigo-300 hover:bg-indigo-50 transition-all"
        >
          <Shuffle className="inline mb-1 mr-2" size={20} />
          Shuffle
        </button>
        <button
          onClick={resetProgress}
          className="flex-1 py-3 px-6 bg-white border-2 border-gray-200 rounded-xl font-bold hover:border-purple-300 hover:bg-purple-50 transition-all"
        >
          <RotateCcw className="inline mb-1 mr-2" size={20} />
          Reset Progress
        </button>
        <button
          className="flex-1 py-3 px-6 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl font-bold hover:shadow-xl transition-all"
        >
          <Plus className="inline mb-1 mr-2" size={20} />
          Add Card
        </button>
      </div>

      {/* Info Box */}
      <div className="mt-6 bg-gradient-to-r from-blue-50 to-cyan-50 border-2 border-blue-200 rounded-xl p-6">
        <h3 className="font-bold mb-2 flex items-center gap-2">
          <BookOpen size={20} className="text-blue-600" />
          How Spaced Repetition Works
        </h3>
        <p className="text-gray-700 text-sm">
          The system schedules reviews based on how well you know each card. Cards you find "Easy" are shown less frequently,
          while "Hard" cards appear more often. This scientifically-proven method optimizes long-term retention!
        </p>
      </div>
    </div>
  );
}
