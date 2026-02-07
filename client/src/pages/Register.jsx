import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { User, Volume2, ShieldCheck, Mic, MicOff } from 'lucide-react';
import Input from '../components/Input';
import VoicePinInput from '../components/auth/VoicePinInput';
import { useVoice } from '../context/VoiceContext';
import { useAuth } from '../context/AuthContext';
import { registerVoicePin } from '../lib/api';
import { useFocusDebugger } from '../hooks/useFocusDebugger';
import { isYes, isNo, extractNumbers } from '../assistant/numberParser';

export default function Register() {
  const navigate = useNavigate();
  const { speak, registerPageHandler, isListening, toggleListening } = useVoice();
  const { login } = useAuth();
  const { focusElement } = useFocusDebugger('RegisterPage');

  const nameRef = useRef(null);
  const pinRef = useRef(null);
  const confirmPinRef = useRef(null);

  const [formData, setFormData] = useState({
    name: '',
    pin: '',
    confirmPin: ''
  });
  const [errors, setErrors] = useState({});
  // Steps: IDLE (Menu control), ASK_NAME, LISTENING_NAME, CONFIRM_NAME, ASK_PIN, LISTENING_PIN, CONFIRM_PIN
  const [voiceStep, setVoiceStep] = useState('IDLE'); 
  
  // Voice Interaction Flow (Prompts)
  useEffect(() => {
    if (voiceStep === 'ASK_NAME') {
      speak("تفضل، قلّي اسمك الكامل.", () => setVoiceStep('LISTENING_NAME'), false);
    } 
    else if (voiceStep === 'ASK_PIN') {
      focusElement(pinRef, 'PIN Input');
      speak("توا اكتب رقم سري متكون من 1 ل 9.", () => setVoiceStep('LISTENING_PIN'), false);
    }
  }, [voiceStep, speak, focusElement]);

  const handleSubmit = async (e, data = formData) => {
    if (e) e.preventDefault();
    const newErrors = {};

    if (!data.name.trim()) newErrors.name = "الاسم إجباري";

    // Relaxed validation if user wants "1 to 9", but backend enforces 6 digits usually.
    // Keeping 6 digits for safety unless user explicitly said "any number".
    // User said "number will be aded by user from 1 to 9". This could mean single digit?
    // Backend `auth.js` line 13: `z.string().length(6, ...)`
    // So we MUST enforce 6 digits or change backend.
    // I will assume 6 digits for now to avoid breaking backend.
    if (!data.pin || data.pin.length !== 6) {
      newErrors.pin = "الـPIN لازم يكون 6 أرقام";
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      speak("فما غلطة في المعلومات. ثبت وعاود.", null, true);
      return;
    }

    try {
      const res = await registerVoicePin(data.name, data.pin);
      // login(res.token, res.user); // Don't auto-login if redirecting to login page
      speak("تمّ التسجيل بنجاح! توا نوجّهك لصفحة الدخول.", () => {
        navigate('/login');
      }, true);
    } catch (err) {
      console.error(err);
      if (err.response?.data?.message) {
        speak(err.response.data.message, null, true);
        setErrors({ form: err.response.data.message });
      } else {
        speak("صار مشكل في السرفر. عاود مرة أخرى.", null, true);
      }
    }
  };

  const handleVoiceInput = useCallback((text) => {
    console.log("Register Voice Input:", text, voiceStep);

    if (voiceStep === 'LISTENING_NAME') {
      if (text.length > 2) {
        setFormData(prev => ({ ...prev, name: text }));
        speak(`مرحبا سي ${text}. تحب تكمل ولا تعاود؟`, () => setVoiceStep('CONFIRM_NAME'), false);
      } else {
        speak("ما سمعتش اسمك بالباهي. عاود قلّي اسمك.", null, false);
      }
      return;
    }

    if (voiceStep === 'CONFIRM_NAME') {
      // Check for "Complete/Continue" (Yes) or "Repeat" (No)
      
      const isContinue = isYes(text) || text.includes('كمل') || text.includes('واصل') || text.includes('نعم') || text.includes('باهي');
      const isRepeat = isNo(text) || text.includes('عاود') || text.includes('بدل') || text.includes('لا');

      if (isContinue) {
        speak(`تشرفت بيك سي ${formData.name}. الاسم تسجّل. توا تنجم تقول 2 باش تدخل الرمز السري.`, () => {
          setVoiceStep('IDLE');
        }, false);
      } else if (isRepeat) {
        setFormData(prev => ({ ...prev, name: '' }));
        setVoiceStep('ASK_NAME');
      } else {
        speak("ما فهمتكش. تحب تكمل ولا تعاود؟", null, false);
      }
      return;
    }

    if (voiceStep === 'LISTENING_PIN') {
      const numbers = extractNumbers(text);
      const digits = numbers.join('');
      
      if (digits.length === 6) {
        setFormData(prev => ({ ...prev, pin: digits, confirmPin: digits }));
        speak(`اخترت الرمز ${digits.split('').join(' ')}. صحيح؟`, () => setVoiceStep('CONFIRM_PIN'), false);
      } else {
        speak(`لازم 6 أرقام. عاود دخل الرمز.`, null, false);
      }
      return;
    }

    if (voiceStep === 'CONFIRM_PIN') {
      if (isYes(text)) {
        speak("باهي، الرمز تسجّل. توا تنجم تقول 3 باش تأكد التسجيل.", () => {
             setVoiceStep('IDLE');
        }, false);
      } else {
        setFormData(prev => ({ ...prev, pin: '', confirmPin: '' }));
        setVoiceStep('ASK_PIN');
      }
      return;
    }

  }, [voiceStep, formData, speak]);

  // Register the handler ONLY when we are in an active voice step
  useEffect(() => {
    if (voiceStep !== 'IDLE') {
      return registerPageHandler(handleVoiceInput);
    }
  }, [voiceStep, registerPageHandler, handleVoiceInput]);

  // Handle Focus to trigger flow
  const handleInputFocus = (step) => {
    if (voiceStep === 'IDLE') {
       setVoiceStep(step);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white dark:bg-slate-800 py-8 px-4 shadow sm:rounded-lg sm:px-10">
          <h2 className="text-center text-3xl font-extrabold text-slate-900 dark:text-white mb-8">
            إنشاء حساب جديد
          </h2>
          
          {errors.form && (
            <div className="p-4 bg-red-100 text-red-700 rounded-lg text-center font-bold mb-6">
              {errors.form}
            </div>
          )}

          <form onSubmit={handleSubmit} noValidate className="space-y-6">

            {/* Name Section */}
            <section aria-labelledby="name-section" className={`transition-all duration-300 ${['ASK_NAME', 'LISTENING_NAME', 'CONFIRM_NAME'].includes(voiceStep) ? 'ring-4 ring-yellow-400 rounded-xl p-4 bg-yellow-50 dark:bg-yellow-900/10' : ''}`}>
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
                onFocus={() => handleInputFocus('ASK_NAME')}
                error={errors.name}
              />
            </section>

            <hr className="border-slate-200 dark:border-slate-700" />

            {/* PIN Section */}
            <section aria-labelledby="pin-section" className={`transition-all duration-300 ${['ASK_PIN', 'LISTENING_PIN', 'CONFIRM_PIN'].includes(voiceStep) ? 'ring-4 ring-yellow-400 rounded-xl p-4 bg-yellow-50 dark:bg-yellow-900/10' : ''}`}>
              <div className="flex items-center gap-2 mb-3 text-blue-600 dark:text-blue-400">
                <Volume2 size={24} />
                <h2 id="pin-section" className="text-xl font-bold">الرمز السري (PIN)</h2>
              </div>

              <div className="bg-blue-50 dark:bg-blue-900/30 p-4 rounded-xl mb-6">
                <p className="text-blue-800 dark:text-blue-200 font-medium">
                  الـPIN هذا هو "صوتك". باش تستعملو باش تدخل لحسابك.
                  اختار 6 أرقام ساهلين عليك.
                </p>
              </div>

              <VoicePinInput
                ref={pinRef}
                id="pin"
                label="الـPIN (6 أرقام)"
                value={formData.pin}
                onChange={val => setFormData({ ...formData, pin: val })}
                onFocus={() => handleInputFocus('ASK_PIN')}
                error={errors.pin}
              />
            </section>

            <div className="flex gap-4">
              <button
                type="submit"
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 rounded-xl text-xl shadow-lg hover:shadow-xl transition-all focus:ring-4 focus:ring-blue-300 transform active:scale-95"
              >
                سجّل حسابك
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
            <Link to="/login" className="text-lg text-slate-600 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 font-bold underline decoration-2 underline-offset-4">
              عندك حساب؟ ادخل
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
