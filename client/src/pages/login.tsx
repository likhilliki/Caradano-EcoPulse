import { useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Mail, Lock, CheckCircle2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function Login() {
  const [, navigate] = useLocation();
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [stage, setStage] = useState<"email" | "otp">("email");
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleSendOTP = async () => {
    if (!email) {
      toast({ title: "Error", description: "Please enter email", variant: "destructive" });
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message);
      }

      const data = await res.json();
      console.log("[TEST] OTP:", data.otp);
      setStage("otp");
      toast({ title: "Success", description: "OTP sent to your email" });
    } catch (err) {
      toast({
        title: "Error",
        description: err instanceof Error ? err.message : "Failed to send OTP",
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
      const res = await fetch("/api/auth/verify-login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, code: otp }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message);
      }

      const data = await res.json();
      localStorage.setItem("authToken", data.token);
      toast({ title: "Success", description: "Logged in successfully!" });
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
          <CardTitle className="text-2xl font-heading">Login</CardTitle>
          <p className="text-sm text-muted-foreground mt-2">OTP-based authentication</p>
        </CardHeader>
        <CardContent className="space-y-4">
          {stage === "email" ? (
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
                    data-testid="input-login-email"
                  />
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-primary" />
                </div>
              </div>
              <Button
                onClick={handleSendOTP}
                disabled={loading || !email}
                className="w-full bg-primary hover:bg-primary/90"
                data-testid="button-send-otp"
              >
                {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                Send OTP
              </Button>
            </>
          ) : (
            <>
              <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-3 mb-4">
                <p className="text-xs text-green-400">Email: {email}</p>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-medium text-muted-foreground">OTP Code</label>
                <Input
                  type="text"
                  placeholder="000000"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.toUpperCase().slice(0, 6))}
                  disabled={loading}
                  maxLength={6}
                  className="bg-black/20 border-white/10 text-center font-mono text-lg"
                  data-testid="input-otp"
                />
              </div>
              <Button
                onClick={handleVerifyOTP}
                disabled={loading || otp.length !== 6}
                className="w-full bg-primary hover:bg-primary/90"
                data-testid="button-verify-otp"
              >
                {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CheckCircle2 className="mr-2 h-4 w-4" />}
                Verify & Login
              </Button>
              <Button
                onClick={() => {
                  setStage("email");
                  setOtp("");
                }}
                variant="outline"
                className="w-full border-white/10 hover:bg-white/5"
                data-testid="button-back"
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
              <span className="px-2 bg-background text-muted-foreground">Don't have account?</span>
            </div>
          </div>

          <Button
            onClick={() => navigate("/signup")}
            variant="outline"
            className="w-full border-primary/50 text-primary hover:bg-primary/10"
            data-testid="button-signup"
          >
            Create Account
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
