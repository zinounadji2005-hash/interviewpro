import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";

export function Navbar() {
  return (
    <motion.header 
      className="fixed top-0 left-0 right-0 z-50 border-b border-slate-800/50 bg-slate-950/80 backdrop-blur-xl"
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
    >
      <div className="container mx-auto max-w-7xl flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8 gap-4">
        <a href="/" className="flex items-center gap-2" data-testid="link-logo">
          <img 
            src="/assets/logo.png" 
            alt="InterviewPro Logo" 
            className="h-8 w-8 rounded-lg object-cover"
          />
          <span className="font-heading font-bold text-lg text-white">InterviewPro</span>
        </a>
        
        <nav className="hidden md:flex items-center gap-8">
          <a 
            href="#features" 
            className="text-sm text-slate-400 hover:text-white transition-colors"
            data-testid="nav-features"
          >
            Features
          </a>
          <a 
            href="#how-it-works" 
            className="text-sm text-slate-400 hover:text-white transition-colors"
            data-testid="nav-how-it-works"
          >
            How It Works
          </a>
        </nav>
        
        <div className="flex items-center gap-3">
          <Button 
            variant="ghost" 
            className="text-slate-300"
            asChild 
            data-testid="button-login"
          >
            <a href="/login">Log In</a>
          </Button>
          <Button 
            className="bg-gradient-to-r from-cyan-500 to-blue-600 text-white border-0 shadow-lg shadow-cyan-500/20"
            asChild 
            data-testid="button-signup"
          >
            <a href="/signup">Get Started</a>
          </Button>
        </div>
      </div>
    </motion.header>
  );
}
