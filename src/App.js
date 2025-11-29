import React, { useState, useEffect } from 'react';
import { Star, Gift, RefreshCw, Play, Home, Check, X, Book, ArrowLeft, Volume2, VolumeX, Snowflake, Trees, Sparkles } from 'lucide-react';

const MultiplicationGame = () => {
  // Game States
  const [gameState, setGameState] = useState('menu');
  const [selectedTable, setSelectedTable] = useState(null);
  const [question, setQuestion] = useState({ num1: 0, num2: 0, answers: [] });
  const [questionQueue, setQuestionQueue] = useState([]);
  const [score, setScore] = useState(0);
  const [questionCount, setQuestionCount] = useState(0);
  const [streak, setStreak] = useState(0);
  const [maxStreak, setMaxStreak] = useState(0);
  const [feedback, setFeedback] = useState(null);
  const [totalQuestions] = useState(20);
  const [isSoundOn, setIsSoundOn] = useState(true);

  // --- Sound System ---
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
      
      const now = ctx.currentTime;

      if (type === 'correct') {
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(523.25, now); // C5
        osc.frequency.linearRampToValueAtTime(659.25, now + 0.1); // E5
        osc.frequency.linearRampToValueAtTime(783.99, now + 0.2); // G5
        osc.frequency.linearRampToValueAtTime(1046.50, now + 0.3); // C6
        gain.gain.setValueAtTime(0.1, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.6);
        osc.start(now);
        osc.stop(now + 0.6);
      } else if (type === 'wrong') {
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(150, now);
        osc.frequency.linearRampToValueAtTime(100, now + 0.3);
        gain.gain.setValueAtTime(0.1, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);
        osc.start(now);
        osc.stop(now + 0.3);
      } else if (type === 'click') {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(800, now);
        gain.gain.setValueAtTime(0.05, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.1);
        osc.start(now);
        osc.stop(now + 0.1);
      }
    } catch (e) { console.error("Audio error", e); }
  };

  // --- Game Logic ---
  const createQuestionFromNumbers = (num1, num2) => {
    const correctAnswer = num1 * num2;
    let wrongAnswers = new Set();
    while (wrongAnswers.size < 3) {
      let wrong;
      const strategy = Math.random();
      if (strategy < 0.3) wrong = correctAnswer + (Math.floor(Math.random() * 5) + 1) * (Math.random() < 0.5 ? 1 : -1);
      else if (strategy < 0.6) wrong = num1 * (num2 + (Math.floor(Math.random() * 3) + 1) * (Math.random() < 0.5 ? 1 : -1));
      else wrong = (Math.floor(Math.random() * 11) + 2) * (Math.floor(Math.random() * 12) + 1);
      if (wrong > 0 && wrong !== correctAnswer) wrongAnswers.add(wrong);
    }
    const answers = [correctAnswer, ...Array.from(wrongAnswers)].sort(() => Math.random() - 0.5);
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
      queue = pool.slice(0, count).map(n2 => ({ num1: table, num2: n2 }));
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
    if (newQueue.length > 0) setQuestion(createQuestionFromNumbers(newQueue[0].num1, newQueue[0].num2));
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
      if (nextCount >= totalQuestions) setGameState('summary');
      else {
        setQuestionCount(nextCount);
        const nextQ = questionQueue[nextCount];
        setQuestion(createQuestionFromNumbers(nextQ.num1, nextQ.num2));
      }
    }, 1500);
  };

  const getRank = () => {
    if (score >= 350) return { text: "ระดับ: ซานต้าในตำนาน 🎅🏆", color: "text-[#D42426]" };
    if (score >= 200) return { text: "ระดับ: หัวหน้าเอลฟ์ 🧝✨", color: "text-[#165B33]" };
    if (score >= 100) return { text: "ระดับ: กวางเรนเดียร์ฝึกหัด 🦌", color: "text-[#F8B229]" };
    return { text: "ระดับ: ตุ๊กตาหิมะ ⛄", color: "text-slate-500" };
  };

  // --- Design Components ---

  const SnowBackground = () => (
    <div className="absolute inset-0 pointer-events-none overflow-hidden z-0">
      {[...Array(30)].map((_, i) => (
        <div 
          key={i}
          className="absolute text-white/60 animate-pulse"
          style={{
            top: `${Math.random() * 100}%`,
            left: `${Math.random() * 100}%`,
            fontSize: `${Math.random() * 16 + 8}px`,
            animation: `fall ${Math.random() * 5 + 5}s linear infinite`,
            opacity: Math.random() * 0.5 + 0.3
          }}
        >
          ❄
        </div>
      ))}
      <style>{`
        @keyframes fall {
          0% { transform: translateY(-10vh) translateX(0px) rotate(0deg); }
          100% { transform: translateY(110vh) translateX(${Math.random() * 50 - 25}px) rotate(360deg); }
        }
      `}</style>
    </div>
  );

  const SoundToggle = () => (
    <button 
      onClick={() => setIsSoundOn(!isSoundOn)}
      className="absolute top-4 right-4 p-3 bg-white/90 backdrop-blur-sm rounded-full shadow-lg hover:shadow-xl hover:scale-105 transition-all z-50 text-[#165B33] border border-[#165B33]/20"
    >
      {isSoundOn ? <Volume2 size={20} /> : <VolumeX size={20} />}
    </button>
  );

  // --- Screens ---

  const MenuScreen = () => (
    <div className="flex flex-col items-center w-full max-w-lg mx-auto p-6 space-y-8 animate-fade-in relative z-10">
      <SoundToggle />
      
      {/* Title Section */}
      <div className="text-center space-y-2 mt-8 relative">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-12 w-24 h-24 bg-[#D42426]/10 rounded-full blur-2xl"></div>
        <div className="flex items-center justify-center gap-3 mb-2">
            <Trees className="text-[#165B33]" size={32} />
            <Sparkles className="text-[#F8B229]" size={24} />
            <Trees className="text-[#165B33]" size={32} />
        </div>
        <h1 className="text-6xl font-black text-[#D42426] drop-shadow-sm tracking-tight leading-tight" style={{ fontFamily: 'Kanit' }}>
          Merry<br/><span className="text-[#165B33]">Math</span>
        </h1>
        <p className="text-slate-600 font-medium bg-white/80 backdrop-blur-md px-6 py-2 rounded-full inline-block shadow-md border border-white">
          เกมฝึกสูตรคูณหรรษา
        </p>
      </div>

      {/* Grid Selection */}
      <div className="grid grid-cols-3 gap-3 w-full">
        {[2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((num) => (
          <button
            key={num}
            onClick={() => startGame(num)}
            className="group relative bg-white hover:bg-[#F0FDF4] border-b-[4px] border-slate-200 hover:border-[#165B33] text-slate-700 hover:text-[#165B33] text-xl font-bold py-4 rounded-2xl shadow-md transition-all transform hover:-translate-y-1 active:border-b-0 active:translate-y-1"
          >
            <span className="relative z-10" style={{ fontFamily: 'Kanit' }}>แม่ {num}</span>
            <div className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity text-[#D42426]">
              <Snowflake size={14} />
            </div>
          </button>
        ))}
      </div>

      {/* Action Buttons */}
      <div className="w-full space-y-3">
        <button
            onClick={() => startGame(null)}
            className="w-full bg-gradient-to-r from-[#D42426] to-[#B91C1C] text-white text-xl font-bold py-4 rounded-2xl shadow-lg shadow-red-500/30 border-b-[4px] border-[#991B1B] hover:brightness-110 active:border-b-0 active:translate-y-1 transition-all flex items-center justify-center gap-3"
            style={{ fontFamily: 'Kanit' }}
        >
            <Gift size={28} className="animate-bounce" />
            <span>โหมดท้าทาย (สุ่มโจทย์)</span>
        </button>

        <button
            onClick={() => { playSound('click'); setGameState('study_menu'); }}
            className="w-full bg-white text-[#165B33] text-lg font-bold py-4 rounded-2xl shadow-md border border-slate-200 hover:bg-[#F0FDF4] hover:border-[#165B33]/30 transition-all flex items-center justify-center gap-2"
            style={{ fontFamily: 'Kanit' }}
        >
            <Book size={24} />
            <span>ตารางสูตรคูณ</span>
        </button>
      </div>
    </div>
  );

  const StudyMenuScreen = () => (
    <div className="flex flex-col items-center w-full max-w-lg mx-auto p-6 h-full relative z-10">
      <SoundToggle />
      <div className="w-full flex items-center justify-between mt-4 mb-8">
        <button onClick={() => { playSound('click'); setGameState('menu'); }} className="p-3 rounded-xl bg-white shadow-md hover:shadow-lg text-slate-600 hover:text-[#D42426] transition-all">
           <ArrowLeft size={24} />
        </button>
        <h2 className="text-2xl font-bold text-[#165B33] bg-white/90 backdrop-blur px-6 py-2 rounded-2xl shadow-md border border-white/50" style={{ fontFamily: 'Kanit' }}>
            เลือกแม่สูตรคูณ
        </h2>
        <div className="w-12"></div>
      </div>

      <div className="grid grid-cols-2 gap-4 w-full overflow-y-auto pb-4 custom-scrollbar">
        {[2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((num) => (
          <button
            key={num}
            onClick={() => {
              playSound('click');
              setSelectedTable(num);
              setGameState('study_detail');
            }}
            className="flex items-center justify-between px-6 py-4 bg-white hover:bg-[#FEF2F2] border-2 border-slate-100 hover:border-[#D42426]/20 rounded-2xl shadow-md transition-all group"
          >
            <span className="text-xl font-bold text-slate-700 group-hover:text-[#D42426]" style={{ fontFamily: 'Kanit' }}>แม่ {num}</span>
            <ArrowLeft className="rotate-180 text-slate-300 group-hover:text-[#D42426]" size={20} />
          </button>
        ))}
      </div>
    </div>
  );

  const StudyDetailScreen = () => (
    <div className="flex flex-col items-center w-full max-w-lg mx-auto p-4 h-full relative z-10">
      <SoundToggle />
      <div className="w-full flex items-center justify-between mb-6 mt-4">
        <button onClick={() => { playSound('click'); setGameState('study_menu'); }} className="p-3 rounded-xl bg-white shadow-md hover:shadow-lg text-slate-600 hover:text-[#D42426] transition-all">
            <ArrowLeft size={24} />
        </button>
        <h2 className="text-3xl font-bold text-[#D42426] bg-white/95 px-8 py-2 rounded-2xl shadow-lg border-2 border-[#D42426]/10" style={{ fontFamily: 'Kanit' }}>
            แม่ {selectedTable}
        </h2>
        <div className="w-12"></div>
      </div>

      <div className="flex-1 w-full overflow-hidden bg-white/90 backdrop-blur-md rounded-3xl shadow-2xl border-2 border-white flex flex-col">
        <div className="overflow-y-auto custom-scrollbar p-1">
            <table className="w-full">
                <tbody>
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((i) => (
                    <tr key={i} className={`border-b border-dashed border-slate-200 ${i % 2 === 0 ? 'bg-[#165B33]/5' : 'bg-transparent'}`}>
                        <td className="py-3 pl-6 text-right text-2xl font-bold text-slate-500" style={{ fontFamily: 'Kanit' }}>{selectedTable}</td>
                        <td className="py-3 text-center text-slate-400">×</td>
                        <td className="py-3 text-center text-2xl font-bold text-[#165B33]" style={{ fontFamily: 'Kanit' }}>{i}</td>
                        <td className="py-3 text-center text-slate-400">=</td>
                        <td className="py-3 pr-6 text-left text-3xl font-black text-[#D42426]" style={{ fontFamily: 'Kanit' }}>{selectedTable * i}</td>
                    </tr>
                ))}
                </tbody>
            </table>
        </div>
      </div>

      <div className="w-full mt-6 mb-2">
            <button
            onClick={() => startGame(selectedTable)}
            className="w-full bg-[#165B33] text-white text-xl font-bold py-4 rounded-2xl shadow-lg shadow-green-900/20 border-b-[4px] border-[#0F3F24] hover:brightness-110 active:border-b-0 active:translate-y-1 transition-all flex items-center justify-center gap-3"
            style={{ fontFamily: 'Kanit' }}
        >
            <Play size={24} className="fill-current" />
            เริ่มทดสอบแม่ {selectedTable}
        </button>
      </div>
    </div>
  );

  const GameScreen = () => (
    <div className="flex flex-col items-center w-full max-w-lg mx-auto p-4 h-full justify-between relative z-10">
      <SoundToggle />
      
      {/* Header Stats */}
      <div className="w-full flex justify-between items-center bg-white/95 backdrop-blur p-4 rounded-2xl shadow-md border border-slate-100 mb-6 mt-6">
        <div className="flex items-center gap-2">
          <div className="bg-[#F8B229]/20 p-2 rounded-lg text-[#F8B229]">
            <Star className="fill-current" size={20} />
          </div>
          <span className="text-2xl font-bold text-slate-700" style={{ fontFamily: 'Kanit' }}>{score}</span>
        </div>
        
        <div className="px-4 py-1 rounded-full bg-slate-100 text-slate-500 font-medium text-sm">
          ข้อ {questionCount + 1} / {totalQuestions}
        </div>
        
        <div className={`flex items-center gap-2 px-3 py-1 rounded-lg ${streak > 1 ? 'bg-[#D42426]/10 text-[#D42426]' : 'bg-slate-50 text-slate-300'}`}>
          <span className="font-bold text-lg" style={{ fontFamily: 'Kanit' }}>{streak}</span>
          <Sparkles size={16} />
        </div>
      </div>

      {/* Question Card */}
      <div className="w-full flex-1 flex flex-col justify-center mb-8 relative">
        <div className="bg-white w-full aspect-[4/3] rounded-[2rem] shadow-2xl shadow-red-200/50 border-[6px] border-white ring-4 ring-white/50 flex flex-col items-center justify-center relative overflow-hidden z-10">
            {/* Background Decoration */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-[#165B33]/10 rounded-full blur-3xl -mr-10 -mt-10"></div>
            <div className="absolute bottom-0 left-0 w-24 h-24 bg-[#D42426]/10 rounded-full blur-2xl -ml-10 -mb-10"></div>

          <div className="text-xl text-slate-400 mb-4 font-medium relative z-10 bg-slate-50/80 px-4 py-1 rounded-full" style={{ fontFamily: 'Kanit' }}>
             {selectedTable ? `แม่ ${selectedTable}` : 'สุ่มโจทย์'}
          </div>
          
          <div className="flex items-center gap-6 relative z-10">
            <span className="text-8xl font-black text-[#D42426]" style={{ fontFamily: 'Kanit' }}>{question.num1}</span>
            <span className="text-5xl text-slate-300">×</span>
            <span className="text-8xl font-black text-[#165B33]" style={{ fontFamily: 'Kanit' }}>{question.num2}</span>
          </div>
          
          {/* Feedback Overlay */}
          {feedback && (
            <div className={`absolute inset-0 flex flex-col items-center justify-center z-20 backdrop-blur-sm transition-all duration-300 ${feedback === 'correct' ? 'bg-green-500/10' : 'bg-red-500/10'}`}>
              <div className={`p-6 rounded-3xl shadow-2xl scale-animation ${feedback === 'correct' ? 'bg-white text-[#165B33]' : 'bg-white text-[#D42426]'}`}>
                {feedback === 'correct' ? (
                    <Check size={80} strokeWidth={4} />
                ) : (
                    <div className="text-center">
                        <X size={60} strokeWidth={4} className="mx-auto mb-2 opacity-50" />
                        <span className="text-4xl font-black" style={{ fontFamily: 'Kanit' }}>{question.correctAnswer}</span>
                    </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Answer Grid */}
      <div className="grid grid-cols-2 gap-4 w-full relative z-10">
        {question.answers.map((ans, idx) => (
          <button
            key={idx}
            disabled={feedback !== null}
            onClick={() => handleAnswer(ans)}
            className={`
                relative overflow-hidden
                py-6 text-4xl font-bold rounded-2xl shadow-md border-b-[4px] transition-all active:border-b-0 active:translate-y-1 
                bg-white hover:brightness-95
                ${idx === 0 ? 'text-[#D42426] border-[#D42426]/20' : ''}
                ${idx === 1 ? 'text-[#165B33] border-[#165B33]/20' : ''}
                ${idx === 2 ? 'text-[#F8B229] border-[#F8B229]/20' : ''}
                ${idx === 3 ? 'text-slate-600 border-slate-200' : ''}
            `}
            style={{ fontFamily: 'Kanit' }}
          >
            {ans}
          </button>
        ))}
      </div>
      
      <button 
        onClick={() => { playSound('click'); setGameState('menu'); }}
        className="mt-8 text-slate-500 hover:text-slate-700 flex items-center gap-2 text-sm font-medium bg-white/80 px-4 py-2 rounded-full backdrop-blur-sm transition-all hover:bg-white shadow-sm"
        style={{ fontFamily: 'Kanit' }}
      >
        <Home size={16} /> กลับหน้าหลัก
      </button>
    </div>
  );

  const SummaryScreen = () => {
    const rank = getRank();
    return (
      <div className="flex flex-col items-center justify-center w-full max-w-lg mx-auto p-6 text-center h-full space-y-8 animate-fade-in relative z-10">
        <SoundToggle />
        
        <div className="relative mt-4">
          <div className="absolute -inset-8 bg-[#F8B229]/20 rounded-full blur-3xl animate-pulse"></div>
          <Gift className="w-40 h-40 text-[#D42426] relative z-10 drop-shadow-2xl animate-bounce" />
          <div className="absolute -bottom-2 -right-2 bg-white rounded-full p-2 shadow-lg rotate-12">
            <Star className="text-[#F8B229] fill-current w-10 h-10" />
          </div>
        </div>

        <div className="space-y-3">
          <h2 className="text-4xl font-black text-slate-800" style={{ fontFamily: 'Kanit' }}>จบเกมแล้ว!</h2>
          <div className={`text-xl font-bold py-2 px-6 rounded-xl bg-white/90 inline-block shadow-md ${rank.color}`} style={{ fontFamily: 'Kanit' }}>
            {rank.text}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 w-full">
          <div className="bg-white/95 backdrop-blur p-6 rounded-2xl shadow-lg border-b-4 border-slate-100 flex flex-col items-center">
            <span className="text-slate-400 text-sm font-medium mb-1">คะแนนรวม</span>
            <span className="text-5xl font-black text-[#D42426]" style={{ fontFamily: 'Kanit' }}>{score}</span>
          </div>
          <div className="bg-white/95 backdrop-blur p-6 rounded-2xl shadow-lg border-b-4 border-slate-100 flex flex-col items-center">
            <span className="text-slate-400 text-sm font-medium mb-1">คอมโบสูงสุด</span>
            <span className="text-5xl font-black text-[#165B33]" style={{ fontFamily: 'Kanit' }}>{maxStreak}</span>
          </div>
        </div>

        <div className="flex flex-col w-full gap-3 mt-4">
          <button
            onClick={() => startGame(selectedTable)}
            className="w-full bg-[#165B33] hover:brightness-110 text-white text-xl font-bold py-4 rounded-2xl shadow-lg shadow-green-900/20 border-b-[4px] border-[#0F3F24] active:border-b-0 active:translate-y-1 transition-all flex items-center justify-center gap-3"
            style={{ fontFamily: 'Kanit' }}
          >
            <RefreshCw size={24} />
            เล่นอีกครั้ง
          </button>
          
          <button
            onClick={() => { playSound('click'); setGameState('menu'); }}
            className="w-full bg-white hover:bg-slate-50 text-slate-600 border-b-[4px] border-slate-200 text-xl font-bold py-4 rounded-2xl shadow-sm active:border-b-0 active:translate-y-1 transition-all flex items-center justify-center gap-3"
            style={{ fontFamily: 'Kanit' }}
          >
            <Home size={24} />
            หน้าหลัก
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-[#FFF8E7] font-sans text-slate-800 flex items-center justify-center overflow-hidden relative selection:bg-[#F8B229] selection:text-white">
      {/* Import Google Font 'Kanit' */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Kanit:wght@300;400;500;600;700;800;900&display=swap');
        .custom-scrollbar::-webkit-scrollbar { width: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 10px; }
        .scale-animation { animation: scaleUp 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275); }
        @keyframes scaleUp { from { transform: scale(0.5); opacity: 0; } to { transform: scale(1); opacity: 1; } }
      `}</style>
      
      {/* Ambient Background Gradient */}
      <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-green-100/40 via-transparent to-red-100/40 pointer-events-none"></div>
      
      <SnowBackground />
      
      {/* Main Content Container */}
      <div className="w-full h-full max-w-lg relative">
        {gameState === 'menu' && <MenuScreen />}
        {gameState === 'study_menu' && <StudyMenuScreen />}
        {gameState === 'study_detail' && <StudyDetailScreen />}
        {gameState === 'playing' && <GameScreen />}
        {gameState === 'summary' && <SummaryScreen />}
      </div>
    </div>
  );
};

export default MultiplicationGame;