import { useState } from "react";
import { Link, useSearchParams, useNavigate } from "react-router-dom";
import { Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "@/components/ui/sonner";
import AuroraBackground from "@/components/aceternity/AuroraBackground";
import VersionFooter from "@/components/VersionFooter";
import RightImageSlider from "@/components/RightImageSlider";

const DIRECTUS_URL =
  import.meta.env.VITE_DIRECTUS_URL ?? "";

const ResetPassword = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get("token");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!token) {
      toast.error("Invalid or missing reset token.");
      return;
    }

    if (password !== confirmPassword) {
      toast.error("Passwords do not match.");
      return;
    }

    if (password.length < 8) {
      toast.error("Password must be at least 8 characters long.");
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch(`${DIRECTUS_URL}/auth/password/reset`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ token, password }),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => null);
        throw new Error(data?.errors?.[0]?.message ?? "Reset failed");
      }

      toast.success("Password reset successful. You can now sign in.");
      navigate("/");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to reset password");
    } finally {
      setIsLoading(false);
    }
  };

  if (!token) {
    return (
      <AuroraBackground>
        <main className="relative z-10 flex min-h-screen items-center justify-center p-6">
          <div className="max-w-md w-full bg-white/95 p-8 rounded-lg shadow-xl text-center">
            <h1 className="text-2xl font-semibold text-slate-900 mb-4">Invalid Link</h1>
            <p className="text-slate-600 mb-6">
              This password reset link is invalid or has expired.
            </p>
            <Link to="/forgot-password">
              <Button className="bg-amber-300 text-slate-900 hover:bg-amber-200">
                Request a new link
              </Button>
            </Link>
          </div>
        </main>
      </AuroraBackground>
    );
  }

  return (
    <AuroraBackground>
      <main className="relative z-10 min-h-screen">
        <div className="grid min-h-screen md:grid-cols-[1.05fr_0.95fr]">
          <section className="flex flex-col justify-center bg-white/95 px-6 py-12 sm:px-12 lg:px-16">
            <div className="max-w-md w-full">
              <img
                src="/ecap-logo.png"
                alt="ECAP + logo"
                className="w-auto"
              />
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">
                ECAP +
              </p>
              <h1 className="mt-2 text-3xl font-semibold text-slate-900">
                Reset your password
              </h1>
              <p className="mt-2 text-sm text-slate-600">
                Enter your new password below.
              </p>

              <form onSubmit={handleSubmit} className="mt-8 space-y-5">
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                  <Input
                    type="password"
                    placeholder="New password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="h-12 pl-11 border-slate-200 bg-white text-slate-900 placeholder:text-slate-400 transition-all duration-300 hover:-translate-y-0.5 focus-visible:-translate-y-0.5 focus-visible:ring-amber-300/80"
                    required
                  />
                </div>

                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                  <Input
                    type="password"
                    placeholder="Confirm new password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="h-12 pl-11 border-slate-200 bg-white text-slate-900 placeholder:text-slate-400 transition-all duration-300 hover:-translate-y-0.5 focus-visible:-translate-y-0.5 focus-visible:ring-amber-300/80"
                    required
                  />
                </div>

                <Button
                  type="submit"
                  className="h-12 w-full bg-amber-300 text-slate-900 transition-transform duration-300 hover:-translate-y-0.5 hover:bg-amber-200"
                  disabled={isLoading}
                >
                  {isLoading ? "Resetting..." : "Reset password"}
                </Button>
              </form>
            </div>
          </section>
          <aside className="relative min-h-[320px] md:min-h-0">
            <RightImageSlider
              images={[
                { src: "/pexels-uniqueerique-6572780.jpg", alt: "Program fieldwork photo" },
                { src: "/pexels-uniqueerique-6572781.jpg", alt: "Community program photo" },
              ]}
            />
            <div className="absolute bottom-10 left-10 right-10 text-white">
              <p className="text-xs font-semibold uppercase tracking-[0.4em] text-white/70">
                ECAP + Platform
              </p>
              <h2 className="mt-3 text-2xl font-semibold">
                Track progress across communities with confidence.
              </h2>
              <p className="mt-2 text-sm text-white/80">
                Secure reporting, real-time insights, and streamlined monitoring in one place.
              </p>
            </div>
          </aside>
        </div>
      </main>
      <VersionFooter />
    </AuroraBackground>
  );
};

export default ResetPassword;
