import { useEffect, useRef, useCallback } from 'react';

/**
 * A hook to debug focus events and manage focus programmatically.
 * @param {string} componentName - The name of the component using this hook (for logs).
 * @param {boolean} enableLogs - Whether to enable console logging.
 */
export function useFocusDebugger(componentName, enableLogs = true) {
  const lastActiveRef = useRef(null);

  useEffect(() => {
    if (!enableLogs) return;

    const handleFocusChange = () => {
      const active = document.activeElement;
      if (active !== lastActiveRef.current) {
        console.log(
          `[FocusDebugger:${componentName}] Focus changed to:`, 
          active, 
          active ? `(ID: ${active.id}, Class: ${active.className}, Tag: ${active.tagName})` : ''
        );
        lastActiveRef.current = active;
      }
    };

    // Capture phase to catch all focus events
    document.addEventListener('focus', handleFocusChange, true);
    document.addEventListener('blur', handleFocusChange, true);

    return () => {
      document.removeEventListener('focus', handleFocusChange, true);
      document.removeEventListener('blur', handleFocusChange, true);
    };
  }, [componentName, enableLogs]);

  /**
   * Attempts to focus an element and logs the result.
   * @param {React.RefObject} ref - The ref of the element to focus.
   * @param {string} elementName - Descriptive name for logs.
   */
  const focusElement = useCallback((ref, elementName) => {
    if (ref && ref.current) {
      if (typeof ref.current.focus === 'function') {
        console.log(`[FocusDebugger:${componentName}] Attempting to focus: ${elementName}`);
        ref.current.focus();
        
        // Verify focus
        setTimeout(() => {
          // If ref.current is not a DOM node (e.g. imperative handle), we can't easily verify activeElement equality
          const isElement = ref.current instanceof Element;
          
          if (isElement) {
            const isActive = document.activeElement === ref.current;
            console.log(`[FocusDebugger:${componentName}] Focus result for ${elementName}: ${isActive ? 'SUCCESS' : 'FAILED'}`);
            if (!isActive) {
               console.warn(`[FocusDebugger:${componentName}] Expected ${elementName} to be focused, but found:`, document.activeElement);
            }
          } else {
             console.log(`[FocusDebugger:${componentName}] Focus action triggered for ${elementName} (Custom Ref Handle) - strict verification skipped.`);
          }
        }, 50);
        return true;
      } else {
        console.error(`[FocusDebugger:${componentName}] ref.current.focus is not a function for ${elementName}`);
      }
    } else {
      console.warn(`[FocusDebugger:${componentName}] Ref is null or undefined for ${elementName}`);
    }
    return false;
  }, [componentName]);

  return { focusElement };
}
