import { useState } from 'react';
import { Link, useNavigate } from 'react-router';
import { motion } from 'motion/react';
import { Mail, Lock, User } from 'lucide-react';
import { useAuth, ApiError } from '../../../contexts/AuthContext';
import { api } from '../../../lib/api';
import { toast } from 'sonner';

type Step = 'email' | 'otp' | 'profile';

function passwordStrength(p: string): { score: number; label: string; color: string } {
  let score = 0;
  if (p.length >= 8) score++;
  if (/[A-Z]/.test(p)) score++;
  if (/[0-9]/.test(p)) score++;
  if (/[^A-Za-z0-9]/.test(p)) score++;
  const labels = ['Weak', 'Fair', 'Good', 'Strong'];
  const colors = ['bg-red-500', 'bg-orange-500', 'bg-yellow-500', 'bg-green-500'];
  return { score, label: labels[Math.min(score, 3)], color: colors[Math.min(score, 3)] };
}

export default function Signup() {
  const [step, setStep] = useState<Step>('email');
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();
  const strength = passwordStrength(password);

  const sendOtp = async () => {
    setLoading(true);
    try {
      await api.sendOtp(email, 'signup');
      toast.success('OTP sent! Check your email (or terminal in dev mode)');
      setStep('otp');
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : 'Failed to send OTP');
    } finally {
      setLoading(false);
    }
  };

  const verifyOtp = async () => {
    const code = otp.join('');
    if (code.length !== 6) return toast.error('Enter 6-digit code');
    setLoading(true);
    try {
      await api.verifyOtp(email, code, 'signup');
      setStep('profile');
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : 'Invalid OTP');
    } finally {
      setLoading(false);
    }
  };

  const handleOtpChange = (i: number, val: string) => {
    if (!/^\d?$/.test(val)) return;
    const next = [...otp];
    next[i] = val;
    setOtp(next);
    if (val && i < 5) document.getElementById(`otp-${i + 1}`)?.focus();
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await register(email, username, password, otp.join(''));
      toast.success('Account created!');
      navigate('/');
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0f0f12] flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-8"
      >
        <h1 className="text-3xl font-bold bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent mb-2">
          Create account
        </h1>
        <div className="flex gap-2 mb-6">
          {(['email', 'otp', 'profile'] as Step[]).map((s, i) => (
            <div key={s} className={`flex-1 h-1 rounded-full ${step === s || (['email','otp','profile'].indexOf(step) > i) ? 'bg-indigo-500' : 'bg-white/10'}`} />
          ))}
        </div>

        {step === 'email' && (
          <div className="space-y-4">
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-lg pl-10 pr-4 py-3 text-white"
                placeholder="Email address"
                required
              />
            </div>
            <button onClick={sendOtp} disabled={loading} className="w-full py-3 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-lg text-white font-semibold">
              {loading ? 'Sending...' : 'Send verification code'}
            </button>
          </div>
        )}

        {step === 'otp' && (
          <div className="space-y-4">
            <p className="text-gray-400 text-sm">Enter the 6-digit code sent to {email}</p>
            <div className="flex gap-2 justify-center">
              {otp.map((d, i) => (
                <input
                  key={i}
                  id={`otp-${i}`}
                  value={d}
                  onChange={(e) => handleOtpChange(i, e.target.value)}
                  maxLength={1}
                  className="w-12 h-14 text-center text-xl bg-white/5 border border-white/10 rounded-lg text-white focus:border-indigo-500 focus:outline-none"
                />
              ))}
            </div>
            <button onClick={verifyOtp} disabled={loading} className="w-full py-3 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-lg text-white font-semibold">
              Verify code
            </button>
          </div>
        )}

        {step === 'profile' && (
          <form onSubmit={handleRegister} className="space-y-4">
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
              <input value={username} onChange={(e) => setUsername(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-lg pl-10 pr-4 py-3 text-white" placeholder="Username" required minLength={3} />
            </div>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
              <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-lg pl-10 pr-4 py-3 text-white" placeholder="Password" required minLength={8} />
            </div>
            {password && (
              <div>
                <div className="h-1 rounded-full bg-white/10 overflow-hidden">
                  <div className={`h-full ${strength.color} transition-all`} style={{ width: `${(strength.score / 4) * 100}%` }} />
                </div>
                <p className="text-xs text-gray-400 mt-1">{strength.label}</p>
              </div>
            )}
            <button type="submit" disabled={loading} className="w-full py-3 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-lg text-white font-semibold">
              {loading ? 'Creating...' : 'Create account'}
            </button>
          </form>
        )}

        <p className="mt-6 text-center text-gray-400 text-sm">
          Already have an account? <Link to="/login" className="text-indigo-400">Sign in</Link>
        </p>
      </motion.div>
    </div>
  );
}
