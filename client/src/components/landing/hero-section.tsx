import { Button } from "@/components/ui/button";
import { ArrowRight, CheckCircle2, Sparkles } from "lucide-react";

export function HeroSection() {
  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-background to-muted/30 py-20 lg:py-32">
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 h-80 w-80 rounded-full bg-primary/5 blur-3xl" />
        <div className="absolute -bottom-40 -left-40 h-80 w-80 rounded-full bg-primary/10 blur-3xl" />
      </div>
      
      <div className="container relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          <div className="space-y-8">
            <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-4 py-1.5 text-sm font-medium text-primary">
              <Sparkles className="h-4 w-4" />
              AI-Powered Interview Preparation
            </div>
            
            <h1 className="font-serif text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">
              Ace Your Next
              <span className="block text-primary">Job Interview</span>
            </h1>
            
            <p className="text-lg text-muted-foreground leading-relaxed max-w-xl">
              Get personalized CV optimization, practice with realistic AI-powered mock interviews, 
              receive structured feedback, and track your improvement over time.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4">
              <Button size="lg" className="gap-2" asChild data-testid="button-get-started">
                <a href="/signup">
                  Get Started Free
                  <ArrowRight className="h-4 w-4" />
                </a>
              </Button>
              <Button size="lg" variant="outline" asChild data-testid="button-learn-more">
                <a href="#how-it-works">Learn How It Works</a>
              </Button>
            </div>
            
            <div className="flex flex-wrap gap-6 pt-4">
              {["No credit card required", "Free plan available", "Cancel anytime"].map((text) => (
                <div key={text} className="flex items-center gap-2 text-sm text-muted-foreground">
                  <CheckCircle2 className="h-4 w-4 text-chart-2" />
                  {text}
                </div>
              ))}
            </div>
          </div>
          
          <div className="relative hidden lg:block">
            <div className="relative rounded-2xl bg-card border border-card-border p-6 shadow-xl">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-muted-foreground">Your Interview Score</span>
                  <span className="text-2xl font-bold text-chart-2">87/100</span>
                </div>
                <div className="h-3 rounded-full bg-muted overflow-hidden">
                  <div className="h-full w-[87%] rounded-full bg-gradient-to-r from-chart-2/80 to-chart-2" />
                </div>
                <div className="grid grid-cols-2 gap-4 pt-4">
                  <div className="rounded-xl bg-background/50 p-4">
                    <p className="text-2xl font-bold">92%</p>
                    <p className="text-xs text-muted-foreground">Communication</p>
                  </div>
                  <div className="rounded-xl bg-background/50 p-4">
                    <p className="text-2xl font-bold">85%</p>
                    <p className="text-xs text-muted-foreground">Confidence</p>
                  </div>
                  <div className="rounded-xl bg-background/50 p-4">
                    <p className="text-2xl font-bold">88%</p>
                    <p className="text-xs text-muted-foreground">Relevance</p>
                  </div>
                  <div className="rounded-xl bg-background/50 p-4">
                    <p className="text-2xl font-bold">83%</p>
                    <p className="text-xs text-muted-foreground">Structure</p>
                  </div>
                </div>
              </div>
            </div>
            <div className="absolute -top-4 -right-4 rounded-xl bg-primary text-primary-foreground px-4 py-2 text-sm font-medium shadow-lg">
              +15% improvement
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
