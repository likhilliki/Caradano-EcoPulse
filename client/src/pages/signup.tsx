import { useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Mail, Lock, CheckCircle2, Eye, EyeOff } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function Signup() {
  const [, navigate] = useLocation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [otp, setOtp] = useState("");
  const [stage, setStage] = useState<"form" | "verify">("form");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const { toast } = useToast();

  const handleSignup = async () => {
    if (!email || !password) {
      toast({ title: "Error", description: "Please fill all fields", variant: "destructive" });
      return;
    }

    if (password.length < 8) {
      toast({ title: "Error", description: "Password must be at least 8 characters", variant: "destructive" });
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message);
      }

      const data = await res.json();
      console.log("[TEST] OTP:", data.otp);
      setStage("verify");
      toast({ title: "Success", description: "OTP sent to your email" });
    } catch (err) {
      toast({
        title: "Error",
        description: err instanceof Error ? err.message : "Signup failed",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = async () => {
    if (!otp) {
      toast({ title: "Error", description: "Please enter OTP", variant: "destructive" });
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/auth/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, code: otp }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message);
      }

      const data = await res.json();
      localStorage.setItem("authToken", data.token);
      toast({ title: "Success", description: "Account created successfully!" });
      navigate("/dashboard");
    } catch (err) {
      toast({
        title: "Error",
        description: err instanceof Error ? err.message : "Failed to verify OTP",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex items-center justify-center p-4">
      <Card className="w-full max-w-md glass-panel border-white/10">
        <CardHeader>
          <CardTitle className="text-2xl font-heading">Create Account</CardTitle>
          <p className="text-sm text-muted-foreground mt-2">Secure OTP verification</p>
        </CardHeader>
        <CardContent className="space-y-4">
          {stage === "form" ? (
            <>
              <div className="space-y-2">
                <label className="text-xs font-medium text-muted-foreground">Email</label>
                <div className="relative">
                  <Input
                    type="email"
                    placeholder="your@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={loading}
                    className="bg-black/20 border-white/10 pl-10"
                    data-testid="input-signup-email"
                  />
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-primary" />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-medium text-muted-foreground">Password</label>
                <div className="relative">
                  <Input
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={loading}
                    className="bg-black/20 border-white/10 pl-10 pr-10"
                    data-testid="input-password"
                  />
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-primary" />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-primary"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                <p className="text-xs text-muted-foreground">Min 8 characters</p>
              </div>

              <Button
                onClick={handleSignup}
                disabled={loading || !email || !password}
                className="w-full bg-primary hover:bg-primary/90"
                data-testid="button-signup-submit"
              >
                {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                Send OTP
              </Button>
            </>
          ) : (
            <>
              <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-3 mb-4">
                <p className="text-xs text-green-400">Verification sent to: {email}</p>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-medium text-muted-foreground">Enter OTP Code</label>
                <Input
                  type="text"
                  placeholder="000000"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.toUpperCase().slice(0, 6))}
                  disabled={loading}
                  maxLength={6}
                  className="bg-black/20 border-white/10 text-center font-mono text-lg"
                  data-testid="input-signup-otp"
                />
              </div>

              <Button
                onClick={handleVerifyOTP}
                disabled={loading || otp.length !== 6}
                className="w-full bg-primary hover:bg-primary/90"
                data-testid="button-verify-signup"
              >
                {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CheckCircle2 className="mr-2 h-4 w-4" />}
                Verify & Create Account
              </Button>

              <Button
                onClick={() => {
                  setStage("form");
                  setOtp("");
                }}
                variant="outline"
                className="w-full border-white/10 hover:bg-white/5"
                data-testid="button-back-signup"
              >
                Back
              </Button>
            </>
          )}

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-white/10"></div>
            </div>
            <div className="relative flex justify-center text-xs">
              <span className="px-2 bg-background text-muted-foreground">Already have account?</span>
            </div>
          </div>

          <Button
            onClick={() => navigate("/login")}
            variant="outline"
            className="w-full border-primary/50 text-primary hover:bg-primary/10"
            data-testid="button-login"
          >
            Login
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
