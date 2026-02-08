import { useState, useRef, useEffect, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { extractNumbers, normalizeArabic } from './numberParser';
import { log } from '../lib/voice';
import { playBeep } from '../lib/audio';
import { registerVoicePin, loginWithVoicePin } from '../lib/api';
import { useAuth } from '../context/AuthContext';
const STATES = {
  IDLE: 'IDLE',
  ASK_NAME: 'ASK_NAME',
  ASK_PIN: 'ASK_PIN',
  CONFIRM_SUBMIT: 'CONFIRM_SUBMIT',
  DONE: 'DONE'
};

export function useAuthVoiceFlow(voice) {
  const { speak, startListening, setCommandHandler } = voice;
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [flowState, setFlowState] = useState(STATES.IDLE);
  
  // Form Data
  const [formData, setFormData] = useState({ name: '', pin: '' });

  // Refs
  const stateRef = useRef(flowState);
  const formDataRef = useRef(formData);

  useEffect(() => {
    stateRef.current = flowState;
    formDataRef.current = formData;
  }, [flowState, formData]);

  // Helper: Prompt
  const prompt = useCallback((text, nextState) => {
    if (nextState) setFlowState(nextState);
    speak(text, () => {
      playBeep();
      startListening();
    }, true);
  }, [speak, startListening]);

  // Helper: Start Flow
  const startAuthFlow = useCallback(() => {
    const isRegister = location.pathname === '/register';
    const intro = isRegister 
      ? "مرحبا بيك. باش نعملو تسجيل جديد. أول حاجة قول اسمك."
      : "مرحبا بيك. باش نعملو الدخول. أول حاجة قول اسمك.";
    
    setFormData({ name: '', pin: '' });
    prompt(intro, STATES.ASK_NAME);
  }, [location.pathname, prompt]);

  // --- Handlers ---

  const handleNameInput = (text) => {
    const name = text.trim(); // Basic cleanup
    if (name.length < 2) {
       prompt("الاسم قصير برشا. عاود قول اسمك.", STATES.ASK_NAME);
       return;
    }
    
    setFormData(prev => ({ ...prev, name }));
    // Fill Input in DOM if exists (optional visual sync)
    // But we rely on state mostly. We can try to fill inputs if they exist.
    const nameInput = document.querySelector('input[name="fullName"]'); // Adjust selector based on actual component
    if (nameInput) {
        nameInput.value = name;
        nameInput.dispatchEvent(new Event('input', { bubbles: true }));
    }

    prompt("تمام. سجلت الاسم. توا قول الرمز السري: ستة أرقام.", STATES.ASK_PIN);
  };

  const handlePinInput = (text) => {
    // Robust parsing: extract all digits
    const nums = extractNumbers(text);
    // If user says "one two three four five six" -> [1,2,3,4,5,6] -> join to "123456"
    // If user says "123456" -> [123456] -> join
    // We need a string of 6 digits.
    
    let pinStr = nums.join('');
    
    // Check length
    if (pinStr.length !== 6) {
        prompt("الرمز لازم يكون ستة أرقام. عاود قول الرمز.", STATES.ASK_PIN);
        return;
    }

    setFormData(prev => ({ ...prev, pin: pinStr }));
    
    const pinInput = document.querySelector('input[name="voicePin"]'); // Adjust selector
    if (pinInput) {
        pinInput.value = pinStr;
        pinInput.dispatchEvent(new Event('input', { bubbles: true }));
    }

    prompt("تمام. سجلت الرمز. تحب نأكدو؟ اختار نعم أو لا.", STATES.CONFIRM_SUBMIT);
  };

  const handleSubmitConfirm = async (text) => {
    const normalized = normalizeArabic(text);
    if (normalized.includes('نعم')) {
        speak("لحظة برك...", null, true);
        
        try {
            const { name, pin } = formDataRef.current;
            const isRegister = location.pathname === '/register';
            
            if (isRegister) {
                const response = await registerVoicePin(name, pin);
                login(response.token, response.user);
                speak("تم التسجيل بنجاح. تنجم تشوف رصيدك في البانكة.", () => navigate('/banque'));
            } else {
                const response = await loginWithVoicePin(name, pin);
                login(response.token, response.user);
                speak("تم الدخول بنجاح. مرحبا بيك.", () => navigate('/banque'));
            }
            setFlowState(STATES.DONE);
        } catch (error) {
            console.error(error);
            speak("صار مشكل. عاود جرّب.", () => {
                // Restart?
                startAuthFlow();
            });
        }

    } else if (normalized.includes('لا')) {
        prompt("تحب تبدّل الاسم ولا الرمز؟ واحد للاسم، اثنين للرمز.", STATES.IDLE); 
        // We need a branching state here or just handle it in main handler
        // Simplified: Restart flow
        prompt("باهي. مالا نعاودو من الأول. قول اسمك.", STATES.ASK_NAME);
    } else {
        prompt("اختار نعم أو لا.", STATES.CONFIRM_SUBMIT);
    }
  };

  // --- Main Command Handler ---
  const handleCommand = useCallback((text) => {
    const currentState = stateRef.current;
    const nums = extractNumbers(text);
    const choiceNum = nums.length > 0 ? nums[0] : null;

    log('info', `[AuthFlow] state=${currentState}, text="${text}"`);

    // Global 0/9
    if (choiceNum === 0) {
        navigate(-1);
        return;
    }
    if (choiceNum === 9) {
        // Repeat current prompt based on state
        // Simplification: just restart the prompt for current state logic
        // But prompt() function needs text.
        // Let's just re-trigger startAuthFlow if at start, or handle context.
        // For now, 9 just restarts the whole flow for simplicity in this wizard
        startAuthFlow();
        return;
    }

    switch (currentState) {
        case STATES.ASK_NAME:
            handleNameInput(text);
            break;
        case STATES.ASK_PIN:
            handlePinInput(text);
            break;
        case STATES.CONFIRM_SUBMIT:
            handleSubmitConfirm(text);
            break;
        default:
            break;
    }
  }, [navigate, startAuthFlow, prompt]); // Dependencies

  // --- Mount/Dismount Logic ---
  useEffect(() => {
    const isAuthPage = location.pathname === '/login' || location.pathname === '/register';
    
    if (isAuthPage) {
        console.log("[AuthFlow] Active");
        setCommandHandler(() => handleCommand);
        startAuthFlow();
    }

    return () => {
        if (isAuthPage) {
            console.log("[AuthFlow] Cleanup");
            setCommandHandler(null);
        }
    };
  }, [location.pathname, setCommandHandler, startAuthFlow, handleCommand]);

  return { formData, flowState };
}
