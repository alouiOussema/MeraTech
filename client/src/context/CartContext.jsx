import React, { createContext, useContext, useState, useEffect } from 'react';

const CartContext = createContext();

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};

export const CartProvider = ({ children }) => {
  const [cartItems, setCartItems] = useState(() => {
    try {
      const stored = localStorage.getItem('cart');
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.error('Failed to parse cart from local storage', error);
      return [];
    }
  });

  const [isCartOpen, setIsCartOpen] = useState(false);

  useEffect(() => {
    try {
      localStorage.setItem('cart', JSON.stringify(cartItems));
    } catch (error) {
      console.error('Failed to save cart to local storage', error);
    }
  }, [cartItems]);

  const addToCart = (product, quantity = 1) => {
    setCartItems(prev => {
      const existing = prev.find(item => item._id === product._id);
      if (existing) {
        // Check stock
        if (existing.quantity + quantity > product.stock) {
          alert('عذراً، الكمية المطلوبة غير متوفرة حالياً.');
          return prev;
        }
        return prev.map(item => 
          item._id === product._id 
            ? { ...item, quantity: item.quantity + quantity }
            : item
        );
      } else {
        if (quantity > product.stock) {
          alert('عذراً، الكمية المطلوبة غير متوفرة حالياً.');
          return prev;
        }
        return [...prev, { ...product, quantity }];
      }
    });
    // Optional: Open cart or show toast
    // setIsCartOpen(true); 
  };

  const removeFromCart = (productId) => {
    setCartItems(prev => prev.filter(item => item._id !== productId));
  };

  const updateQuantity = (productId, newQuantity) => {
    if (newQuantity < 1) return;
    setCartItems(prev => {
      return prev.map(item => {
        if (item._id === productId) {
          if (newQuantity > item.stock) {
            alert('عذراً، الكمية المطلوبة غير متوفرة حالياً.');
            return item;
          }
          return { ...item, quantity: newQuantity };
        }
        return item;
      });
    });
  };

  const clearCart = () => {
    setCartItems([]);
  };

  const checkout = () => {
    // In a real app, this would send an order to the backend
    setCartItems([]);
    return true;
  };

  const toggleCart = () => setIsCartOpen(!isCartOpen);

  // Calculations
  const subtotal = cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const shipping = subtotal > 100 ? 0 : 7; // Free shipping over 100 TND
  const tax = subtotal * 0.0; // Assuming tax included or 0 for simplicity
  const total = subtotal + shipping + tax;

  const value = {
    cartItems,
    addToCart,
    removeFromCart,
    updateQuantity,
    clearCart,
    checkout,
    isCartOpen,
    toggleCart,
    setIsCartOpen,
    cartTotals: {
      subtotal,
      shipping,
      tax,
      total
    }
  };

  return (
    <CartContext.Provider value={value}>
      {children}
    </CartContext.Provider>
  );
};
