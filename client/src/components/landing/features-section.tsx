import { Card, CardContent } from "@/components/ui/card";
import { FileText, Brain, BarChart3, Lightbulb, History, Target } from "lucide-react";

const features = [
  {
    icon: FileText,
    title: "CV Optimization",
    description: "AI analyzes your resume to strengthen achievements, improve wording, and optimize for ATS systems. See side-by-side comparisons with detailed explanations.",
    color: "text-chart-1",
    bgColor: "bg-chart-1/10",
  },
  {
    icon: Brain,
    title: "AI Mock Interviews",
    description: "Practice with realistic behavioral, technical, and HR interview questions tailored to your CV and target role. Get model answers with explanations.",
    color: "text-chart-2",
    bgColor: "bg-chart-2/10",
  },
  {
    icon: BarChart3,
    title: "Structured Scoring",
    description: "Receive detailed scores (0-100) across Communication, Confidence, Relevance, and Answer Structure. Track exactly where you excel and need work.",
    color: "text-chart-3",
    bgColor: "bg-chart-3/10",
  },
  {
    icon: Lightbulb,
    title: "Actionable Feedback",
    description: "Get executive summaries with your top 3 mistakes, top 3 improvements, and one high-impact focus point after each interview session.",
    color: "text-chart-4",
    bgColor: "bg-chart-4/10",
  },
  {
    icon: History,
    title: "Progress Tracking",
    description: "Compare Round 1 vs Round 2 performance with visual charts. See improvement highlighted and track your journey over multiple sessions.",
    color: "text-chart-5",
    bgColor: "bg-chart-5/10",
  },
  {
    icon: Target,
    title: "Weakness Detection",
    description: "AI identifies recurring patterns across sessions like unfocused introductions or lack of concrete examples, with specific improvement suggestions.",
    color: "text-primary",
    bgColor: "bg-primary/10",
  },
];

export function FeaturesSection() {
  return (
    <section id="features" className="py-20 lg:py-28">
      <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="font-serif text-3xl font-bold sm:text-4xl">Everything You Need to Succeed</h2>
          <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto">
            Comprehensive tools designed to help you prepare, practice, and improve
          </p>
        </div>
        
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature) => (
            <Card key={feature.title} className="group hover-elevate border-card-border">
              <CardContent className="p-6 space-y-4">
                <div className={`w-12 h-12 rounded-xl ${feature.bgColor} flex items-center justify-center`}>
                  <feature.icon className={`h-6 w-6 ${feature.color}`} />
                </div>
                <h3 className="font-semibold text-lg">{feature.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{feature.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
