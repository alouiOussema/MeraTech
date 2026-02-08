import { describe, it, expect, vi, beforeAll, afterAll } from 'vitest';
import { parseVoiceCommand, parseKeyboardCommand } from '../parsers';
import { routeCommand } from '../commandRouter';
import { MENUS } from '../menus';

// Mock document for keyboard parser
beforeAll(() => {
  global.document = {
    activeElement: {
      tagName: 'BODY'
    }
  };
});

describe('Voice Parser', () => {
  it('detects double shortcuts', () => {
    expect(parseVoiceCommand('ثلاثة ثلاثة')).toMatchObject({ type: 'NAVIGATE', payload: '/banque' });
    expect(parseVoiceCommand('1 1')).toMatchObject({ type: 'NAVIGATE', payload: '/' });
    expect(parseVoiceCommand('2 2')).toMatchObject({ type: 'GO_BACK' });
  });

  it('detects single menu selection numbers', () => {
    expect(parseVoiceCommand('ثلاثة')).toMatchObject({ type: 'SELECT_OPTION', payload: 3 });
    expect(parseVoiceCommand('رقم واحد')).toMatchObject({ type: 'SELECT_OPTION', payload: 1 });
    expect(parseVoiceCommand('5')).toMatchObject({ type: 'SELECT_OPTION', payload: 5 });
  });

  it('detects keywords', () => {
    expect(parseVoiceCommand('الرئيسية')).toMatchObject({ type: 'NAVIGATE', payload: '/' });
    expect(parseVoiceCommand('رجوع')).toMatchObject({ type: 'GO_BACK' });
    expect(parseVoiceCommand('مساعدة')).toMatchObject({ type: 'HELP' });
  });

  it('returns NO_MATCH for unknown input', () => {
    expect(parseVoiceCommand('bla bla')).toMatchObject({ type: 'NO_MATCH' });
  });
});

describe('Keyboard Parser', () => {
  const createKeyEvent = (key) => ({ key, preventDefault: () => {} });

  it('parses menu numbers', () => {
    expect(parseKeyboardCommand(createKeyEvent('1'))).toEqual({ type: 'SELECT_OPTION', payload: 1 });
    expect(parseKeyboardCommand(createKeyEvent('9'))).toEqual({ type: 'SELECT_OPTION', payload: 9 });
  });

  it('parses shortcuts', () => {
    expect(parseKeyboardCommand(createKeyEvent('h'))).toEqual({ type: 'NAVIGATE', payload: '/' });
    expect(parseKeyboardCommand(createKeyEvent('b'))).toEqual({ type: 'NAVIGATE', payload: '/banque' });
    expect(parseKeyboardCommand(createKeyEvent('Backspace'))).toEqual({ type: 'GO_BACK' });
    expect(parseKeyboardCommand(createKeyEvent('?'))).toEqual({ type: 'HELP' });
  });

  it('returns null for non-command keys', () => {
    expect(parseKeyboardCommand(createKeyEvent('a'))).toBeNull();
    expect(parseKeyboardCommand(createKeyEvent('Enter'))).toBeNull();
  });
});

describe('Command Router', () => {
  it('routes voice selection to menu action', () => {
    // In '/' menu, option 1 is Keyboard Mode (NAVIGATE to /welcome)
    const result = routeCommand({
      source: 'voice',
      text: 'واحد',
      routePath: '/'
    });
    
    expect(result).toMatchObject({
      action: 'NAVIGATE',
      payload: '/welcome'
    });
  });

  it('routes keyboard selection to SAME menu action', () => {
    const result = routeCommand({
      source: 'keyboard',
      event: { key: '1' },
      routePath: '/'
    });

    expect(result).toMatchObject({
      action: 'NAVIGATE',
      payload: '/welcome'
    });
  });

  it('routes shortcuts directly', () => {
    const result = routeCommand({
      source: 'keyboard',
      event: { key: 'h' },
      routePath: '/anywhere'
    });

    expect(result).toMatchObject({
      action: 'NAVIGATE',
      payload: '/'
    });
  });

  it('handles invalid menu path gracefully', () => {
    const result = routeCommand({
      source: 'voice',
      text: '1',
      routePath: '/non-existent'
    });

    expect(result).toMatchObject({
      action: 'NO_MATCH'
    });
  });
});
