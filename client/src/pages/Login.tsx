import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import Icon from '../components/Icon';
import { useAuth } from '../auth/AuthContext';

export default function Login() {
  const { requestCustomerOtp, loginCustomer, loginAdmin } = useAuth();
  const navigate = useNavigate();
  const [mode, setMode] = useState<'customer' | 'admin'>('customer');
  const [mobile, setMobile] = useState('');
  const [otp, setOtp] = useState('');
  const [demoOtp, setDemoOtp] = useState('');
  const [challengeId, setChallengeId] = useState('');
  const [otpStep, setOtpStep] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      if (mode === 'customer') {
        if (!otpStep) {
          const challenge = await requestCustomerOtp(mobile);
          setChallengeId(challenge.challenge_id);
          setDemoOtp(challenge.demo_otp);
          setOtpStep(true);
          return;
        }
        await loginCustomer(mobile, otp, challengeId);
        navigate('/');
      } else {
        await loginAdmin(username, password);
        navigate('/admin');
      }
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Could not sign in');
    } finally {
      setSubmitting(false);
    }
  };

  return <main className="login-page">
    <section className="login-card">
      <div className="login-brand"><span className="brand-mark"><Icon name="spark" size={20} /></span><div><strong>ResolveX</strong><small>Returns workspace</small></div></div>
      <span className="eyebrow">DEMO ACCESS</span>
      <h1>Sign in to continue</h1>
      <p className="login-intro">Your orders and return cases stay linked to your account.</p>
      <div className="login-tabs" role="tablist" aria-label="Account type">
        <button type="button" role="tab" aria-selected={mode === 'customer'} className={mode === 'customer' ? 'selected' : ''} onClick={() => { setMode('customer'); setOtpStep(false); setError(''); }}>Customer</button>
        <button type="button" role="tab" aria-selected={mode === 'admin'} className={mode === 'admin' ? 'selected' : ''} onClick={() => { setMode('admin'); setError(''); }}>Admin</button>
      </div>
      <form className="login-form" onSubmit={submit}>
        {mode === 'customer' ? <>
          {!otpStep ? <>
            <label>Mobile number<input type="tel" autoComplete="tel" inputMode="numeric" maxLength={10} pattern="[0-9]{10}" value={mobile} onChange={event => { setMobile(event.target.value.replace(/\D/g, '').slice(0, 10)); setChallengeId(''); setDemoOtp(''); }} placeholder="Enter your 10-digit mobile" required /></label>
            <p className="login-hint">Enter exactly 10 digits. In local demo mode, the OTP appears on the next step; no SMS is sent.</p>
          </> : <>
            <div className="login-phone-summary">Code sent to <strong>{mobile}</strong><button type="button" onClick={() => { setOtpStep(false); setOtp(''); setError(''); }}>Change</button></div>
            <label>One-time password<input autoComplete="one-time-code" inputMode="numeric" maxLength={6} pattern="[0-9]{6}" value={otp} onChange={event => setOtp(event.target.value.replace(/\D/g, '').slice(0, 6))} placeholder="Enter 6-digit code" required /></label>
            <p className="login-hint">Local demo code: <code>{demoOtp}</code> · expires in 5 minutes. The special configured number always uses its fixed code.</p>
          </>}
        </> : <>
          <label>Admin username<input autoComplete="username" value={username} onChange={event => setUsername(event.target.value)} placeholder="Admin username" required /></label>
          <label>Password<input type="password" autoComplete="current-password" value={password} onChange={event => setPassword(event.target.value)} placeholder="Admin password" required /></label>
          <p className="login-hint">Admin credentials are read from the server environment, including `username` and `password` in server/.env.</p>
        </>}
        {error && <p role="alert" className="inline-alert danger-alert">{error}</p>}
        <button className="primary-button login-submit" disabled={submitting || (mode === 'customer' && !otpStep && mobile.length !== 10) || (mode === 'customer' && otpStep && otp.length !== 6)}>{submitting ? <span className="mini-spinner" /> : mode === 'customer' && !otpStep ? 'Send code' : 'Sign in'} {!submitting && <Icon name="arrow" size={15} />}</button>
      </form>
      <p className="login-security"><Icon name="shield" size={14} /> Signed sessions expire after 8 hours. Sign out to revoke this session.</p>
    </section>
  </main>;
}
