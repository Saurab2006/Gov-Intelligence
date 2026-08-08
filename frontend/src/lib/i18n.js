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
    'nav.dashboard': 'Civic Home',
    'nav.budget': 'Public Money',
    'nav.departments': 'Departments',
    'nav.issues': 'Issue Chain',
    'nav.authorities': 'Authorities',
    'nav.analytics': 'Civic Intelligence',
    'nav.reports': 'AI Briefs',
    'nav.userManagement': 'User Management',
    'nav.menu': 'Menu',
    'nav.admin': 'Admin',

    // Topbar
    'topbar.search': 'Search issues, wards, authorities, budgets...',
    'topbar.signOut': 'Sign out',
    'topbar.language': 'Language',

    // Offline / PWA
    'offline.banner': "You're offline — showing saved data. Reports you submit now will send automatically once you're back online.",

    // Dashboard
    'dashboard.title': 'Civic Home',
    'dashboard.welcome': 'Welcome back',
    'dashboard.recentActivity': 'Recent Activity',
    'dashboard.greeting.morning': 'Good morning',
    'dashboard.greeting.afternoon': 'Good afternoon',
    'dashboard.greeting.evening': 'Good evening',
    'dashboard.greeting.late': 'Working late',
    'dashboard.heroSubtitle': "Here's where people are asking for help, who owns the work, and what's been fixed — a citizen reports a problem, the community confirms it, officials take ownership, and the outcome stays on record.",
    'dashboard.namaste': 'Namaste',
    'dashboard.pageTitle': 'Civic overview',
    'dashboard.headlineTitle': 'The headline numbers',
    'dashboard.headlineSubtitle': 'A quick read on the reports and the work waiting on someone.',
    'dashboard.trendTitle': 'How the civic chain is trending',
    'dashboard.trendSubtitle': 'Public budget available versus what the community is reporting.',
    'dashboard.budgetPanelTitle': 'Budget trend',
    'dashboard.budgetPanelSubtitle': 'Rs in thousands, by period',
    'dashboard.deptPanelTitle': 'Where it goes',
    'dashboard.deptPanelSubtitle': 'Spend by department',
    'dashboard.reportsTitle': 'What people are reporting',
    'dashboard.reportsSubtitle': 'The newest reports from citizens, straight from the wards.',
    'dashboard.latestReports': 'Latest civic reports',
    'dashboard.latestReportsSub': 'Updated as reports come in',
    'dashboard.noReports': 'No reports filed yet',
    'dashboard.noReportsSub': 'As citizens raise issues, they will show up here.',

    // Budget explorer
    'budget.title': 'Public Money',
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
    'dashboard.greeting.morning': 'शुभ प्रभात',
    'dashboard.greeting.afternoon': 'शुभ अपराह्न',
    'dashboard.greeting.evening': 'शुभ साँझ',
    'dashboard.greeting.late': 'अझै काम गर्दै हुनुहुन्छ',
    'dashboard.heroSubtitle': 'यहाँ देख्नुहोस् — मानिसहरूले कहाँ मद्दत माग्दै छन्, काम कसको जिम्मामा छ, र के-के समाधान भइसक्यो। नागरिकले समस्या रिपोर्ट गर्छन्, समुदायले त्यसलाई पुष्टि गर्छ, सम्बन्धित निकायले जिम्मेवारी लिन्छ, र नतिजा सार्वजनिक अभिलेखमा रहन्छ।',
    'dashboard.namaste': 'नमस्ते',
    'dashboard.pageTitle': 'नागरिक सिंहावलोकन',
    'dashboard.headlineTitle': 'मुख्य तथ्याङ्कहरू',
    'dashboard.headlineSubtitle': 'रिपोर्ट र कसैको पर्खाइमा रहेको काम, छोटो झलकमा।',
    'dashboard.trendTitle': 'नागरिक चेन कसरी अगाडि बढ्दैछ',
    'dashboard.trendSubtitle': 'उपलब्ध सार्वजनिक बजेट र समुदायले उठाएका रिपोर्टहरू।',
    'dashboard.budgetPanelTitle': 'बजेट प्रवृत्ति',
    'dashboard.budgetPanelSubtitle': 'रु हजारमा, अवधि अनुसार',
    'dashboard.deptPanelTitle': 'पैसा कहाँ जान्छ',
    'dashboard.deptPanelSubtitle': 'विभाग अनुसार खर्च',
    'dashboard.reportsTitle': 'मानिसहरूले के रिपोर्ट गर्दैछन्',
    'dashboard.reportsSubtitle': 'वडाहरूबाट सिधै आएका नयाँ नागरिक रिपोर्टहरू।',
    'dashboard.latestReports': 'पछिल्ला नागरिक रिपोर्टहरू',
    'dashboard.latestReportsSub': 'रिपोर्ट आउनेबित्तिकै अद्यावधिक हुन्छ',
    'dashboard.noReports': 'हालसम्म कुनै रिपोर्ट दर्ता भएको छैन',
    'dashboard.noReportsSub': 'नागरिकले समस्या उठाउनेबित्तिकै यहाँ देखिनेछ।',

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
