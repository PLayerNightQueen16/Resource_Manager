import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Sparkles, Mail, Lock, User, ArrowRight, Loader2 } from "lucide-react";
import { auth } from "@/lib/firebase";
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  updateProfile 
} from "firebase/auth";

import { AnimatedBackground } from "@/components/AnimatedBackground";

export function Auth({ onLogin }) {
  const [isLogin, setIsLogin] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    password: "",
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      if (isLogin) {
        const userCredential = await signInWithEmailAndPassword(auth, formData.email, formData.password);
        onLogin(userCredential.user);
      } else {
        const userCredential = await createUserWithEmailAndPassword(auth, formData.email, formData.password);
        if (formData.username) {
          await updateProfile(userCredential.user, { displayName: formData.username });
        }
        onLogin(userCredential.user);
      }
    } catch (err) {
      let message = "Something went wrong. Please try again.";
      if (err.code === "auth/email-already-in-use") message = "This email is already in use.";
      if (err.code === "auth/invalid-email") message = "Invalid email format.";
      if (err.code === "auth/weak-password") message = "Password should be at least 6 characters.";
      if (err.code === "auth/user-not-found") message = "No account found with this email.";
      if (err.code === "auth/wrong-password") message = "Incorrect password.";
      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-[100dvh] w-full flex items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute inset-0 bg-[#0a0a1a] z-[-2]" />
      <AnimatedBackground />

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-[420px] relative"
      >
        <div className="glass-card p-8 rounded-3xl border border-white/10 backdrop-blur-3xl shadow-2xl relative overflow-hidden group">
          <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent pointer-events-none" />
          
          <div className="flex flex-col items-center mb-8">
            <div className="w-20 h-20 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center mb-4 shadow-inner">
              <img src="/logo.jpg" alt="Logo" className="w-[85%] h-[85%] rounded-xl object-contain shadow-lg" />
            </div>
            <h1 className="text-3xl font-serif text-white tracking-widest mb-2">NOETICA</h1>
            <p className="text-white/40 text-sm tracking-tight text-center">
              Your celestial sanctuary for digital wisdom.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <AnimatePresence mode="wait">
              {!isLogin && (
                <motion.div
                  key="username"
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="space-y-2"
                >
                  <label className="text-xs font-semibold text-white/50 uppercase tracking-widest pl-1">Username</label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                    <Input
                      required
                      placeholder="Stardust_Voyager"
                      value={formData.username}
                      onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                      className="bg-white/5 border-white/10 text-white pl-10 h-12 focus:ring-amber-500/50"
                    />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="space-y-2">
              <label className="text-xs font-semibold text-white/50 uppercase tracking-widest pl-1">Email Space</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                <Input
                  required
                  type="email"
                  placeholder="name@cosmos.com"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="bg-white/5 border-white/10 text-white pl-10 h-12 focus:ring-amber-500/50"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold text-white/50 uppercase tracking-widest pl-1">Pass-key</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                <Input
                  required
                  type="password"
                  placeholder="••••••••"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="bg-white/5 border-white/10 text-white pl-10 h-12 focus:ring-amber-500/50"
                />
              </div>
            </div>

            {error && (
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-red-400 text-xs text-center font-medium bg-red-400/10 py-2 rounded-lg"
              >
                {error}
              </motion.p>
            )}

            <Button
              type="submit"
              disabled={isLoading}
              className="w-full h-12 bg-white text-black hover:bg-white/90 rounded-xl font-semibold tracking-wide transition-all active:scale-95 group"
            >
              {isLoading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <span className="flex items-center gap-2">
                  {isLogin ? "Enter the Vault" : "Initialize Account"}
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </span>
              )}
            </Button>
          </form>

          <div className="mt-8 flex flex-col items-center gap-4">
            <div className="flex items-center gap-2 text-sm">
              <span className="text-white/30">{isLogin ? "New to the sanctuary?" : "Already a voyager?"}</span>
              <button
                type="button"
                onClick={() => setIsLogin(!isLogin)}
                className="text-white font-medium hover:underline underline-offset-4"
              >
                {isLogin ? "Create Account" : "Access Vault"}
              </button>
            </div>
            
            <div className="flex items-center gap-2 text-[10px] text-white/20 uppercase tracking-[0.2em] font-medium">
              <div className="w-8 h-px bg-white/10" />
              Secure Mock Auth
              <div className="w-8 h-px bg-white/10" />
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
