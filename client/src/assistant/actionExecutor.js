import { executors } from './executors';
import { playBeep } from '../lib/audio';

/**
 * Executes a resolved action.
 * @param {object} commandResult - { action, payload, ... }
 * @param {object} context - { navigate, speak, location, announceMenu, ... }
 */
export const executeAction = async (commandResult, context) => {
  const { action, payload } = commandResult;
  const { navigate, speak, announceMenu, location } = context;

  console.log("[ActionExecutor] Executing:", action, payload);

  try {
    switch (action) {
      case 'NAVIGATE':
        if (payload) navigate(payload);
        break;

      case 'GO_BACK':
        if (location.pathname !== '/') {
          navigate(-1);
        } else {
          speak("ما تنجمش ترجع، انت في الرئيسية.");
        }
        break;

      case 'REPEAT':
        announceMenu();
        break;

      case 'HELP':
        // Generate help text based on current menu
        // We might want to move this logic to a helper or keep it simple here
        let helpText = "المساعدة: ";
        // We assume context has the current menu or we can fetch it?
        // Let's assume the caller handles the full help text generation 
        // OR we do a simple generic help + announce menu.
        // For now, consistent with VoiceOperator:
        helpText += "تنجم تختار رقم من 1 لـ 9. ";
        helpText += "أو استعمل الاختصارات: 1 1 للرئيسية، 2 2 للرجوع. ";
        speak(helpText, () => {
          announceMenu();
        }, true);
        break;

      case 'FOCUS':
        const input = document.querySelector(`input[name="${payload}"]`) || 
                      document.querySelector(`#${payload}`);
        if (input) {
          input.focus();
          speak("تفضل، اكتب.", null, false); // Keep listening
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

      case 'NO_MATCH':
        speak("ما فهمتكش. عاود اختار.", () => {
             playBeep();
        }, false); 
        break;

      case 'TOGGLE_LISTENING':
        if (context.toggleListening) {
          context.toggleListening();
          // Optionally speak status
          // speak("بدلت حالة الميكروفون", null, false);
        }
        break;

      default:
        speak("العملية هذي مازالت موش متوفرة.");
    }
  } catch (err) {
    console.error("[ActionExecutor] Execution failed:", err);
    speak("صار مشكل في التنفيذ.");
  }
};
