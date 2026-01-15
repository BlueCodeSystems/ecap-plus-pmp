import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Mail, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const LoginCard = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Navigate to dashboard after login
    navigate("/dashboard");
  };

  return (
    <div className="w-full max-w-md bg-card rounded-lg shadow-2xl p-8 animate-fade-in">
      {/* Header */}
      <div className="text-center mb-8">
        <h4 className="text-muted-foreground text-sm font-medium tracking-wide uppercase mb-2">
          Login
        </h4>
        <h1 className="text-2xl font-bold text-primary">ECAP II Login</h1>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Email Field */}
        <div className="relative">
          <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-input-icon" />
          <Input
            type="email"
            placeholder="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="pl-11 h-12 border-border bg-background text-foreground placeholder:text-muted-foreground placeholder:italic focus-visible:ring-primary"
            required
          />
        </div>

        {/* Password Field */}
        <div className="relative">
          <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-input-icon" />
          <Input
            type="password"
            placeholder="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="pl-11 h-12 border-border bg-background text-foreground placeholder:text-muted-foreground placeholder:italic focus-visible:ring-primary"
            required
          />
        </div>

        {/* Submit Button */}
        <Button
          type="submit"
          className="w-full h-12 text-base font-semibold tracking-wide uppercase"
        >
          Lets Go
        </Button>
      </form>
    </div>
  );
};

export default LoginCard;
