
import { describe, it, expect } from 'vitest';
import { normalizeArabic, extractNumbers, detectDoubleShortcut, parseSingleMenuChoice } from '../numberParser';

describe('numberParser', () => {
  
  describe('normalizeArabic', () => {
    it('normalizes alef, yeh, teh marbuta', () => {
      expect(normalizeArabic('أحمد')).toBe('احمد');
      expect(normalizeArabic('إبراهيم')).toBe('ابراهيم');
      expect(normalizeArabic('آلة')).toBe('اله');
      expect(normalizeArabic('مدرسة')).toBe('مدرسه');
      expect(normalizeArabic('علي')).toBe('علي'); // No change for ya
      expect(normalizeArabic('على')).toBe('علي'); // Alef maqsura/Yeh
    });

    it('removes diacritics', () => {
      expect(normalizeArabic('مَرْحَبًا')).toBe('مرحبا');
    });
  });

  describe('extractNumbers', () => {
    it('extracts western digits', () => {
      expect(extractNumbers('choice 1')).toEqual([1]);
      expect(extractNumbers('I want 3 and 5')).toEqual([3, 5]);
    });

    it('extracts arabic-indic digits', () => {
      expect(extractNumbers('رقم ١')).toEqual([1]);
      expect(extractNumbers('٢ و ٣')).toEqual([2, 3]);
    });

    it('extracts arabic number words', () => {
      expect(extractNumbers('واحد')).toEqual([1]);
      expect(extractNumbers('ثلاثة')).toEqual([3]);
      expect(extractNumbers('تلاثة')).toEqual([3]); // Dialect
      expect(extractNumbers('تسعة')).toEqual([9]);
    });

    it('handles mixed input', () => {
      expect(extractNumbers('واحد 2 ٣')).toEqual([1, 2, 3]);
    });
  });

  describe('detectDoubleShortcut', () => {
    it('detects double 1 (Home)', () => {
      expect(detectDoubleShortcut([1, 1])).toEqual({ type: 'NAVIGATE', target: '/' });
    });

    it('detects double 2 (Back)', () => {
      expect(detectDoubleShortcut([2, 2])).toEqual({ type: 'GO_BACK' });
    });

    it('detects double 3 (Bank)', () => {
      expect(detectDoubleShortcut([3, 3])).toEqual({ type: 'NAVIGATE', target: '/banque' });
    });

    it('detects double 4 (Products)', () => {
      expect(detectDoubleShortcut([4, 4])).toEqual({ type: 'NAVIGATE', target: '/products' });
    });

    it('detects double 5 (Repeat)', () => {
      expect(detectDoubleShortcut([5, 5])).toEqual({ type: 'REPEAT' });
    });

    it('detects double 6 (Help)', () => {
      expect(detectDoubleShortcut([6, 6])).toEqual({ type: 'HELP' });
    });

    it('returns null for single numbers or non-doubles', () => {
      expect(detectDoubleShortcut([1])).toBeNull();
      expect(detectDoubleShortcut([1, 2])).toBeNull();
    });

    it('detects double in longer sequence', () => {
      expect(detectDoubleShortcut([1, 3, 3])).toEqual({ type: 'NAVIGATE', target: '/banque' });
    });
  });

  describe('parseSingleMenuChoice', () => {
    it('returns the number if valid', () => {
      expect(parseSingleMenuChoice('واحد')).toBe(1);
      expect(parseSingleMenuChoice('5')).toBe(5);
    });

    it('returns null if no number', () => {
      expect(parseSingleMenuChoice('hello')).toBeNull();
    });
  });
});
