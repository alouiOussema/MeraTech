import { parseVoiceCommand, parseKeyboardCommand } from './parsers';
import { MENUS } from './menus';

/**
 * Routes a raw input (voice or keyboard) to a resolved action based on the current context (menu).
 * 
 * @param {object} input 
 *   - source: 'voice' | 'keyboard'
 *   - text: string (for voice)
 *   - event: KeyboardEvent (for keyboard)
 *   - routePath: string (current URL path)
 * 
 * @returns {object} { action, payload, ... }
 */
export const routeCommand = (input) => {
  const { source, text, event, routePath } = input;
  let rawIntent = null;

  // 1. Parse Input
  if (source === 'voice') {
    rawIntent = parseVoiceCommand(text);
  } else if (source === 'keyboard') {
    rawIntent = parseKeyboardCommand(event);
  }

  if (!rawIntent || rawIntent.type === 'NO_MATCH') {
    return { action: 'NO_MATCH' };
  }

  // 2. Resolve 'SELECT_OPTION' against current Menu
  if (rawIntent.type === 'SELECT_OPTION') {
    const menu = MENUS[routePath];
    if (!menu) {
      return { action: 'NO_MATCH', error: 'No menu for this path' };
    }

    const option = menu.options.find(o => o.id === rawIntent.payload);
    if (option) {
      // Map the menu option to a canonical action
      return {
        action: option.action,
        payload: option.payload,
        label: option.label // pass label for confirmation speech
      };
    } else {
      return { action: 'NO_MATCH', error: 'Option not found' };
    }
  }

  // 3. Direct Actions (NAVIGATE, HELP, etc. from shortcuts)
  return {
    action: rawIntent.type,
    payload: rawIntent.payload || rawIntent.target
  };
};
