import { Navbar } from "@/components/layout/navbar";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { ArrowRight, Shield, Zap, Globe } from "lucide-react";
import heroBg from "@assets/generated_images/futuristic_eco-city_hero_background.png";

export default function Home() {
  return (
    <div className="min-h-screen bg-background text-foreground overflow-x-hidden">
      <Navbar />
      
      {/* Hero Section */}
      <section className="relative min-h-[90vh] flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 z-0">
          <img 
            src={heroBg} 
            alt="Eco City" 
            className="w-full h-full object-cover opacity-40"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-background/0 via-background/50 to-background" />
        </div>

        <div className="container mx-auto px-4 relative z-10 pt-20">
          <div className="max-w-3xl mx-auto text-center space-y-8">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-sm font-medium animate-in fade-in slide-in-from-bottom-4 duration-1000">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
              </span>
              Live on Cardano Mainnet
            </div>
            
            <h1 className="text-6xl md:text-7xl font-heading font-bold tracking-tight text-white animate-in fade-in slide-in-from-bottom-8 duration-1000 delay-200">
              Monetize Your <br/>
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-emerald-400 text-glow">
                Environmental Data
              </span>
            </h1>
            
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto animate-in fade-in slide-in-from-bottom-8 duration-1000 delay-400">
              Join the decentralized network of air quality monitors. Earn AirTokens for contributing verified data to the Masumi Agent network on Cardano.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4 animate-in fade-in slide-in-from-bottom-8 duration-1000 delay-600">
              <Link href="/dashboard">
                <Button size="lg" className="h-14 px-8 text-lg rounded-full bg-primary text-primary-foreground hover:bg-primary/90 shadow-[0_0_20px_-5px_hsl(var(--primary))] transition-all hover:scale-105" data-testid="button-launch-app">
                  Launch App
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-24 bg-background relative z-10">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-3 gap-8">
            <div className="glass-panel p-8 rounded-2xl hover:border-primary/30 transition-colors group">
              <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center mb-6 group-hover:bg-primary/20 transition-colors">
                <Globe className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-xl font-heading font-bold mb-3 text-white">Hyper-Local Data</h3>
              <p className="text-muted-foreground">
                Real-time AQI tracking powered by distributed IoT sensors and Blockfrost API oracle feeds.
              </p>
            </div>

            <div className="glass-panel p-8 rounded-2xl hover:border-primary/30 transition-colors group">
              <div className="h-12 w-12 rounded-xl bg-blue-500/10 flex items-center justify-center mb-6 group-hover:bg-blue-500/20 transition-colors">
                <Shield className="h-6 w-6 text-blue-400" />
              </div>
              <h3 className="text-xl font-heading font-bold mb-3 text-white">Masumi Verification</h3>
              <p className="text-muted-foreground">
                Data integrity guaranteed by Masumi Agents. Smart contracts validate every data point before rewards.
              </p>
            </div>

            <div className="glass-panel p-8 rounded-2xl hover:border-primary/30 transition-colors group">
              <div className="h-12 w-12 rounded-xl bg-purple-500/10 flex items-center justify-center mb-6 group-hover:bg-purple-500/20 transition-colors">
                <Zap className="h-6 w-6 text-purple-400" />
              </div>
              <h3 className="text-xl font-heading font-bold mb-3 text-white">Instant Rewards</h3>
              <p className="text-muted-foreground">
                Automatic token distribution via Aiken smart contracts directly to your Eternal wallet.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
