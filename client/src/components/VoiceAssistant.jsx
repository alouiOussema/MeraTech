import React, { useEffect, useRef } from 'react';
import { useVoice } from '../context/VoiceContext';
import { Mic, MicOff, Volume2, VolumeX, RotateCcw, Keyboard, HelpCircle } from 'lucide-react';

export default function VoiceAssistant() {
  const { 
    isListening, 
    toggleListening, 
    transcript, 
    interimTranscript,
    speak, 
    stopSpeaking, 
    repeatLast,
    permissionStatus,
    autoStartBlocked,
    requestPermissionManual
  } = useVoice();

  const [showKeyboard, setShowKeyboard] = React.useState(false);
  const [textInput, setTextInput] = React.useState("");
  const { processText } = useVoice();

  // Focus management for accessibility
  const containerRef = useRef(null);

  useEffect(() => {
    // Focus the container on mount if possible
    if (containerRef.current) {
      containerRef.current.focus();
    }
  }, []);

  const handleTextSubmit = (e) => {
    e.preventDefault();
    if (textInput.trim()) {
      processText(textInput);
      setTextInput("");
    }
  };

  // If permission is blocked or needs gesture
  if (autoStartBlocked || permissionStatus === 'prompt' || permissionStatus === 'denied') {
      return (
          <div className="fixed inset-0 z-[100] bg-slate-900/95 flex items-center justify-center p-4 text-center">
              <div className="max-w-2xl w-full bg-white dark:bg-slate-800 p-8 rounded-3xl shadow-2xl border-4 border-blue-500">
                  <h1 className="text-4xl font-bold mb-6 text-slate-900 dark:text-white">
                      مرحبا بيك في منصّة إبصار
                  </h1>
                  <p className="text-2xl mb-8 text-slate-700 dark:text-slate-300 leading-relaxed">
                      باش نبدّيو، لازمنا نفعّلوا الصوت والميكروفون.
                  </p>
                  
                  <button 
                      onClick={requestPermissionManual}
                      className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold text-3xl py-8 rounded-2xl shadow-xl transform transition hover:scale-105 focus:ring-4 focus:ring-blue-400 focus:outline-none"
                      aria-label="اضغط هنا باش نبدّيو بالصوت"
                  >
                      اضغط هنا باش نبدّيو بالصوت
                  </button>

                  {permissionStatus === 'denied' && (
                      <div className="mt-6 p-4 bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-200 rounded-xl">
                          <p className="font-bold text-xl">
                              عذراً، الميكروفون مسكّر من المتصفّح. بربّي حلّه من الفوق (Icon القفل 🔒).
                          </p>
                      </div>
                  )}
              </div>
          </div>
      );
  }

  return (
    <>
      {/* Hidden but focusable region for Screen Readers */}
      <section 
        ref={containerRef}
        aria-label="المساعد الصوتي" 
        aria-live="polite" 
        tabIndex="-1"
        className="sr-only focus:not-sr-only focus:absolute focus:top-0 focus:left-0 focus:z-50 focus:bg-white focus:p-4 focus:w-full"
      >
        <p>المساعد الصوتي يخدم. حالة الميكروفون: {isListening ? "نسمع فيك" : "واقف"}.</p>
        <p>تنجم تنزل Espace باش توقف ولا تشغل.</p>
      </section>

      {/* Main Voice UI Overlay */}
      <div className="fixed bottom-0 left-0 right-0 z-40 p-4 pointer-events-none">
        <div className="max-w-xl mx-auto pointer-events-auto">
            
            {/* Status Card */}
            <div className={`
                transition-all duration-300 transform 
                ${isListening ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0 pointer-events-none'}
                bg-slate-900/90 backdrop-blur-md text-white rounded-t-3xl p-6 shadow-2xl border-t border-x border-white/10
            `}>
                <div className="flex items-center justify-center gap-4 mb-4">
                    <div className="animate-pulse bg-red-500 rounded-full p-3">
                        <Mic size={32} />
                    </div>
                    <h2 className="text-2xl font-bold">
                        نسمع فيك...
                    </h2>
                </div>
                
                <div className="text-center min-h-[3rem] text-xl text-blue-200 font-medium">
                    {interimTranscript || transcript || "تكلّم..."}
                </div>
            </div>

            {/* Always Visible Controls (Bottom Sheet) */}
            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-700 p-4 flex items-center justify-between gap-2 mt-2">
                
                <button
                    onClick={toggleListening}
                    className={`
                        flex-1 flex flex-col items-center justify-center gap-1 p-3 rounded-xl transition-colors
                        ${isListening 
                            ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300' 
                            : 'bg-blue-600 text-white hover:bg-blue-700'}
                    `}
                    title="تحكم في الميكروفون (Space)"
                >
                    {isListening ? <Mic size={24} /> : <MicOff size={24} />}
                    <span className="text-sm font-bold">{isListening ? "وقّف" : "تكلّم"}</span>
                </button>

                <button
                    onClick={repeatLast}
                    className="flex-1 flex flex-col items-center justify-center gap-1 p-3 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition-colors"
                    title="عاود الكلام (R)"
                >
                    <RotateCcw size={24} />
                    <span className="text-sm font-bold">عاود</span>
                </button>

                <button
                    onClick={() => setShowKeyboard(!showKeyboard)}
                    className="flex-1 flex flex-col items-center justify-center gap-1 p-3 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition-colors"
                    title="اكتب بالكيبورد"
                >
                    <Keyboard size={24} />
                    <span className="text-sm font-bold">كتيبة</span>
                </button>

            </div>

            {/* Keyboard Input Fallback */}
            {showKeyboard && (
                <div className="mt-2 bg-white dark:bg-slate-800 p-4 rounded-xl shadow-lg border border-slate-200 dark:border-slate-700">
                    <form onSubmit={handleTextSubmit} className="flex gap-2">
                        <input
                            type="text"
                            value={textInput}
                            onChange={(e) => setTextInput(e.target.value)}
                            placeholder="اكتب شنوه تحب..."
                            className="flex-1 px-4 py-3 border-2 border-slate-300 dark:border-slate-600 rounded-lg bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none text-right text-lg"
                            autoFocus
                        />
                        <button 
                            type="submit"
                            className="bg-blue-600 text-white px-6 py-2 rounded-lg font-bold hover:bg-blue-700"
                        >
                            إرسال
                        </button>
                    </form>
                </div>
            )}
        </div>
      </div>
    </>
  );
}
