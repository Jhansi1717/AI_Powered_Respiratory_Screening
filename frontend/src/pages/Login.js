import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { loginUser } from "../services/api";
import { Link, useNavigate } from "react-router-dom";
import { setToken } from "../utils/auth";
import { Stethoscope, Mail, Lock, ArrowRight, Activity, ShieldCheck, Zap, Sun, Moon, AlertCircle, Languages } from "lucide-react";
import { translations } from "../utils/translations";

export default function Login({ isDarkMode, toggleTheme, language, setLanguage }) {
  const t = translations[language];
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showLangMenu, setShowLangMenu] = useState(false);
  
  const languages = [
    { code: "en", label: "English" },
    { code: "es", label: "Español" },
    { code: "hi", label: "हिन्दी" },
    { code: "te", label: "తెలుగు" }
  ];

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, scale: 0.95 },
    visible: { opacity: 1, scale: 1, transition: { duration: 0.5, ease: "easeOut" } }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!email || !password) {
      setError("Please enter both email and password.");
      return;
    }

    setError("");
    setLoading(true);

    try {
      const data = await loginUser(email, password);
      const token = data?.access_token;
      if (!token) throw new Error("Invalid login response.");

      setToken(token);
      navigate("/dashboard");
    } catch (err) {
      console.error("Login error:", err);
      setError(err.detail || "Invalid credentials or network error.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-white text-slate-900 selection:bg-blue-100 selection:text-blue-900 dark:bg-slate-950 dark:text-slate-100">
      {/* Left Column: Visual/Marketing */}
      <section className="hidden w-1/2 flex-col justify-between bg-slate-950 p-12 lg:flex dark:bg-black">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3 text-white">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600 shadow-lg shadow-blue-600/20">
              <Stethoscope size={24} />
            </div>
            <span className="text-xl font-bold tracking-tight">Respiratory AI</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="relative">
              <button
                onClick={() => setShowLangMenu(!showLangMenu)}
                className="flex h-10 w-10 items-center justify-center rounded-full bg-white/5 text-slate-400 transition hover:bg-white/10 hover:text-white"
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
                              ? "bg-blue-600 text-white" 
                              : "text-slate-400 hover:bg-white/5 hover:text-white"
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
              className="flex h-10 w-10 items-center justify-center rounded-full bg-white/5 text-slate-400 transition hover:bg-white/10 hover:text-white"
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
            {t.clinicalMarketingTitle}
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="max-w-md text-lg text-slate-400"
          >
            {t.clinicalMarketingDesc}
          </motion.p>
        </div>

        <motion.div 
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="grid grid-cols-2 gap-4"
        >
          {[
            { icon: ShieldCheck, label: "Secure Data", desc: "JWT Protected" },
            { icon: Activity, label: "Real-time", desc: "Instant Results" },
            { icon: Zap, label: "AI Powered", desc: "EfficientNet B0" },
            { icon: Lock, label: "Private", desc: "Encrypted Auth" }
          ].map((item, i) => (
            <motion.div 
              key={i}
              variants={itemVariants}
              whileHover={{ scale: 1.05, backgroundColor: "rgba(255, 255, 255, 0.08)" }}
              className="rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur-sm transition-colors"
            >
              <item.icon size={20} className="text-blue-500" />
              <p className="mt-3 text-sm font-bold text-white">{item.label}</p>
              <p className="text-xs text-slate-500">{item.desc}</p>
            </motion.div>
          ))}
        </motion.div>
      </section>

      {/* Right Column: Form */}
      <section className="flex flex-1 flex-col items-center justify-center px-8 sm:px-12 lg:px-20 dark:bg-slate-950">
        <div className="w-full max-w-sm space-y-8">
          <div className="space-y-2">
            <h2 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">{t.welcomeBack}</h2>
            <p className="text-sm font-medium text-slate-500 dark:text-slate-400">{t.loginDesc}</p>
          </div>

          <AnimatePresence>
            {error && (
              <motion.div 
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="flex items-center gap-3 rounded-2xl bg-rose-50 px-4 py-3 text-sm font-bold text-rose-600 ring-1 ring-rose-200 dark:bg-rose-900/10 dark:ring-rose-900/30 dark:text-rose-400"
              >
                <AlertCircle size={18} />
                {error}
              </motion.div>
            )}
          </AnimatePresence>

          <form onSubmit={handleSubmit} className="space-y-6">
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
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-11 py-3.5 text-sm font-semibold outline-none transition focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-100 dark:border-slate-800 dark:bg-slate-900 dark:text-white dark:focus:border-blue-600 dark:focus:bg-slate-800 dark:focus:ring-blue-900/20"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <div className="flex justify-between items-center">
                  <label className="text-xs font-black uppercase tracking-widest text-slate-400">{t.passwordLabel}</label>
                  <a href="#!" onClick={(e) => e.preventDefault()} className="text-xs font-bold text-blue-600 hover:underline dark:text-blue-400">{t.forgotPassword}</a>
                </div>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                  <input
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-11 py-3.5 text-sm font-semibold outline-none transition focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-100 dark:border-slate-800 dark:bg-slate-900 dark:text-white dark:focus:border-blue-600 dark:focus:bg-slate-800 dark:focus:ring-blue-900/20"
                  />
                </div>
              </div>
            </div>

            <motion.button
              type="submit"
              disabled={loading}
              whileHover={{ scale: 1.02, boxShadow: "0 10px 30px -10px rgba(59, 130, 246, 0.5)" }}
              whileTap={{ scale: 0.98 }}
              className="group relative flex w-full items-center justify-center gap-2 rounded-2xl bg-slate-900 py-4 text-base font-bold text-white shadow-xl shadow-slate-900/10 transition duration-200 disabled:cursor-not-allowed disabled:bg-slate-200 dark:bg-blue-600 dark:hover:bg-blue-700 dark:disabled:bg-slate-800"
            >
              {loading ? (
                <motion.div 
                  animate={{ rotate: 360 }} 
                  transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
                  className="h-5 w-5 border-2 border-white/30 border-t-white rounded-full" 
                />
              ) : (
                <>
                  <span>{t.signIn}</span>
                  <ArrowRight size={18} className="transition group-hover:translate-x-1" />
                </>
              )}
            </motion.button>
          </form>

          <p className="text-center text-sm font-semibold text-slate-500">
            {t.noAccount}{" "}
            <Link to="/signup" className="text-blue-600 hover:underline">{t.createAccount}</Link>
          </p>
        </div>
      </section>
    </div>
  );
}


