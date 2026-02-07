import { renderHook, act } from '@testing-library/react-hooks';
import { CartProvider, useCart } from './CartContext';

// Mock localStorage
const localStorageMock = (() => {
  let store = {};
  return {
    getItem: (key) => store[key] || null,
    setItem: (key, value) => { store[key] = value.toString(); },
    clear: () => { store = {}; }
  };
})();

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock
});

describe('CartContext', () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  test('should initialize with empty cart', () => {
    const { result } = renderHook(() => useCart(), { wrapper: CartProvider });
    expect(result.current.cartItems).toEqual([]);
    expect(result.current.cartTotals.total).toBe(7); // Shipping only
  });

  test('should add item to cart', () => {
    const { result } = renderHook(() => useCart(), { wrapper: CartProvider });
    const product = { _id: '1', name: 'Test Product', price: 10, stock: 5 };

    act(() => {
      result.current.addToCart(product);
    });

    expect(result.current.cartItems).toHaveLength(1);
    expect(result.current.cartItems[0]).toEqual({ ...product, quantity: 1 });
  });

  test('should update quantity', () => {
    const { result } = renderHook(() => useCart(), { wrapper: CartProvider });
    const product = { _id: '1', name: 'Test Product', price: 10, stock: 5 };

    act(() => {
      result.current.addToCart(product);
    });

    act(() => {
      result.current.updateQuantity('1', 3);
    });

    expect(result.current.cartItems[0].quantity).toBe(3);
  });

  test('should remove item', () => {
    const { result } = renderHook(() => useCart(), { wrapper: CartProvider });
    const product = { _id: '1', name: 'Test Product', price: 10, stock: 5 };

    act(() => {
      result.current.addToCart(product);
      result.current.removeFromCart('1');
    });

    expect(result.current.cartItems).toHaveLength(0);
  });

  test('should calculate totals correctly', () => {
    const { result } = renderHook(() => useCart(), { wrapper: CartProvider });
    const product1 = { _id: '1', name: 'P1', price: 10, stock: 10 };
    const product2 = { _id: '2', name: 'P2', price: 20, stock: 10 };

    act(() => {
      result.current.addToCart(product1, 2); // 20
      result.current.addToCart(product2, 1); // 20
    });

    // Subtotal: 40
    // Shipping: 7 (under 100)
    // Total: 47
    expect(result.current.cartTotals.subtotal).toBe(40);
    expect(result.current.cartTotals.total).toBe(47);
  });
});
