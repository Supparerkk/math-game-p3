import React, { useState, useEffect } from 'react';
import { Star, Trophy, RefreshCw, Play, Home, Check, X, Book, ArrowLeft, Volume2, VolumeX } from 'lucide-react';

const MultiplicationGame = () => {
  // Game States: 'menu', 'playing', 'summary', 'study_menu', 'study_detail'
  const [gameState, setGameState] = useState('menu');
  const [selectedTable, setSelectedTable] = useState(null); // null means mixed/random
  const [question, setQuestion] = useState({ num1: 0, num2: 0, answers: [] });
  const [questionQueue, setQuestionQueue] = useState([]); // Store the sequence of questions
  const [score, setScore] = useState(0);
  const [questionCount, setQuestionCount] = useState(0);
  const [streak, setStreak] = useState(0);
  const [maxStreak, setMaxStreak] = useState(0);
  const [feedback, setFeedback] = useState(null); // 'correct', 'wrong', or null
  const [totalQuestions] = useState(20); // Number of questions per round
  const [isSoundOn, setIsSoundOn] = useState(true);

  // Sound generator using Web Audio API
  const playSound = (type) => {
    if (!isSoundOn) return;

    try {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (!AudioContext) return;
      
      const ctx = new AudioContext();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      
      osc.connect(gain);
      gain.connect(ctx.destination);
      
      if (type === 'correct') {
        // Ping sound (High pitch sine wave, ramping up slightly)
        osc.type = 'sine';
        osc.frequency.setValueAtTime(500, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(1000, ctx.currentTime + 0.1);
        
        gain.gain.setValueAtTime(0.2, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.5);
        
        osc.start();
        osc.stop(ctx.currentTime + 0.5);
      } else if (type === 'wrong') {
        // Buzz sound (Low pitch sawtooth, descending)
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(150, ctx.currentTime);
        osc.frequency.linearRampToValueAtTime(100, ctx.currentTime + 0.3);
        
        gain.gain.setValueAtTime(0.2, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);
        
        osc.start();
        osc.stop(ctx.currentTime + 0.3);
      } else if (type === 'click') {
        // Soft click
        osc.type = 'sine';
        osc.frequency.setValueAtTime(800, ctx.currentTime);
        gain.gain.setValueAtTime(0.05, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.1);
        osc.start();
        osc.stop(ctx.currentTime + 0.1);
      }
    } catch (e) {
      console.error("Audio play failed", e);
    }
  };

  // Function to generate wrong answers and format the question object
  const createQuestionFromNumbers = (num1, num2) => {
    const correctAnswer = num1 * num2;
    
    // Generate 3 wrong answers that are plausible
    let wrongAnswers = new Set();
    while (wrongAnswers.size < 3) {
      let wrong;
      // Strategy to make wrong answers look confusingly similar
      const strategy = Math.random();
      if (strategy < 0.3) {
        // Close number
        wrong = correctAnswer + (Math.floor(Math.random() * 5) + 1) * (Math.random() < 0.5 ? 1 : -1);
      } else if (strategy < 0.6) {
        // Wrong multiple
        wrong = num1 * (num2 + (Math.floor(Math.random() * 3) + 1) * (Math.random() < 0.5 ? 1 : -1));
      } else {
        // Random plausible number
        wrong = (Math.floor(Math.random() * 11) + 2) * (Math.floor(Math.random() * 12) + 1);
      }

      if (wrong > 0 && wrong !== correctAnswer) {
        wrongAnswers.add(wrong);
      }
    }

    // Combine and shuffle
    const answers = [correctAnswer, ...Array.from(wrongAnswers)]
      .sort(() => Math.random() - 0.5);

    return { num1, num2, correctAnswer, answers };
  };

  // Function to build a queue of unique/balanced questions
  const generateQuestionQueue = (table, count) => {
    let queue = [];
    
    if (table) {
      // Single Table Mode
      const baseSet = Array.from({ length: 12 }, (_, i) => i + 1);
      let pool = [];
      while (pool.length < count) {
        const shuffled = [...baseSet].sort(() => Math.random() - 0.5);
        pool = [...pool, ...shuffled];
      }
      pool = pool.slice(0, count);
      queue = pool.map(n2 => ({ num1: table, num2: n2 }));
    } else {
      // Mixed Mode
      let allPairs = [];
      for (let i = 2; i <= 12; i++) {
        for (let j = 1; j <= 12; j++) {
          allPairs.push({ num1: i, num2: j });
        }
      }
      allPairs.sort(() => Math.random() - 0.5);
      queue = allPairs.slice(0, count);
    }
    return queue;
  };

  const startGame = (table) => {
    playSound('click');
    setSelectedTable(table);
    setScore(0);
    setQuestionCount(0);
    setStreak(0);
    setMaxStreak(0);
    setGameState('playing');
    
    const newQueue = generateQuestionQueue(table, totalQuestions);
    setQuestionQueue(newQueue);
    
    if (newQueue.length > 0) {
      setQuestion(createQuestionFromNumbers(newQueue[0].num1, newQueue[0].num2));
    }
  };

  const handleAnswer = (answer) => {
    if (feedback) return; 

    if (answer === question.correctAnswer) {
      playSound('correct');
      setFeedback('correct');
      setScore(s => s + 10 + (streak * 2)); 
      const newStreak = streak + 1;
      setStreak(newStreak);
      if (newStreak > maxStreak) setMaxStreak(newStreak);
    } else {
      playSound('wrong');
      setFeedback('wrong');
      setStreak(0);
    }

    setTimeout(() => {
      setFeedback(null);
      
      const nextCount = questionCount + 1;
      
      if (nextCount >= totalQuestions) {
        setGameState('summary');
      } else {
        setQuestionCount(nextCount);
        const nextQ = questionQueue[nextCount];
        setQuestion(createQuestionFromNumbers(nextQ.num1, nextQ.num2));
      }
    }, 1500); 
  };

  const getRank = () => {
    if (score >= 350) return { text: "เซียนคณิตศาสตร์! 🏆", color: "text-yellow-600" };
    if (score >= 200) return { text: "เก่งยอดเยี่ยม! ⭐", color: "text-purple-600" };
    if (score >= 100) return { text: "ทำได้ดีมาก! 👍", color: "text-green-600" };
    return { text: "ฝึกฝนต่อไปนะ! 💪", color: "text-blue-600" };
  };

  // --- Components ---

  const SoundToggle = () => (
    <button 
      onClick={() => setIsSoundOn(!isSoundOn)}
      className="absolute top-4 right-4 p-2 bg-white/80 rounded-full shadow-sm hover:bg-white text-gray-500 hover:text-blue-500 transition-colors z-50"
    >
      {isSoundOn ? <Volume2 size={24} /> : <VolumeX size={24} />}
    </button>
  );

  const MenuScreen = () => (
    <div className="flex flex-col items-center w-full max-w-md mx-auto p-4 space-y-6 animate-fade-in relative">
      <SoundToggle />
      <div className="text-center space-y-2 mt-8">
        <h1 className="text-4xl font-bold text-blue-600 drop-shadow-sm">เก่งสูตรคูณ</h1>
        <p className="text-gray-600 text-lg">เลือกแม่สูตรคูณที่อยากฝึกเลย!</p>
      </div>

      <div className="grid grid-cols-3 gap-3 w-full">
        {[2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((num) => (
          <button
            key={num}
            onClick={() => startGame(num)}
            className="bg-white hover:bg-blue-50 border-2 border-blue-200 hover:border-blue-400 text-blue-600 text-xl font-bold py-4 rounded-xl shadow-sm transition-all transform hover:scale-105 active:scale-95"
          >
            แม่ {num}
          </button>
        ))}
      </div>

      <button
        onClick={() => startGame(null)}
        className="w-full bg-gradient-to-r from-orange-400 to-pink-500 text-white text-2xl font-bold py-4 rounded-2xl shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all flex items-center justify-center gap-2"
      >
        <Trophy className="w-8 h-8" />
        ท้าทาย (สุ่มทุกแม่)
      </button>

      <button
        onClick={() => { playSound('click'); setGameState('study_menu'); }}
        className="w-full bg-white text-blue-500 border-2 border-blue-200 text-xl font-bold py-3 rounded-2xl shadow-sm hover:bg-blue-50 transition-all flex items-center justify-center gap-2"
      >
        <Book className="w-6 h-6" />
        ฝึกท่องจำ (ดูตาราง)
      </button>
    </div>
  );

  const StudyMenuScreen = () => (
    <div className="flex flex-col items-center w-full max-w-md mx-auto p-4 space-y-6 animate-fade-in h-full relative">
      <SoundToggle />
      <div className="w-full flex items-center justify-between mt-2">
        <button onClick={() => { playSound('click'); setGameState('menu'); }} className="p-2 rounded-full hover:bg-slate-100">
           <ArrowLeft className="w-6 h-6 text-gray-500" />
        </button>
        <h2 className="text-2xl font-bold text-blue-600">ท่องจำสูตรคูณ</h2>
        <div className="w-10"></div>
      </div>

      <p className="text-gray-600">เลือกแม่ที่ต้องการท่องจำ</p>

      <div className="grid grid-cols-3 gap-3 w-full">
        {[2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((num) => (
          <button
            key={num}
            onClick={() => {
              playSound('click');
              setSelectedTable(num);
              setGameState('study_detail');
            }}
            className="bg-sky-50 hover:bg-sky-100 border-2 border-sky-200 text-sky-600 text-xl font-bold py-4 rounded-xl shadow-sm transition-all"
          >
            แม่ {num}
          </button>
        ))}
      </div>
    </div>
  );

  const StudyDetailScreen = () => {
    return (
      <div className="flex flex-col items-center w-full max-w-md mx-auto p-4 h-full animate-fade-in relative">
        <SoundToggle />
        <div className="w-full flex items-center justify-between mb-4 mt-2">
          <button onClick={() => { playSound('click'); setGameState('study_menu'); }} className="p-2 rounded-full hover:bg-slate-100">
             <ArrowLeft className="w-6 h-6 text-gray-500" />
          </button>
          <h2 className="text-3xl font-bold text-blue-600">สูตรคูณ แม่ {selectedTable}</h2>
          <div className="w-10"></div>
        </div>

        <div className="flex-1 w-full overflow-y-auto pr-2 custom-scrollbar">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((i) => (
                    <div key={i} className={`flex items-center justify-center py-3 text-2xl font-bold border-b last:border-0 ${i % 2 === 0 ? 'bg-slate-50' : 'bg-white'}`}>
                        <span className="w-12 text-right text-slate-600">{selectedTable}</span>
                        <span className="w-8 text-center text-gray-300">x</span>
                        <span className="w-12 text-center text-blue-500">{i}</span>
                        <span className="w-8 text-center text-gray-300">=</span>
                        <span className="w-16 text-left text-orange-500">{selectedTable * i}</span>
                    </div>
                ))}
            </div>
        </div>

        <div className="w-full mt-4 pt-2 border-t border-gray-100">
             <button
                onClick={() => startGame(selectedTable)}
                className="w-full bg-green-500 hover:bg-green-600 text-white text-xl font-bold py-4 rounded-xl shadow-lg flex items-center justify-center gap-2 transition-all transform active:scale-95"
            >
                <Play className="fill-current w-6 h-6" />
                เริ่มทดสอบ แม่ {selectedTable}
            </button>
        </div>
      </div>
    );
  };

  const GameScreen = () => (
    <div className="flex flex-col items-center w-full max-w-md mx-auto p-4 h-full justify-between animate-fade-in relative">
      <SoundToggle />
      {/* Header Stats */}
      <div className="w-full flex justify-between items-center bg-white p-3 rounded-2xl shadow-sm border border-gray-100 mb-4 mt-8">
        <div className="flex items-center gap-2 text-yellow-500 font-bold">
          <Star className="fill-current" />
          <span className="text-xl">{score}</span>
        </div>
        <div className="text-gray-500 font-medium">
          ข้อที่ {questionCount + 1}/{totalQuestions}
        </div>
        <div className={`flex items-center gap-1 font-bold ${streak > 1 ? 'text-orange-500' : 'text-gray-300'}`}>
          🔥 {streak}
        </div>
      </div>

      {/* Question Card */}
      <div className="flex-1 w-full flex flex-col items-center justify-center mb-6 relative">
        <div className="bg-white w-full py-12 rounded-3xl shadow-lg border-b-8 border-blue-100 flex flex-col items-center justify-center relative overflow-hidden">
          <div className="text-2xl text-gray-400 mb-2 font-light">
             {selectedTable ? `แม่ ${selectedTable}` : 'สุ่มแม่'}
          </div>
          <div className="text-7xl font-black text-slate-700 flex items-center gap-4">
            <span>{question.num1}</span>
            <span className="text-blue-400">×</span>
            <span>{question.num2}</span>
          </div>
          
          {/* Feedback Overlay */}
          {feedback && (
            <div className={`absolute inset-0 flex items-center justify-center bg-white/90 z-10 transition-all ${feedback === 'correct' ? 'text-green-500' : 'text-red-500'}`}>
              {feedback === 'correct' ? (
                <div className="flex flex-col items-center animate-bounce">
                  <Check className="w-24 h-24" />
                  <span className="text-3xl font-bold">เยี่ยมมาก!</span>
                </div>
              ) : (
                <div className="flex flex-col items-center animate-pulse">
                  <X className="w-24 h-24" />
                  <span className="text-3xl font-bold">{question.correctAnswer}</span>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Answer Grid */}
      <div className="grid grid-cols-2 gap-4 w-full">
        {question.answers.map((ans, idx) => (
          <button
            key={idx}
            disabled={feedback !== null}
            onClick={() => handleAnswer(ans)}
            className={`py-6 text-3xl font-bold rounded-2xl shadow-md border-b-4 transition-all active:border-b-0 active:translate-y-1 ${
              ['bg-red-100 text-red-600 border-red-200 hover:bg-red-200', 
               'bg-green-100 text-green-600 border-green-200 hover:bg-green-200',
               'bg-yellow-100 text-yellow-600 border-yellow-200 hover:bg-yellow-200',
               'bg-blue-100 text-blue-600 border-blue-200 hover:bg-blue-200'][idx % 4]
            }`}
          >
            {ans}
          </button>
        ))}
      </div>
      
      <button 
        onClick={() => { playSound('click'); setGameState('menu'); }}
        className="mt-6 text-gray-400 hover:text-gray-600 flex items-center gap-2 text-sm"
      >
        <Home className="w-4 h-4" /> กลับหน้าหลัก
      </button>
    </div>
  );

  const SummaryScreen = () => {
    const rank = getRank();
    return (
      <div className="flex flex-col items-center justify-center w-full max-w-md mx-auto p-6 text-center h-full space-y-8 animate-fade-in relative">
        <SoundToggle />
        <div className="relative mt-8">
          <div className="absolute -inset-4 bg-yellow-200 rounded-full blur-xl opacity-50 animate-pulse"></div>
          <Trophy className="w-32 h-32 text-yellow-500 relative z-10 drop-shadow-md" />
        </div>

        <div className="space-y-2">
          <h2 className="text-3xl font-bold text-gray-800">จบเกมแล้ว!</h2>
          <div className={`text-2xl font-bold ${rank.color}`}>{rank.text}</div>
        </div>

        <div className="grid grid-cols-2 gap-4 w-full bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <div className="flex flex-col items-center">
            <span className="text-gray-400 text-sm">คะแนนรวม</span>
            <span className="text-4xl font-black text-blue-600">{score}</span>
          </div>
          <div className="flex flex-col items-center">
            <span className="text-gray-400 text-sm">คอมโบสูงสุด</span>
            <span className="text-4xl font-black text-orange-500">{maxStreak}</span>
          </div>
        </div>

        <div className="flex flex-col w-full gap-3">
          <button
            onClick={() => startGame(selectedTable)}
            className="w-full bg-green-500 hover:bg-green-600 text-white text-xl font-bold py-4 rounded-xl shadow-lg flex items-center justify-center gap-2 transition-colors"
          >
            <RefreshCw className="w-6 h-6" />
            เล่นอีกครั้ง {selectedTable ? `(แม่ ${selectedTable})` : '(สุ่ม)'}
          </button>
          
          <button
            onClick={() => { playSound('click'); setGameState('menu'); }}
            className="w-full bg-white hover:bg-gray-50 text-gray-600 border-2 border-gray-200 text-xl font-bold py-4 rounded-xl shadow-sm flex items-center justify-center gap-2 transition-colors"
          >
            <Home className="w-6 h-6" />
            เลือกแม่สูตรคูณใหม่
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans selection:bg-blue-100 flex items-center justify-center overflow-hidden">
      {gameState === 'menu' && <MenuScreen />}
      {gameState === 'study_menu' && <StudyMenuScreen />}
      {gameState === 'study_detail' && <StudyDetailScreen />}
      {gameState === 'playing' && <GameScreen />}
      {gameState === 'summary' && <SummaryScreen />}
    </div>
  );
};

export default MultiplicationGame;