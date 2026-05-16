import { useState } from 'react';
import { Link } from 'react-router';
import { motion } from 'motion/react';
// motion used for page animation
import { Mail, Lock } from 'lucide-react';
import { api } from '../../../lib/api';
import { ApiError } from '../../../contexts/AuthContext';
import { toast } from 'sonner';

type Step = 'email' | 'otp' | 'reset';

export default function ForgotPassword() {
  const [step, setStep] = useState<Step>('email');
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const sendOtp = async () => {
    setLoading(true);
    try {
      await api.forgotPassword(email);
      toast.success('Reset code sent');
      setStep('otp');
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : 'Failed');
    } finally {
      setLoading(false);
    }
  };

  const handleOtpChange = (i: number, val: string) => {
    if (!/^\d?$/.test(val)) return;
    const next = [...otp];
    next[i] = val;
    setOtp(next);
    if (val && i < 5) document.getElementById(`fp-otp-${i + 1}`)?.focus();
  };

  const resetPass = async () => {
    setLoading(true);
    try {
      await api.resetPassword(email, otp.join(''), password);
      toast.success('Password reset! Please sign in.');
      window.location.href = '/login';
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : 'Reset failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0f0f12] flex items-center justify-center p-4">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-8">
        <h1 className="text-2xl font-bold text-white mb-6">Reset password</h1>
        {step === 'email' && (
          <motion.div className="space-y-4">
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white" placeholder="Email" />
            <button onClick={sendOtp} disabled={loading} className="w-full py-3 bg-indigo-600 rounded-lg text-white">Send code</button>
          </motion.div>
        )}
        {step === 'otp' && (
          <div className="space-y-4">
            <div className="flex gap-2 justify-center">
              {otp.map((d, i) => (
                <input key={i} id={`fp-otp-${i}`} value={d} onChange={(e) => handleOtpChange(i, e.target.value)} maxLength={1} className="w-12 h-14 text-center text-xl bg-white/5 border border-white/10 rounded-lg text-white" />
              ))}
            </div>
            <button onClick={() => setStep('reset')} className="w-full py-3 bg-indigo-600 rounded-lg text-white">Continue</button>
          </div>
        )}
        {step === 'reset' && (
          <div className="space-y-4">
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white" placeholder="New password" minLength={8} />
            <button onClick={resetPass} disabled={loading} className="w-full py-3 bg-indigo-600 rounded-lg text-white">{loading ? 'Resetting...' : 'Reset password'}</button>
          </div>
        )}
        <Link to="/login" className="block mt-4 text-center text-indigo-400 text-sm">Back to login</Link>
      </motion.div>
    </div>
  );
}
