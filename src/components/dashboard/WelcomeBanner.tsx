import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/context/AuthContext";

const WelcomeBanner = () => {
  const { user } = useAuth();
  const firstName = user?.first_name || "there";

  return (
    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-rose-600 via-pink-600 to-fuchsia-600 p-6 sm:p-8 text-white shadow-lg">
      {/* Decorative elements */}
      <div className="pointer-events-none absolute -right-16 -top-16 h-64 w-64 rounded-full bg-white/10 blur-2xl" />
      <div className="pointer-events-none absolute -bottom-8 -left-8 h-48 w-48 rounded-full bg-white/10 blur-2xl" />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_70%_20%,_rgba(255,255,255,0.15),_transparent_50%)]" />

      <div className="relative z-10 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold sm:text-3xl">
            Welcome back, {firstName}
          </h1>
          <p className="mt-1 text-sm text-white/80 max-w-lg">
            Monitor screening coverage, validate data quality, and coordinate fieldwork — all in one place.
          </p>
        </div>
        <Badge className="w-fit border-0 bg-white/20 text-white backdrop-blur-sm hover:bg-white/30 px-4 py-1.5 text-xs font-semibold">
          <span className="mr-2 inline-block h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
          Live Monitoring
        </Badge>
      </div>
    </div>
  );
};

export default WelcomeBanner;
