import React, { useState, useEffect, useCallback } from 'react';
import { Plus, Minus, Trash2, ShoppingBag } from 'lucide-react';
import { useVoice } from '../context/VoiceContext';
import api from '../lib/api';

export default function Courses() {
  const [items, setItems] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  
  const { registerPageHandler, speak } = useVoice();

  const fetchData = async () => {
    try {
      setLoading(true);
      const res = await api.get('/courses/list');
      setItems(res.data.items);
      
      const totalRes = await api.get('/courses/total');
      setTotal(totalRes.data.total);
    } catch (error) {
      console.error("Error fetching courses data", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const addItem = async (name, price = 0) => {
    try {
      const res = await api.post('/courses/items', { name, qty: 1 });
      setItems(res.data.items);
      // Refresh total
      const totalRes = await api.get('/courses/total');
      setTotal(totalRes.data.total);
      speak(`زدنا ${name} للكورسة`);
    } catch (error) {
      console.error("Error adding item", error);
      speak("صار مشكل، ما نجمتش نزيد الحاجة");
    }
  };

  const checkPrice = async (name) => {
    try {
      const res = await api.get(`/prices/${name}`);
      speak(`سوم ${name} هو ${res.data.price} دينار`);
    } catch (error) {
      speak("ما عرفتش السوم");
    }
  };

  // Voice command handling is now managed globally by VoiceOperator
  // to support complex NLU commands (e.g., "زيد حليب", "قداش سوم الحليب")
  // which might overlap with local commands.


  const updateQuantity = async (id, delta) => {
    const item = items.find(i => i._id === id);
    if (!item) return;
    
    const newQty = item.qty + delta;
    
    try {
      if (newQty <= 0) {
        // Remove
        const res = await api.delete(`/courses/items/${id}`);
        setItems(res.data.items);
      } else {
        // Update
        const res = await api.patch(`/courses/items/${id}`, { qty: newQty });
        setItems(res.data.items);
      }
      
      // Refresh total
      const totalRes = await api.get('/courses/total');
      setTotal(totalRes.data.total);
      
    } catch (error) {
      console.error("Error updating quantity", error);
    }
  };

  return (
    <div className="space-y-8 pb-32">
      <header>
        <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">القْوْرْسَة (قائمة الشراء)</h1>
        <p className="text-slate-600 dark:text-slate-400">حضّر قضيتك واعرف الحسبة</p>
      </header>

      {/* Total Card */}
      <section className="bg-orange-600 rounded-2xl p-6 text-white shadow-lg flex justify-between items-center">
        <div>
          <span className="text-lg opacity-90 block mb-1">المجموع التقريبي</span>
          <div className="text-4xl font-bold">{total.toFixed(3)} <span className="text-2xl">د.ت</span></div>
        </div>
        <ShoppingBag size={48} className="opacity-50" />
      </section>

      {/* Shopping List */}
      <section aria-label="قائمة المنتجات">
        {loading ? (
          <p className="text-center py-8">قاعد يشرجي...</p>
        ) : (
          <ul className="space-y-4">
            {items.map(item => (
              <li key={item._id} className="bg-white dark:bg-slate-800 p-4 rounded-xl shadow-sm flex items-center justify-between border border-slate-100 dark:border-slate-700">
                <div className="flex-1">
                  <h3 className="text-xl font-bold text-slate-800 dark:text-white">{item.name}</h3>
                  <p className="text-slate-500">{item.price ? item.price.toFixed(3) : '---'} د.ت / للقطعة</p>
                </div>
                
                <div className="flex items-center gap-3 bg-slate-100 dark:bg-slate-900 rounded-lg p-1">
                  <button 
                    onClick={() => updateQuantity(item._id, -1)}
                    className="p-2 bg-white dark:bg-slate-800 rounded-md shadow-sm text-slate-700 dark:text-slate-300 hover:bg-red-50 hover:text-red-600"
                    aria-label={`نقص كعبة ${item.name}`}
                  >
                    <Minus size={20} />
                  </button>
                  <span className="font-bold text-lg w-6 text-center">{item.qty}</span>
                  <button 
                    onClick={() => updateQuantity(item._id, 1)}
                    className="p-2 bg-white dark:bg-slate-800 rounded-md shadow-sm text-slate-700 dark:text-slate-300 hover:bg-green-50 hover:text-green-600"
                    aria-label={`زيد كعبة ${item.name}`}
                  >
                    <Plus size={20} />
                  </button>
                </div>
              </li>
            ))}
            {items.length === 0 && (
              <li className="text-center py-8 text-slate-500">القائمة فارغة. زيد حاجات!</li>
            )}
          </ul>
        )}
      </section>

      {/* Price Check / Hints */}
      <section className="bg-blue-50 dark:bg-blue-900/20 p-6 rounded-2xl border-2 border-dashed border-blue-200 dark:border-blue-800">
        <h2 className="text-lg font-bold text-blue-800 dark:text-blue-300 mb-4">أوامر صوتية تنجم تجربها:</h2>
        <ul className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <li className="bg-white dark:bg-slate-800 px-4 py-3 rounded-lg text-slate-700 dark:text-slate-300 shadow-sm">
             "زيد حليب"
          </li>
          <li className="bg-white dark:bg-slate-800 px-4 py-3 rounded-lg text-slate-700 dark:text-slate-300 shadow-sm">
             "شنوّة سوم الحليب؟"
          </li>
        </ul>
      </section>
    </div>
  );
}
