
import { useEffect, useRef, useState, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useVoice } from '../context/VoiceContext';
import { useCart } from '../context/CartContext';
import api from '../lib/api'; // Keeping NLU as fallback if needed, but prioritizing numbers
import { executors } from './executors';
import { MENUS } from './menus';
import { 
  extractNumbers, 
  detectDoubleShortcut, 
  parseSingleMenuChoice,
  normalizeArabic,
  isYes,
  isNo
} from './numberParser';
import { playBeep } from '../lib/audio';

export default function VoiceOperator() {
  const {
    setCommandHandler,
    setDefaultCommandHandler,
    speak,
    startListening,
    stopListening
  } = useVoice();

  const { cartItems, cartTotals } = useCart();
  const cartItemsRef = useRef(cartItems);
  
  useEffect(() => {
    cartItemsRef.current = cartItems;
  }, [cartItems]);

  const location = useLocation();
  const navigate = useNavigate();
  const lastPath = useRef(null);
  
  const [confirmingOption, setConfirmingOption] = useState(null); // { id, label, action, payload }
  const [retryCount, setRetryCount] = useState(0);
  const waitTimeoutRef = useRef(null);
  const [isProcessing, setIsProcessing] = useState(false);

  // 1. Register Command Handler
  const handleVoiceCommandRef = useRef(null);
  useEffect(() => {
    handleVoiceCommandRef.current = handleVoiceCommand;
  });

  useEffect(() => {
    // Correctly set the function in state by returning it from the updater
    if (setDefaultCommandHandler) {
      setDefaultCommandHandler(() => (text) => {
        if (handleVoiceCommandRef.current) {
          return handleVoiceCommandRef.current(text);
        }
      });
      return () => setDefaultCommandHandler(() => null);
    }
  }, [setDefaultCommandHandler]);

  // 2. Announce Menu Logic
  const announceMenu = useCallback((isRetry = false) => {
    const currentPath = location.pathname;
    const menu = MENUS[currentPath];
    
    if (!menu) return;

    // Clear any existing timeout
    if (waitTimeoutRef.current) clearTimeout(waitTimeoutRef.current);

    let text = isRetry ? "نعاودلك القائمة. " : (menu.welcome || "");
    
    if (menu.options && menu.options.length > 0) {
      text += ' اختار رقم: ';
      menu.options.forEach(opt => {
        text += `${opt.id}: ${opt.label}. `;
      });
    }

    // Speak, then Beep and Listen
    // We stop listening before speaking to avoid self-pickup (though VoiceContext handles this usually)
    speak(text, () => {
      playBeep();
      startListening();
      startWaitTimeout();
    }, true); // Prevent auto-restart from context
  }, [location.pathname, speak, startListening]);

  // 3. Timeout Logic
  const startWaitTimeout = () => {
    if (waitTimeoutRef.current) clearTimeout(waitTimeoutRef.current);
    waitTimeoutRef.current = setTimeout(() => {
      handleTimeout();
    }, 10000); // 10s wait
  };

  const handleTimeout = () => {
    console.log("[VoiceOperator] Timeout - User silent");
    if (retryCount < 1) {
      setRetryCount(prev => prev + 1);
      announceMenu(true); // Retry once
    } else {
      // Trigger Help
      setRetryCount(0); // Reset for next time
      handleDoubleShortcut({ type: 'HELP' });
    }
  };

  // 4. Path Change Listener
  useEffect(() => {
    const currentPath = location.pathname;
    if (currentPath !== lastPath.current) {
      lastPath.current = currentPath;
      setConfirmingOption(null);
      setRetryCount(0);
      
      // Short delay to allow page load
      setTimeout(() => {
        announceMenu();
      }, 1000);
    }
  }, [location.pathname, announceMenu]);

  // 6. Action Executors
  const handleDoubleShortcut = useCallback((action) => {
    switch (action.type) {
      case 'NAVIGATE':
        if (action.target) navigate(action.target);
        break;
      case 'GO_BACK':
        if (location.pathname !== '/') navigate(-1);
        else speak("ما تنجمش ترجع، انت في الرئيسية.");
        break;
      case 'REPEAT':
        announceMenu();
        break;
      case 'HELP':
        const menu = MENUS[location.pathname];
        let helpText = "المساعدة: ";
        if (menu) {
           helpText += `انت في ${menu.title}. `;
           helpText += "تنجم تختار رقم من 1 لـ 9. ";
           helpText += "أو استعمل الاختصارات: 1 1 للرئيسية، 2 2 للرجوع، 3 3 للبنك، 4 4 للمتجر. ";
           helpText += "توا نعاودلك القائمة. ";
        }
        speak(helpText, () => {
           announceMenu();
        }, true);
        break;
      default:
        console.warn("Unknown shortcut:", action);
    }
  }, [navigate, location.pathname, speak, announceMenu]);

  const executeMenuOption = useCallback(async (option) => {
    try {
      switch (option.action) {
        case 'NAVIGATE':
          navigate(option.payload);
          break;
        case 'GO_BACK':
          navigate(-1);
          break;
        case 'FOCUS':
          const input = document.querySelector(`input[name="${option.payload}"]`) || 
                        document.querySelector(`#${option.payload}`);
          if (input) {
            input.focus();
            speak("تفضل، اكتب.", null, true); // No restart, user types
          } else {
            speak("ما لقيتش الخانة.", () => announceMenu(), true);
          }
          break;
        case 'SUBMIT_LOGIN':
        case 'SUBMIT_REGISTER':
          executors.click('button[type="submit"]');
          break;
        case 'READ_PRODUCTS':
          const products = document.querySelectorAll('[role="article"] h3');
          if (products.length > 0) {
            let text = "المنتجات: ";
            products.forEach((p, i) => { if (i < 3) text += p.innerText + '. '; });
            speak(text);
          } else {
            speak("ما فماش منتجات.");
          }
          break;
        case 'OPEN_CART':
          executors.click('[aria-label="Cart"]'); 
          break;
        case 'LOGOUT':
           navigate('/login'); 
           break;
        case 'READ_BALANCE':
           speak("رصيدك الحالي هو 1200 دينار.");
           break;
        case 'START_TRANSFER':
           speak("لمن تحب تبعث؟");
           break;
        default:
          speak("العملية هذي مازالت موش متوفرة.");
      }
    } catch (err) {
      console.error("Execution failed:", err);
      speak("صار مشكل في التنفيذ.");
    }
  }, [navigate, speak]);

  // 5. Core Voice Command Handler
  const handleVoiceCommand = useCallback(async (text) => {
    if (isProcessing) return;
    setIsProcessing(true);
    
    // Received input -> Clear timeout
    if (waitTimeoutRef.current) clearTimeout(waitTimeoutRef.current);

    console.log("[VoiceOperator] Processing:", text);
    
    try {
      // Extract Numbers
      const numbers = extractNumbers(text);
      console.log("[VoiceOperator] Extracted Numbers:", numbers);

      // A. Check Double Shortcut (Priority)
      const doubleAction = detectDoubleShortcut(numbers);
      if (doubleAction) {
        console.log("[VoiceOperator] Double Shortcut:", doubleAction);
        setConfirmingOption(null); // Cancel any pending confirmation
        handleDoubleShortcut(doubleAction);
        setIsProcessing(false);
        return;
      }

      // B. Confirmation Flow
      if (confirmingOption) {
        if (isYes(text)) {
          speak("باهي.", async () => {
            await executeMenuOption(confirmingOption);
            setConfirmingOption(null);
            // If action is not navigation, listen again?
            if (confirmingOption.action !== 'NAVIGATE') {
               playBeep();
               startListening();
            }
          }, true);
        } else if (isNo(text)) {
          speak("باهي، ألغينا.", () => {
            setConfirmingOption(null);
            announceMenu();
          }, true);
        } else {
          speak("جاوب ب نعم ولا لا.", () => {
             playBeep();
             startListening();
             startWaitTimeout();
          }, true);
        }
        setIsProcessing(false);
        return;
      }

      // C. Single Menu Choice
      const choice = parseSingleMenuChoice(text);
      if (choice) {
        const menu = MENUS[location.pathname];
        const option = menu?.options.find(o => o.id === choice);
        
        if (option) {
          speak(`اخترت رقم ${choice}: ${option.label}. صحيح؟`, () => {
            setConfirmingOption(option);
            playBeep();
            startListening();
            startWaitTimeout();
          }, true);
          setIsProcessing(false);
          return;
        }
      }

      // D. Fallback / No Match
      speak("ما فهمتش الرقم. عاود اختار.", () => {
         playBeep();
         startListening();
         startWaitTimeout();
      }, true);

    } catch (err) {
      console.error("[VoiceOperator] Error:", err);
      speak("صار مشكل، نعطيك المساعدة توّا.", () => {
        handleDoubleShortcut({ type: 'HELP' });
      }, true);
    } finally {
      setIsProcessing(false);
    }
  }, [isProcessing, confirmingOption, handleDoubleShortcut, executeMenuOption, location.pathname, speak, startListening, announceMenu, startWaitTimeout]);


  // 7. Keyboard Handler (Simulate Voice Choice)
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (['INPUT', 'TEXTAREA'].includes(document.activeElement.tagName)) return;

      const key = parseInt(e.key);
      if (!isNaN(key) && key >= 1 && key <= 9) {
        e.preventDefault();
        // Simulate voice command for this number
        // Or directly execute?
        // User said: "Voice-only numbered selection". 
        // But "Ensure the automation works for both keyboard input and spoken commands" (previous task).
        // Let's treat keyboard as a direct selection WITHOUT confirmation for speed?
        // Or WITH confirmation to match voice flow?
        // Matching voice flow is safer.
        handleVoiceCommand(`${key}`);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleVoiceCommand]); // Dependency on handleVoiceCommand (which is stable via ref or callback?)
  // handleVoiceCommand is not stable as defined above (re-created every render).
  // I should wrap handleVoiceCommand in useCallback or use ref.
  // Actually, I defined handleVoiceCommand inside the component, so it changes.
  // I'll wrap it in useCallback or just disable the warning.

  return null;
}
