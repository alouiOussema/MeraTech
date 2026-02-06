const express = require('express');
const router = express.Router();

const mockUserData = {
  userId: 'demo',
  balance: 1250.50,
  currency: 'TND',
  accountNumber: '****1234'
};

const languagePatterns = {
  'ar-tn': {
    check_balance: ['شحال فلوسي', 'شحال رصيدي', 'شحال عندي', 'فلوسي شحال'],
    send_money: ['نحب نبعث فلوس', 'نحب نحول فلوس', 'نبعث', 'حاب نبعث', 'نحول'],
    pay_bill: ['نخلص الفاتورة', 'نفعل الفاتورة', 'نحب نخلص', 'نحب نفعل'],
    shopping: ['نحب نشري', 'نحب ناخو', 'نشرى', 'نزيد للستة', 'زيد لي'],
    markers: ['شحال', 'نحب', 'نبعث', 'نخلص', 'فلوس', 'كيفاش', 'اشكون']
  },
  'ar': {
    check_balance: ['رصيدي', 'رصيد الحساب', 'كم رصيدي', 'افحص الرصيد'],
    send_money: ['إرسال مال', 'تحويل مالي', 'أرسل فلوس', 'حوالة مالية'],
    pay_bill: ['دفع الفاتورة', 'سداد', 'خلاص', 'أدفع'],
    shopping: ['قائمة المشتريات', 'إضافة إلى القائمة', 'شراء'],
    markers: ['رصيد', 'حساب', 'مال', 'فاتورة', 'قائمة']
  },
  'fr': {
    check_balance: ['solde', 'vérifier mon compte', 'combien j\'ai', 'mon solde'],
    send_money: ['envoyer de l\'argent', 'virement', 'transférer', 'envoyer à'],
    pay_bill: ['payer la facture', 'régler', 'paiement', 'payer'],
    shopping: ['liste de courses', 'ajouter à la liste', 'acheter'],
    markers: ['le', 'la', 'mon', 'vérifier', 'envoyer', 'solde', 'compte']
  },
  'en': {
    check_balance: ['check balance', 'my balance', 'how much money', 'account balance'],
    send_money: ['send money', 'transfer money', 'wire money', 'send to'],
    pay_bill: ['pay bill', 'pay the bill', 'settle payment', 'make payment'],
    shopping: ['shopping list', 'add to list', 'buy', 'grocery list'],
    markers: ['the', 'my', 'check', 'send', 'pay', 'balance', 'account']
  }
};

function detectLanguage(text) {
  const lowerText = text.toLowerCase();
  const hasArabic = /[\u0600-\u06FF]/.test(text);

  if (hasArabic) {
    const darjaMarkers = languagePatterns['ar-tn'].markers;
    if (darjaMarkers.some(m => text.includes(m))) {
      return 'ar-tn';
    }
    return 'ar';
  }
  
  const frenchWords = ['le', 'la', 'mon', 'vérifier', 'envoyer', 'solde', 'compte'];
  const englishWords = ['the', 'my', 'check', 'send', 'pay', 'balance', 'account'];
  
  const words = lowerText.split(/\s+/);
  const frenchCount = words.filter(w => frenchWords.includes(w)).length;
  const englishCount = words.filter(w => englishWords.includes(w)).length;
  
  return frenchCount > englishCount ? 'fr' : 'en';
}

function understandIntent(text, language) {
  const lowerText = text.toLowerCase();
  const patterns = languagePatterns[language] || languagePatterns['en'];

  const scores = {};

  for (const [intent, phrases] of Object.entries(patterns)) {
    if (intent === 'markers') continue;
    const matches = phrases.filter(phrase => lowerText.includes(phrase.toLowerCase())).length;
    scores[intent] = matches;
  }

  const bestIntent = Object.entries(scores).sort((a, b) => b[1] - a[1])[0];

  if (bestIntent && bestIntent[1] > 0) {
    return bestIntent[0];
  }

  return 'help';
}

function extractEntities(text) {
  const amounts = [];
  const recipients = [];

  const amountRegex = /(\d+(?:\.\d+)?)\s*(?:dinar|dt|tnd|دينار|دراهم|فلوس)/gi;
  let match;
  while ((match = amountRegex.exec(text)) !== null) {
    amounts.push(parseFloat(match[1]));
  }

  const recipientRegex = /(?:to|à|ل|pour)\s+([A-Za-zأ-ي]{2,20})/gi;
  while ((match = recipientRegex.exec(text)) !== null) {
    recipients.push(match[1]);
  }

  return { amounts, recipients };
}

function generateResponse(intent, language, entities) {
  const responses = {
    'ar-tn': {
      check_balance: `رصيدك هو ${mockUserData.balance} دينار. تحب تعمل حاجة أخرى؟`,
      send_money: `تمام، نبعث ${entities.amounts[0] || 'الفلوس'} لـ ${entities.recipients[0] || 'الشخص'}؟`,
      pay_bill: 'نخلصلك الفاتورة توا. تحب تتأكد؟',
      shopping: 'زدتها للستة. حاجة أخرى تحب تزيدها؟',
      help: 'نقدر نعاونك في: فحص الرصيد، إرسال الفلوس، دفع الفواتير، أو لستة الشراء. اش تحب تعمل؟'
    },
    'ar': {
      check_balance: `رصيدك الحالي هو ${mockUserData.balance} دينار. هل تريد مساعدة أخرى؟`,
      send_money: `سأرسل ${entities.amounts[0] || 'المبلغ'} إلى ${entities.recipients[0] || 'المستلم'}.`,
      pay_bill: 'سأقوم بسداد الفاتورة الآن. هل تريد تأكيد؟',
      shopping: 'تمت الإضافة إلى قائمة المشتريات. هل تريد إضافة المزيد؟',
      help: 'يمكنني مساعدتك في: الاستعلام عن الرصيد، التحويلات المالية، دفع الفواتير، أو إدارة قائمة المشتريات.'
    },
    'fr': {
      check_balance: `Votre solde est de ${mockUserData.balance} dinars. Puis-je vous aider autrement?`,
      send_money: `Je vais envoyer ${entities.amounts[0] || "l'argent"} à ${entities.recipients[0] || 'le destinataire'}.`,
      pay_bill: 'Je vais payer la facture maintenant. Confirmez-vous?',
      shopping: 'Ajouté à la liste. Voulez-vous ajouter autre chose?',
      help: 'Je peux vous aider avec: consultation de solde, virements, paiements, ou liste de courses.'
    },
    'en': {
      check_balance: `Your balance is ${mockUserData.balance} dinars. Can I help with anything else?`,
      send_money: `I'll send ${entities.amounts[0] || 'the money'} to ${entities.recipients[0] || 'the recipient'}.`,
      pay_bill: "I'll pay the bill now. Do you confirm?",
      shopping: 'Added to your list. Anything else to add?',
      help: 'I can help you with: balance checks, money transfers, bill payments, or shopping lists.'
    }
  };

  const langResponses = responses[language] || responses['en'];
  return langResponses[intent] || langResponses['help'];
}

router.post('/process-command', async (req, res) => {
  try {
    const { text, userId = 'demo' } = req.body;
    
    if (!text) {
      return res.status(400).json({ error: 'No text provided' });
    }
    
    console.log('[API] Processing:', text);
    
    const language = detectLanguage(text);
    console.log('[API] Detected language:', language);
    
    const intent = understandIntent(text, language);
    console.log('[API] Detected intent:', intent);
    
    const entities = extractEntities(text);
    console.log('[API] Extracted entities:', entities);
    
    const response = generateResponse(intent, language, entities);

    let actionResult = {};
    switch(intent) {
      case 'check_balance':
        actionResult = { action: 'show_balance', balance: mockUserData.balance };
        break;
      case 'send_money':
        actionResult = { 
          action: 'initiate_transfer', 
          amount: entities.amounts[0],
          recipient: entities.recipients[0],
          status: 'pending_confirmation'
        };
        break;
      case 'pay_bill':
        actionResult = { action: 'pay_bill', status: 'pending' };
        break;
      case 'shopping':
        actionResult = { action: 'update_shopping_list', items_added: [] };
        break;
      default:
        actionResult = { action: 'show_help' };
    }

    res.json({
      success: true,
      understood: {
        text,
        language,
        intent,
        entities
      },
      action: actionResult,
      response,
      audioResponse: response
    });
    
  } catch (error) {
    console.error('[API] Error:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

router.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    service: 'voice-nlp',
    languages: ['en', 'fr', 'ar', 'ar-tn']
  });
});

module.exports = router;