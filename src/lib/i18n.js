// Lightweight in-app i18n dictionary. No external i18n library required —
// this plugs into LanguageContext via a simple key lookup so it works
// cleanly with the Next.js App Router (no next-i18next Pages Router setup needed).

export const LOCALES = {
  en: 'English',
  ne: 'नेपाली',
};

export const translations = {
  en: {
    // Sidebar / nav
    'nav.dashboard': 'Dashboard',
    'nav.budget': 'Budget Explorer',
    'nav.departments': 'Departments',
    'nav.issues': 'Community Reports',
    'nav.authorities': 'Authorities',
    'nav.analytics': 'Analytics',
    'nav.reports': 'Reports',
    'nav.userManagement': 'User Management',
    'nav.menu': 'Menu',
    'nav.admin': 'Admin',

    // Topbar
    'topbar.search': 'Search budgets, departments, projects…',
    'topbar.signOut': 'Sign out',
    'topbar.language': 'Language',

    // Offline / PWA
    'offline.banner': "You're offline — showing saved data. Reports you submit now will send automatically once you're back online.",

    // Dashboard
    'dashboard.title': 'Dashboard',
    'dashboard.welcome': 'Welcome back',
    'dashboard.recentActivity': 'Recent Activity',

    // Budget explorer
    'budget.title': 'Budget Explorer',
    'budget.subtitle': 'Search and filter budget line items',
    'budget.search': 'Search line items...',
    'budget.allSectors': 'All sectors',
    'budget.allWards': 'All wards',
    'budget.ward': 'Ward',
    'budget.district': 'District',
    'budget.department': 'Department',
    'budget.sector': 'Sector',
    'budget.amount': 'Amount',
    'budget.fiscalYear': 'Fiscal Year',
    'budget.title.col': 'Title',
    'budget.proposeChange': 'Propose change',

    // Common
    'common.loading': 'Loading…',
    'common.save': 'Save',
    'common.cancel': 'Cancel',
    'common.submit': 'Submit',
    'common.close': 'Close',
    'common.approve': 'Approve',
    'common.reject': 'Reject',
    'common.all': 'All',
  },
  ne: {
    // Sidebar / nav
    'nav.dashboard': 'ड्यासबोर्ड',
    'nav.budget': 'बजेट अन्वेषक',
    'nav.departments': 'विभागहरू',
    'nav.issues': 'सामुदायिक रिपोर्टहरू',
    'nav.authorities': 'निकायहरू',
    'nav.analytics': 'विश्लेषण',
    'nav.reports': 'प्रतिवेदनहरू',
    'nav.userManagement': 'प्रयोगकर्ता व्यवस्थापन',
    'nav.menu': 'मेनु',
    'nav.admin': 'प्रशासक',

    // Topbar
    'topbar.search': 'बजेट, विभाग, परियोजना खोज्नुहोस्…',
    'topbar.signOut': 'साइन आउट',
    'topbar.language': 'भाषा',

    // Offline / PWA
    'offline.banner': 'तपाईं अफलाइन हुनुहुन्छ — सेभ गरिएको डाटा देखाइँदैछ। अहिले पेश गरेका रिपोर्टहरू फेरि अनलाइन हुनासाथ स्वतः पठाइनेछन्।',

    // Dashboard
    'dashboard.title': 'ड्यासबोर्ड',
    'dashboard.welcome': 'फेरि स्वागत छ',
    'dashboard.recentActivity': 'हालैका गतिविधिहरू',

    // Budget explorer
    'budget.title': 'बजेट अन्वेषक',
    'budget.subtitle': 'बजेट लाइन-आइटमहरू खोज्नुहोस् र फिल्टर गर्नुहोस्',
    'budget.search': 'लाइन-आइटमहरू खोज्नुहोस्...',
    'budget.allSectors': 'सबै क्षेत्रहरू',
    'budget.allWards': 'सबै वडाहरू',
    'budget.ward': 'वडा',
    'budget.district': 'जिल्ला',
    'budget.department': 'विभाग',
    'budget.sector': 'क्षेत्र',
    'budget.amount': 'रकम',
    'budget.fiscalYear': 'आर्थिक वर्ष',
    'budget.title.col': 'शीर्षक',
    'budget.proposeChange': 'परिवर्तन प्रस्ताव गर्नुहोस्',

    // Common
    'common.loading': 'लोड हुँदैछ…',
    'common.save': 'सेभ गर्नुहोस्',
    'common.cancel': 'रद्द गर्नुहोस्',
    'common.submit': 'पेश गर्नुहोस्',
    'common.close': 'बन्द गर्नुहोस्',
    'common.approve': 'स्वीकृत गर्नुहोस्',
    'common.reject': 'अस्वीकार गर्नुहोस्',
    'common.all': 'सबै',
  },
};

export function t(locale, key) {
  return translations[locale]?.[key] || translations.en[key] || key;
}
