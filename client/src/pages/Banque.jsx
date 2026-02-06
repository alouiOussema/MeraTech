import React, { useState, useEffect, useCallback } from 'react';
import { ArrowUpRight, ArrowDownLeft, Wallet, User } from 'lucide-react';
import { useVoice } from '../context/VoiceContext';
import Input from '../components/Input';
import api from '../lib/api';

export default function Banque() {
  const [balance, setBalance] = useState(0);
  const [currency, setCurrency] = useState('TND');
  const [transfers, setTransfers] = useState([]);
  const [transferAmount, setTransferAmount] = useState('');
  const [recipient, setRecipient] = useState('');
  const [loading, setLoading] = useState(true);
  
  const { registerPageHandler, speak } = useVoice();

  const fetchData = async () => {
    try {
      setLoading(true);
      const [balanceRes, transfersRes] = await Promise.all([
        api.get('/bank/balance'),
        api.get('/bank/transfers')
      ]);
      setBalance(balanceRes.data.balance);
      setCurrency(balanceRes.data.currency);
      setTransfers(transfersRes.data);
    } catch (error) {
      console.error("Error fetching bank data", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleVoiceCommand = useCallback((command) => {
    // Simple command parsing simulation
    if (command.includes("رصيدي")) {
      speak(`رصيدك الحالي هو ${balance} دينار`);
    } else {
        speak("ما فهمتكش، تنجم تسألني على رصيدك");
    }
  }, [balance]);

  // Register voice handler
  useEffect(() => {
    const unregister = registerPageHandler(handleVoiceCommand);
    return unregister;
  }, [registerPageHandler, handleVoiceCommand]);

  const handleTransfer = async (e) => {
    e.preventDefault();
    if (!recipient || !transferAmount) return;

    try {
      const res = await api.post('/bank/transfer', {
        toName: recipient,
        amount: parseFloat(transferAmount)
      });
      
      setBalance(res.data.balance);
      speak(`تم تحويل ${transferAmount} دينار لــ ${recipient}`);
      setTransferAmount('');
      setRecipient('');
      
      // Refresh transfers
      const transfersRes = await api.get('/bank/transfers');
      setTransfers(transfersRes.data);
      
    } catch (error) {
      console.error("Transfer error", error);
      const msg = error.response?.data?.error || "صار مشكل في التحويل";
      speak(msg);
    }
  };

  return (
    <div className="space-y-8 pb-32">
      <header>
        <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">البنك (تجربة)</h1>
        <p className="text-slate-600 dark:text-slate-400">تحكّم في فلوسك بسهولة</p>
      </header>

      {/* Balance Card */}
      <section className="bg-gradient-to-r from-blue-600 to-blue-800 rounded-2xl p-6 text-white shadow-lg">
        <div className="flex items-center gap-4 mb-4">
          <div className="bg-white/20 p-3 rounded-full">
            <Wallet size={32} />
          </div>
          <span className="text-xl font-medium opacity-90">رصيدي الحالي</span>
        </div>
        <div className="text-4xl font-bold tracking-tight">
          {loading ? "..." : balance.toFixed(3)} <span className="text-2xl font-normal">{currency}</span>
        </div>
      </section>

      {/* Last Actions */}
      <section aria-labelledby="last-actions-heading">
        <h2 id="last-actions-heading" className="text-xl font-bold mb-4 text-slate-800 dark:text-white">آخر العمليات</h2>
        <div className="space-y-3">
          {transfers.length === 0 ? (
            <p className="text-slate-500">ما فماش عمليات سابقة</p>
          ) : (
            transfers.map(action => (
              <div key={action._id} className="bg-white dark:bg-slate-800 p-4 rounded-xl shadow-sm flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-full bg-red-100 text-red-600">
                    <ArrowUpRight size={20} />
                  </div>
                  <div>
                    <p className="font-bold text-slate-800 dark:text-white">تحويل لــ {action.toName}</p>
                    <p className="text-sm text-slate-500">{new Date(action.createdAt).toLocaleDateString('ar-TN')}</p>
                  </div>
                </div>
                <span className="font-bold text-slate-800 dark:text-slate-200">
                  -{action.amount.toFixed(3)}
                </span>
              </div>
            ))
          )}
        </div>
      </section>

      {/* Transfer Form */}
      <section className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-md border border-slate-200 dark:border-slate-700">
        <h2 className="text-xl font-bold mb-4 text-slate-800 dark:text-white">تحويل أموال</h2>
        <form onSubmit={handleTransfer}>
          <Input 
            id="recipient" 
            label="لشكون باش تبعث؟ (الاسم)" 
            placeholder="مثال: سارة" 
            value={recipient}
            onChange={e => setRecipient(e.target.value)}
          />
          <Input 
            id="amount" 
            label="قداش؟ (المبلغ)" 
            type="number" 
            placeholder="0.000" 
            value={transferAmount}
            onChange={e => setTransferAmount(e.target.value)}
          />
          <button className="w-full bg-slate-900 dark:bg-blue-600 text-white font-bold py-3 rounded-lg mt-2">
            حوّل
          </button>
        </form>
      </section>
    </div>
  );
}
