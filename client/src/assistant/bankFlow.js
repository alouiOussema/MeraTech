import { useState, useRef, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { extractNumbers, normalizeArabic } from './numberParser';
import { log } from '../lib/voice';
import { playBeep } from '../lib/audio';
import { fetchBalance, fetchTransactions, transferMoney } from '../lib/api';

const STATES = {
  IDLE: 'IDLE',
  WAIT_TRANSFER_NAME: 'WAIT_TRANSFER_NAME',
  WAIT_TRANSFER_AMOUNT: 'WAIT_TRANSFER_AMOUNT',
  WAIT_CONFIRM_TRANSFER: 'WAIT_CONFIRM_TRANSFER',
  READING_HISTORY: 'READING_HISTORY'
};

export function useBankVoiceFlow(voice) {
  const { speak, startListening, setCommandHandler } = voice;
  const navigate = useNavigate();
  const [flowState, setFlowState] = useState(STATES.IDLE);
  
  // Transfer Data
  const [transferData, setTransferData] = useState({ toName: '', amount: 0 });

  // Refs
  const stateRef = useRef(flowState);
  const transferDataRef = useRef(transferData);

  useEffect(() => {
    stateRef.current = flowState;
    transferDataRef.current = transferData;
  }, [flowState, transferData]);

  // Helper: Prompt
  const prompt = useCallback((text, nextState) => {
    if (nextState) setFlowState(nextState);
    speak(text, () => {
      // Only start listening if not just reading info and returning to menu immediately
      // But here we usually want to listen for next command
      // Except when reading history, maybe we want to go back to idle?
      // Let's assume always listen unless specified otherwise
      playBeep();
      startListening();
    }, true);
  }, [speak, startListening]);

  // Menu Text
  const MENU_TEXT = "مرحبا بيك في البنك. اختار شنوة تحب تعمل: واحد، نسمّعك رصيدك. اثنين، نحول فلوس. ثلاثة، نسمّعك آخر العمليات. صفر، رجوع. تسعة، نعاود القائمة.";

  // Helper: Start Flow
  const startBankFlow = useCallback(() => {
    setFlowState(STATES.IDLE);
    setTransferData({ toName: '', amount: 0 });
    prompt(MENU_TEXT, STATES.IDLE);
  }, [prompt]);

  // --- Handlers ---

  const handleIdleCommand = async (text, choiceNum) => {
    if (choiceNum === 1) {
        // Read Balance
        try {
            const data = await fetchBalance();
            const balanceText = `رصيدك هو ${data.balance} دينار.`;
            prompt(balanceText + " " + MENU_TEXT, STATES.IDLE);
        } catch (e) {
            prompt("ما نجمتش نجيب الرصيد. عاود مرة أخرى.", STATES.IDLE);
        }
    } else if (choiceNum === 2) {
        // Start Transfer
        prompt("لمن تحب تبعث الفلوس؟ قول الاسم.", STATES.WAIT_TRANSFER_NAME);
    } else if (choiceNum === 3) {
        // Read History
        try {
            const txs = await fetchTransactions();
            if (txs.length === 0) {
                prompt("ما عندك حتى عمليات سابقة. " + MENU_TEXT, STATES.IDLE);
            } else {
                // Read last 3 for brevity as requested in prompt "read last 3 transactions" in logic description
                const last3 = txs.slice(0, 3); 
                const lines = last3.map(tx => {
                    if (tx.type === 'TRANSFER_OUT') return `حولت ${Math.abs(tx.amount)} دينار لـ ${tx.meta.toName}`;
                    if (tx.type === 'TRANSFER_IN') return `وصلك ${tx.amount} دينار من عند ${tx.meta.fromName}`;
                    if (tx.type === 'CHECKOUT') return `شريت قضية بـ ${Math.abs(tx.amount)} دينار`;
                    return `عملية بقيمة ${tx.amount} دينار`;
                }).join('. ');
                
                prompt("آخر العمليات: " + lines + ". " + MENU_TEXT, STATES.IDLE);
            }
        } catch (e) {
            prompt("ما نجمتش نجيب العمليات. عاود مرة أخرى.", STATES.IDLE);
        }
    } else if (choiceNum === 0) {
        speak("باهي. راجعين للصفحة الرئيسية.", () => navigate('/'));
    } else if (choiceNum === 9) {
        prompt(MENU_TEXT, STATES.IDLE);
    } else {
        // If text input is not a number, maybe handle it? 
        // For now, strict menu
        prompt("ما فهمتكش. " + MENU_TEXT, STATES.IDLE);
    }
  };

  const handleTransferName = (text) => {
      const name = text.trim();
      if (name.length < 2) {
          prompt("الاسم مش واضح. عاود قول الاسم.", STATES.WAIT_TRANSFER_NAME);
          return;
      }
      setTransferData(prev => ({ ...prev, toName: name }));
      prompt(`باهي، قداش تحب تبعث لـ ${name}؟ قول المبلغ بالدينار.`, STATES.WAIT_TRANSFER_AMOUNT);
  };

  const handleTransferAmount = (text) => {
      const nums = extractNumbers(text);
      if (nums.length === 0) {
          prompt("ما سمعتش المبلغ. عاود قول قداش تحب تبعث.", STATES.WAIT_TRANSFER_AMOUNT);
          return;
      }
      const amount = nums[0];
      setTransferData(prev => ({ ...prev, amount }));
      prompt(`باش تحول ${amount} دينار لـ ${transferDataRef.current.toName}. صحيح؟ نعم أو لا.`, STATES.WAIT_CONFIRM_TRANSFER);
  };

  const handleConfirmTransfer = async (text) => {
      const normalized = normalizeArabic(text);
      if (normalized.includes('نعم') || normalized.includes('صحيح')) {
          speak("لحظة برك...", null, true);
          try {
              const { toName, amount } = transferDataRef.current;
              await transferMoney(toName, amount);
              prompt(`تم التحويل بنجاح. ${MENU_TEXT}`, STATES.IDLE);
          } catch (error) {
              console.error(error);
              const errMsg = error.response?.data?.message || "صار مشكل في التحويل.";
              prompt(`${errMsg} ${MENU_TEXT}`, STATES.IDLE);
          }
      } else if (normalized.includes('لا')) {
          prompt("بطلنا التحويل. " + MENU_TEXT, STATES.IDLE);
      } else {
          prompt("اختار نعم أو لا.", STATES.WAIT_CONFIRM_TRANSFER);
      }
  };

  // --- Main Command Handler ---
  const handleCommand = useCallback((text) => {
    const currentState = stateRef.current;
    const nums = extractNumbers(text);
    const choiceNum = nums.length > 0 ? nums[0] : null;

    log('info', `[BankFlow] state=${currentState}, text="${text}"`);

    // Global 0/9 checks are inside IDLE, but for other states?
    // User requested: "0 => go back, 9 => repeat menu" as global rules for Bank Flow
    if (choiceNum === 0) {
         speak("باهي. راجعين للصفحة الرئيسية.", () => navigate('/'));
         return;
    }
    if (choiceNum === 9) {
        startBankFlow(); // Repeats menu/intro
        return;
    }

    switch (currentState) {
        case STATES.IDLE:
            handleIdleCommand(text, choiceNum);
            break;
        case STATES.WAIT_TRANSFER_NAME:
            handleTransferName(text);
            break;
        case STATES.WAIT_TRANSFER_AMOUNT:
            handleTransferAmount(text);
            break;
        case STATES.WAIT_CONFIRM_TRANSFER:
            handleConfirmTransfer(text);
            break;
        default:
            break;
    }
  }, [navigate, startBankFlow, prompt]); // Dependencies

  // --- Mount/Dismount Logic ---
  useEffect(() => {
    const isBankPage = window.location.pathname === '/banque';
    
    if (isBankPage) {
        console.log("[BankFlow] Active");
        setCommandHandler(() => handleCommand);
        startBankFlow();
    }

    return () => {
        if (isBankPage) {
            console.log("[BankFlow] Cleanup");
            setCommandHandler(null);
        }
    };
  }, [setCommandHandler, startBankFlow, handleCommand]);

  return { flowState };
}
