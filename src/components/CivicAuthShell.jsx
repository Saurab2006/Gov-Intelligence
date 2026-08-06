'use client';
import { useState } from 'react';
import Link from 'next/link';
import styles from '@/styles/civicAuth.module.css';
import { ShieldCheck } from 'lucide-react';

export default function CivicAuthShell({ activeTab, children }) {
  const [lang, setLang] = useState('en');

  return (
    <div className={styles.shell}>
      <link
        rel="stylesheet"
        href="https://fonts.googleapis.com/css2?family=Yatra+One&family=IBM+Plex+Sans:wght@400;500;600;700&family=IBM+Plex+Sans+Devanagari:wght@400;500;600;700&family=IBM+Plex+Mono:wght@400;500;600&display=swap"
      />
      <div className={styles.authShell}>
        <div className={styles.sidePanel}>
          <div className={styles.sidePanelContent}>
            <div className={styles.brandRow}>
              <div className={styles.brandSeal}>
                <span />
              </div>
              <div>
                <div className={styles.brandWordmarkSm}>Civic<span className={styles.np}>दृष्टि</span></div>
                <div className={styles.brandCaption}>Civic Archive</div>
              </div>
            </div>

            <div className={styles.sidePanelBottom}>
              <div className={styles.taglineNp}>सुनिने आवाज, दर्ज इतिहास</div>
              <div className={styles.brandWordmarkLg}>Civic<span className={styles.np}>दृष्टि</span></div>
              <div className={styles.quoteNp}>तपाईंको सरकार, तपाईंको दृष्टिमा</div>
              <div className={styles.quoteEn}>Namaste – welcome to your government, in view.</div>

              <div className={styles.statStrip}>
                <div><strong>753</strong>Local units</div>
                <div><strong>रू 1.86T</strong>Tracked budget</div>
                <div><strong>701</strong>Wards reporting</div>
              </div>
            </div>
          </div>
        </div>

        <div className={styles.formPanel}>
          <div className={styles.formPanelInner}>
            <div className={styles.formTop}>
              <div className={styles.eyebrow}>
                <ShieldCheck className="h-3.5 w-3.5" />
                Secure access
              </div>
              <div className={styles.langToggle}>
                <button
                  type="button"
                  className={`${styles.langToggleBtn} ${lang === 'en' ? styles.langToggleBtnActive : ''}`}
                  onClick={() => setLang('en')}
                >
                  EN
                </button>
                <button
                  type="button"
                  className={`${styles.langToggleBtn} ${lang === 'ne' ? styles.langToggleBtnActive : ''}`}
                  onClick={() => setLang('ne')}
                >
                  नेपाली
                </button>
              </div>
            </div>

            <div className={styles.tierTabs}>
              <Link href="/login" className={`${styles.tierTab} ${activeTab === 'login' ? styles.tierTabActive : ''}`}>
                Log In
              </Link>
              <Link href="/signup" className={`${styles.tierTab} ${activeTab === 'signup' ? styles.tierTabActive : ''}`}>
                Sign Up
              </Link>
            </div>
            <div className={styles.dhakaMini} />

            {children}
          </div>
        </div>
      </div>
    </div>
  );
}
