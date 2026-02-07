import React, { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { User, Volume2, ShieldCheck, CheckCircle } from 'lucide-react';
import Input from '../components/Input';
import VoicePinInput from '../components/auth/VoicePinInput';
import { useVoice } from '../context/VoiceContext';
import { useAuth } from '../context/AuthContext';
import { registerVoicePin } from '../lib/api';

export default function Register() {
  const navigate = useNavigate();
  const { speak, registerPageHandler } = useVoice();
  const { login } = useAuth();

  const [formData, setFormData] = useState({
    name: '',
    pin: '',
    confirmPin: ''
  });
  const [errors, setErrors] = useState({});
  const [voiceStep, setVoiceStep] = useState('WELCOME'); // WELCOME, NAME, PIN_PROMPT, PIN, CONFIRM_PIN_PROMPT, CONFIRM_PIN

  // Voice Interaction Flow
  useEffect(() => {
    if (voiceStep === 'WELCOME') {
      speak("أهلا وسهلا! أنا باش نساعدك تعمل حسابك الأول. أوّل حاجة، قلّي شنوّة اسمك الكامل؟", () => setVoiceStep('NAME'));
    } else if (voiceStep === 'PIN_PROMPT') {
      speak("باهي. توا اختار PIN متكوّن من ستّة أرقام.", () => setVoiceStep('PIN'));
    } else if (voiceStep === 'CONFIRM_PIN_PROMPT') {
      speak("باهي. توا عاود نفس الـPIN باش نتأكّدو.", () => setVoiceStep('CONFIRM_PIN'));
    }
  }, [voiceStep, speak]);

  const handleSubmit = async (e, data = formData) => {
    if (e) e.preventDefault();
    const newErrors = {};

    if (!data.name.trim()) newErrors.name = "الاسم إجباري";

    if (!data.pin || data.pin.length !== 6) {
      newErrors.pin = "الـPIN لازم يكون 6 أرقام";
    }

    if (data.pin !== data.confirmPin) {
      newErrors.confirmPin = "الـPIN مش كيف كيف";
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      speak("فما غلطة في المعلومات. ثبت وعاود.");
      return;
    }

    try {
      const res = await registerVoicePin(data.name, data.pin);

      login(res.token, res.user);

      speak("تمّ التسجيل بنجاح! مرحبا بيك في منصّة إبصار.", () => {
        navigate('/banque');
      });
    } catch (err) {
      console.error(err);
      if (err.response?.data?.message) {
        speak(err.response.data.message);
        setErrors({ form: err.response.data.message });
      } else {
        speak("صار مشكل في السرفر. عاود مرة أخرى.");
      }
    }
  };

  const handleVoiceInput = useCallback((text, intent) => {
    console.log("Register Voice Input:", text, voiceStep);

    if (voiceStep === 'NAME') {
      if (text.length > 2) {
        setFormData(prev => ({ ...prev, name: text }));
        speak(`مرحبا سي ${text}. متشرّفين بيك.`, () => setVoiceStep('PIN_PROMPT'));
      } else {
        speak("ما سمعتش اسمك بالباهي. عاود قلّي اسمك من فضلك.");
      }
      return;
    }

    if (voiceStep === 'PIN') {
      const digits = text.replace(/\D/g, '');
      if (digits.length > 0) {
        // Append digits if user says them in chunks, or replace? 
        // For simplicity, let's assume they say the whole PIN or we take the last 6 digits found
        // Better: just take the digits found in this utterance.

        if (digits.length === 6) {
          setFormData(prev => ({ ...prev, pin: digits }));
          speak("الـPIN مريقل.", () => setVoiceStep('CONFIRM_PIN_PROMPT'));
        } else {
          speak(`سمعت ${digits.length} أرقام. لازم ستّة أرقام.`);
        }
      } else {
        speak("ما سمعتش أرقام. عاود قلّي الـPIN.");
      }
      return;
    }

    if (voiceStep === 'CONFIRM_PIN') {
      const digits = text.replace(/\D/g, '');
      if (digits.length === 6) {
        if (digits === formData.pin) {
          setFormData(prev => ({ ...prev, confirmPin: digits }));
          speak("الـPIN متطابق. لحظة، نسجّل حسابك.");
          handleSubmit(null, { ...formData, confirmPin: digits });
        } else {
          speak("الـPIN موش كيف كيف. ما يهمّش، عاود الـPIN من لولاني.", () => {
            setFormData(prev => ({ ...prev, pin: '', confirmPin: '' }));
            setVoiceStep('PIN_PROMPT');
          });
        }
      } else {
        speak("عاود الـPIN من فضلك، لازم ستّة أرقام.");
      }
    }
  }, [voiceStep, formData, speak]);

  // Register the handler
  useEffect(() => {
    return registerPageHandler(handleVoiceInput);
  }, [registerPageHandler, handleVoiceInput]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-900 px-4 py-6">
      <div className="w-full max-w-lg bg-white dark:bg-slate-800 rounded-2xl shadow-xl border border-slate-100 dark:border-slate-700 overflow-hidden">

        {/* Header */}
        <div className="bg-blue-600 p-6 text-white text-center">
          <h1 className="text-3xl font-bold mb-2">تسجيل</h1>
          <p className="opacity-90">اعمل حساب جديد في منصّة إبصار</p>
        </div>

        <div className="p-6 md:p-8 space-y-6">

          {errors.form && (
            <div className="p-4 bg-red-100 text-red-700 rounded-lg text-center font-bold">
              {errors.form}
            </div>
          )}

          <form onSubmit={handleSubmit} noValidate className="space-y-6">

            {/* Name Section */}
            <section aria-labelledby="name-section" className={voiceStep === 'NAME' ? 'ring-4 ring-yellow-400 rounded-xl p-2' : ''}>
              <div className="flex items-center gap-2 mb-3 text-blue-600 dark:text-blue-400">
                <User size={24} />
                <h2 id="name-section" className="text-xl font-bold">معلوماتك</h2>
              </div>

              <Input
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
            <section aria-labelledby="pin-section" className={['PIN', 'PIN_PROMPT', 'CONFIRM_PIN', 'CONFIRM_PIN_PROMPT'].includes(voiceStep) ? 'ring-4 ring-yellow-400 rounded-xl p-2' : ''}>
              <div className="flex items-center gap-2 mb-3 text-blue-600 dark:text-blue-400">
                <Volume2 size={24} />
                <h2 id="pin-section" className="text-xl font-bold">الرمز السري (PIN)</h2>
              </div>

              <div className="space-y-6">
                <VoicePinInput
                  id="pin"
                  label="الـPIN (6 أرقام)"
                  value={formData.pin}
                  onChange={val => setFormData({ ...formData, pin: val })}
                  error={errors.pin}
                />

                <VoicePinInput
                  id="confirmPin"
                  label="عاود الـPIN للتأكيد"
                  value={formData.confirmPin}
                  onChange={val => setFormData({ ...formData, confirmPin: val })}
                  error={errors.confirmPin}
                  helperText="عاود قول نفس الأرقام باش نتأكدو"
                />
              </div>
            </section>

            <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-xl flex items-center gap-3 border border-green-100 dark:border-green-800">
              <ShieldCheck className="text-green-600 dark:text-green-400 shrink-0" size={24} />
              <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
                معلوماتك تبقى محمية وما نعطيوها لحد.
              </p>
            </div>

            <button
              type="submit"
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 rounded-xl text-xl shadow-lg hover:shadow-xl transition-all focus:ring-4 focus:ring-blue-300 transform active:scale-95"
            >
              سجّل حسابك
            </button>
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