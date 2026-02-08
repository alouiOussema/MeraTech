import { useState, useRef, useEffect, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { extractNumbers, normalizeArabic } from './numberParser';
import { MENUS } from './menus';
import { log } from '../lib/voice';
import { playBeep } from '../lib/audio';

const STATES = {
  IDLE: 'IDLE',
  WAIT_SEARCH_QUERY: 'WAIT_SEARCH_QUERY',
  WAIT_ADD_PRODUCT_NAME: 'WAIT_ADD_PRODUCT_NAME',
  WAIT_ADD_QTY: 'WAIT_ADD_QTY',
  WAIT_CONFIRM_CHECKOUT: 'WAIT_CONFIRM_CHECKOUT',
  WAIT_CONFIRM_EMPTY: 'WAIT_CONFIRM_EMPTY',
  // Intermediate states to confirm add after search
  WAIT_CONFIRM_ADD_SEARCH_RESULT: 'WAIT_CONFIRM_ADD_SEARCH_RESULT'
};

export function useProductsVoiceFlow({
  voice,
  cart,
  products,
  setSearchQuery,
  searchQuery,
  searchInputRef
}) {
  const { speak, startListening, setCommandHandler, resetTranscript } = voice;
  const { addToCart, checkout, clearCart, cartItems, cartTotals } = cart;
  const navigate = useNavigate();
  const location = useLocation();
  
  // State Machine
  const [flowState, setFlowState] = useState(STATES.IDLE);
  const [selectedProduct, setSelectedProduct] = useState(null);
  
  // Refs for access in callbacks
  const stateRef = useRef(flowState);
  const productsRef = useRef(products);
  const selectedProductRef = useRef(selectedProduct);

  useEffect(() => {
    console.log("[ProductsFlow] Mounted");
    stateRef.current = flowState;
    productsRef.current = products;
    selectedProductRef.current = selectedProduct;
  }, [flowState, products, selectedProduct]);

  // --- Entry Announcement ---
  useEffect(() => {
    if (location.pathname === '/products') {
        console.log("[ProductsFlow] Announcing products menu on entry");
        setFlowState(STATES.IDLE);
        const menu = MENUS['/products'];
        if (menu) {
             speak(menu.welcome, () => {
                playBeep();
                startListening();
             }, true);
        }
    }
  }, [location.pathname, speak, startListening]);

  // --- Helper: Product Finder ---
  const findProductByName = (name) => {
    if (!name) return null;
    const normalizedQuery = normalizeArabic(name).toLowerCase();
    
    // Exact match or substring
    const matches = productsRef.current.filter(p => {
        const normP = normalizeArabic(p.name).toLowerCase();
        return normP.includes(normalizedQuery);
    });

    if (matches.length === 0) return null;
    
    // Pick best match (shortest name usually closest to query, or first)
    // For now, return first match
    return matches[0];
  };

  // --- Helpers: Speak & Listen ---
  const prompt = (text, nextState) => {
    if (nextState) setFlowState(nextState);
    speak(text, () => {
        playBeep();
        startListening();
    }, true);
  };

  const repeatMenu = () => {
    const menu = MENUS['/products'];
    if (menu) {
        speak(menu.welcome, () => {
            playBeep();
            startListening();
        }, true);
    }
  };

  // --- Handlers for Options ---

  // Option 1: Filter/Search
  const startSearch = () => {
    prompt("قول اسم المنتَج اللي تحب تلوج عليه.", STATES.WAIT_SEARCH_QUERY);
  };

  const handleSearchQuery = (text) => {
    const product = findProductByName(text);
    // Update UI filter
    setSearchQuery(text); 
    console.log(`[ProductsFlow] setSearchQuery="${text}"`);

    // Force input value update to trigger React state if needed (though setSearchQuery should handle it)
    if (searchInputRef.current) {
        searchInputRef.current.value = text;
        // Dispatch input event to ensure listeners catch it
        const event = new Event('input', { bubbles: true });
        searchInputRef.current.dispatchEvent(event);
    }
    
    if (product) {
        setSelectedProduct(product);
        prompt(`لقيت ${product.name}. تحب نزيدوه للسلة؟ اختار نعم أو لا.`, STATES.WAIT_CONFIRM_ADD_SEARCH_RESULT);
    } else {
        prompt("ما لقيتش. تحب تعاود؟ اختار نعم أو لا.", STATES.WAIT_SEARCH_QUERY); // We stay in query state but ask logic implies branching
        // Actually, if 'Yes' -> WAIT_SEARCH_QUERY. If 'No' -> IDLE.
        // Let's handle the Yes/No for retry in a sub-logic or just re-prompt.
        // User spec: "if not found: '...'. (yes => WAIT_SEARCH_QUERY, no => IDLE)"
        // So we need a temporary state or handle it here?
        // Let's use a specialized state for Retry Confirmation is safer, 
        // OR just interpret "Yes" in WAIT_SEARCH_QUERY as "Retry"? No, that's ambiguous.
        // Let's assume we prompt and stay in a "WAIT_RETRY_SEARCH" state? 
        // User spec didn't explicitly name it, but implied logic.
        // I'll stick to simple: Just ask "Say product name again" if they want, or use a specific state.
        // Let's use a temporary state for clarity:
        setFlowState('WAIT_SEARCH_RETRY_CONFIRM');
    }
  };

  // Option 2: Add Product
  const startAddProduct = () => {
    prompt("شنوة اسم المنتَج؟", STATES.WAIT_ADD_PRODUCT_NAME);
  };

  const handleAddProductName = (text) => {
    const product = findProductByName(text);
    if (product) {
        setSelectedProduct(product);
        prompt("قدّاش تحب؟", STATES.WAIT_ADD_QTY);
    } else {
        prompt("ما لقيتش. عاود اسم المنتَج.", STATES.WAIT_ADD_PRODUCT_NAME);
    }
  };

  const handleAddQty = (text) => {
    const nums = extractNumbers(text);
    const qty = nums.length > 0 ? nums[0] : null;
    if (qty && qty > 0) {
        addToCart(selectedProductRef.current, qty);
        speak(`تمام. زدنا ${qty} من ${selectedProductRef.current.name} للسلة.`, () => {
             // Return to IDLE + repeat menu
             // Or ask "Want something else?" -> Spec says "return to IDLE and repeat products menu"
             setFlowState(STATES.IDLE);
             repeatMenu();
        });
    } else {
        prompt("ما فهمتش الرقم. عاود قولي قدّاش تحب.", STATES.WAIT_ADD_QTY);
    }
  };

  // Option 3: Read Cart
  const handleReadCart = () => {
    if (cartItems.length === 0) {
        speak("السلة فارغة.", () => {
            setFlowState(STATES.IDLE);
            repeatMenu();
        });
        return;
    }
    
    let text = "عندك في السلة: ";
    cartItems.forEach(item => {
        text += `${item.quantity} من ${item.name}. `;
    });
    // Assuming cartTotals is available
    if (cartTotals) {
        text += `المجموع ${cartTotals.total} دينار. `;
    }
    
    speak(text, () => {
        setFlowState(STATES.IDLE);
        repeatMenu();
    });
  };

  // Option 4: Checkout
  const startCheckout = () => {
    prompt("باش نأكدو الطلب. اختار نعم أو لا.", STATES.WAIT_CONFIRM_CHECKOUT);
  };

  const handleCheckoutConfirm = (text) => {
    const normalized = normalizeArabic(text);
    if (normalized.includes('نعم')) {
        checkout();
        clearCart();
        speak("تمّ تأكيد الطلب. السلة تفرّغت.", () => {
            setFlowState(STATES.IDLE);
            // Assuming stay idle
        });
    } else {
        speak("تمام.", () => {
            setFlowState(STATES.IDLE);
        });
    }
  };

  // Option 5: Empty Cart
  const startEmptyCart = () => {
    prompt("متأكّد تحب تفرّغ السلة؟ اختار نعم أو لا.", STATES.WAIT_CONFIRM_EMPTY);
  };

  const handleEmptyConfirm = (text) => {
    const normalized = normalizeArabic(text);
    if (normalized.includes('نعم')) {
        clearCart();
        speak("تمّ تفريغ السلة.", () => {
            setFlowState(STATES.IDLE);
        });
    } else {
        setFlowState(STATES.IDLE);
    }
  };


  // --- MAIN HANDLER ---
  const handleVoiceCommand = useCallback((text) => {
    const currentState = stateRef.current;
    const nums = extractNumbers(text);
    const choiceNum = nums.length > 0 ? nums[0] : null;
    const normalized = normalizeArabic(text);

    log('info', `[ProductsFlow] state=${currentState}, received="${text}", parsedNumber=${choiceNum}`);

    // Global Rules (0 and 9) - Apply in ALL states
    if (choiceNum === 0) {
        log('info', '[ProductsFlow] Action: GO BACK');
        navigate(-1);
        setFlowState(STATES.IDLE);
        return;
    }
    if (choiceNum === 9) {
        log('info', '[ProductsFlow] Action: REPEAT MENU');
        repeatMenu();
        // Keep current state? Or reset?
        // Spec says "9 = REPEAT products menu". Usually implies resetting context.
        // But if user is in middle of flow, repeating menu might be confusing if state doesn't reset.
        // "return to IDLE and repeat products menu" is used elsewhere.
        // Let's reset to IDLE for safety when repeating main menu.
        setFlowState(STATES.IDLE);
        return;
    }

    // State Machine Logic
    switch (currentState) {
      case STATES.IDLE:
        if (choiceNum === 1) startSearch();
        else if (choiceNum === 2) startAddProduct();
        else if (choiceNum === 3) handleReadCart();
        else if (choiceNum === 4) startCheckout();
        else if (choiceNum === 5) startEmptyCart();
        else {
            // Invalid number or text in IDLE
            // Maybe ignore or re-announce
        }
        break;

      case STATES.WAIT_SEARCH_QUERY:
        handleSearchQuery(text);
        break;

      case 'WAIT_SEARCH_RETRY_CONFIRM': // Temporary internal state
        if (normalized.includes('نعم')) {
            prompt("قول اسم المنتَج.", STATES.WAIT_SEARCH_QUERY);
        } else {
            setFlowState(STATES.IDLE);
            repeatMenu();
        }
        break;

      case STATES.WAIT_CONFIRM_ADD_SEARCH_RESULT:
        if (normalized.includes('نعم')) {
            prompt("قدّاش تحب؟", STATES.WAIT_ADD_QTY);
        } else if (normalized.includes('لا')) {
            setFlowState(STATES.IDLE);
            repeatMenu();
        } else {
            prompt("اختار نعم أو لا.", STATES.WAIT_CONFIRM_ADD_SEARCH_RESULT);
        }
        break;

      case STATES.WAIT_ADD_PRODUCT_NAME:
        handleAddProductName(text);
        break;

      case STATES.WAIT_ADD_QTY:
        handleAddQty(text);
        break;

      case STATES.WAIT_CONFIRM_CHECKOUT:
        handleCheckoutConfirm(text);
        break;

      case STATES.WAIT_CONFIRM_EMPTY:
        handleEmptyConfirm(text);
        break;

      default:
        break;
    }
  }, [
    navigate, speak, startListening, addToCart, checkout, clearCart, cartItems, cartTotals,
    setSearchQuery // Used in handleSearchQuery
  ]);

  // --- Keyboard Support ---
  useEffect(() => {
    const handleKeyDown = (e) => {
        // Only trigger if we are on products page
        // Map keys 0-9 to handleVoiceCommand
        if (e.key >= '0' && e.key <= '9') {
            log('info', `[ProductsFlow] Keyboard input: ${e.key}`);
            handleVoiceCommand(e.key);
        }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleVoiceCommand]);

  // --- Registration ---
  useEffect(() => {
    log('info', '[ProductsFlow] Registering high-priority handler');
    setFlowState(STATES.IDLE);
    setCommandHandler(() => handleVoiceCommand);
    
    // Cleanup
    return () => {
        log('info', '[ProductsFlow] Unregistering handler');
        setCommandHandler(null);
    };
  }, [setCommandHandler, handleVoiceCommand]);

  return { flowState };
}
