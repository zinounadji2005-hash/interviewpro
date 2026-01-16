import { motion, useInView, animate } from "framer-motion";
import { useRef, useEffect, useState } from "react";
import { Users } from "lucide-react";

function AnimatedCounter({ value }: { value: number }) {
  const [displayValue, setDisplayValue] = useState(0);
  const prevValueRef = useRef(0);

  useEffect(() => {
    const prevValue = prevValueRef.current;
    prevValueRef.current = value;

    if (value === 0) return;

    const controls = animate(prevValue, value, {
      duration: 1.5,
      ease: "easeOut",
      onUpdate: (v) => setDisplayValue(Math.round(v)),
    });

    return () => controls.stop();
  }, [value]);

  return (
    <span className="tabular-nums">
      {displayValue.toLocaleString()}
    </span>
  );
}

export function SocialProofSection() {
  const [userCount, setUserCount] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isConnected, setIsConnected] = useState(false);
  const sectionRef = useRef(null);
  const isInView = useInView(sectionRef, { once: true, margin: "-100px" });

  useEffect(() => {
    async function fetchCount() {
      try {
        const response = await fetch("/api/user-count");
        if (response.ok) {
          const data = await response.json();
          setUserCount(data.count);
          setIsConnected(true);
        }
      } catch (error) {
        console.error("Failed to fetch user count:", error);
      } finally {
        setIsLoading(false);
      }
    }

    fetchCount();

    const pollInterval = setInterval(fetchCount, 30000);

    return () => {
      clearInterval(pollInterval);
    };
  }, []);

  return (
    <section 
      ref={sectionRef}
      className="py-24 lg:py-32 bg-slate-950 relative overflow-hidden"
    >
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-slate-700 to-transparent" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-cyan-500/5 rounded-full blur-3xl" />
      </div>
      
      <div className="container mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 relative">
        <motion.div 
          className="text-center"
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
          transition={{ duration: 0.8 }}
        >
          <motion.div 
            className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-cyan-500/20 to-purple-500/20 border border-cyan-500/30 mb-8"
            initial={{ scale: 0 }}
            animate={isInView ? { scale: 1 } : { scale: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <Users className="w-10 h-10 text-cyan-400" />
          </motion.div>

          <motion.div
            className="mb-6"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={isInView ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.8 }}
            transition={{ duration: 0.6, delay: 0.3 }}
          >
            {isLoading ? (
              <div className="h-24 flex items-center justify-center">
                <div className="w-8 h-8 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin" />
              </div>
            ) : (
              <div 
                className="text-6xl sm:text-7xl lg:text-8xl font-bold bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-500 bg-clip-text text-transparent"
                data-testid="text-user-count"
              >
                <AnimatedCounter value={userCount} />
              </div>
            )}
          </motion.div>

          <motion.p
            className="text-xl sm:text-2xl text-slate-300 max-w-2xl mx-auto leading-relaxed"
            initial={{ opacity: 0, y: 20 }}
            animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
            transition={{ duration: 0.6, delay: 0.5 }}
          >
            {userCount === 1 ? "user is" : "users are"} preparing for job interviews with our platform
          </motion.p>

          {isConnected && (
            <motion.div
              className="mt-8 inline-flex items-center gap-2 text-sm text-slate-500"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1 }}
            >
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
              </span>
              Live counter
            </motion.div>
          )}
        </motion.div>
      </div>
    </section>
  );
}
