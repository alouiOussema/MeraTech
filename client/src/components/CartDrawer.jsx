import React from 'react';
import { X, Trash2, Plus, Minus, ShoppingBag } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useNavigate } from 'react-router-dom';

import { useVoice } from '../context/VoiceContext';

export default function CartDrawer() {
  const { 
    cartItems, 
    isCartOpen, 
    setIsCartOpen, 
    removeFromCart, 
    updateQuantity,
    cartTotals,
    checkout
  } = useCart();
  
  const { speak } = useVoice();
  const navigate = useNavigate();

  const handleCheckout = () => {
    checkout();
    const msg = "الطلب متاعك تسجل وقاعد يتحضر باش يوصلك.";
    speak(msg);
    alert(msg);
    setIsCartOpen(false);
  };

  if (!isCartOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end" role="dialog" aria-modal="true" aria-labelledby="cart-title">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity"
        onClick={() => setIsCartOpen(false)}
      />

      {/* Drawer */}
      <div className="relative w-full max-w-md bg-white dark:bg-slate-900 h-full shadow-2xl flex flex-col animate-in slide-in-from-right duration-300">
        
        {/* Header */}
        <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-white dark:bg-slate-900 z-10">
          <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400">
            <ShoppingBag size={24} />
            <h2 id="cart-title" className="text-xl font-bold">سلة المشتريات</h2>
            <span className="bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 text-xs font-bold px-2 py-1 rounded-full">
              {cartItems.length}
            </span>
          </div>
          <button 
            onClick={() => setIsCartOpen(false)}
            className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors text-slate-500"
            aria-label="إغلاق السلة"
          >
            <X size={24} />
          </button>
        </div>

        {/* Items */}
        <div className="flex-grow overflow-y-auto p-4 space-y-4">
          {cartItems.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-slate-500 dark:text-slate-400 space-y-4">
              <ShoppingBag size={64} className="opacity-20" />
              <p className="text-lg font-medium">السلة فارغة</p>
              <button 
                onClick={() => { setIsCartOpen(false); navigate('/products'); }}
                className="text-blue-600 font-bold hover:underline"
              >
                تصفح المنتجات
              </button>
            </div>
          ) : (
            cartItems.map(item => (
              <div key={item._id} className="flex gap-4 bg-slate-50 dark:bg-slate-800/50 p-3 rounded-xl border border-slate-100 dark:border-slate-800">
                <div className="w-20 h-20 bg-white rounded-lg overflow-hidden flex-shrink-0 border border-slate-200 dark:border-slate-700">
                  <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                </div>
                
                <div className="flex-grow flex flex-col justify-between">
                  <div className="flex justify-between items-start">
                    <h3 className="font-bold text-slate-800 dark:text-slate-200 line-clamp-1">{item.name}</h3>
                    <button 
                      onClick={() => removeFromCart(item._id)}
                      className="text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 p-1 rounded transition-colors"
                      aria-label="حذف"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                  
                  <div className="flex justify-between items-end mt-2">
                    <div className="flex items-center gap-2 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-1">
                      <button 
                        onClick={() => updateQuantity(item._id, item.quantity - 1)}
                        className="p-1 hover:bg-slate-100 dark:hover:bg-slate-700 rounded"
                        disabled={item.quantity <= 1}
                      >
                        <Minus size={14} />
                      </button>
                      <span className="w-6 text-center font-bold text-sm">{item.quantity}</span>
                      <button 
                        onClick={() => updateQuantity(item._id, item.quantity + 1)}
                        className="p-1 hover:bg-slate-100 dark:hover:bg-slate-700 rounded"
                        disabled={item.quantity >= item.stock}
                      >
                        <Plus size={14} />
                      </button>
                    </div>
                    <span className="font-bold text-blue-600 dark:text-blue-400">
                      {(item.price * item.quantity).toFixed(3)} د.ت
                    </span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        {cartItems.length > 0 && (
          <div className="p-4 bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)]">
            <div className="space-y-2 mb-4 text-sm">
              <div className="flex justify-between text-slate-600 dark:text-slate-400">
                <span>المجموع الفرعي</span>
                <span>{cartTotals.subtotal.toFixed(3)} د.ت</span>
              </div>
              <div className="flex justify-between text-slate-600 dark:text-slate-400">
                <span>التوصيل</span>
                <span>{cartTotals.shipping === 0 ? 'مجاني' : `${cartTotals.shipping.toFixed(3)} د.ت`}</span>
              </div>
              <div className="flex justify-between font-bold text-lg text-slate-900 dark:text-white pt-2 border-t border-slate-100 dark:border-slate-800">
                <span>الإجمالي</span>
                <span>{cartTotals.total.toFixed(3)} د.ت</span>
              </div>
            </div>
            
            <button 
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 rounded-xl shadow-lg hover:shadow-xl transition-all active:scale-95"
              onClick={handleCheckout}
            >
              إتمام الشراء
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
