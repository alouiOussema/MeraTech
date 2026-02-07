import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { User, Volume2, HelpCircle, Mic, MicOff } from 'lucide-react';
import Input from '../components/Input';
import VoicePinInput from '../components/auth/VoicePinInput';
import AccessibleAlert from '../components/AccessibleAlert';
import { useVoice } from '../context/VoiceContext';
import { useAuth } from '../context/AuthContext';
import { loginWithVoicePin } from '../lib/api';
import { useFocusDebugger } from '../hooks/useFocusDebugger';
import { extractNumbers } from '../assistant/numberParser';

export default function Login() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({ name: '', pin: '' });
  const [errors, setErrors] = useState({});
  const { registerPageHandler, speak, isListening, toggleListening } = useVoice();
  const { login } = useAuth();
  const [voiceStep, setVoiceStep] = useState('WELCOME');
  
  const { focusElement } = useFocusDebugger('LoginPage');
  const nameRef = useRef(null);
  const pinRef = useRef(null);

  // Voice Interaction Logic
  useEffect(() => {
    if (voiceStep === 'WELCOME') {
      speak("مرحبا بيك في صفحة الدخول. أنا هنا باش نساعدك. قلّي اسمك الكامل باش نبدّيو.", () => setVoiceStep('NAME'));
    } else if (voiceStep === 'NAME') {
      focusElement(nameRef, 'Name Input');
    } else if (voiceStep === 'PIN_PROMPT') {
      speak("باهي. توا قلّي الـPIN متاعك، ستّة أرقام.", () => setVoiceStep('PIN'));
    } else if (voiceStep === 'PIN') {
      focusElement(pinRef, 'PIN Input');
    }
  }, [voiceStep, speak, focusElement]);

  const handleSubmit = async (e, dataOverride) => {
    if (e) e.preventDefault();
    const data = dataOverride || formData;

    const newErrors = {};
    if (!data.name.trim()) newErrors.name = "الاسم إجباري";
    if (!data.pin || data.pin.length !== 6) newErrors.pin = "الـPIN لازم يكون 6 أرقام";

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      speak(Object.values(newErrors).join(". "));
      return;
    }

    try {
      const res = await loginWithVoicePin(data.name, data.pin);

      login(res.token, res.user);

      speak("مرحبا بيك! تمّ الدخول بنجاح.", () => {
        navigate('/profile');
      });
    } catch (err) {
      console.error(err);
      if (err.response?.data?.message) {
        speak(err.response.data.message);
        setErrors({ form: err.response.data.message });
      } else {
        speak("صار مشكل. ثبت من معلوماتك وعاود.");
      }
    }
  };

  const handleVoiceInput = useCallback((text, intent) => {
    // Barge-in Handling during Welcome
    if (voiceStep === 'WELCOME') {
      if (text.length > 2) {
        setFormData(prev => ({ ...prev, name: text }));
        speak(`باهي، ${text}. توا قلّي الـPIN متاعك.`, () => setVoiceStep('PIN'));
      }
      return;
    }

    // Heuristic for Name
    if (voiceStep === 'NAME') {
      if (text.length > 2) {
        setFormData(prev => ({ ...prev, name: text }));
        speak(`باهي، ${text}. توا قلّي الـPIN متاعك.`, () => setVoiceStep('PIN'));
      } else {
        speak("ما سمعتش اسمك. عاود قلّي اسمك.");
      }
      return;
    }

    // Heuristic for PIN
    if (voiceStep === 'PIN') {
      // STRICT FILTERING: Only digits
      const numbers = extractNumbers(text);
      const digits = numbers.join('');
      
      if (digits.length > 0) {
        setFormData(prev => ({ ...prev, pin: digits }));
        if (digits.length === 6) {
          speak("الـPIN مريقل. لحظة، نتحقّق من المعلومات.");
          // Trigger submit automatically
          handleSubmit(null, { ...formData, pin: digits }); 
        } else {
          speak(`سمعت ${digits.length} أرقام. لازم ستّة أرقام.`);
        }
      } else {
        // Silent or gentle hint
        // speak("ما سمعتش أرقام. عاود الـPIN.");
      }
    }
  }, [voiceStep, formData, speak]);

  // Register handler
  useEffect(() => {
    return registerPageHandler(handleVoiceInput);
  }, [registerPageHandler, handleVoiceInput]);


  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-900 px-4 py-6">
      <div className="w-full max-w-lg bg-white dark:bg-slate-800 rounded-2xl shadow-xl border border-slate-100 dark:border-slate-700 overflow-hidden">

        {/* Header */}
        <div className="bg-blue-600 p-6 text-white text-center">
          <h1 className="text-3xl font-bold mb-2">دخول</h1>
          <p className="opacity-90">مرحبا بيك مرة أخرى</p>
        </div>

        <div className="p-6 md:p-8 space-y-6">

          {errors.form && (
            <div className="p-4 bg-red-100 text-red-700 rounded-lg text-center font-bold">
              {errors.form}
            </div>
          )}

          <form onSubmit={handleSubmit} noValidate className="space-y-6">

            {/* Name Section */}
            <section aria-labelledby="name-section" className={`transition-all duration-300 ${voiceStep === 'NAME' ? 'ring-4 ring-yellow-400 rounded-xl p-4 bg-yellow-50 dark:bg-yellow-900/10' : ''}`}>
              <div className="flex items-center gap-2 mb-3 text-blue-600 dark:text-blue-400">
                <User size={24} />
                <h2 id="name-section" className="text-xl font-bold">معلوماتك</h2>
              </div>

              <Input
                ref={nameRef}
                id="name"
                label="اسمك الكامل"
                placeholder="فلان الفلاني"
                value={formData.name}
                onChange={e => setFormData({ ...formData, name: e.target.value })}
                error={errors.name}
              />
            </section>

            <hr className="border-slate-200 dark:border-slate-700" />

            {/* PIN Section */}
            <section aria-labelledby="pin-section" className={`transition-all duration-300 ${['PIN', 'PIN_PROMPT'].includes(voiceStep) ? 'ring-4 ring-yellow-400 rounded-xl p-4 bg-yellow-50 dark:bg-yellow-900/10' : ''}`}>
              <div className="flex items-center gap-2 mb-3 text-blue-600 dark:text-blue-400">
                <Volume2 size={24} />
                <h2 id="pin-section" className="text-xl font-bold">الرمز السري (PIN)</h2>
              </div>

              <VoicePinInput
                ref={pinRef}
                id="pin"
                label="الـPIN"
                value={formData.pin}
                onChange={val => setFormData({ ...formData, pin: val })}
                error={errors.pin}
                helperText="قول الـPIN متاعك"
              />
            </section>

            <div className="flex gap-4">
              <button
                type="submit"
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 rounded-xl text-xl shadow-lg hover:shadow-xl transition-all focus:ring-4 focus:ring-blue-300 transform active:scale-95"
              >
                دخول
              </button>

              <button
                type="button"
                onClick={toggleListening}
                className={`px-6 rounded-xl flex items-center justify-center transition-colors ${isListening ? 'bg-red-100 text-red-600 hover:bg-red-200' : 'bg-green-100 text-green-600 hover:bg-green-200'}`}
                title={isListening ? "أوقف الاستماع" : "ابدأ الاستماع"}
              >
                {isListening ? <Mic size={28} /> : <MicOff size={28} />}
              </button>
            </div>
          </form>

          {/* Secondary Actions */}
          <div className="flex flex-col gap-4 text-center border-t border-slate-200 dark:border-slate-700 pt-6">
            <Link to="/register" className="text-lg text-slate-600 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 font-bold underline decoration-2 underline-offset-4">
              ما عندكش حساب؟ سجّل
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}