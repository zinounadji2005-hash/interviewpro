import { Upload, Target, FileCheck, MessageSquare, TrendingUp, Award } from "lucide-react";

const steps = [
  {
    icon: Upload,
    title: "Upload CV",
    description: "Upload your resume in PDF or DOCX format",
  },
  {
    icon: Target,
    title: "Target Role",
    description: "Select your target job role or paste a job description",
  },
  {
    icon: FileCheck,
    title: "Optimize CV",
    description: "Get AI-powered suggestions to improve your CV",
  },
  {
    icon: MessageSquare,
    title: "Mock Interview",
    description: "Practice with realistic interview questions",
  },
  {
    icon: TrendingUp,
    title: "Get Feedback",
    description: "Receive detailed scores and improvement tips",
  },
  {
    icon: Award,
    title: "Track Progress",
    description: "Compare rounds and see your improvement",
  },
];

export function ProcessSection() {
  return (
    <section id="how-it-works" className="py-20 lg:py-28 bg-muted/30">
      <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="font-serif text-3xl font-bold sm:text-4xl">How It Works</h2>
          <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto">
            A simple 6-step process to transform your interview performance
          </p>
        </div>
        
        <div className="relative">
          <div className="absolute top-24 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-border to-transparent hidden lg:block" />
          
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-8">
            {steps.map((step, index) => (
              <div key={step.title} className="relative group">
                <div className="flex flex-col items-center text-center">
                  <div className="relative mb-4">
                    <div className="w-16 h-16 rounded-2xl bg-card border border-card-border flex items-center justify-center shadow-md group-hover:shadow-lg group-hover:border-primary/30 transition-all">
                      <step.icon className="h-7 w-7 text-primary" />
                    </div>
                    <div className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs font-bold flex items-center justify-center">
                      {index + 1}
                    </div>
                  </div>
                  <h3 className="font-semibold text-sm mb-1">{step.title}</h3>
                  <p className="text-xs text-muted-foreground leading-relaxed">{step.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
