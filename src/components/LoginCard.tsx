import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Mail, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/context/AuthContext";
import Title from "@/components/aceternity/Title";
import LoadingDots from "@/components/aceternity/LoadingDots";

const LoginCard = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();
  const { login, isLoading } = useAuth();
  const [knownUsers] = useState<string[]>(() => {
    if (typeof window === "undefined") return [];
    try {
      return JSON.parse(localStorage.getItem("ecap.known_users") || "[]");
    } catch {
      return [];
    }
  });

  const isReturningUser = useMemo(() => {
    const trimmedEmail = email.trim().toLowerCase();
    if (!trimmedEmail) return knownUsers.length > 0;
    return knownUsers.includes(trimmedEmail);
  }, [email, knownUsers]);

  const handleSubmit = (e: React.FormEvent) => {
    setError(null);
    e.preventDefault();
    login(email, password)
      .then(() => {
        const trimmedEmail = email.trim().toLowerCase();
        const updatedUsers = Array.from(new Set([...knownUsers, trimmedEmail]));
        localStorage.setItem("ecap.known_users", JSON.stringify(updatedUsers));
        localStorage.setItem("ecap.returning_user", "true"); // Keep legacy flag for compatibility
        navigate("/dashboard");
      })
      .catch((err) => {
        setError(err instanceof Error ? err.message : "Login failed");
      });
  };

  return (
    <div className="animate-fade-in">
      <div className="mb-8 max-w-md">
        <img
          src="/ecap-logo.png"
          alt="ECAP +logo"
          className="w-auto max-h-24"
        />
        <Title className="mt-2">ECAP+ Program Management Platform</Title>
        <h1 className="mt-2 text-3xl font-semibold text-slate-900">
          {isReturningUser ? "Welcome back" : "Welcome"}
        </h1>
        <p className="mt-2 text-sm text-slate-600">
          Sign in to continue data reporting and monitoring.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="relative">
          <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
          <Input
            type="email"
            placeholder="Email address"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="h-12 pl-11 border-slate-200 bg-white text-slate-900 placeholder:text-slate-400 transition-all duration-300 hover:-translate-y-0.5 focus-visible:-translate-y-0.5 focus-visible:ring-primary/30"
            required
          />
        </div>

        <div className="relative">
          <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
          <Input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="h-12 pl-11 border-slate-200 bg-white text-slate-900 placeholder:text-slate-400 transition-all duration-300 hover:-translate-y-0.5 focus-visible:-translate-y-0.5 focus-visible:ring-primary/30"
            required
          />
        </div>

        <div className="flex items-center justify-between text-sm text-slate-600">
          <label className="flex items-center gap-2">
            <input type="checkbox" className="h-4 w-4 rounded border-slate-300 text-primary" />
            Remember me
          </label>
          <button
            type="button"
            className="font-medium text-slate-700 hover:text-slate-900"
            onClick={() => navigate("/forgot-password")}
          >
            Forgot password?
          </button>
        </div>

        {error && <p className="text-sm text-destructive">{error}</p>}

        <Button
          type="submit"
          className="h-12 w-full bg-primary text-primary-foreground transition-transform duration-300 hover:-translate-y-0.5 hover:bg-primary/90"
          disabled={isLoading}
        >
          {isLoading ? (
            <span className="flex items-center justify-center gap-2">
              Signing in <LoadingDots />
            </span>
          ) : (
            "Sign in"
          )}
        </Button>
      </form>
    </div>
  );
};

export default LoginCard;
