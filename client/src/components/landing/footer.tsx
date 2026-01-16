import { motion, useInView } from "framer-motion";
import { useRef } from "react";

export function Footer() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-50px" });

  return (
    <motion.footer 
      ref={ref}
      className="border-t border-slate-800 bg-slate-950 py-12"
      initial={{ opacity: 0 }}
      animate={isInView ? { opacity: 1 } : { opacity: 0 }}
      transition={{ duration: 0.6 }}
    >
      <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2">
            <img 
              src="/assets/logo.png" 
              alt="InterviewPro Logo" 
              className="h-8 w-8 rounded-lg object-cover"
            />
            <span className="font-heading font-bold text-lg text-white">InterviewPro</span>
          </div>
          
          <nav className="flex flex-wrap items-center justify-center gap-6 text-sm text-slate-400">
            <a href="#features" className="hover:text-white transition-colors">Features</a>
            <a href="#how-it-works" className="hover:text-white transition-colors">How It Works</a>
            <a href="/login" className="hover:text-white transition-colors">Log In</a>
            <a href="/signup" className="hover:text-white transition-colors">Sign Up</a>
          </nav>
          
          <p className="text-sm text-slate-500">
            {new Date().getFullYear()} InterviewPro. All rights reserved.
          </p>
        </div>
      </div>
    </motion.footer>
  );
}
