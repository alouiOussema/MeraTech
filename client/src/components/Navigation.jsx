import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { Home, CreditCard, ShoppingCart, Settings, LogOut, ShoppingBag, Store, User } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';

const navItems = [
  { to: '/', label: 'الرئيسية', icon: Home, exact: true, shortcut: 1 },
  { to: '/banque', label: 'البنك', icon: CreditCard, shortcut: 2 },
  { to: '/products', label: 'المتجر', icon: Store, shortcut: 3 },
];

export function TopNavbar() {
  const { toggleCart, cartItems } = useCart();
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const currentNavItems = [...navItems];
  if (user) {
    currentNavItems.push({ to: '/profile', label: 'حسابي', icon: User, shortcut: 4 });
  }

  return (
    <nav className="hidden md:block bg-white dark:bg-slate-800 shadow-sm sticky top-0 z-40" aria-label="القائمة العلوية">
      <div className="container mx-auto px-4 py-3 flex justify-between items-center">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center text-white font-bold text-xl">
            إ
          </div>
          <span className="text-xl font-bold text-slate-800 dark:text-white">منصّة إبصار</span>
        </div>
        
        <div className="flex items-center gap-6">
          <ul className="flex items-center gap-2">
            {currentNavItems.map((item) => (
              <li key={item.to}>
                <NavLink
                  to={item.to}
                  end={item.exact}
                  aria-label={`${item.label} (اضغط ${item.shortcut})`}
                  title={`اختصار: ${item.shortcut}`}
                  className={({ isActive }) => `
                    flex items-center gap-2 px-4 py-2 rounded-lg transition-colors font-medium
                    ${isActive 
                      ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300' 
                      : 'text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-700'}
                  `}
                >
                  <item.icon size={20} aria-hidden="true" />
                  <span>{item.label}</span>
                </NavLink>
              </li>
            ))}
          </ul>
          
          <div className="h-6 w-px bg-slate-200 dark:bg-slate-700 mx-2"></div>
          
          <div className="flex items-center gap-2">
             <button 
               onClick={toggleCart}
               className="relative flex items-center gap-2 text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-700 px-3 py-2 rounded-lg font-medium transition-colors"
               aria-label={`السلة، فيها ${cartItems.length} منتجات`}
             >
               <ShoppingBag size={20} />
               {cartItems.length > 0 && (
                 <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 text-white text-[10px] flex items-center justify-center rounded-full font-bold">
                   {cartItems.length}
                 </span>
               )}
             </button>

             {!user ? (
               <NavLink 
                 to="/login"
                 className="flex items-center gap-2 text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-700 px-4 py-2 rounded-lg font-medium transition-colors"
               >
                 <span>دخول</span>
               </NavLink>
             ) : (
               <button 
                onClick={handleLogout}
                className="flex items-center gap-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 px-4 py-2 rounded-lg font-medium transition-colors"
               >
                <LogOut size={20} aria-hidden="true" />
                <span>خروج</span>
              </button>
             )}
          </div>
        </div>
      </div>
    </nav>
  );
}

export function BottomNavbar() {
  const { user } = useAuth();
  
  const currentNavItems = [...navItems];
  if (user) {
    currentNavItems.push({ to: '/profile', label: 'حسابي', icon: User, shortcut: 4 });
  }

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white dark:bg-slate-800 shadow-[0_-2px_10px_rgba(0,0,0,0.1)] z-50 pb-safe" aria-label="القائمة السفلية">
      <ul className="flex justify-around items-center p-2">
        {currentNavItems.map((item) => (
          <li key={item.to} className="flex-1">
            <NavLink
              to={item.to}
              end={item.exact}
              aria-label={`${item.label} (رقم ${item.shortcut})`}
              className={({ isActive }) => `
                flex flex-col items-center justify-center gap-1 py-2 rounded-lg transition-colors w-full relative
                ${isActive 
                  ? 'text-blue-600 dark:text-blue-400' 
                  : 'text-slate-500 hover:bg-slate-50 dark:text-slate-400 dark:hover:bg-slate-700'}
              `}
            >
              {({ isActive }) => (
                <>
                  <div className="relative">
                    <item.icon size={24} strokeWidth={isActive ? 2.5 : 2} aria-hidden="true" />
                    {/* Visual Shortcut Hint Badge */}
                    <span className="absolute -top-1 -right-2 bg-slate-100 dark:bg-slate-700 text-[10px] text-slate-500 rounded-full w-4 h-4 flex items-center justify-center border border-slate-200 dark:border-slate-600">
                      {item.shortcut}
                    </span>
                  </div>
                  <span className="text-xs font-bold">{item.label}</span>
                </>
              )}
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  );
}
