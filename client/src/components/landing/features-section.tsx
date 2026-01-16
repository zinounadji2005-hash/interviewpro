import { Card, CardContent } from "@/components/ui/card";
import { FileText, Brain, BarChart3, Lightbulb, History, Target, Zap, Shield, Clock } from "lucide-react";
import { motion, useInView } from "framer-motion";
import { useRef } from "react";

const features = [
  {
    icon: FileText,
    title: "Smart CV Optimization",
    description: "AI analyzes your resume to strengthen achievements, improve wording, and optimize for ATS systems with side-by-side comparisons.",
    gradient: "from-cyan-500 to-blue-500",
    highlight: "ATS-Optimized",
    id: "cv-optimization",
  },
  {
    icon: Brain,
    title: "AI Mock Interviews",
    description: "Practice with realistic behavioral, technical, and HR interview questions tailored to your CV and target role.",
    gradient: "from-blue-500 to-indigo-500",
    highlight: "Role-Specific",
    id: "mock-interviews",
  },
  {
    icon: BarChart3,
    title: "Structured Scoring",
    description: "Receive detailed 0-100 scores across Communication, Confidence, Relevance, and Answer Structure dimensions.",
    gradient: "from-indigo-500 to-purple-500",
    highlight: "Data-Driven",
    id: "scoring",
  },
  {
    icon: Lightbulb,
    title: "Executive Feedback",
    description: "Get summaries with your top 3 mistakes, top 3 improvements, and one high-impact focus point after each session.",
    gradient: "from-purple-500 to-pink-500",
    highlight: "Actionable",
    id: "feedback",
  },
  {
    icon: History,
    title: "Progress Tracking",
    description: "Compare Round 1 vs Round 2 performance with visual charts. Track your improvement journey over multiple sessions.",
    gradient: "from-pink-500 to-rose-500",
    highlight: "Visual",
    id: "progress",
  },
  {
    icon: Target,
    title: "Weakness Detection",
    description: "AI identifies recurring patterns across sessions like unfocused introductions or lack of concrete examples.",
    gradient: "from-rose-500 to-orange-500",
    highlight: "Pattern Analysis",
    id: "weakness",
  },
];

const benefits = [
  { icon: Zap, text: "Instant AI Feedback" },
  { icon: Shield, text: "Private & Secure" },
  { icon: Clock, text: "Practice Anytime" },
];

function FeatureCard({ feature, index }: { feature: typeof features[0]; index: number }) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-50px" });

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 40 }}
      animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 40 }}
      transition={{ duration: 0.6, delay: index * 0.1 }}
      data-testid={`feature-card-${feature.id}`}
    >
      <Card className="group h-full bg-slate-900/50 border-slate-800 transition-all duration-300 overflow-visible">
        <CardContent className="p-6 space-y-4">
          <div className="flex items-start justify-between">
            <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${feature.gradient} p-[1px] shadow-lg group-hover:shadow-xl transition-all duration-300 group-hover:scale-105`}>
              <div className="w-full h-full rounded-2xl bg-slate-900 flex items-center justify-center">
                <feature.icon className="h-6 w-6 text-white" />
              </div>
            </div>
            <span className={`px-2.5 py-1 rounded-full bg-gradient-to-r ${feature.gradient} text-xs font-medium text-white opacity-80`}>
              {feature.highlight}
            </span>
          </div>
          <h3 className="font-semibold text-lg text-white">{feature.title}</h3>
          <p className="text-sm text-slate-400 leading-relaxed">{feature.description}</p>
        </CardContent>
      </Card>
    </motion.div>
  );
}

export function FeaturesSection() {
  const headerRef = useRef(null);
  const benefitsRef = useRef(null);
  const isHeaderInView = useInView(headerRef, { once: true, margin: "-100px" });
  const isBenefitsInView = useInView(benefitsRef, { once: true, margin: "-50px" });

  return (
    <section id="features" className="py-24 lg:py-32 bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 relative overflow-hidden">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div
          className="absolute top-40 -right-40 w-80 h-80 rounded-full bg-purple-600/10 blur-3xl"
          animate={{
            x: [0, -30, 0],
            y: [0, 20, 0],
          }}
          transition={{
            duration: 10,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
        <motion.div
          className="absolute bottom-40 -left-40 w-80 h-80 rounded-full bg-cyan-600/10 blur-3xl"
          animate={{
            x: [0, 30, 0],
            y: [0, -20, 0],
          }}
          transition={{
            duration: 12,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
      </div>
      
      <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 relative">
        <motion.div 
          ref={headerRef}
          className="text-center mb-8"
          initial={{ opacity: 0, y: 30 }}
          animate={isHeaderInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
          transition={{ duration: 0.8 }}
        >
          <div className="inline-flex items-center gap-2 rounded-full border border-cyan-500/30 bg-cyan-500/10 px-4 py-2 text-sm font-medium text-cyan-400 mb-6">
            Powerful Features
          </div>
          <h2 className="font-heading text-3xl font-bold text-white sm:text-4xl lg:text-5xl">
            Everything You Need to{" "}
            <span className="bg-gradient-to-r from-cyan-400 to-purple-500 bg-clip-text text-transparent">
              Succeed
            </span>
          </h2>
          <p className="mt-6 text-lg text-slate-400 max-w-2xl mx-auto">
            Comprehensive AI-powered tools designed to help you prepare, practice, and continuously improve
          </p>
        </motion.div>
        
        <motion.div 
          ref={benefitsRef}
          className="flex flex-wrap justify-center gap-6 mb-16"
          initial={{ opacity: 0, y: 20 }}
          animate={isBenefitsInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
          transition={{ duration: 0.6 }}
        >
          {benefits.map((benefit) => (
            <div 
              key={benefit.text}
              className="flex items-center gap-2 px-4 py-2 rounded-full bg-slate-800/50 border border-slate-700/50 text-sm text-slate-300"
            >
              <benefit.icon className="h-4 w-4 text-cyan-400" />
              {benefit.text}
            </div>
          ))}
        </motion.div>
        
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, index) => (
            <FeatureCard key={feature.title} feature={feature} index={index} />
          ))}
        </div>
      </div>
    </section>
  );
}
