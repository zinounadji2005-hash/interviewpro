import { Button } from "@/components/ui/button";
import { ArrowRight, Play } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect } from "react";

const rotatingTexts = [
  "with AI-powered practice",
  "with real feedback",
  "with measurable improvement",
  "with structured scoring",
];

function AnimatedText() {
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % rotatingTexts.length);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-[1.5em] relative">
      <AnimatePresence mode="wait">
        <motion.span
          key={currentIndex}
          initial={{ y: 40, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -40, opacity: 0 }}
          transition={{ duration: 0.5, ease: "easeInOut" }}
          className="block bg-gradient-to-r from-cyan-400 via-blue-400 to-purple-500 bg-clip-text text-transparent"
        >
          {rotatingTexts[currentIndex]}
        </motion.span>
      </AnimatePresence>
    </div>
  );
}

function FloatingOrbs() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      <motion.div
        className="absolute top-20 left-[10%] w-72 h-72 rounded-full bg-gradient-to-r from-blue-600/20 to-purple-600/20 blur-3xl"
        animate={{
          x: [0, 30, 0],
          y: [0, -20, 0],
          scale: [1, 1.1, 1],
        }}
        transition={{
          duration: 8,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />
      <motion.div
        className="absolute bottom-40 right-[15%] w-96 h-96 rounded-full bg-gradient-to-r from-purple-600/15 to-pink-600/15 blur-3xl"
        animate={{
          x: [0, -40, 0],
          y: [0, 30, 0],
          scale: [1, 1.2, 1],
        }}
        transition={{
          duration: 10,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />
      <motion.div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-gradient-to-r from-cyan-600/10 to-blue-600/10 blur-3xl"
        animate={{
          scale: [1, 1.15, 1],
          opacity: [0.3, 0.5, 0.3],
        }}
        transition={{
          duration: 6,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />
    </div>
  );
}

function GridPattern() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-[0.03]">
      <div 
        className="absolute inset-0"
        style={{
          backgroundImage: `linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px),
                            linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)`,
          backgroundSize: '60px 60px',
        }}
      />
    </div>
  );
}

export function HeroSection() {
  return (
    <section className="relative min-h-[90vh] flex items-center overflow-hidden bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950">
      <FloatingOrbs />
      <GridPattern />
      
      <div className="container relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-20">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          <motion.div 
            className="space-y-8"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
          >
            <motion.div 
              className="inline-flex items-center gap-2 rounded-full border border-cyan-500/30 bg-cyan-500/10 px-4 py-2 text-sm font-medium text-cyan-400 backdrop-blur-sm"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2 }}
            >
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-cyan-400"></span>
              </span>
              AI-Powered Interview Preparation
            </motion.div>
            
            <div className="space-y-4">
              <motion.h1 
                className="font-heading text-4xl font-bold tracking-tight text-white sm:text-5xl lg:text-6xl xl:text-7xl"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3, duration: 0.8 }}
              >
                Ace your next interview
              </motion.h1>
              <motion.div
                className="font-heading text-2xl font-bold sm:text-3xl lg:text-4xl xl:text-5xl"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5, duration: 0.8 }}
              >
                <AnimatedText />
              </motion.div>
            </div>
            
            <motion.p 
              className="text-lg text-slate-400 leading-relaxed max-w-xl"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.7 }}
            >
              Get personalized CV optimization, practice with realistic AI-powered mock interviews, 
              receive structured feedback with detailed scoring, and track your improvement over time.
            </motion.p>
            
            <motion.div 
              className="flex flex-col sm:flex-row gap-4"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.9 }}
            >
              <Button 
                size="lg" 
                className="gap-2 bg-gradient-to-r from-cyan-500 to-blue-600 text-white border-0 shadow-lg shadow-cyan-500/25" 
                asChild 
                data-testid="button-get-started"
              >
                <a href="/signup">
                  Start Practicing Free
                  <ArrowRight className="h-4 w-4" />
                </a>
              </Button>
              <Button 
                size="lg" 
                variant="outline" 
                className="gap-2 border-slate-700 text-slate-300 backdrop-blur-sm"
                asChild 
                data-testid="button-learn-more"
              >
                <a href="#how-it-works">
                  <Play className="h-4 w-4" />
                  See How It Works
                </a>
              </Button>
            </motion.div>
            
            <motion.div 
              className="flex flex-wrap gap-8 pt-4"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1.1 }}
            >
              {[
                { value: "10,000+", label: "Interviews Completed", id: "interviews" },
                { value: "87%", label: "Success Rate", id: "success" },
                { value: "4.9/5", label: "User Rating", id: "rating" },
              ].map((stat) => (
                <div key={stat.label} className="text-center" data-testid={`stat-${stat.id}`}>
                  <div className="text-2xl font-bold text-white" data-testid={`stat-value-${stat.id}`}>{stat.value}</div>
                  <div className="text-xs text-slate-500">{stat.label}</div>
                </div>
              ))}
            </motion.div>
          </motion.div>
          
          <motion.div 
            className="relative hidden lg:block"
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.5, duration: 0.8 }}
          >
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/20 to-purple-500/20 rounded-3xl blur-2xl" />
              <div className="relative rounded-2xl bg-slate-900/80 border border-slate-700/50 p-8 shadow-2xl backdrop-blur-xl">
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-slate-400">Your Interview Score</p>
                      <p className="text-4xl font-bold text-white mt-1">87<span className="text-2xl text-slate-500">/100</span></p>
                    </div>
                    <div className="px-3 py-1.5 rounded-full bg-emerald-500/20 text-emerald-400 text-sm font-medium">
                      +15% from last
                    </div>
                  </div>
                  
                  <div className="h-3 rounded-full bg-slate-800 overflow-hidden">
                    <motion.div 
                      className="h-full rounded-full bg-gradient-to-r from-cyan-500 to-blue-500"
                      initial={{ width: 0 }}
                      animate={{ width: "87%" }}
                      transition={{ delay: 1, duration: 1.5, ease: "easeOut" }}
                    />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    {[
                      { label: "Communication", score: 92, color: "from-cyan-500 to-cyan-400" },
                      { label: "Confidence", score: 85, color: "from-blue-500 to-blue-400" },
                      { label: "Relevance", score: 88, color: "from-purple-500 to-purple-400" },
                      { label: "Structure", score: 83, color: "from-pink-500 to-pink-400" },
                    ].map((item, index) => (
                      <motion.div 
                        key={item.label}
                        className="rounded-xl bg-slate-800/50 border border-slate-700/50 p-4"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 1.2 + index * 0.1 }}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xs text-slate-400">{item.label}</span>
                          <span className="text-lg font-bold text-white">{item.score}%</span>
                        </div>
                        <div className="h-1.5 rounded-full bg-slate-700 overflow-hidden">
                          <motion.div 
                            className={`h-full rounded-full bg-gradient-to-r ${item.color}`}
                            initial={{ width: 0 }}
                            animate={{ width: `${item.score}%` }}
                            transition={{ delay: 1.4 + index * 0.1, duration: 0.8 }}
                          />
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
      
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-slate-950 to-transparent pointer-events-none" />
    </section>
  );
}
