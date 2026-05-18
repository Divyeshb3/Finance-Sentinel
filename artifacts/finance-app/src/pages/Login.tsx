import { useState } from "react";
import { useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { signInWithGoogle, signInWithEmail, signUpWithEmail } from "@/lib/firebase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Mail, Lock, Eye, EyeOff, TrendingUp, ShieldCheck, Sparkles } from "lucide-react";

type Mode = "login" | "signup";

export default function Login() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [mode, setMode] = useState<Mode>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  const handleGoogleSignIn = async () => {
    setGoogleLoading(true);
    try {
      await signInWithGoogle();
      navigate("/");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Google sign-in failed.";
      toast({ title: "Sign-in failed", description: msg, variant: "destructive" });
    } finally {
      setGoogleLoading(false);
    }
  };

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;
    setIsLoading(true);
    try {
      if (mode === "login") {
        await signInWithEmail(email, password);
      } else {
        await signUpWithEmail(email, password);
      }
      navigate("/");
    } catch (err: unknown) {
      const raw = err instanceof Error ? err.message : "";
      let description = "Something went wrong. Please try again.";
      if (raw.includes("user-not-found") || raw.includes("wrong-password") || raw.includes("invalid-credential")) {
        description = "Incorrect email or password.";
      } else if (raw.includes("email-already-in-use")) {
        description = "An account with this email already exists.";
      } else if (raw.includes("weak-password")) {
        description = "Password should be at least 6 characters.";
      } else if (raw.includes("invalid-email")) {
        description = "Please enter a valid email address.";
      }
      toast({ title: mode === "login" ? "Login failed" : "Sign-up failed", description, variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  const features = [
    { icon: TrendingUp, text: "Track every rupee you spend" },
    { icon: ShieldCheck, text: "Secure & private — your data stays yours" },
    { icon: Sparkles, text: "AI-powered insights on your habits" },
  ];

  return (
    <div className="min-h-screen flex flex-col md:flex-row">
      {/* Left brand panel */}
      <div className="hidden md:flex md:w-[45%] bg-[#0B1020] flex-col justify-between p-10 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-transparent to-purple-900/20 pointer-events-none" />
        <div className="absolute -top-32 -right-32 w-96 h-96 rounded-full bg-primary/10 blur-3xl" />
        <div className="absolute -bottom-32 -left-32 w-96 h-96 rounded-full bg-purple-600/10 blur-3xl" />

        <div className="relative z-10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl gradient-indigo flex items-center justify-center shadow-lg">
              <span className="text-white font-black text-xl leading-none">F</span>
            </div>
            <span className="text-2xl font-bold text-white">Fin<span className="gradient-text font-extrabold">Wise</span></span>
          </div>
        </div>

        <div className="relative z-10 space-y-8">
          <div>
            <h1 className="text-4xl font-black text-white leading-tight tracking-tight">
              Take control of<br />your finances.
            </h1>
            <p className="text-white/60 mt-4 font-medium leading-relaxed">
              The smarter way for students and young professionals to track spending and grow savings.
            </p>
          </div>
          <div className="space-y-4">
            {features.map(({ icon: Icon, text }) => (
              <div key={text} className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center shrink-0">
                  <Icon className="h-4 w-4 text-primary" />
                </div>
                <span className="text-white/70 text-sm font-medium">{text}</span>
              </div>
            ))}
          </div>
        </div>

        <p className="relative z-10 text-white/30 text-xs">
          © {new Date().getFullYear()} FinWise. Your money, your story.
        </p>
      </div>

      {/* Right form panel */}
      <div className="flex-1 flex flex-col items-center justify-center p-6 md:p-12 bg-background min-h-screen md:min-h-0">
        {/* Mobile logo */}
        <div className="mb-8 flex items-center gap-3 md:hidden">
          <div className="w-9 h-9 rounded-xl gradient-indigo flex items-center justify-center shadow-lg">
            <span className="text-white font-black text-lg leading-none">F</span>
          </div>
          <span className="text-xl font-bold">Fin<span className="gradient-text font-extrabold">Wise</span></span>
        </div>

        <div className="w-full max-w-md">
          <AnimatePresence mode="wait">
            <motion.div
              key={mode}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.2 }}
            >
              <div className="mb-8">
                <h2 className="text-3xl font-black tracking-tight">
                  {mode === "login" ? "Welcome back" : "Create account"}
                </h2>
                <p className="text-muted-foreground mt-2 font-medium">
                  {mode === "login"
                    ? "Sign in to continue to your dashboard."
                    : "Start your financial journey today."}
                </p>
              </div>

              {/* Google Sign-In */}
              <Button
                type="button"
                variant="outline"
                className="w-full h-12 rounded-xl font-semibold border-border/80 hover:bg-muted transition-all flex items-center gap-3 mb-6"
                onClick={handleGoogleSignIn}
                disabled={googleLoading || isLoading}
              >
                {googleLoading ? (
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                ) : (
                  <svg className="h-5 w-5" viewBox="0 0 24 24">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                  </svg>
                )}
                Continue with Google
              </Button>

              <div className="flex items-center gap-3 mb-6">
                <div className="flex-1 h-px bg-border" />
                <span className="text-xs text-muted-foreground font-medium uppercase tracking-wider">or</span>
                <div className="flex-1 h-px bg-border" />
              </div>

              {/* Email/Password form */}
              <form onSubmit={handleEmailAuth} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Email
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      type="email"
                      placeholder="you@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="pl-11 h-12 rounded-xl bg-muted/30 border-border/60 focus:border-primary focus:ring-1 focus:ring-primary text-base"
                      required
                      autoComplete="email"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Password
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      type={showPassword ? "text" : "password"}
                      placeholder={mode === "signup" ? "At least 6 characters" : "Your password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="pl-11 pr-12 h-12 rounded-xl bg-muted/30 border-border/60 focus:border-primary focus:ring-1 focus:ring-primary text-base"
                      required
                      autoComplete={mode === "login" ? "current-password" : "new-password"}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                      tabIndex={-1}
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                <Button
                  type="submit"
                  className="w-full h-12 rounded-xl font-bold gradient-indigo text-white border-none shadow-lg shadow-primary/20 hover:-translate-y-0.5 transition-all mt-2"
                  disabled={isLoading || googleLoading}
                >
                  {isLoading ? (
                    <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                  ) : mode === "login" ? "Sign in" : "Create account"}
                </Button>
              </form>

              <p className="text-center text-sm text-muted-foreground mt-6">
                {mode === "login" ? "Don't have an account?" : "Already have an account?"}{" "}
                <button
                  type="button"
                  className="font-semibold text-primary hover:underline"
                  onClick={() => {
                    setMode(mode === "login" ? "signup" : "login");
                    setEmail("");
                    setPassword("");
                  }}
                >
                  {mode === "login" ? "Sign up" : "Sign in"}
                </button>
              </p>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
