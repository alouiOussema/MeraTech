export const MENUS = {
  '/': {
    title: 'الرئيسية',
    welcome: 'مرحبا بيك في منصّة إبصار. ',
    options: [
      { id: 1, label: 'دخول', action: 'NAVIGATE', payload: '/login' },
      { id: 2, label: 'تسجيل جديد', action: 'NAVIGATE', payload: '/register' },
      { id: 8, label: 'الخروج', action: 'LOGOUT' }
    ]
  },
  // /login and /register are handled by custom AuthFlow
  '/products': {
    title: 'قائمة المنتجات',
    welcome: 'مرحبا بيك في المنتجات. اختار شنوة تحب تعمل: 0، رجوع. 1، لوّج على منتج. 2، زيد منتج للسلة. 3، اسمع السلة والمجموع. 4، أكّد الطلب وافرغ السلة. 5، افرغ السلة. 9، عاود القائمة.',
    options: [
      { id: 0, label: 'رجوع', action: 'GO_BACK' },
      { id: 1, label: 'لوّج على منتج', action: 'START_SEARCH' },
      { id: 2, label: 'زيد منتج للسلة', action: 'START_ADD_PRODUCT' },
      { id: 3, label: 'اسمع السلة والمجموع', action: 'READ_CART' },
      { id: 4, label: 'أكّد الطلب وافرغ السلة', action: 'START_CHECKOUT' },
      { id: 5, label: 'افرغ السلة', action: 'START_EMPTY_CART' },
      { id: 9, label: 'عاود القائمة', action: 'REPEAT' }
    ]
  },
  '/banque': {
    title: 'البنك',
    welcome: 'مرحبا بيك في البنك. اختار شنوة تحب تعمل: واحد، نسمّعك رصيدك. اثنين، نحول فلوس. ثلاثة، نسمّعك آخر العمليات. صفر، رجوع. تسعة، نعاود القائمة.',
    options: [
      { id: 1, label: 'نسمّعك رصيدك', action: 'READ_BALANCE' },
      { id: 2, label: 'نحول فلوس', action: 'START_TRANSFER' },
      { id: 3, label: 'نسمّعك آخر العمليات', action: 'READ_HISTORY' },
      { id: 0, label: 'رجوع', action: 'GO_BACK' },
      { id: 9, label: 'نعاود القائمة', action: 'REPEAT' }
    ]
  },
  '/profile': {
    title: 'حسابي',
    welcome: 'هذا حسابك الشخصي. ',
    options: [
      { id: 1, label: 'الخروج', action: 'LOGOUT' },
      { id: 2, label: 'رجوع', action: 'GO_BACK' }
    ]
  }
};

export const QUICK_MENU = [
  { id: 1, label: 'الرئيسية', path: '/' },
  { id: 2, label: 'الدخول', path: '/login' },
  { id: 3, label: 'التسجيل', path: '/register' },
  { id: 4, label: 'البنك', path: '/banque' },
  { id: 5, label: 'المنتجات', path: '/products' },
  { id: 6, label: 'الحساب', path: '/profile' },
  { id: 7, label: 'الإعدادات', path: '/settings' },
  { id: 9, label: 'نعاود القائمة', action: 'REPEAT' }
];

export const speakQuickMenu = () => {
  return "باهِي. هاني نعطيك القائمة: 1 للرئيسية، 2 للدخول، 3 للتسجيل، 4 للبنك، 5 للمنتجات، 6 للحساب، 7 للإعدادات، و 9 باش نعاود القائمة.";
};
