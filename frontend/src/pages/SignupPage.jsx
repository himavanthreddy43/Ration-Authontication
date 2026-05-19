import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { UserPlus, KeyRound, Phone, AlertCircle, ArrowRight, Chrome } from 'lucide-react';

export default function SignupPage() {
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [step, setStep] = useState(1); // 1 = phone, 2 = otp
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { sendOtp, verifyOtp, signInWithGoogle } = useAuth();
  const navigate = useNavigate();

  const handleSendOtp = async (e) => {
    e.preventDefault();
    if (!phone || phone.length < 10) {
      setError("Please enter a valid phone number with country code (e.g. +91...)");
      return;
    }
    setError('');
    setIsLoading(true);
    
    // Ensure phone has + prefix if not present (assuming India +91 for example if no prefix is there)
    const formattedPhone = phone.startsWith('+') ? phone : `+91${phone}`;

    const { error } = await sendOtp(formattedPhone);
    setIsLoading(false);
    
    if (error) {
      setError(error.message);
    } else {
      setStep(2);
      setPhone(formattedPhone); // Store the formatted one for verification
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    if (!otp || otp.length < 6) {
      setError("Please enter a valid 6-digit OTP");
      return;
    }
    setError('');
    setIsLoading(true);
    
    const { error } = await verifyOtp(phone, otp);
    setIsLoading(false);
    
    if (error) {
      setError(error.message);
    } else {
      navigate('/dashboard'); // Go to dashboard on success
    }
  };

  const handleGoogleSignIn = async () => {
    setError('');
    const { error } = await signInWithGoogle();
    if (error) {
      setError(error.message);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-4rem)] p-4">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-xl border border-zinc-200/50 p-8 transform transition-all">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-indigo-100 text-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-inner">
            <UserPlus size={32} />
          </div>
          <h1 className="text-3xl font-bold text-zinc-900">Create Account</h1>
          <p className="text-zinc-500 mt-2">Sign up to access Smart Ration System</p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-100 rounded-xl flex items-start space-x-3 text-red-600 text-sm">
            <AlertCircle size={18} className="shrink-0 mt-0.5" />
            <p>{error}</p>
          </div>
        )}

        {step === 1 ? (
          <form onSubmit={handleSendOtp} className="space-y-5">
            <div className="space-y-2">
              <label className="text-sm font-semibold text-zinc-700">Phone Number</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-zinc-400">
                  <Phone size={18} />
                </div>
                <input 
                  type="tel" 
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+91 98765 43210"
                  className="w-full pl-11 pr-4 py-3 bg-zinc-50 border border-zinc-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
                />
              </div>
            </div>
            <button 
              type="submit" 
              disabled={isLoading}
              className="w-full flex items-center justify-center space-x-2 bg-indigo-600 hover:bg-indigo-700 text-white py-3 rounded-xl font-semibold shadow-md shadow-indigo-500/20 transition-all disabled:opacity-70 disabled:cursor-not-allowed"
            >
              <span>{isLoading ? "Sending..." : "Send OTP"}</span>
              {!isLoading && <ArrowRight size={18} />}
            </button>
          </form>
        ) : (
          <form onSubmit={handleVerifyOtp} className="space-y-5">
            <div className="space-y-2">
              <label className="text-sm font-semibold text-zinc-700">Enter OTP</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-zinc-400">
                  <KeyRound size={18} />
                </div>
                <input 
                  type="text" 
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  placeholder="123456"
                  maxLength={6}
                  className="w-full pl-11 pr-4 py-3 bg-zinc-50 border border-zinc-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors text-center tracking-[0.5em] font-mono text-lg"
                />
              </div>
            </div>
            <button 
              type="submit" 
              disabled={isLoading}
              className="w-full flex items-center justify-center space-x-2 bg-green-600 hover:bg-green-700 text-white py-3 rounded-xl font-semibold shadow-md shadow-green-500/20 transition-all disabled:opacity-70 disabled:cursor-not-allowed"
            >
              <span>{isLoading ? "Verifying..." : "Verify & Sign Up"}</span>
              {!isLoading && <ArrowRight size={18} />}
            </button>
            <button 
              type="button"
              onClick={() => setStep(1)}
              className="w-full text-zinc-500 hover:text-zinc-800 text-sm font-medium transition-colors"
            >
              Change Phone Number
            </button>
          </form>
        )}

        <div className="mt-8">
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-zinc-200"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white text-zinc-500">Or continue with</span>
            </div>
          </div>
          <button 
            onClick={handleGoogleSignIn}
            type="button"
            className="mt-6 w-full flex items-center justify-center space-x-3 bg-white border border-zinc-200 hover:bg-zinc-50 text-zinc-700 py-3 rounded-xl font-medium shadow-sm transition-all"
          >
            <Chrome size={20} className="text-blue-500" />
            <span>Google</span>
          </button>
        </div>

        <div className="mt-8 text-center text-sm text-zinc-600">
          Already have an account?{' '}
          <Link to="/login" className="font-semibold text-indigo-600 hover:text-indigo-500 transition-colors">
            Log in
          </Link>
        </div>
      </div>
    </div>
  );
}
