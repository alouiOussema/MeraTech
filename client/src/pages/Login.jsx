import React, { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { User, Volume2, HelpCircle } from 'lucide-react';
import Input from '../components/Input';
import VoicePinInput from '../components/auth/VoicePinInput';
import AccessibleAlert from '../components/AccessibleAlert';
import { useVoice } from '../context/VoiceContext';
import api from '../lib/api';

export default function Login() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({ name: '', pin: '' });
  const [errors, setErrors] = useState({});
  const { registerPageHandler, speak } = useVoice();
  const [voiceStep, setVoiceStep] = useState('WELCOME'); // WELCOME, NAME, PIN, SUBMIT

  // Voice Interaction Logic
  useEffect(() => {
    if (voiceStep === 'WELCOME') {
      speak("مرحبا. باش تدخل، قلّي اسمك الكامل", () => setVoiceStep('NAME'));
    } else if (voiceStep === 'PIN_PROMPT') {
      speak("توا قلّي الـPIN متاعك 6 أرقام", () => setVoiceStep('PIN'));
    }
  }, [voiceStep, speak]);

  const handleVoiceInput = useCallback((text, intent) => {
    // If it's a global intent like "Register", the global handler handles it (navigation).
    // But here we get the text first if registered.
    
    // Heuristic for Name
    if (voiceStep === 'NAME') {
      // Assume the text is the name
      setFormData(prev => ({ ...prev, name: text }));
      speak(`باهي، ${text}.`, () => setVoiceStep('PIN_PROMPT'));
      return;
    }

    // Heuristic for PIN
    if (voiceStep === 'PIN') {
      // Extract digits
      const digits = text.replace(/\D/g, '');
      if (digits.length > 0) {
        setFormData(prev => ({ ...prev, pin: digits }));
        if (digits.length === 6) {
           speak("PIN مريقل. باش نجرب ندخل.");
           // Trigger submit automatically? Maybe wait for confirmation
           handleSubmit(null, { ...formData, pin: digits }); // Pass new data directly
        } else {
           speak(`سمعت ${digits.length} أرقام. لازم 6.`);
        }
      } else {
        speak("ما سمعتش أرقام. عاود الـPIN.");
      }
    }
  }, [voiceStep, formData, speak]);

  // Register handler
  useEffect(() => {
    return registerPageHandler(handleVoiceInput);
  }, [registerPageHandler, handleVoiceInput]);


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
      const res = await api.post('/auth/voice-login', {
        name: data.name,
        voicePin: data.pin
      });
      
      speak("مرحباً بيك! تم الدخول بنجاح.");
      navigate('/banque');
      
    } catch (error) {
      console.error(error);
      const msg = error.response?.data?.message || "صار مشكل في الدخول";
      speak(msg);
      setErrors({ form: msg });
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-900 px-4 py-6">
      <div className="w-full max-w-lg bg-white dark:bg-slate-800 rounded-2xl shadow-xl border border-slate-100 dark:border-slate-700 overflow-hidden">
        
        {/* Header */}
        <div className="bg-blue-600 p-6 text-white text-center">
          <h1 className="text-3xl font-bold mb-2">دخول</h1>
          <p className="opacity-90">مرحباً بيك في منصّة إبصار</p>
        </div>

        <div className="p-6 space-y-6">
          
          <AccessibleAlert 
            type="info" 
            message="للوقت هذا، الدخول بالاسم و PIN فقط (تجربة)" 
          />

          {errors.form && (
            <AccessibleAlert type="error" message={errors.form} />
          )}

          <form onSubmit={handleSubmit} noValidate className="space-y-6">
            
            {/* Name Section */}
            <section aria-labelledby="name-section">
              <div className="flex items-center gap-2 mb-3 text-blue-600 dark:text-blue-400">
                <User size={24} />
                <h2 id="name-section" className="text-xl font-bold">شكونك؟</h2>
              </div>
              
              <Input
                id="name"
                label="اسمك الكامل"
                placeholder="فلان الفلاني"
                value={formData.name}
                onChange={e => setFormData({...formData, name: e.target.value})}
                error={errors.name}
              />
            </section>

            <hr className="border-slate-200 dark:border-slate-700" />

            {/* PIN Section */}
            <section aria-labelledby="pin-section">
              <div className="flex items-center gap-2 mb-3 text-blue-600 dark:text-blue-400">
                <Volume2 size={24} />
                <h2 id="pin-section" className="text-xl font-bold">الرمز السري (PIN)</h2>
              </div>

              <VoicePinInput
                id="pin"
                label="الـPIN (6 أرقام)"
                value={formData.pin}
                onChange={val => setFormData({...formData, pin: val})}
                error={errors.pin}
              />
            </section>

            <button
              type="submit"
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 rounded-xl text-xl shadow-lg hover:shadow-xl transition-all focus:ring-4 focus:ring-blue-300 transform active:scale-95"
            >
              ادخل
            </button>
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
