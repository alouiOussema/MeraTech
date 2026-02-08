import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { User, Volume2, ShieldCheck } from 'lucide-react';
import Input from '../components/Input';
import VoicePinInput from '../components/auth/VoicePinInput';
import { useVoice } from '../context/VoiceContext';
import { useAuth } from '../context/AuthContext';
import { useAuthVoiceFlow } from '../assistant/authFlow';
import { registerVoicePin } from '../lib/api';

export default function Register() {
  const navigate = useNavigate();
  const voice = useVoice();
  const { login } = useAuth();
  const { formData: voiceData } = useAuthVoiceFlow(voice);

  const [formData, setFormData] = useState({
    name: '',
    pin: '',
    confirmPin: ''
  });
  const [errors, setErrors] = useState({});

  // Sync voice data to local form data
  useEffect(() => {
    if (voiceData.name || voiceData.pin) {
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

      const response = await registerVoicePin(formData.name, formData.pin);
      login(response.token, response.user);
      navigate('/banque');
    } catch (error) {
      console.error(error);
      setErrors({ form: error.response?.data?.message || 'فشل في التسجيل.' });
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-900 px-4 py-6">
      <div className="w-full max-w-lg bg-white dark:bg-slate-800 rounded-2xl shadow-xl border border-slate-100 dark:border-slate-700 overflow-hidden">
        
        {/* Header */}
        <div className="bg-emerald-600 p-6 text-white text-center">
          <div className="flex justify-center mb-4">
            <div className="p-3 bg-white/20 rounded-full backdrop-blur-sm">
              <ShieldCheck size={40} className="text-white" />
            </div>
          </div>
          <h1 className="text-3xl font-bold mb-2">تسجيل جديد</h1>
          <p className="opacity-90">مرحبا بيك في تطبيقنا</p>
        </div>

        <div className="p-6 md:p-8 space-y-6">
          
          {errors.form && (
             <div className="p-4 bg-red-100 text-red-700 rounded-lg text-center font-bold">
               {errors.form}
             </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            
            {/* Name Section */}
            <section>
              <Input 
                name="fullName"
                id="name"
                label="الاسم الكامل"
                icon={User}
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
                error={errors.name}
                placeholder="فلان الفلاني"
                helperText="قول اسمك باش يتعمّر أوتوماتيكياً"
              />
            </section>

            {/* PIN Section */}
            <section>
              <div className="flex items-center gap-2 mb-2 text-emerald-600 dark:text-emerald-400">
                <Volume2 size={24} />
                <h2 className="text-xl font-bold">الرمز السري (PIN)</h2>
              </div>
              <VoicePinInput
                name="voicePin"
                id="pin"
                label="اختار رمز سري (6 أرقام)"
                value={formData.pin}
                onChange={(val) => setFormData({...formData, pin: val})}
                error={errors.pin}
                helperText="قول 6 أرقام للرمز السري"
              />
            </section>

            {/* Submit Button */}
            <button
              type="submit"
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-4 rounded-xl text-lg transition-all transform hover:scale-[1.02] active:scale-[0.98] shadow-lg hover:shadow-xl mt-4"
            >
              تسجيل حساب
            </button>

            <div className="text-center mt-6">
              <p className="text-slate-600 dark:text-slate-400">
                عندك حساب؟{' '}
                <Link to="/login" className="text-emerald-600 font-bold hover:underline">
                  سجل الدخول من هنا
                </Link>
              </p>
            </div>

          </form>
        </div>
      </div>
    </div>
  );
}
