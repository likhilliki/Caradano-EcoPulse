import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Upload, CheckCircle2, AlertCircle } from "lucide-react";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";

interface WalletImportProps {
  onImported?: (wallet: any) => void;
}

export function WalletImport({ onImported }: WalletImportProps) {
  const [importedWallet, setImportedWallet] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setLoading(true);
    setError(null);

    try {
      const text = await file.text();
      const wallet = JSON.parse(text);

      if (!wallet.wallet || !wallet.wallet.id) {
        throw new Error("Invalid wallet JSON format");
      }

      setImportedWallet(wallet);
      toast({
        title: "Wallet Imported",
        description: `Wallet ID: ${wallet.wallet.id.slice(0, 20)}...`,
      });

      onImported?.(wallet);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to import wallet";
      setError(msg);
      toast({
        title: "Import Failed",
        description: msg,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="glass-panel border-white/5">
      <CardHeader>
        <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
          Import Test Wallet
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {importedWallet ? (
          <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-4 space-y-2">
            <div className="flex items-center gap-2 text-green-400 font-bold">
              <CheckCircle2 className="h-4 w-4" />
              Wallet Imported
            </div>
            <p className="text-xs text-green-400/80 font-mono">{importedWallet.wallet.id}</p>
            <p className="text-xs text-green-400/60">Network: {importedWallet.wallet.networkId}</p>
          </div>
        ) : (
          <div className="border-2 border-dashed border-white/10 rounded-lg p-6 text-center hover:border-primary/50 transition-colors">
            <label className="cursor-pointer block">
              <input
                type="file"
                accept=".json"
                onChange={handleFileUpload}
                disabled={loading}
                className="hidden"
              />
              <Upload className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
              <p className="text-sm font-medium text-white mb-1">Upload Wallet JSON</p>
              <p className="text-xs text-muted-foreground">or drag and drop</p>
            </label>
          </div>
        )}

        {error && (
          <div className="text-xs text-center text-red-400 bg-red-500/10 p-3 rounded-lg flex items-center gap-2 justify-center">
            <AlertCircle className="h-4 w-4" />
            {error}
          </div>
        )}

        <p className="text-xs text-muted-foreground text-center">
          ⚠️ For testing only - use Eternl for production transactions
        </p>
      </CardContent>
    </Card>
  );
}
