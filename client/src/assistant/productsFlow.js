import { useState, useRef, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { extractChoiceNumber, normalizeArabic, productMatchScoring, detectIntent, INTENTS, findCategory } from '../lib/arabic';

const STATES = {
  IDLE: 'IDLE',
  MENU: 'MENU',
  SEARCH_WAIT: 'SEARCH_WAIT',
  CONFIRM_RETRY: 'CONFIRM_RETRY',
  CONFIRM_MATCH: 'CONFIRM_MATCH',
  SELECT_FROM_LIST: 'SELECT_FROM_LIST',
  QUANTITY: 'QUANTITY',
  CONFIRM_ADD_MORE: 'CONFIRM_ADD_MORE',
  CHECKOUT_CONFIRM: 'CHECKOUT_CONFIRM'
};

export function useProductsVoiceFlow({
  voice,
  cart,
  products,
  setSearchQuery,
  searchQuery,
  searchInputRef,
  setCategory,
  categories
}) {
  const { speak, startListening, setCommandHandler } = voice;
  const { addToCart, checkout } = cart;
  const navigate = useNavigate();
  const [flowState, setFlowState] = useState(STATES.IDLE);
  const [matchedProducts, setMatchedProducts] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState(null);
  
  const stateRef = useRef(flowState);
  const productsRef = useRef(products);
  const matchedProductsRef = useRef(matchedProducts);
  const selectedProductRef = useRef(selectedProduct);
  const categoriesRef = useRef(categories);

  useEffect(() => {
    stateRef.current = flowState;
    productsRef.current = products;
    matchedProductsRef.current = matchedProducts;
    selectedProductRef.current = selectedProduct;
    categoriesRef.current = categories;
  }, [flowState, products, matchedProducts, selectedProduct, categories]);

  const startMenu = useCallback(() => {
    setFlowState(STATES.MENU);
    speak("مرحبا بيك في قسم المنتوجات. تنجم تقلي: نحب نشوف ماكلة، ولا لوج على زيت، ولا زيد هذا للسلّة.", () => startListening());
  }, [speak, startListening]);

  const startSearch = useCallback(() => {
    setFlowState(STATES.SEARCH_WAIT);
    setSearchQuery('');
    if (searchInputRef?.current) {
      setTimeout(() => {
        searchInputRef.current.focus();
      }, 500);
    }
    speak("قلّي اسم المنتوج اللي تحب عليه.", () => startListening());
  }, [speak, startListening, setSearchQuery, searchInputRef]);

  const handleSearch = useCallback((transcript) => {
    const query = normalizeArabic(transcript);
    setSearchQuery(query);
    
    const allProducts = productsRef.current;
    const scored = allProducts.map(p => ({
      product: p,
      score: productMatchScoring(query, p.name)
    })).filter(p => p.score > 0);

    scored.sort((a, b) => b.score - a.score);
    const matches = scored.map(s => s.product);

    if (matches.length === 0) {
      setFlowState(STATES.CONFIRM_RETRY);
      speak("هالمنتج ماشي موجود فالقائمة توّة. تحب تعاود؟ قول نعم ولا لا.", () => startListening());
    } else if (matches.length === 1 && scored[0].score > 0.5) {
      const p = matches[0];
      setSelectedProduct(p);
      setFlowState(STATES.CONFIRM_MATCH);
      speak(`لقيت ${p.name}. تحب نزيدو للسلّة؟ قول نعم ولا لا.`, () => startListening());
    } else {
      setMatchedProducts(matches.slice(0, 5));
      setFlowState(STATES.SELECT_FROM_LIST);
      
      const listTxt = matches.slice(0, 5).map((p, i) => `${i + 1}. ${p.name}`).join('. ');
      speak(`${listTxt}. اختار رقم المنتوج.`, () => startListening());
    }
  }, [speak, startListening, setSearchQuery]);

  const askQuantity = useCallback(() => {
    setFlowState(STATES.QUANTITY);
    speak("قدّاش تحب نزيد؟ قول رقم من 1 حتى 9.", () => startListening());
  }, [speak, startListening]);

  const confirmAddMore = useCallback(() => {
    setFlowState(STATES.CONFIRM_ADD_MORE);
    speak("تمّ. تحب نزيدلك منتوج آخر؟ قول نعم ولا لا.", () => startListening());
  }, [speak, startListening]);

  const startCheckout = useCallback(() => {
    setFlowState(STATES.CHECKOUT_CONFIRM);
    speak("الخلاص بعد التوصيل. نأكد الطلب؟ قول نعم ولا لا.", () => startListening());
  }, [speak, startListening, cart]);

  const handleVoiceCommand = useCallback((text) => {
    const currentState = stateRef.current;
    const normalized = normalizeArabic(text);
    const choiceNum = extractChoiceNumber(text);
    const intent = detectIntent(text);

    // Global Intent Handling (Overrides state unless in critical confirmation)
    const isCriticalState = [
      STATES.QUANTITY, 
      STATES.CHECKOUT_CONFIRM, 
      STATES.CONFIRM_MATCH
    ].includes(currentState);

    // If strong intent and not in critical middle-of-action state
    if (intent.type !== INTENTS.UNKNOWN && !isCriticalState) {
       switch (intent.type) {
         case INTENTS.FILTER:
           const cat = findCategory(text, categoriesRef.current || []);
           if (cat) {
             setCategory(cat);
             setSearchQuery(''); // Clear search when filtering
             speak(`هاني صفيت المنتوجات على ${cat}.`);
             return;
           }
           // If no category found but intent was filter/fetch, maybe treat as search?
           // fall through
           break;
           
         case INTENTS.SEARCH:
           // Extract query from "Find X"
           // Simple heuristic: remove the command words
           // But handleSearch does scoring, so passing full text might be okay if scoring is robust,
           // or we clean it. normalizeArabic cleans a bit.
           // Better to jump to search wait or just execute search?
           // If user said "Find oil", execute search immediately.
           // Remove command words:
           let query = normalized
             .replace(/(لوج|بحث|find|search|look for|على|عن)/g, '')
             .trim();
           if (query.length > 2) {
             handleSearch(query);
             return;
           }
           break;
           
         case INTENTS.ADD_CART:
             // If "add this" and we have a selected product or search result?
             // But usually "add X".
             // If "add X", search for X, then add.
             let addQuery = normalized
               .replace(/(زيد|حط|اشري|add|buy|لي|للسلة)/g, '')
               .trim();
             
             if (addQuery === 'هذا' || addQuery === 'this') {
                // If we have a selected product
                if (selectedProductRef.current) {
                   askQuantity();
                   return;
                }
             }

             if (addQuery.length > 2) {
                // Treat as search for product to add
                // We can use handleSearch logic but with auto-select if strong match
                handleSearch(addQuery); 
                // handleSearch will eventually ask "Do you want to add it?"
                return;
             }
             break;

         case INTENTS.CHECKOUT:
            startCheckout();
            return;
       }
    }

    // State-Specific Logic (Fallback)
    switch (currentState) {
      case STATES.MENU:
        if (choiceNum === 1 || normalized.includes('بحث') || normalized.includes('لوج') || normalized.includes('تفلتر')) {
          startSearch();
        } else if (choiceNum === 2 || normalized.includes('رجوع')) {
          navigate(-1);
          speak("رجعنا للي قبل.");
        } else {
          // If no global intent matched and no menu option matched
          speak("تنجم تقلي شنوه تحب تلوج، ولا تختار فئة.", () => startListening());
        }
        break;

      case STATES.SEARCH_WAIT:
        handleSearch(text);
        break;

      case STATES.CONFIRM_RETRY:
        if (normalized.includes('نعم')) {
          startSearch();
        } else if (normalized.includes('لا')) {
          startMenu();
        } else {
          speak("قول نعم ولا لا.", () => startListening());
        }
        break;

      case STATES.CONFIRM_MATCH:
        if (normalized.includes('نعم')) {
          askQuantity();
        } else if (normalized.includes('لا')) {
          speak("تحب تڨلّب على منتوج آخر؟ قول نعم ولا لا.", () => startListening());
          setFlowState(STATES.CONFIRM_ADD_MORE);
        } else {
          speak("قول نعم باش تزيدو، ولا لا.", () => startListening());
        }
        break;

      case STATES.SELECT_FROM_LIST:
        if (choiceNum && choiceNum >= 1 && choiceNum <= matchedProductsRef.current.length) {
          const p = matchedProductsRef.current[choiceNum - 1];
          setSelectedProduct(p);
          askQuantity();
        } else {
          const listTxt = matchedProductsRef.current.map((p, i) => `${i + 1}. ${p.name}`).join('. ');
          speak(`رقم غالط. ${listTxt}. اختار رقم.`, () => startListening());
        }
        break;

      case STATES.QUANTITY:
        if (choiceNum && choiceNum >= 1 && choiceNum <= 9) {
          const p = selectedProductRef.current;
          addToCart(p, choiceNum);
          speak(`تمّ. زدنا ${choiceNum} من ${p.name} للسلّة.`);
          setTimeout(() => confirmAddMore(), 2000);
        } else {
          speak("اختار رقم من 1 ل 9.", () => startListening());
        }
        break;

      case STATES.CONFIRM_ADD_MORE:
        if (normalized.includes('نعم')) {
          startSearch();
        } else if (normalized.includes('لا')) {
          startCheckout();
        } else {
          speak("قول نعم ولا لا.", () => startListening());
        }
        break;

      case STATES.CHECKOUT_CONFIRM:
        if (normalized.includes('نعم')) {
          checkout();
          speak("الطلب متاعك تسجل. يوصلك قريبا.", () => {
             navigate('/');
          });
        } else if (normalized.includes('لا')) {
          startMenu();
        } else {
           speak("نأكد الطلب؟ قول نعم ولا لا.", () => startListening());
        }
        break;

      default:
        // Don't restart menu on every unknown sound, just log it or give a subtle hint if needed
        console.log("Unknown command in MENU state:", text);
        // startMenu(); // CAUSES LOOP if noise is detected
        break;
    }
  }, [navigate, speak, startListening, startSearch, handleSearch, startMenu, askQuantity, confirmAddMore, startCheckout, addToCart, checkout, setCategory]);

  useEffect(() => {
    // Only start menu ONCE on mount
    const timer = setTimeout(() => {
       startMenu();
    }, 1000);

    setCommandHandler(() => handleVoiceCommand);

    return () => {
      clearTimeout(timer);
      setCommandHandler(null);
    };
  }, []); // Empty dependency array to prevent loops!

  // Update command handler when it changes (if needed, but handleVoiceCommand should use refs for state)
  useEffect(() => {
    setCommandHandler(() => handleVoiceCommand);
  }, [handleVoiceCommand, setCommandHandler]);

  return {
    flowState,
    matchedProducts,
    selectedProduct
  };
}
