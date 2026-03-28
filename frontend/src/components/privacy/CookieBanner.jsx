import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTheme } from '../../context/ThemeContext.jsx';
import { getCookieConsent, hasCookieConsent, setCookieConsent } from '../../utils/cookieConsent.js';

export default function CookieBanner() {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const [visible, setVisible] = useState(() => !hasCookieConsent() && !getCookieConsent());
  const [showCustomize, setShowCustomize] = useState(false);
  const [analyticsAllowed, setAnalyticsAllowed] = useState(false);
  const [marketingAllowed, setMarketingAllowed] = useState(false);

  const cardClasses = useMemo(
    () =>
      isDark
        ? 'border border-slate-700 bg-[#121212] text-white shadow-[0_18px_55px_-28px_rgba(0,0,0,0.75)]'
        : 'border border-[#cfd7f6] bg-[#F5F5F5] text-[#060273] shadow-[0_20px_45px_-26px_rgba(7,3,140,0.35)]',
    [isDark]
  );

  if (!visible) return null;

  const hideBanner = () => setVisible(false);

  const acceptAll = () => {
    setCookieConsent('true', {
      necessary: true,
      analytics: true,
      marketing: true
    });
    hideBanner();
  };

  const acceptNecessary = () => {
    setCookieConsent('necessary', {
      necessary: true,
      analytics: false,
      marketing: false
    });
    hideBanner();
  };

  const saveCustom = () => {
    setCookieConsent('custom', {
      necessary: true,
      analytics: analyticsAllowed,
      marketing: marketingAllowed
    });
    hideBanner();
  };

  return (
    <div className="fixed inset-x-0 bottom-0 z-[130] px-3 pb-3 sm:px-5 sm:pb-5">
      <div className={`mx-auto w-full max-w-5xl rounded-2xl p-4 sm:p-5 ${cardClasses}`}>
        <div className="flex items-start justify-between gap-3">
          <div>
            <h3 className="text-base font-extrabold tracking-tight sm:text-lg">Uso de Cookies</h3>
            <p className={`mt-2 text-sm leading-relaxed ${isDark ? 'text-slate-200' : 'text-[#060273]/90'}`}>
              Utilizamos cookies propias y de terceros para mejorar su experiencia de navegacion, analizar el trafico del sitio y
              personalizar el contenido. Al hacer clic en "Aceptar todas", usted acepta el uso de todas las cookies.
            </p>
            <Link
              to="/privacy-policy"
              className={`mt-2 inline-block text-xs font-bold underline underline-offset-2 ${isDark ? 'text-[#F2CB05]' : 'text-[#07038C]'}`}
            >
              Politica de Privacidad
            </Link>
          </div>
          <button
            type="button"
            onClick={acceptNecessary}
            aria-label="Cerrar banner de cookies"
            className={`grid h-8 w-8 flex-shrink-0 place-items-center rounded-full text-lg leading-none ${
              isDark ? 'bg-slate-800 text-white hover:bg-slate-700' : 'bg-white text-[#07038C] hover:bg-[#f0f0f5]'
            }`}
          >
            ×
          </button>
        </div>

        {showCustomize && (
          <div className={`mt-4 rounded-xl border p-3 ${isDark ? 'border-slate-700 bg-slate-900/40' : 'border-[#d6d3ef] bg-white/85'}`}>
            <p className={`mb-2 text-xs font-semibold ${isDark ? 'text-slate-200' : 'text-[#07038C]'}`}>Personaliza tus cookies</p>
            <label className="flex items-center justify-between gap-3 py-1.5 text-sm">
              <span>Cookies necesarias (siempre activas)</span>
              <input type="checkbox" checked readOnly className="h-4 w-4 accent-[#F2CB05]" />
            </label>
            <label className="flex items-center justify-between gap-3 py-1.5 text-sm">
              <span>Cookies de analitica</span>
              <input
                type="checkbox"
                checked={analyticsAllowed}
                onChange={(e) => setAnalyticsAllowed(e.target.checked)}
                className="h-4 w-4 accent-[#F2CB05]"
              />
            </label>
            <label className="flex items-center justify-between gap-3 py-1.5 text-sm">
              <span>Cookies de personalizacion</span>
              <input
                type="checkbox"
                checked={marketingAllowed}
                onChange={(e) => setMarketingAllowed(e.target.checked)}
                className="h-4 w-4 accent-[#F2CB05]"
              />
            </label>
          </div>
        )}

        <div className="mt-4 grid gap-2 sm:grid-cols-3">
          <button
            type="button"
            onClick={acceptAll}
            className="rounded-xl bg-[#F2CB05] px-4 py-2.5 text-sm font-extrabold uppercase tracking-[0.06em] text-[#060273] transition hover:brightness-95"
          >
            Aceptar todas
          </button>
          <button
            type="button"
            onClick={acceptNecessary}
            className={`rounded-xl px-4 py-2.5 text-sm font-bold uppercase tracking-[0.06em] transition ${
              isDark ? 'bg-[#07038C] text-white hover:bg-[#0d08a8]' : 'bg-[#07038C] text-white hover:bg-[#0b079f]'
            }`}
          >
            Solo necesarias
          </button>
          {!showCustomize ? (
            <button
              type="button"
              onClick={() => setShowCustomize(true)}
              className={`rounded-xl border px-4 py-2.5 text-sm font-bold uppercase tracking-[0.06em] transition ${
                isDark ? 'border-slate-600 bg-transparent text-white hover:bg-slate-800' : 'border-[#07038C] bg-transparent text-[#07038C] hover:bg-[#ecebfb]'
              }`}
            >
              Personalizar
            </button>
          ) : (
            <button
              type="button"
              onClick={saveCustom}
              className={`rounded-xl px-4 py-2.5 text-sm font-bold uppercase tracking-[0.06em] transition ${
                isDark ? 'bg-[#07038C] text-white hover:bg-[#0d08a8]' : 'bg-[#07038C] text-white hover:bg-[#0b079f]'
              }`}
            >
              Guardar preferencias
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
