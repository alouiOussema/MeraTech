import React, { useState, useEffect } from 'react';
import { User } from 'lucide-react';
import Input from '../components/Input';
import VoicePinInput from '../components/auth/VoicePinInput';
import { useVoice } from '../context/VoiceContext';
import { useAuth } from '../context/AuthContext';
import { useAuthVoiceFlow } from '../assistant/authFlow';
import { loginWithVoicePin } from '../lib/api';
import { useNavigate, useLocation } from 'react-router-dom';

export default function Login() {
  const [formData, setFormData] = useState({ name: '', pin: '' });
  const [errors, setErrors] = useState({});
  const voice = useVoice();
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const { formData: voiceData } = useAuthVoiceFlow(voice, { mode: 'LOGIN' });

  // Handle redirect messages (e.g. "You must login first")
  useEffect(() => {
    if (location.state?.message) {
      voice.speak(location.state.message);
      // Clear state to avoid repeating on re-renders (optional, but good practice if possible, 
      // though replacing history entry is hard here without causing another render. 
      // Just speaking once on mount is fine as location.state persists.)
      // We could use history.replace to clear it, but let's keep it simple.
      // Ideally we only speak if we haven't spoken it yet, but useEffect with empty deps 
      // or specific logic is needed.
      // Actually, since this component mounts on navigation, speaking once is correct.
      
      // To prevent re-speaking if user interacts with page, we can rely on standard useEffect behavior.
      // However, we should be careful not to conflict with other voice flows.
    }
  }, [location.state]);

  useEffect(() => {
    if (voiceData?.name || voiceData?.pin) {
      setFormData(prev => ({
        ...prev,
        name: voiceData.name || prev.name,
        pin: voiceData.pin || prev.pin
      }));
    }
  }, [voiceData]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrors({});
    
    try {
      if (!formData.name || !formData.pin) {
        setErrors({ form: 'الرجاء تعمير كل الخانات' });
        return;
      }
      
      const response = await loginWithVoicePin(formData.name, formData.pin);
      login(response.token, response.user);
      navigate('/banque');
    } catch (error) {
      console.error(error);
      setErrors({ form: error.response?.data?.message || 'فشل في الدخول. تثبت من معلوماتك.' });
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-900 px-4 py-6">
      <div className="w-full max-w-lg bg-white dark:bg-slate-800 rounded-2xl shadow-xl border border-slate-100 dark:border-slate-700 overflow-hidden">
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
            <section aria-labelledby="name-section">
              <div className="flex items-center gap-2 mb-3 text-blue-600 dark:text-blue-400">
                <User size={24} />
                <h2 id="name-section" className="text-xl font-bold">معلوماتك</h2>
              </div>

              <Input
                name="name"
                id="name"
                label="اسمك الكامل"
                placeholder="فلان الفلاني"
                value={formData.name}
                onChange={e => setFormData({ ...formData, name: e.target.value })}
                error={errors.name}
                helperText="المُرشد يعمّر الاسم بالصوت"
              />
            </section>

            <section aria-labelledby="pin-section">
              <VoicePinInput
                name="pin"
                id="pin"
                label="الرمز السري الصوتي"
                value={formData.pin}
                onChange={val => setFormData({ ...formData, pin: val })}
                error={errors.pin}
                helperText="قول 6 أرقام"
              />
            </section>

            <div className="pt-4">
              <button
                type="submit"
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 rounded-xl text-lg transition-all transform hover:scale-[1.02] active:scale-[0.98] shadow-lg hover:shadow-xl"
              >
                تأكيد الدخول
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
