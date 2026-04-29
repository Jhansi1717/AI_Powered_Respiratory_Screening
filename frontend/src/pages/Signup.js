import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Link, useNavigate } from "react-router-dom";
import { signupUser } from "../services/api";
import { Stethoscope, Mail, Lock, UserPlus, Check, ShieldCheck, Heart, Sun, Moon, Languages } from "lucide-react";
import { translations } from "../utils/translations";

export default function Signup({ isDarkMode, toggleTheme, language, setLanguage }) {
  const t = translations[language];
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [showLangMenu, setShowLangMenu] = useState(false);
  
  const languages = [
    { code: "en", label: "English" },
    { code: "es", label: "Español" },
    { code: "hi", label: "हिन्दी" },
    { code: "te", label: "తెలుగు" }
  ];

  const handleSignup = async () => {
    if (!email || !password) {
      setError("Please enter both email and password.");
      return;
    }

    setError("");
    setSuccess("");
    setLoading(true);

    try {
      await signupUser(email, password);
      setSuccess("Account created successfully!");
      setTimeout(() => navigate("/"), 1500);
    } catch (apiError) {
      console.error("Signup error:", apiError);
      setError(apiError.detail || "Signup failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-white text-slate-900 selection:bg-emerald-100 selection:text-emerald-900 dark:bg-slate-950 dark:text-slate-100">
      {/* Left Column: Visual/Marketing */}
      <section className="hidden w-1/2 flex-col justify-between bg-emerald-950 p-12 lg:flex dark:bg-black">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3 text-white">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500 shadow-lg shadow-emerald-500/20">
              <Stethoscope size={24} />
            </div>
            <span className="text-xl font-bold tracking-tight">Respiratory AI</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="relative">
              <button
                onClick={() => setShowLangMenu(!showLangMenu)}
                className="flex h-10 w-10 items-center justify-center rounded-full bg-white/5 text-emerald-400 transition hover:bg-white/10 hover:text-emerald-300"
                title="Change Language"
              >
                <div className="flex flex-col items-center">
                  <Languages size={18} />
                  <span className="text-[8px] font-bold uppercase">{language}</span>
                </div>
              </button>

              <AnimatePresence>
                {showLangMenu && (
                  <>
                    <div className="fixed inset-0 z-10" onClick={() => setShowLangMenu(false)} />
                    <motion.div
                      initial={{ opacity: 0, y: 10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 10, scale: 0.95 }}
                      className="absolute right-0 top-full z-20 mt-2 w-40 overflow-hidden rounded-2xl border border-white/10 bg-slate-900 p-1.5 shadow-xl ring-1 ring-white/10"
                    >
                      {languages.map((lang) => (
                        <button
                          key={lang.code}
                          onClick={() => {
                            setLanguage(lang.code);
                            setShowLangMenu(false);
                          }}
                          className={`flex w-full items-center gap-3 rounded-xl px-3 py-2 text-sm font-bold transition ${
                            language === lang.code 
                              ? "bg-emerald-600 text-white" 
                              : "text-emerald-400 hover:bg-white/5 hover:text-emerald-300"
                          }`}
                        >
                          <span className="uppercase text-[10px] opacity-50">{lang.code}</span>
                          {lang.label}
                        </button>
                      ))}
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
            </div>
            <button
              onClick={toggleTheme}
              className="flex h-10 w-10 items-center justify-center rounded-full bg-white/5 text-emerald-400 transition hover:bg-white/10 hover:text-emerald-300"
            >
              {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
            </button>
          </div>
        </div>

        <div className="space-y-6">
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-5xl font-extrabold leading-tight text-white"
          >
            Join the future of <span className="text-emerald-400">respiratory health.</span>
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="max-w-md text-lg text-emerald-100/60"
          >
            Create an account to start analyzing respiratory sounds with our advanced AI diagnostic assistant.
          </motion.p>
        </div>

        <div className="space-y-4">
          {[
            "Instant audio pattern recognition",
            "Personalized screening history",
            "Secure, encrypted account access",
            "Modern, intuitive dashboard"
          ].map((feature, i) => (
            <motion.div 
              key={i}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 + i * 0.1 }}
              className="flex items-center gap-3 text-emerald-100/80"
            >
              <div className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-400">
                <Check size={14} />
              </div>
              <span className="text-sm font-semibold">{feature}</span>
            </motion.div>
          ))}
        </div>

        <div className="flex items-center gap-4 border-t border-white/10 pt-8">
          <div className="flex -space-x-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-10 w-10 rounded-full border-2 border-emerald-950 bg-slate-200 ring-2 ring-emerald-500/20" />
            ))}
          </div>
          <p className="text-sm font-bold text-emerald-100/60">Joined by 1,000+ professionals</p>
        </div>
      </section>

      {/* Right Column: Form */}
      <section className="flex flex-1 flex-col items-center justify-center px-8 sm:px-12 lg:px-20 dark:bg-slate-950">
        <div className="w-full max-w-sm space-y-8">
          <div className="space-y-2 text-center lg:text-left">
            <h2 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">{t.createAccount}</h2>
            <p className="text-sm font-medium text-slate-500 dark:text-slate-400">{t.signupDesc}</p>
          </div>

          <AnimatePresence>
            {error && (
              <motion.div 
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="flex items-center gap-3 rounded-2xl bg-rose-50 px-4 py-3 text-sm font-bold text-rose-600 ring-1 ring-rose-200 dark:bg-rose-900/10 dark:ring-rose-900/30 dark:text-rose-400"
              >
                <ShieldCheck size={18} className="rotate-180" />
                {error}
              </motion.div>
            )}
            {success && (
              <motion.div 
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                className="flex items-center gap-3 rounded-2xl bg-emerald-50 px-4 py-3 text-sm font-bold text-emerald-600 ring-1 ring-emerald-200 dark:bg-emerald-900/10 dark:ring-emerald-900/30 dark:text-emerald-400"
              >
                <Check size={18} />
                {success}
              </motion.div>
            )}
          </AnimatePresence>

          <form onSubmit={(e) => { e.preventDefault(); handleSignup(); }} className="space-y-6">
            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-black uppercase tracking-widest text-slate-400">{t.emailLabel}</label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                  <input
                    type="email"
                    placeholder="name@clinical.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-11 py-3.5 text-sm font-semibold outline-none transition focus:border-emerald-500 focus:bg-white focus:ring-4 focus:ring-emerald-100 dark:border-slate-800 dark:bg-slate-900 dark:text-white dark:focus:border-emerald-600 dark:focus:bg-slate-800 dark:focus:ring-emerald-900/20"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-black uppercase tracking-widest text-slate-400">{t.passwordLabel}</label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                  <input
                    type="password"
                    placeholder="Choose a strong password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-11 py-3.5 text-sm font-semibold outline-none transition focus:border-emerald-500 focus:bg-white focus:ring-4 focus:ring-emerald-100 dark:border-slate-800 dark:bg-slate-900 dark:text-white dark:focus:border-emerald-600 dark:focus:bg-slate-800 dark:focus:ring-emerald-900/20"
                  />
                </div>
              </div>
            </div>

            <div className="flex items-start gap-3 rounded-2xl bg-slate-50 p-4 ring-1 ring-slate-100 dark:bg-slate-800 dark:ring-slate-700">
              <ShieldCheck size={20} className="mt-0.5 text-slate-400" />
              <p className="text-xs font-medium leading-relaxed text-slate-500 dark:text-slate-400">
                {t.terms}
              </p>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="group relative flex w-full items-center justify-center gap-2 rounded-2xl bg-slate-900 py-4 text-base font-bold text-white shadow-xl shadow-slate-900/10 transition transform duration-200 hover:-translate-y-0.5 hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-200 active:scale-95 dark:bg-emerald-600 dark:hover:bg-emerald-700 dark:disabled:bg-slate-800"
            >
              {loading ? (
                <motion.div 
                  animate={{ rotate: 360 }} 
                  transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
                  className="h-5 w-5 border-2 border-white/30 border-t-white rounded-full" 
                />
              ) : (
                <>
                  <span>{t.createAccountBtn}</span>
                  <UserPlus size={18} className="transition group-hover:translate-x-1" />
                </>
              )}
            </button>
          </form>

          <p className="text-center text-sm font-semibold text-slate-500">
            {t.haveAccount}{" "}
            <Link to="/" className="text-emerald-600 hover:underline">{t.signIn}</Link>
          </p>

          <div className="flex flex-col items-center gap-2 pt-4">
            <div className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-slate-300">
              <Heart size={10} className="text-rose-500 fill-rose-500" />
              <span>Made for Clinical Excellence</span>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
