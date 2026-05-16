import { useState, useEffect } from 'react';
import { Brain, Clock, Zap, TrendingUp, TrendingDown, CheckCircle2, XCircle, Lightbulb } from 'lucide-react';

type QuestionType = {
  id: number;
  question: string;
  options: string[];
  correctAnswer: number;
  difficulty: 'easy' | 'medium' | 'hard';
  explanation: string;
  topic: string;
};

const questionBank: QuestionType[] = [
  {
    id: 1,
    question: 'What is 5 + 3?',
    options: ['7', '8', '9', '10'],
    correctAnswer: 1,
    difficulty: 'easy',
    explanation: '5 + 3 = 8. This is basic addition.',
    topic: 'Basic Math'
  },
  {
    id: 2,
    question: 'What is the derivative of x²?',
    options: ['x', '2x', 'x³', '2'],
    correctAnswer: 1,
    difficulty: 'medium',
    explanation: 'Using the power rule: d/dx(x²) = 2x¹ = 2x',
    topic: 'Calculus'
  },
  {
    id: 3,
    question: 'Solve: ∫(2x + 3)dx',
    options: ['x² + 3x + C', '2x² + 3x + C', 'x² + 3 + C', '2x + C'],
    correctAnswer: 0,
    difficulty: 'hard',
    explanation: '∫2x dx = x², ∫3 dx = 3x, combined: x² + 3x + C',
    topic: 'Integration'
  },
  {
    id: 4,
    question: 'What is 12 × 7?',
    options: ['72', '84', '96', '108'],
    correctAnswer: 1,
    difficulty: 'easy',
    explanation: '12 × 7 = 84. This is multiplication.',
    topic: 'Basic Math'
  },
  {
    id: 5,
    question: 'What is the quadratic formula?',
    options: ['x = -b ± √(b² - 4ac) / 2a', 'x = b ± √(b² + 4ac) / 2a', 'x = -b ± √(b² + 4ac) / a', 'x = b ± √(b² - 4ac) / a'],
    correctAnswer: 0,
    difficulty: 'medium',
    explanation: 'The quadratic formula solves ax² + bx + c = 0',
    topic: 'Algebra'
  },
];

export default function AdaptiveQuiz() {
  const [gameState, setGameState] = useState<'setup' | 'playing' | 'review'>('setup');
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [showFeedback, setShowFeedback] = useState(false);
  const [score, setScore] = useState(0);
  const [responseTime, setResponseTime] = useState(0);
  const [questionStartTime, setQuestionStartTime] = useState(Date.now());
  const [difficulty, setDifficulty] = useState<'easy' | 'medium' | 'hard'>('medium');
  const [performanceData, setPerformanceData] = useState<{
    correct: boolean;
    time: number;
    difficulty: string;
  }[]>([]);
  const [learningState, setLearningState] = useState<'struggling' | 'bored' | 'optimal' | 'fatigued'>('optimal');
  const [consecutiveCorrect, setConsecutiveCorrect] = useState(0);
  const [consecutiveWrong, setConsecutiveWrong] = useState(0);

  const questions = questionBank.filter(q => q.difficulty === difficulty).slice(0, 5);
  const currentQ = questions[currentQuestion];

  useEffect(() => {
    if (gameState === 'playing') {
      setQuestionStartTime(Date.now());
    }
  }, [currentQuestion, gameState]);

  const analyzeLearningState = (correct: boolean, timeTaken: number) => {
    if (!correct && timeTaken > 30) {
      return 'struggling';
    } else if (correct && timeTaken < 5) {
      return 'bored';
    } else if (timeTaken > 60) {
      return 'fatigued';
    }
    return 'optimal';
  };

  const adjustDifficulty = () => {
    if (consecutiveCorrect >= 2) {
      if (difficulty === 'easy') setDifficulty('medium');
      else if (difficulty === 'medium') setDifficulty('hard');
    } else if (consecutiveWrong >= 2) {
      if (difficulty === 'hard') setDifficulty('medium');
      else if (difficulty === 'medium') setDifficulty('easy');
    }
  };

  const handleAnswer = (answerIndex: number) => {
    if (showFeedback) return;

    const timeTaken = (Date.now() - questionStartTime) / 1000;
    setResponseTime(timeTaken);
    setSelectedAnswer(answerIndex);
    setShowFeedback(true);

    const correct = answerIndex === currentQ.correctAnswer;
    if (correct) {
      setScore(score + 1);
      setConsecutiveCorrect(consecutiveCorrect + 1);
      setConsecutiveWrong(0);
    } else {
      setConsecutiveWrong(consecutiveWrong + 1);
      setConsecutiveCorrect(0);
    }

    const state = analyzeLearningState(correct, timeTaken);
    setLearningState(state);

    setPerformanceData([...performanceData, { correct, time: timeTaken, difficulty }]);
  };

  const nextQuestion = () => {
    if (currentQuestion < questions.length - 1) {
      adjustDifficulty();
      setCurrentQuestion(currentQuestion + 1);
      setSelectedAnswer(null);
      setShowFeedback(false);
    } else {
      setGameState('review');
    }
  };

  const startQuiz = () => {
    setGameState('playing');
    setCurrentQuestion(0);
    setScore(0);
    setPerformanceData([]);
    setConsecutiveCorrect(0);
    setConsecutiveWrong(0);
  };

  const getLearningStateMessage = () => {
    switch (learningState) {
      case 'struggling':
        return { text: 'Taking your time - that\'s okay! Let me adjust the difficulty.', icon: '🤔', color: 'amber' };
      case 'bored':
        return { text: 'You\'re crushing this! Time for a challenge.', icon: '🚀', color: 'green' };
      case 'fatigued':
        return { text: 'Seems like you need a break. Consider switching to lighter content.', icon: '😴', color: 'blue' };
      default:
        return { text: 'Great pace! You\'re in the optimal learning zone.', icon: '✨', color: 'purple' };
    }
  };

  if (gameState === 'setup') {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <div className="text-center mb-8">
            <div className="w-20 h-20 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-full mx-auto mb-4 flex items-center justify-center">
              <Brain className="text-white" size={40} />
            </div>
            <h1 className="text-4xl font-bold mb-2">Adaptive Quiz</h1>
            <p className="text-gray-600">AI-powered quiz that adapts to your performance in real-time</p>
          </div>

          <div className="space-y-6 mb-8">
            <div className="bg-gradient-to-r from-indigo-50 to-purple-50 p-6 rounded-xl border-2 border-indigo-200">
              <h3 className="font-bold mb-3 flex items-center gap-2">
                <Zap className="text-indigo-600" size={20} />
                How it works
              </h3>
              <ul className="space-y-2 text-gray-700">
                <li className="flex items-start gap-2">
                  <span className="text-indigo-600 font-bold">•</span>
                  <span>Questions automatically adjust difficulty based on your answers</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-indigo-600 font-bold">•</span>
                  <span>AI detects if you're struggling, bored, or fatigued</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-indigo-600 font-bold">•</span>
                  <span>Response time is analyzed to optimize your learning experience</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-indigo-600 font-bold">•</span>
                  <span>Get instant explanations after each question</span>
                </li>
              </ul>
            </div>

            <div>
              <label className="block font-bold mb-3">Starting Difficulty</label>
              <div className="grid grid-cols-3 gap-4">
                {(['easy', 'medium', 'hard'] as const).map((diff) => (
                  <button
                    key={diff}
                    onClick={() => setDifficulty(diff)}
                    className={`p-4 rounded-xl border-2 transition-all ${
                      difficulty === diff
                        ? 'border-indigo-500 bg-indigo-50 shadow-md'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="font-bold capitalize">{diff}</div>
                    <div className="text-sm text-gray-600 mt-1">
                      {diff === 'easy' && 'Basic concepts'}
                      {diff === 'medium' && 'Intermediate'}
                      {diff === 'hard' && 'Advanced'}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>

          <button
            onClick={startQuiz}
            className="w-full py-4 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl font-bold text-lg hover:shadow-xl transition-all hover:-translate-y-1"
          >
            Start Adaptive Quiz
          </button>
        </div>
      </div>
    );
  }

  if (gameState === 'review') {
    const avgTime = performanceData.reduce((acc, p) => acc + p.time, 0) / performanceData.length;
    const accuracy = (score / questions.length) * 100;

    return (
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <div className="text-center mb-8">
            <div className="text-6xl mb-4">🎉</div>
            <h2 className="text-3xl font-bold mb-2">Quiz Complete!</h2>
            <p className="text-gray-600">Here's how you performed</p>
          </div>

          <div className="grid grid-cols-3 gap-4 mb-8">
            <div className="bg-gradient-to-br from-green-50 to-emerald-50 p-6 rounded-xl border-2 border-green-200">
              <p className="text-sm text-gray-600 mb-1">Score</p>
              <p className="text-3xl font-bold text-green-600">{score}/{questions.length}</p>
            </div>
            <div className="bg-gradient-to-br from-blue-50 to-cyan-50 p-6 rounded-xl border-2 border-blue-200">
              <p className="text-sm text-gray-600 mb-1">Accuracy</p>
              <p className="text-3xl font-bold text-blue-600">{accuracy.toFixed(0)}%</p>
            </div>
            <div className="bg-gradient-to-br from-purple-50 to-pink-50 p-6 rounded-xl border-2 border-purple-200">
              <p className="text-sm text-gray-600 mb-1">Avg Time</p>
              <p className="text-3xl font-bold text-purple-600">{avgTime.toFixed(1)}s</p>
            </div>
          </div>

          <div className="bg-gradient-to-r from-amber-50 to-orange-50 p-6 rounded-xl border-2 border-amber-200 mb-8">
            <h3 className="font-bold mb-3 flex items-center gap-2">
              <Lightbulb className="text-amber-600" size={20} />
              AI Analysis
            </h3>
            <p className="text-gray-700">
              {accuracy >= 80 && avgTime < 20 && 'Excellent performance! You have a strong grasp of the material. Consider moving to more advanced topics.'}
              {accuracy >= 80 && avgTime >= 20 && 'Good accuracy but you\'re taking your time. This might indicate you\'re being careful, which is great!'}
              {accuracy < 80 && accuracy >= 60 && 'You\'re on the right track! A bit more practice will help solidify these concepts.'}
              {accuracy < 60 && 'Consider reviewing the fundamentals. Breaking down concepts into smaller chunks might help.'}
            </p>
          </div>

          <div className="flex gap-4">
            <button
              onClick={startQuiz}
              className="flex-1 py-4 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl font-bold hover:shadow-xl transition-all"
            >
              Try Again
            </button>
            <button
              onClick={() => setGameState('setup')}
              className="flex-1 py-4 border-2 border-gray-300 rounded-xl font-bold hover:bg-gray-50 transition-all"
            >
              Back to Setup
            </button>
          </div>
        </div>
      </div>
    );
  }

  const stateInfo = getLearningStateMessage();

  return (
    <div className="max-w-4xl mx-auto">
      {/* Progress Bar */}
      <div className="bg-white rounded-xl shadow-md p-4 mb-6">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium">Question {currentQuestion + 1}/{questions.length}</span>
          <span className="text-sm font-medium">Score: {score}/{currentQuestion + (showFeedback ? 1 : 0)}</span>
        </div>
        <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 transition-all duration-300"
            style={{ width: `${((currentQuestion + 1) / questions.length) * 100}%` }}
          />
        </div>
      </div>

      {/* Learning State Indicator */}
      <div className={`bg-gradient-to-r from-${stateInfo.color}-50 to-${stateInfo.color}-100 border-2 border-${stateInfo.color}-200 rounded-xl p-4 mb-6`}>
        <div className="flex items-center gap-3">
          <span className="text-2xl">{stateInfo.icon}</span>
          <div>
            <p className="font-bold text-sm">Learning State: {learningState.charAt(0).toUpperCase() + learningState.slice(1)}</p>
            <p className="text-sm text-gray-700">{stateInfo.text}</p>
          </div>
          <div className="ml-auto flex items-center gap-2 text-sm">
            <Clock size={16} />
            <span className="font-mono">{responseTime > 0 ? `${responseTime.toFixed(1)}s` : '--'}</span>
          </div>
        </div>
      </div>

      {/* Question Card */}
      <div className="bg-white rounded-2xl shadow-xl p-8">
        <div className="flex items-center justify-between mb-6">
          <span className={`px-4 py-1 rounded-full text-sm font-bold ${
            difficulty === 'easy' ? 'bg-green-100 text-green-700' :
            difficulty === 'medium' ? 'bg-yellow-100 text-yellow-700' :
            'bg-red-100 text-red-700'
          }`}>
            {difficulty.toUpperCase()}
          </span>
          <span className="text-sm text-gray-600">{currentQ.topic}</span>
        </div>

        <h3 className="text-2xl font-bold mb-8">{currentQ.question}</h3>

        <div className="space-y-3 mb-8">
          {currentQ.options.map((option, index) => {
            const isSelected = selectedAnswer === index;
            const isCorrect = index === currentQ.correctAnswer;
            const showResult = showFeedback;

            let className = 'w-full p-4 rounded-xl border-2 text-left transition-all ';
            if (!showResult) {
              className += isSelected
                ? 'border-indigo-500 bg-indigo-50'
                : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50';
            } else {
              if (isCorrect) {
                className += 'border-green-500 bg-green-50';
              } else if (isSelected && !isCorrect) {
                className += 'border-red-500 bg-red-50';
              } else {
                className += 'border-gray-200 bg-gray-50';
              }
            }

            return (
              <button
                key={index}
                onClick={() => handleAnswer(index)}
                disabled={showFeedback}
                className={className}
              >
                <div className="flex items-center justify-between">
                  <span className="font-medium">{option}</span>
                  {showResult && (
                    <>
                      {isCorrect && <CheckCircle2 className="text-green-600" size={24} />}
                      {isSelected && !isCorrect && <XCircle className="text-red-600" size={24} />}
                    </>
                  )}
                </div>
              </button>
            );
          })}
        </div>

        {showFeedback && (
          <div className={`p-6 rounded-xl mb-6 ${
            selectedAnswer === currentQ.correctAnswer
              ? 'bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-200'
              : 'bg-gradient-to-r from-red-50 to-pink-50 border-2 border-red-200'
          }`}>
            <div className="flex items-start gap-3">
              {selectedAnswer === currentQ.correctAnswer ? (
                <>
                  <CheckCircle2 className="text-green-600 flex-shrink-0" size={24} />
                  <div>
                    <p className="font-bold text-green-700 mb-1">Correct!</p>
                    <p className="text-gray-700">{currentQ.explanation}</p>
                  </div>
                </>
              ) : (
                <>
                  <XCircle className="text-red-600 flex-shrink-0" size={24} />
                  <div>
                    <p className="font-bold text-red-700 mb-1">Not quite right</p>
                    <p className="text-gray-700">{currentQ.explanation}</p>
                  </div>
                </>
              )}
            </div>
          </div>
        )}

        {showFeedback && (
          <button
            onClick={nextQuestion}
            className="w-full py-4 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl font-bold hover:shadow-xl transition-all"
          >
            {currentQuestion < questions.length - 1 ? 'Next Question' : 'See Results'}
          </button>
        )}
      </div>
    </div>
  );
}
