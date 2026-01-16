import { Upload, Target, FileCheck, MessageSquare, TrendingUp, Award } from "lucide-react";
import { motion } from "framer-motion";
import { useInView } from "framer-motion";
import { useRef } from "react";

const steps = [
  {
    icon: Upload,
    title: "Upload CV",
    description: "Upload your resume in PDF or DOCX format for AI analysis",
    gradient: "from-cyan-500 to-blue-500",
    id: "upload",
  },
  {
    icon: Target,
    title: "Target Role",
    description: "Select your target job role or paste a job description",
    gradient: "from-blue-500 to-indigo-500",
    id: "target",
  },
  {
    icon: FileCheck,
    title: "Optimize CV",
    description: "Get AI-powered suggestions to strengthen your resume",
    gradient: "from-indigo-500 to-purple-500",
    id: "optimize",
  },
  {
    icon: MessageSquare,
    title: "Mock Interview",
    description: "Practice with realistic behavioral and technical questions",
    gradient: "from-purple-500 to-pink-500",
    id: "interview",
  },
  {
    icon: TrendingUp,
    title: "Get Feedback",
    description: "Receive detailed scores and actionable improvement tips",
    gradient: "from-pink-500 to-rose-500",
    id: "feedback",
  },
  {
    icon: Award,
    title: "Track Progress",
    description: "Compare sessions and see your improvement over time",
    gradient: "from-rose-500 to-orange-500",
    id: "progress",
  },
];

function StepCard({ step, index }: { step: typeof steps[0]; index: number }) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <motion.div
      ref={ref}
      className="relative group"
      initial={{ opacity: 0, y: 50 }}
      animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 50 }}
      transition={{ duration: 0.6, delay: index * 0.1 }}
      data-testid={`step-card-${step.id}`}
    >
      <div className="flex flex-col items-center text-center">
        <div className="relative mb-6">
          <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/20 to-purple-500/20 rounded-2xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
          <div className={`relative w-20 h-20 rounded-2xl bg-gradient-to-br ${step.gradient} p-[1px] shadow-lg group-hover:shadow-xl transition-all duration-300 group-hover:scale-105`}>
            <div className="w-full h-full rounded-2xl bg-slate-900 flex items-center justify-center">
              <step.icon className="h-8 w-8 text-white" />
            </div>
          </div>
          <div className={`absolute -top-2 -right-2 w-8 h-8 rounded-full bg-gradient-to-br ${step.gradient} text-white text-sm font-bold flex items-center justify-center shadow-lg`}>
            {index + 1}
          </div>
        </div>
        <h3 className="font-semibold text-lg text-white mb-2">{step.title}</h3>
        <p className="text-sm text-slate-400 leading-relaxed max-w-[200px]">{step.description}</p>
      </div>
      
      {index < steps.length - 1 && (
        <div className="hidden lg:block absolute top-10 left-full w-full">
          <motion.div 
            className="h-[2px] bg-gradient-to-r from-slate-700 to-slate-800 w-[calc(100%-40px)] mx-auto"
            initial={{ scaleX: 0 }}
            animate={isInView ? { scaleX: 1 } : { scaleX: 0 }}
            transition={{ duration: 0.8, delay: index * 0.1 + 0.3 }}
            style={{ originX: 0 }}
          />
        </div>
      )}
    </motion.div>
  );
}

export function ProcessSection() {
  const headerRef = useRef(null);
  const isHeaderInView = useInView(headerRef, { once: true, margin: "-100px" });

  return (
    <section id="how-it-works" className="py-24 lg:py-32 bg-slate-950 relative overflow-hidden">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-slate-700 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-slate-700 to-transparent" />
      </div>
      
      <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 relative">
        <motion.div 
          ref={headerRef}
          className="text-center mb-20"
          initial={{ opacity: 0, y: 30 }}
          animate={isHeaderInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
          transition={{ duration: 0.8 }}
        >
          <div className="inline-flex items-center gap-2 rounded-full border border-purple-500/30 bg-purple-500/10 px-4 py-2 text-sm font-medium text-purple-400 mb-6">
            Simple Process
          </div>
          <h2 className="font-heading text-3xl font-bold text-white sm:text-4xl lg:text-5xl">
            From CV to{" "}
            <span className="bg-gradient-to-r from-cyan-400 to-purple-500 bg-clip-text text-transparent">
              Dream Job
            </span>
          </h2>
          <p className="mt-6 text-lg text-slate-400 max-w-2xl mx-auto">
            A proven 6-step process to transform your interview performance and land the job you deserve
          </p>
        </motion.div>
        
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-8 lg:gap-4">
          {steps.map((step, index) => (
            <StepCard key={step.title} step={step} index={index} />
          ))}
        </div>
      </div>
    </section>
  );
}
