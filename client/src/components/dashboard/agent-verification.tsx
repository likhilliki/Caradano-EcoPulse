import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CheckCircle2, AlertCircle, Zap, TrendingUp } from "lucide-react";
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";

export function AgentVerification() {
  const [stats, setStats] = useState<any>(null);
  const [verifications, setVerifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchAgentData();
  }, []);

  const fetchAgentData = async () => {
    try {
      const token = localStorage.getItem("authToken");
      if (!token) return;

      // Fetch stats
      const statsRes = await fetch("/api/agent/stats", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const statsData = await statsRes.json();
      setStats(statsData);

      // Fetch verifications
      const verifRes = await fetch("/api/agent/verifications", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const verifData = await verifRes.json();
      setVerifications(verifData.verifications || []);

      setLoading(false);
    } catch (error) {
      console.error("Failed to fetch agent data:", error);
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Card className="glass-panel border-white/5">
        <CardContent className="p-8 text-center text-muted-foreground">
          Loading Masumi Agent stats...
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Agent Stats Grid */}
      <div className="grid md:grid-cols-4 gap-4">
        {/* Total Submissions */}
        <Card className="glass-panel border-white/5">
          <CardContent className="p-4">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs text-muted-foreground uppercase mb-1">Submissions</p>
                <p className="text-2xl font-bold text-white">{stats?.totalSubmissions || 0}</p>
              </div>
              <AlertCircle className="h-5 w-5 text-primary/50" />
            </div>
          </CardContent>
        </Card>

        {/* Verified Submissions */}
        <Card className="glass-panel border-white/5">
          <CardContent className="p-4">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs text-muted-foreground uppercase mb-1">Verified</p>
                <p className="text-2xl font-bold text-green-400">{stats?.verifiedSubmissions || 0}</p>
              </div>
              <CheckCircle2 className="h-5 w-5 text-green-400/50" />
            </div>
          </CardContent>
        </Card>

        {/* Total Tokens */}
        <Card className="glass-panel border-white/5">
          <CardContent className="p-4">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs text-muted-foreground uppercase mb-1">Tokens Earned</p>
                <p className="text-2xl font-bold text-blue-400">{stats?.totalTokensAwarded || 0}</p>
              </div>
              <Zap className="h-5 w-5 text-blue-400/50" />
            </div>
          </CardContent>
        </Card>

        {/* Verification Score */}
        <Card className="glass-panel border-white/5">
          <CardContent className="p-4">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs text-muted-foreground uppercase mb-1">Avg Score</p>
                <p className="text-2xl font-bold text-primary">{stats?.averageVerificationScore || 0}/100</p>
              </div>
              <TrendingUp className="h-5 w-5 text-primary/50" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Verification History */}
      <Card className="glass-panel border-white/5">
        <CardHeader>
          <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
            Masumi Agent Verification History
          </CardTitle>
        </CardHeader>
        <CardContent>
          {verifications.length === 0 ? (
            <p className="text-xs text-muted-foreground text-center py-8">
              No verifications yet. Submit AQI data to get started!
            </p>
          ) : (
            <div className="space-y-2 max-h-[300px] overflow-y-auto">
              {verifications.map((v) => (
                <div key={v.id} className="bg-black/20 rounded-lg p-3 flex items-start justify-between border border-white/5">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <Badge
                        variant={v.status === "verified" ? "default" : "secondary"}
                        className="text-xs"
                      >
                        {v.status === "verified" ? "✓ Verified" : "Pending"}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        {v.verifiedAt ? new Date(v.verifiedAt).toLocaleDateString() : "Processing..."}
                      </span>
                    </div>
                    <p className="text-sm font-mono text-primary">+{v.tokensAwarded} ECO tokens</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-bold text-white">{v.verificationScore || 0}%</p>
                    <p className="text-xs text-muted-foreground">Score</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Info Box */}
      <div className="bg-primary/5 border border-primary/20 rounded-lg p-4">
        <p className="text-xs text-primary">
          <strong>🤖 Masumi Agent Active:</strong> Autonomously verifies AQI submissions, validates data quality, and distributes tokens automatically. Base reward: 10 ECO tokens per submission. Bonuses for clean air data (+5) and moderate conditions (+3).
        </p>
      </div>
    </div>
  );
}
