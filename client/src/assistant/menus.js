export const MENUS = {
  '/': {
    title: 'الرئيسية',
    welcome: 'مرحبا بيك في منصّة إبصار. ',
    options: [
      { id: 1, label: 'دخول', action: 'NAVIGATE', payload: '/login' },
      { id: 2, label: 'تسجيل جديد', action: 'NAVIGATE', payload: '/register' }
    ]
  },
  '/login': {
    title: 'تسجيل الدخول',
    welcome: 'صفحة الدخول. ',
    options: [
      { id: 1, label: 'اكتب اسمك', action: 'FOCUS', payload: 'name' },
      { id: 2, label: 'اكتب الرمز السري', action: 'FOCUS', payload: 'pin' },
      { id: 3, label: 'تأكيد الدخول', action: 'SUBMIT_LOGIN' },
      { id: 4, label: 'رجوع', action: 'GO_BACK' }
    ]
  },
  '/register': {
    title: 'تسجيل جديد',
    welcome: 'صفحة التسجيل. ',
    options: [
      { id: 1, label: 'اكتب اسمك', action: 'FOCUS', payload: 'name' },
      { id: 2, label: 'اكتب الرمز السري', action: 'FOCUS', payload: 'pin' },
      { id: 3, label: 'تأكيد التسجيل', action: 'SUBMIT_REGISTER' },
      { id: 4, label: 'رجوع', action: 'GO_BACK' }
    ]
  },
  '/products': {
    title: 'قائمة المنتجات',
    welcome: 'هذي قائمة المنتجات. ',
    options: [
      { id: 1, label: 'اسمع المنتجات', action: 'READ_PRODUCTS' },
      { id: 2, label: 'لوّج على منتج', action: 'FOCUS', payload: 'search' },
      { id: 3, label: 'السلة', action: 'OPEN_CART' },
      { id: 4, label: 'الخروج', action: 'LOGOUT' },
      { id: 5, label: 'رجوع', action: 'GO_BACK' }
    ]
  },
  '/banque': {
    title: 'البنك',
    welcome: 'حسابك البنكي. ',
    options: [
      { id: 1, label: 'رصيدي', action: 'READ_BALANCE' },
      { id: 2, label: 'تحويل فلوس', action: 'START_TRANSFER' },
      { id: 3, label: 'رجوع', action: 'GO_BACK' }
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
