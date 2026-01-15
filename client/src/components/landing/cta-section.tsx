import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";

export function CTASection() {
  return (
    <section className="py-20 lg:py-28 bg-primary/5">
      <div className="container mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 text-center">
        <h2 className="font-serif text-3xl font-bold sm:text-4xl mb-6">
          Ready to Ace Your Next Interview?
        </h2>
        <p className="text-lg text-muted-foreground mb-10 max-w-2xl mx-auto">
          Join thousands of job seekers who have improved their interview performance 
          and landed their dream jobs with InterviewPro.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button size="lg" className="gap-2" asChild data-testid="button-cta-start">
            <a href="/signup">
              Start Practicing Now
              <ArrowRight className="h-4 w-4" />
            </a>
          </Button>
          <Button size="lg" variant="outline" asChild data-testid="button-cta-features">
            <a href="#features">Explore Features</a>
          </Button>
        </div>
      </div>
    </section>
  );
}
