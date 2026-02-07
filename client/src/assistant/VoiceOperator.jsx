
import { useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useVoice } from '../context/VoiceContext';
import api from '../lib/api';
import { executors } from './executors';
import { PAGE_SCRIPTS } from './pageScripts';

export default function VoiceOperator() {
  const {
    setCommandHandler,
    speak,
    isListening,
    requestPermissionManual
  } = useVoice();

  const location = useLocation();
  const navigate = useNavigate();
  // Initialize with null to ensure the first page load triggers the effect
  const lastPath = useRef(null);
  const [processing, setProcessing] = useState(false);

  // 1. Register as the global command handler
  // Use a ref to ensure the handler always has access to fresh state/props
  // without triggering context updates (and re-renders) constantly.
  const handleVoiceCommandRef = useRef(null);

  useEffect(() => {
    handleVoiceCommandRef.current = handleVoiceCommand;
  });

  useEffect(() => {
    // Register a stable wrapper function
    setCommandHandler(() => (text) => {
      if (handleVoiceCommandRef.current) {
        return handleVoiceCommandRef.current(text);
      }
    });
    return () => setCommandHandler(null);
  }, [setCommandHandler]);

  // 2. Handle Navigation & Announcements
  useEffect(() => {
    const currentPath = location.pathname;
    console.log('[VoiceOperator] Path Check:', { current: currentPath, last: lastPath.current });

    // Only announce if path changed
    if (currentPath !== lastPath.current) {
      lastPath.current = currentPath;

      const script = PAGE_SCRIPTS[currentPath];
      if (script) {
        console.log('[VoiceOperator] Script found for:', currentPath, script);
        // Wait for page to fully mount/render before announcing
        setTimeout(() => {
          console.log('[VoiceOperator] Attempting to speak welcome message:', script.welcome);
          try {
            speak(script.welcome);
          } catch (err) {
            console.error('[VoiceOperator] Failed to speak welcome message:', err);
          }
        }, 1200);
      } else {
        console.warn('[VoiceOperator] No script found for path:', currentPath);
      }
    }
  }, [location.pathname, speak]);

  // 3. Core Logic: Handle Voice Command
  const handleVoiceCommand = async (text) => {
    if (processing) return;
    setProcessing(true);

    try {
      console.log("[VoiceOperator] Analyzing:", text);

      // Call NLU
      const res = await api.post('/nlu/intent', { text });
      const { intent, confidence, entities, reply_darija } = res.data;

      console.log("[VoiceOperator] NLU Result:", { intent, entities, reply_darija });

      // Speak the assistant's reply first (feedback)
      if (reply_darija) {
        speak(reply_darija);
      } else if (intent === 'UNKNOWN') {
        speak("سامحني، ما فهمتكش.");
      }

      // Execute Action
      await executeIntent(intent, entities);

    } catch (error) {
      console.error("[VoiceOperator] Error:", error);
      speak("صار مشكل في الاتصال. عاود مرة أخرى.");
    } finally {
      setProcessing(false);
    }
  };

  // 4. Intent Execution Router
  const executeIntent = async (intent, entities) => {
    // Global Navigation
    switch (intent) {
      case 'HOME':
        navigate('/');
        return;
      case 'LOGIN':
        navigate('/login');
        return;
      case 'REGISTER':
        navigate('/register');
        return;
      case 'BANK':
        navigate('/banque');
        return;
      case 'COURSES':
        navigate('/courses');
        return;
      case 'HELP':
        const script = PAGE_SCRIPTS[location.pathname];
        if (script && script.commands) {
          speak(`في الصفحة هذي، تنجم تقول: ${script.commands.join('، ')}`);
        } else {
          speak("تنجم تمشي للبنك، ولا الكورسة، ولا الصفحة الرئيسية.");
        }
        return;
      case 'REPEAT':
        // VoiceContext handles this usually, but we can do it here too if needed
        return;
    }

    // Context-Specific Actions
    const currentPath = location.pathname;

    if (currentPath === '/login') {
      // Logic for Login is simple form fill
      // If NLU extracted name/pin (unlikely for PIN usually, but name yes)
      // Usually Login flow is: "Login" -> Guided.
      // But if user says "My name is Ali", Intent might be UNKNOWN or specific if trained.
      // Our NLU has no specific intent for "PROVIDE_NAME".
      // We rely on "filling" based on context.

      // Ideally, NLU returns "FILL_FORM" or we infer it.
      // For now, let's assume if we are on Login and get UNKNOWN or just text, we might treat it as input?
      // The NLU prompt handles specific intents.
      // If the user says "Ali", NLU might say UNKNOWN.
      // This is a limitation of the current NLU prompt. 
      // We need the NLU to support "INFORM" or "PROVIDE_DATA".
      // Or we use local heuristics for data entry like PINs.
    }

    // BANK Actions
    if (intent === 'GET_BALANCE') {
      // The Banque page fetches data. We need to read it from DOM or re-fetch.
      // Re-fetching is safer programmatically.
      try {
        const res = await api.get('/bank/balance');
        speak(`رصيدك هو ${res.data.balance} دينار`);
      } catch (e) {
        speak("ما نجمتش نعرف الرصيد.");
      }
    }

    if (intent === 'BANK_TRANSFER') {
      if (entities.toName && entities.amount) {
        // Fill form and submit
        const filled = executors.fillInput('input[placeholder*="اسم"]', entities.toName) &&
          executors.fillInput('input[type="number"]', entities.amount);

        if (filled) {
          // Click submit
          setTimeout(() => {
            executors.click('button[type="submit"]');
          }, 1000);
        } else {
          // If not on bank page, go there first?
          if (currentPath !== '/banque') {
            navigate('/banque');
            speak("هزيتك للبنك. عاود الأمر.");
          }
        }
      } else {
        speak("لمن تحب تبعث وقداش؟");
      }
    }

    // COURSES Actions
    if (intent === 'ADD_ITEM') {
      if (entities.itemName) {
        // We need to call the API directly or interact with UI.
        // API is better for reliability.
        try {
          await api.post('/courses/items', { name: entities.itemName, qty: entities.qty || 1 });
          // Force refresh UI? 
          // Since we bypassed React state, the UI won't update unless we trigger a refresh.
          // Navigation to same page might work or we rely on the component polling.
          // Better: The component should listen to DB changes? No.
          // Use executors to reload?
          window.location.reload(); // Crude but effective for "Out-of-the-box" without refactoring component state
        } catch (e) {
          speak("ما نجمتش نزيد القضية.");
        }
      }
    }

    if (intent === 'CHECK_PRICE') {
      if (entities.itemName) {
        try {
          const res = await api.get(`/prices/${entities.itemName}`);
          speak(`سوم ${entities.itemName} هو ${res.data.price} دينار`);
        } catch (error) {
          speak("ما عرفتش السوم");
        }
      }
    }

    if (intent === 'GET_TOTAL') {
      try {
        const res = await api.get('/courses/total');
        speak(`التوتال متاعك ${res.data.total} دينار`);
      } catch (error) {
        speak("ما عرفتش التوتال");
      }
    }

  };

  return null; // Logic only component
}
