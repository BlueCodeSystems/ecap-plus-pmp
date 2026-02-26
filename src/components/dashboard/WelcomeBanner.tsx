import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/AuthContext";
import { ArrowRight } from "lucide-react";

const WelcomeBanner = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const firstName = user?.first_name || "there";

  const isFirstLogin = sessionStorage.getItem("ecap.first_login") === "true";

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 18) return "Good afternoon";
    return "Good evening";
  };

  return (
    <div
      className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-green-700 via-emerald-600 to-teal-600 p-6 sm:p-8 text-white shadow-lg"
    >
      {/* Decorative elements */}
      <div className="pointer-events-none absolute -right-16 -top-16 h-64 w-64 rounded-full bg-white/10 blur-2xl" />
      <div className="pointer-events-none absolute -bottom-8 -left-8 h-48 w-48 rounded-full bg-white/10 blur-2xl" />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_70%_20%,_rgba(255,255,255,0.15),_transparent_50%)]" />

      <div className="relative z-10 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="mb-1 flex overflow-hidden text-xs font-bold tracking-wider text-emerald-100/80">
            {getGreeting().split("").map((char, index) => (
              <span
                key={index}
                className="animate-bounce-in-up opacity-0 inline-block"
                style={{ animationDelay: `${index * 0.05}s` }}
              >
                {char === " " ? "\u00A0" : char}
              </span>
            ))}
          </div>
          <h1 className="text-3xl font-black sm:text-4xl leading-tight">
            {isFirstLogin ? `Welcome, ${firstName}` : `Welcome back, ${firstName}`}
          </h1>
          <p className="mt-1 text-sm text-white/90 max-w-lg font-medium">
            Monitor screening coverage, validate data quality, and coordinate fieldwork all in one place.
          </p>
        </div>
        <Button
          onClick={() => navigate("/flags")}
          className="w-fit border-0 bg-white/20 text-white backdrop-blur-sm hover:bg-white/30 px-6 py-6 text-sm font-semibold rounded-xl group transition-all duration-300"
        >
          <span className="mr-3 inline-block h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
          Start DQA Review
          <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
        </Button>
      </div>
    </div>
  );
};

export default WelcomeBanner;
