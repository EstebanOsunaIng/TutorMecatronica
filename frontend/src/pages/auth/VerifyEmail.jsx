import React, { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { authApi } from '../../api/auth.api.js';
import { useTheme } from '../../context/ThemeContext.jsx';
import { useToast } from '../../context/ToastContext.jsx';

export default function VerifyEmail() {
  const navigate = useNavigate();
  const toast = useToast();
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === 'dark';

  const [email, setEmail] = useState(() => String(localStorage.getItem('pendingEmail') || '').trim().toLowerCase());
  const [userId, setUserId] = useState(() => String(localStorage.getItem('pendingUserId') || '').trim());
  const [otp, setOtp] = useState('');
  const [status, setStatus] = useState('NONE');
  const [remainingSeconds, setRemainingSeconds] = useState(0);
  const [nextResendSeconds, setNextResendSeconds] = useState(0);
  const [feedback, setFeedback] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);

  const authBackground = isDark ? '/assets/modo-oscuro-B.png' : '/assets/modo-claro-B.png';

  const inputClass = `block w-full rounded-xl px-4 py-2.5 text-[0.95rem] shadow-sm outline-none transition ${
    isDark
      ? 'border border-sky-900/60 bg-[#082447] text-white placeholder:text-sky-100/35 focus:border-sky-500 focus:ring-2 focus:ring-sky-500/25'
      : 'border border-[#9ebbd4] bg-[#edf4fb] text-[#243447] placeholder:text-[#6d8094] focus:border-[#2c8fd3] focus:ring-2 focus:ring-[#2c8fd3]/25'
  }`;

  const countdown = useMemo(() => {
    const mm = String(Math.floor(Math.max(0, remainingSeconds) / 60)).padStart(2, '0');
    const ss = String(Math.max(0, remainingSeconds) % 60).padStart(2, '0');
    return `${mm}:${ss}`;
  }, [remainingSeconds]);

  useEffect(() => {
    if (!email) {
      setFeedback('No encontramos un correo pendiente. Regresa al registro.');
      return;
    }

    const pollStatus = async () => {
      try {
        const { data } = await authApi.getRegisterEmailVerificationStatus(email);
        const nextStatus = data?.status || 'NONE';
        setStatus(nextStatus);
        setRemainingSeconds(Number(data?.remainingSeconds || 0));
        setNextResendSeconds(Number(data?.nextResendSeconds || 0));

        if (nextStatus === 'VERIFIED') {
          setFeedback('Correo verificado exitosamente. Ya puedes iniciar sesion.');
          localStorage.removeItem('verificationFlowActive');
          setTimeout(() => navigate('/login'), 900);
        } else if (nextStatus === 'EXPIRED') {
          setFeedback('Codigo expirado. Solicita uno nuevo.');
        } else if (nextStatus === 'PENDING') {
          setFeedback('Te enviamos un codigo OTP. Revisa tu correo.');
        }
      } catch (_err) {
        // silence
      }
    };

    pollStatus();
    const timer = setInterval(pollStatus, 2500);
    return () => clearInterval(timer);
  }, [email, navigate]);

  useEffect(() => {
    const timer = setInterval(() => {
      setRemainingSeconds((prev) => Math.max(0, prev - 1));
      setNextResendSeconds((prev) => Math.max(0, prev - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const resend = async () => {
    if (!email || !userId) return;
    if (nextResendSeconds > 0) {
      setFeedback(`Espera ${nextResendSeconds}s para reenviar.`);
      return;
    }

    setIsSending(true);
    try {
      const { data } = await authApi.requestRegisterEmailVerification({ email, userId });
      setStatus('PENDING');
      setRemainingSeconds(Number(data?.expiresInMinutes || 15) * 60);
      setNextResendSeconds(Number(data?.cooldownSeconds || 60));
      setFeedback(data?.message || 'Codigo reenviado correctamente.');
      toast.success('Codigo reenviado', 'Revisa tu correo para continuar.');
    } catch (err) {
      const message = err?.response?.data?.error || 'No se pudo reenviar el codigo.';
      setFeedback(message);
      toast.error('No se pudo reenviar', message);
    } finally {
      setIsSending(false);
    }
  };

  const submit = async (e) => {
    e.preventDefault();
    if (!/^\d{6}$/.test(otp)) {
      setFeedback('Codigo incorrecto');
      return;
    }

    setIsVerifying(true);
    try {
      const { data } = await authApi.verifyCode({ email, otp });
      setStatus('VERIFIED');
      setFeedback(data?.message || 'Correo verificado exitosamente');
      toast.success('Verificacion completada', 'Tu cuenta esta activa.');
      localStorage.removeItem('pendingEmail');
      localStorage.removeItem('pendingUserId');
      localStorage.removeItem('verificationFlowActive');
      setTimeout(() => navigate('/login'), 700);
    } catch (err) {
      const message = err?.response?.data?.error || 'No se pudo verificar el codigo.';
      setFeedback(message);
      toast.error('Verificacion fallida', message);
    } finally {
      setIsVerifying(false);
    }
  };

  return (
    <div
      className={`min-h-screen w-full ${isDark ? 'text-white' : 'text-[#10253c]'}`}
      style={{
        fontFamily: 'Roboto, sans-serif',
        backgroundImage: `url(${authBackground})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat'
      }}
    >
      <div className="relative flex min-h-screen items-center justify-center px-5 py-8">
        <div className={`relative w-full max-w-[480px] rounded-[2rem] p-6 backdrop-blur-xl ${isDark ? 'border border-sky-800/80 bg-[#0a2746]/78 shadow-xl shadow-sky-950/30' : 'border border-[#9fc0da]/92 bg-[#e9f2fb]/86 shadow-2xl shadow-cyan-700/20'}`}>
          <div className="absolute right-5 top-5">
            <button
              onClick={toggleTheme}
              className={`rounded-2xl p-2.5 transition ${isDark ? 'border border-sky-700/50 bg-[#0b2a4b] text-sky-200 hover:bg-[#123763] hover:text-white' : 'border border-[#b7cede] bg-[#dbeaf5] text-[#0f4a7c] shadow-sm shadow-slate-300/50 hover:bg-[#d1e4f2] hover:text-[#0b3f6b]'}`}
              aria-label={theme === 'dark' ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
              type="button"
            >
              {theme === 'dark' ? '☾' : '☀'}
            </button>
          </div>

          <h1 className={`mt-2 text-center text-3xl font-extrabold ${isDark ? 'text-white' : 'text-[#092748]'}`}>Verificar correo</h1>
          <p className={`mt-2 text-center text-sm ${isDark ? 'text-sky-100/80' : 'text-[#5f7184]'}`}>
            Te enviamos un codigo a <strong>{email || 'tu correo'}</strong>
          </p>

          <form onSubmit={submit} className="mt-6 space-y-4">
            <div>
              <label className={`block text-[11px] font-bold uppercase tracking-[0.16em] ${isDark ? 'text-sky-200/75' : 'text-[#647384]'}`}>Codigo OTP</label>
              <input
                value={otp}
                onChange={(e) => setOtp(String(e.target.value || '').replace(/\D/g, '').slice(0, 6))}
                inputMode="numeric"
                placeholder="000000"
                className={`${inputClass} mt-1.5 text-center text-2xl tracking-[0.35em]`}
              />
            </div>

            <div className="flex items-center justify-between text-xs font-semibold">
              <span className={isDark ? 'text-amber-200' : 'text-amber-700'}>Expira en {countdown}</span>
              <button
                type="button"
                onClick={resend}
                disabled={isSending || nextResendSeconds > 0 || !userId}
                className="rounded-lg border border-sky-300 bg-sky-50 px-3 py-1.5 text-sky-700 transition hover:bg-sky-100 disabled:cursor-not-allowed disabled:opacity-60 dark:border-sky-700 dark:bg-sky-900/30 dark:text-sky-200 dark:hover:bg-sky-900/45"
              >
                {nextResendSeconds > 0 ? `Reenviar en ${nextResendSeconds}s` : isSending ? 'Reenviando...' : 'Reenviar codigo'}
              </button>
            </div>

            {feedback && (
              <div className={`rounded-lg px-3 py-2 text-sm ${status === 'VERIFIED' ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-200' : 'bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-300'}`}>
                {feedback}
              </div>
            )}

            <button
              type="submit"
              disabled={isVerifying || otp.length !== 6}
              className={`w-full rounded-xl px-4 py-2.5 text-[0.95rem] font-extrabold uppercase tracking-[0.12em] text-white shadow-sm transition disabled:cursor-not-allowed disabled:opacity-60 ${isDark ? 'bg-sky-500 hover:bg-sky-400' : 'bg-gradient-to-r from-[#1599e0] to-[#25aeea] hover:from-[#138ece] hover:to-[#209fd6]'}`}
            >
              {isVerifying ? 'Verificando...' : 'Confirmar codigo'}
            </button>
          </form>

          <p className={`mt-4 text-center text-xs ${isDark ? 'text-sky-100/75' : 'text-[#6d7b8a]'}`}>
            ¿Volver al inicio de sesión? <Link to="/login" className={`font-semibold ${isDark ? 'text-sky-300 hover:text-sky-200' : 'text-[#2f82bb] hover:text-[#1f5f92]'}`}>Ir a login</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
