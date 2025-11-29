import React, { useState, useEffect } from 'react';
import { Star, Gift, RefreshCw, Play, Home, Check, X, Book, ArrowLeft, Volume2, VolumeX, Snowflake, Trees } from 'lucide-react';

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
        // Jingle bell-ish sound (Higher pitch, sparkling)
        osc.type = 'sine';
        osc.frequency.setValueAtTime(880, ctx.currentTime); // A5
        osc.frequency.exponentialRampToValueAtTime(1760, ctx.currentTime + 0.1);
        
        gain.gain.setValueAtTime(0.1, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.5);
        
        osc.start();
        osc.stop(ctx.currentTime + 0.5);
      } else if (type === 'wrong') {
        // Low buzzer
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(150, ctx.currentTime);
        osc.frequency.linearRampToValueAtTime(100, ctx.currentTime + 0.3);
        
        gain.gain.setValueAtTime(0.1, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);
        
        osc.start();
        osc.stop(ctx.currentTime + 0.3);
      } else if (type === 'click') {
        // Soft woodblock sound
        osc.type = 'sine';
        osc.frequency.setValueAtTime(600, ctx.currentTime);
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
    
    let wrongAnswers = new Set();
    while (wrongAnswers.size < 3) {
      let wrong;
      const strategy = Math.random();
      if (strategy < 0.3) {
        wrong = correctAnswer + (Math.floor(Math.random() * 5) + 1) * (Math.random() < 0.5 ? 1 : -1);
      } else if (strategy < 0.6) {
        wrong = num1 * (num2 + (Math.floor(Math.random() * 3) + 1) * (Math.random() < 0.5 ? 1 : -1));
      } else {
        wrong = (Math.floor(Math.random() * 11) + 2) * (Math.floor(Math.random() * 12) + 1);
      }

      if (wrong > 0 && wrong !== correctAnswer) {
        wrongAnswers.add(wrong);
      }
    }

    const answers = [correctAnswer, ...Array.from(wrongAnswers)]
      .sort(() => Math.random() - 0.5);

    return { num1, num2, correctAnswer, answers };
  };

  const generateQuestionQueue = (table, count) => {
    let queue = [];
    if (table) {
      const baseSet = Array.from({ length: 12 }, (_, i) => i + 1);
      let pool = [];
      while (pool.length < count) {
        const shuffled = [...baseSet].sort(() => Math.random() - 0.5);
        pool = [...pool, ...shuffled];
      }
      pool = pool.slice(0, count);
      queue = pool.map(n2 => ({ num1: table, num2: n2 }));
    } else {
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
    if (score >= 350) return { text: "สุดยอดซานต้า! 🎅🎁", color: "text-red-600" };
    if (score >= 200) return { text: "เก่งเหมือนเอลฟ์! 🧝", color: "text-green-600" };
    if (score >= 100) return { text: "ทำได้ดีมาก! 🎄", color: "text-yellow-600" };
    return { text: "ฝึกฝนต่อไปนะ! ⛄", color: "text-blue-500" };
  };

  // --- Decorative Snow Component ---
  const SnowBackground = () => (
    <div className="absolute inset-0 pointer-events-none overflow-hidden z-0">
      {[...Array(20)].map((_, i) => (
        <div 
          key={i}
          className="absolute text-white opacity-20 animate-pulse"
          style={{
            top: `${Math.random() * 100}%`,
            left: `${Math.random() * 100}%`,
            fontSize: `${Math.random() * 20 + 10}px`,
            animationDuration: `${Math.random() * 3 + 2}s`
          }}
        >
          ❄
        </div>
      ))}
    </div>
  );

  // --- Components ---

  const SoundToggle = () => (
    <button 
      onClick={() => setIsSoundOn(!isSoundOn)}
      className="absolute top-4 right-4 p-2 bg-white/90 rounded-full shadow-md hover:bg-white text-green-700 hover:text-green-900 transition-colors z-50 border-2 border-green-100"
    >
      {isSoundOn ? <Volume2 size={24} /> : <VolumeX size={24} />}
    </button>
  );

  const MenuScreen = () => (
    <div className="flex flex-col items-center w-full max-w-md mx-auto p-4 space-y-6 animate-fade-in relative z-10">
      <SoundToggle />
      <div className="text-center space-y-2 mt-8">
        <div className="flex items-center justify-center gap-2">
            <Trees className="text-green-600 w-10 h-10" />
            <h1 className="text-5xl font-black text-red-600 drop-shadow-md tracking-wider" style={{ fontFamily: 'cursive' }}>Merry Math</h1>
            <Trees className="text-green-600 w-10 h-10" />
        </div>
        <p className="text-green-800 text-lg font-medium bg-white/80 px-4 py-1 rounded-full inline-block backdrop-blur-sm">
          🎄 ฝึกสูตรคูณต้อนรับคริสต์มาส 🎄
        </p>
      </div>

      <div className="grid grid-cols-3 gap-3 w-full">
        {[2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((num) => (
          <button
            key={num}
            onClick={() => startGame(num)}
            className="bg-white/95 hover:bg-green-50 border-b-4 border-green-200 hover:border-green-400 text-green-700 text-xl font-bold py-4 rounded-xl shadow-sm transition-all transform hover:scale-105 active:scale-95 relative overflow-hidden group"
          >
            <div className="absolute top-0 right-0 p-1 opacity-20 group-hover:opacity-40 text-red-500">
                <Snowflake size={16} />
            </div>
            แม่ {num}
          </button>
        ))}
      </div>

      <button
        onClick={() => startGame(null)}
        className="w-full bg-gradient-to-r from-red-500 to-red-600 text-white text-2xl font-bold py-4 rounded-2xl shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all flex items-center justify-center gap-2 border-b-4 border-red-800"
      >
        <Gift className="w-8 h-8 animate-bounce" />
        ท้าทาย (กล่องสุ่ม)
      </button>

      <button
        onClick={() => { playSound('click'); setGameState('study_menu'); }}
        className="w-full bg-white text-green-700 border-2 border-green-200 text-xl font-bold py-3 rounded-2xl shadow-sm hover:bg-green-50 transition-all flex items-center justify-center gap-2"
      >
        <Book className="w-6 h-6" />
        ฝึกท่องจำ (ดูตาราง)
      </button>
    </div>
  );

  const StudyMenuScreen = () => (
    <div className="flex flex-col items-center w-full max-w-md mx-auto p-4 space-y-6 animate-fade-in h-full relative z-10">
      <SoundToggle />
      <div className="w-full flex items-center justify-between mt-2">
        <button onClick={() => { playSound('click'); setGameState('menu'); }} className="p-2 rounded-full bg-white/80 hover:bg-white text-green-700">
           <ArrowLeft className="w-6 h-6" />
        </button>
        <h2 className="text-2xl font-bold text-green-800 drop-shadow-sm bg-white/60 px-4 py-1 rounded-lg">ท่องจำสูตรคูณ</h2>
        <div className="w-10"></div>
      </div>

      <div className="grid grid-cols-3 gap-3 w-full">
        {[2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((num) => (
          <button
            key={num}
            onClick={() => {
              playSound('click');
              setSelectedTable(num);
              setGameState('study_detail');
            }}
            className="bg-red-50 hover:bg-red-100 border-2 border-red-200 text-red-600 text-xl font-bold py-4 rounded-xl shadow-sm transition-all"
          >
            แม่ {num}
          </button>
        ))}
      </div>
    </div>
  );

  const StudyDetailScreen = () => {
    return (
      <div className="flex flex-col items-center w-full max-w-md mx-auto p-4 h-full animate-fade-in relative z-10">
        <SoundToggle />
        <div className="w-full flex items-center justify-between mb-4 mt-2">
          <button onClick={() => { playSound('click'); setGameState('study_menu'); }} className="p-2 rounded-full bg-white/80 hover:bg-white text-green-700">
             <ArrowLeft className="w-6 h-6" />
          </button>
          <h2 className="text-3xl font-bold text-green-800 bg-white/60 px-4 py-1 rounded-lg">แม่ {selectedTable}</h2>
          <div className="w-10"></div>
        </div>

        <div className="flex-1 w-full overflow-y-auto pr-2 custom-scrollbar">
            <div className="bg-white/95 rounded-2xl shadow-lg border-2 border-green-100 overflow-hidden">
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((i) => (
                    <div key={i} className={`flex items-center justify-center py-3 text-2xl font-bold border-b border-green-50 last:border-0 ${i % 2 === 0 ? 'bg-red-50 text-red-700' : 'bg-white text-green-700'}`}>
                        <span className="w-12 text-right">{selectedTable}</span>
                        <span className="w-8 text-center text-gray-300">x</span>
                        <span className="w-12 text-center">{i}</span>
                        <span className="w-8 text-center text-gray-300">=</span>
                        <span className="w-16 text-left text-yellow-600">{selectedTable * i}</span>
                    </div>
                ))}
            </div>
        </div>

        <div className="w-full mt-4 pt-2">
             <button
                onClick={() => startGame(selectedTable)}
                className="w-full bg-green-600 hover:bg-green-700 text-white text-xl font-bold py-4 rounded-xl shadow-lg flex items-center justify-center gap-2 transition-all transform active:scale-95 border-b-4 border-green-800"
            >
                <Play className="fill-current w-6 h-6" />
                เริ่มทดสอบ แม่ {selectedTable}
            </button>
        </div>
      </div>
    );
  };

  const GameScreen = () => (
    <div className="flex flex-col items-center w-full max-w-md mx-auto p-4 h-full justify-between animate-fade-in relative z-10">
      <SoundToggle />
      {/* Header Stats */}
      <div className="w-full flex justify-between items-center bg-white/95 p-3 rounded-2xl shadow-md border-2 border-green-100 mb-4 mt-8">
        <div className="flex items-center gap-2 text-yellow-500 font-bold">
          <Star className="fill-current" />
          <span className="text-xl">{score}</span>
        </div>
        <div className="text-gray-500 font-medium">
          ข้อที่ {questionCount + 1}/{totalQuestions}
        </div>
        <div className={`flex items-center gap-1 font-bold ${streak > 1 ? 'text-red-500' : 'text-gray-300'}`}>
          🔥 {streak}
        </div>
      </div>

      {/* Question Card */}
      <div className="flex-1 w-full flex flex-col items-center justify-center mb-6 relative">
        <div className="bg-white w-full py-12 rounded-3xl shadow-xl border-b-8 border-red-200 flex flex-col items-center justify-center relative overflow-hidden">
            {/* Decoration on card */}
            <div className="absolute top-0 right-0 text-green-100 transform translate-x-1/4 -translate-y-1/4">
                <Snowflake size={100} />
            </div>

          <div className="text-2xl text-gray-400 mb-2 font-light relative z-10">
             {selectedTable ? `แม่ ${selectedTable}` : 'สุ่มแม่'}
          </div>
          <div className="text-7xl font-black text-slate-700 flex items-center gap-4 relative z-10">
            <span className="text-red-600">{question.num1}</span>
            <span className="text-green-400">×</span>
            <span className="text-green-600">{question.num2}</span>
          </div>
          
          {/* Feedback Overlay */}
          {feedback && (
            <div className={`absolute inset-0 flex items-center justify-center bg-white/95 z-20 transition-all ${feedback === 'correct' ? 'text-green-600' : 'text-red-600'}`}>
              {feedback === 'correct' ? (
                <div className="flex flex-col items-center animate-bounce">
                  <Check className="w-24 h-24" />
                  <span className="text-3xl font-bold">Ho! Ho! Ho! 🎅</span>
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
            className={`py-6 text-3xl font-bold rounded-2xl shadow-md border-b-4 transition-all active:border-b-0 active:translate-y-1 bg-white hover:bg-gray-50
              ${idx % 2 === 0 ? 'text-red-600 border-red-200' : 'text-green-600 border-green-200'}
            `}
          >
            {ans}
          </button>
        ))}
      </div>
      
      <button 
        onClick={() => { playSound('click'); setGameState('menu'); }}
        className="mt-6 text-white/80 hover:text-white flex items-center gap-2 text-sm bg-black/20 px-4 py-2 rounded-full"
      >
        <Home className="w-4 h-4" /> กลับหน้าหลัก
      </button>
    </div>
  );

  const SummaryScreen = () => {
    const rank = getRank();
    return (
      <div className="flex flex-col items-center justify-center w-full max-w-md mx-auto p-6 text-center h-full space-y-8 animate-fade-in relative z-10">
        <SoundToggle />
        <div className="relative mt-8">
          <div className="absolute -inset-4 bg-yellow-100 rounded-full blur-xl opacity-50 animate-pulse"></div>
          <Gift className="w-32 h-32 text-red-500 relative z-10 drop-shadow-md animate-bounce" />
        </div>

        <div className="space-y-2">
          <h2 className="text-3xl font-bold text-gray-800 bg-white/60 px-4 py-1 rounded-lg inline-block">จบเกมแล้ว!</h2>
          <div className={`text-2xl font-bold bg-white/80 p-2 rounded-xl shadow-sm ${rank.color}`}>{rank.text}</div>
        </div>

        <div className="grid grid-cols-2 gap-4 w-full bg-white/95 p-6 rounded-2xl shadow-md border border-green-100">
          <div className="flex flex-col items-center">
            <span className="text-gray-400 text-sm">คะแนนรวม</span>
            <span className="text-4xl font-black text-red-600">{score}</span>
          </div>
          <div className="flex flex-col items-center">
            <span className="text-gray-400 text-sm">คอมโบสูงสุด</span>
            <span className="text-4xl font-black text-green-600">{maxStreak}</span>
          </div>
        </div>

        <div className="flex flex-col w-full gap-3">
          <button
            onClick={() => startGame(selectedTable)}
            className="w-full bg-green-500 hover:bg-green-600 text-white text-xl font-bold py-4 rounded-xl shadow-lg flex items-center justify-center gap-2 transition-colors border-b-4 border-green-700"
          >
            <RefreshCw className="w-6 h-6" />
            เล่นอีกครั้ง {selectedTable ? `(แม่ ${selectedTable})` : '(สุ่ม)'}
          </button>
          
          <button
            onClick={() => { playSound('click'); setGameState('menu'); }}
            className="w-full bg-white hover:bg-gray-50 text-red-600 border-2 border-red-200 text-xl font-bold py-4 rounded-xl shadow-sm flex items-center justify-center gap-2 transition-colors"
          >
            <Home className="w-6 h-6" />
            เลือกแม่สูตรคูณใหม่
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-green-50 to-red-50 font-sans selection:bg-green-200 flex items-center justify-center overflow-hidden relative">
      <SnowBackground />
      {gameState === 'menu' && <MenuScreen />}
      {gameState === 'study_menu' && <StudyMenuScreen />}
      {gameState === 'study_detail' && <StudyDetailScreen />}
      {gameState === 'playing' && <GameScreen />}
      {gameState === 'summary' && <SummaryScreen />}
    </div>
  );
};

export default MultiplicationGame;