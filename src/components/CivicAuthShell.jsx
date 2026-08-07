'use client';
import Link from 'next/link';
import Image from 'next/image';
import styles from '@/styles/civicAuth.module.css';
import { CivicLogo } from '@/components/CivicBrand';

export default function CivicAuthShell({ activeTab, children }) {
  return (
    <div className={styles.shell}>
      <div className={styles.authShell}>
        <section className={styles.sidePanel}>
          <Image src="/civic-temple.png" alt="Kathmandu temples and mountains" fill priority sizes="(max-width: 900px) 100vw, 50vw" className={styles.sideImage} />
          <div className={styles.imageWash} />
          <div className={styles.sidePanelContent}>
            <div className={styles.brandRow}><CivicLogo /></div>
            <div className={styles.sidePanelBottom}>
              <p className={styles.taglineNp}>सुनिने आवाज, दर्ज इतिहास</p>
              <h1 className={styles.brandWordmarkLg}>Civic<span>दृष्टि</span></h1>
              <p className={styles.quoteNp}>तपाईंको सरकार, तपाईंको दृष्टिमा</p>
              <p className={styles.quoteEn}>Namaste - welcome to your government, in view.</p>
              <div className={styles.statStrip}>
                <div><strong>753</strong>Local units</div>
                <div><strong>रू 1.86T</strong>Tracked budget</div>
                <div><strong>701</strong>Wards reporting</div>
              </div>
            </div>
          </div>
        </section>

        <section className={styles.formPanel}>
          <div className={styles.formPanelInner}>
            <div className={styles.mobileLogo}><CivicLogo /></div>
            <p className={styles.eyebrow}>Secure Civic Access</p>
            <div className={styles.tierTabs}>
              <Link href="/login" className={`${styles.tierTab} ${activeTab === 'login' ? styles.tierTabActive : ''}`}>Log in</Link>
              <Link href="/signup" className={`${styles.tierTab} ${activeTab === 'signup' ? styles.tierTabActive : ''}`}>Sign up</Link>
            </div>
            {children}
          </div>
        </section>
      </div>
    </div>
  );
}
