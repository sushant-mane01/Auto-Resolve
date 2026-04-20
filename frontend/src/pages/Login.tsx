import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, Loader2, Lock } from "lucide-react";
import { Logo } from "@/components/Logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { loginWithGoogle, signInWithEmail, signUpWithEmail } from "@/lib/api";
import { useAuth } from "@/store/auth";
import { toast } from "sonner";
import { GoogleLogin } from "@react-oauth/google";

type Mode = "signin" | "signup";

const Login = () => {
  const navigate = useNavigate();
  const setAuth = useAuth((s) => s.setAuth);
  const [mode, setMode] = useState<Mode>("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState<"none" | "email" | "google">("none");

  const routeFor = (role: string) => (role === "admin" ? "/admin/dashboard" : "/");

  const handleEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error("Email and password are required");
      return;
    }
    setLoading("email");
    try {
      const { token, user } =
        mode === "signin"
          ? await signInWithEmail({ email, password })
          : await signUpWithEmail({ email, password });
      setAuth(token, user);
      toast.success(mode === "signin" ? `Welcome back, ${user.name}` : `Account created for ${user.name}`);
      navigate(routeFor(user.role), { replace: true });
    } catch (error: any) {
      toast.error(error.message || (mode === "signin" ? "Sign in failed" : "Sign up failed"));
    } finally {
      setLoading("none");
    }
  };

  const handleGoogleSuccess = async (credential: string) => {
    setLoading("google");
    try {
      const { token, user } = await loginWithGoogle({ token: credential });
      setAuth(token, user);
      toast.success(`Signed in as ${user.name}`);
      navigate(routeFor(user.role), { replace: true });
    } catch (error: any) {
      toast.error(error.message || "Sign in failed");
    } finally {
      setLoading("none");
    }
  };

  const isSignIn = mode === "signin";

  return (
    <main className="relative min-h-screen overflow-hidden">
      <div className="relative z-10 grid min-h-screen lg:grid-cols-2">
        {/* LEFT — Branding */}
        <section className="relative hidden overflow-hidden lg:block">
          <div aria-hidden className="pointer-events-none absolute inset-0">
            <div className="absolute -top-32 -left-24 h-[640px] w-[640px] rounded-full bg-primary/20 blur-[160px]" />
            <div className="absolute bottom-[-12rem] right-[-6rem] h-[520px] w-[520px] rounded-full bg-accent/15 blur-[160px]" />
            <div className="absolute inset-0 bg-gradient-to-br from-background via-background/60 to-background" />
            <svg className="absolute inset-0 h-full w-full text-foreground/40 opacity-[0.04]" xmlns="http://www.w3.org/2000/svg">
              <defs>
                <pattern id="grid-l" width="56" height="56" patternUnits="userSpaceOnUse">
                  <path d="M 56 0 L 0 0 0 56" fill="none" stroke="currentColor" strokeWidth="1" />
                </pattern>
              </defs>
              <rect width="100%" height="100%" fill="url(#grid-l)" />
            </svg>
          </div>

          <div className="relative z-10 flex h-full flex-col justify-between p-12">
            <Logo />
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, ease: "easeOut" }}
              className="max-w-lg"
            >
              <h1 className="whitespace-nowrap text-5xl font-semibold leading-[1.05] tracking-tight text-foreground">
                Welcome to <span className="text-gradient-cyan">Auto-Resolve</span>
              </h1>
              <p className="mt-6 text-lg leading-relaxed text-muted-foreground">
                Resolve, triage and analyze customer support at scale with AI assistance.
              </p>
            </motion.div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Lock className="h-3.5 w-3.5" />
              <span>SSO encrypted in transit · SOC 2 Type II compliant</span>
            </div>
          </div>
        </section>

        {/* RIGHT — Auth card */}
        <section className="relative flex items-center justify-center px-6 py-12 sm:px-10">
          <div aria-hidden className="pointer-events-none absolute inset-0 lg:hidden">
            <div className="absolute -top-32 left-1/2 h-[520px] w-[520px] -translate-x-1/2 rounded-full bg-primary/15 blur-[140px]" />
          </div>

          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, ease: "easeOut" }}
            className="relative z-10 w-full max-w-md"
          >
            <div className="mb-8 flex justify-center lg:hidden">
              <Logo />
            </div>

            <div className="glass-strong rounded-2xl p-8 shadow-glass">
              <AnimatePresence mode="wait">
                <motion.div
                  key={mode}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  transition={{ duration: 0.2 }}
                >
                  <h2 className="text-2xl font-semibold tracking-tight text-foreground">
                    {isSignIn ? "Sign in to your account" : "Create your account"}
                  </h2>
                  <p className="mt-2 text-base text-muted-foreground">
                    {isSignIn
                      ? "Enter your credentials to access the workspace."
                      : "Get started in seconds with your work email."}
                  </p>
                </motion.div>
              </AnimatePresence>

              <form onSubmit={handleEmail} className="mt-7 space-y-5">
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-base">Email address</Label>
                  <Input
                    id="email"
                    type="email"
                    autoComplete="email"
                    placeholder="name@company.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="h-12 text-base"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password" className="text-base">Password</Label>
                  <Input
                    id="password"
                    type="password"
                    autoComplete={isSignIn ? "current-password" : "new-password"}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="h-12 text-base"
                    required
                  />
                </div>

                <Button
                  type="submit"
                  disabled={loading !== "none"}
                  className="group h-12 w-full justify-between bg-foreground text-background hover:bg-foreground/90"
                >
                  <span className="font-medium">{isSignIn ? "Sign In" : "Sign Up"}</span>
                  {loading === "email" ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                  )}
                </Button>
              </form>

              <div className="my-6 flex items-center gap-4">
                <div className="h-px flex-1 bg-border-strong" />
                <span className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Or</span>
                <div className="h-px flex-1 bg-border-strong" />
              </div>

              <div className="flex justify-center w-full min-h-[48px]">
                <GoogleLogin
                  onSuccess={(res) => {
                    if (res.credential) handleGoogleSuccess(res.credential);
                  }}
                  onError={() => toast.error("Google login failed")}
                  useOneTap
                  theme="outline"
                  size="large"
                  text="continue_with"
                />
              </div>
            </div>

            <p className="mt-6 text-center text-sm text-muted-foreground">
              {isSignIn ? "Don't have an account? " : "Already have an account? "}
              <button
                type="button"
                onClick={() => setMode(isSignIn ? "signup" : "signin")}
                className="font-medium text-foreground underline-offset-4 hover:underline"
              >
                {isSignIn ? "Sign up" : "Sign in"}
              </button>
            </p>
          </motion.div>
        </section>
      </div>
    </main>
  );
};

export default Login;
