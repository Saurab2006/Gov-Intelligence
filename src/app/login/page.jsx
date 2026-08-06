'use client';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useAuth } from '@/context/AuthContext';
import CivicAuthShell from '@/components/CivicAuthShell';
import styles from '@/styles/civicAuth.module.css';
import { Eye, EyeOff, Loader2, LockKeyhole } from 'lucide-react';
import { toast } from 'sonner';
import Link from 'next/link';

export default function LoginPage() {
  const { login } = useAuth();
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState('');
  const { register, handleSubmit, setValue, formState: { errors, isSubmitting } } = useForm({
    defaultValues: { email: '', password: '', remember: true },
  });

  const onSubmit = async (values) => {
    setError('');
    try {
      const user = await login(values);
      toast.success(`Welcome back, ${user.name.split(' ')[0]}`);
    } catch (err) {
      setError(err.message);
    }
  };

  const demoFill = (email, pass) => {
    setValue('email', email);
    setValue('password', pass);
  };

  return (
    <CivicAuthShell activeTab="login">
      <h1 className={styles.pageTitle}>Welcome back</h1>
      <p className={styles.pageSub}>Log in to track budgets, review issues, and follow your ward.</p>

      {error && <div className={styles.errorBox}>{error}</div>}

      <form onSubmit={handleSubmit(onSubmit)}>
        <label className={styles.label}>
          Email <span className={styles.labelNp}>इमेल</span>
        </label>
        <input
          type="email"
          placeholder="you@example.com"
          className={`${styles.input} ${errors.email ? styles.inputError : ''}`}
          {...register('email', { required: 'Email is required' })}
        />
        {errors.email && <span className={styles.errMsg}>{errors.email.message}</span>}

        <label className={styles.label}>
          Password <span className={styles.labelNp}>पासवर्ड</span>
        </label>
        <div className={styles.inputWrap}>
          <input
            type={showPw ? 'text' : 'password'}
            placeholder="••••••••"
            className={`${styles.input} ${errors.password ? styles.inputError : ''}`}
            style={{ paddingRight: 40 }}
            {...register('password', { required: 'Password is required' })}
          />
          <button
            type="button"
            onClick={() => setShowPw((v) => !v)}
            className={styles.inputIconBtn}
            aria-label={showPw ? 'Hide password' : 'Show password'}
          >
            {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
        {errors.password && <span className={styles.errMsg}>{errors.password.message}</span>}

        <div className={styles.checkboxRow} style={{ justifyContent: 'space-between' }}>
          <label style={{ display: 'flex', alignItems: 'flex-start', gap: 8, margin: 0 }}>
            <input type="checkbox" {...register('remember')} />
            Keep me signed in on this device
          </label>
          <span className={styles.metaNote}>Ward data protected</span>
        </div>

        <button type="submit" disabled={isSubmitting} className={styles.btn}>
          {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <LockKeyhole className="h-4 w-4" />}
          Log In
        </button>
      </form>

      <div className={styles.divider}>Quick demo access</div>
      <div className={styles.demoGrid}>
        {[
          ['Admin', 'admin@govinsight.np', 'admin123'],
          ['Officer', 'analyst@govinsight.np', 'analyst123'],
          ['Citizen', 'researcher@govinsight.np', 'researcher123'],
        ].map(([label, email, pass]) => (
          <button key={label} type="button" onClick={() => demoFill(email, pass)} className={styles.demoChip}>
            {label}
          </button>
        ))}
      </div>

      <div className={styles.footNote}>
        No account? <Link href="/signup">Join GovInsight</Link>
      </div>
    </CivicAuthShell>
  );
}
