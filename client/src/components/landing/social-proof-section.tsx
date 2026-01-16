import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import { Quote, Star } from "lucide-react";

const testimonials = [
  {
    quote: "The AI feedback was incredibly detailed. It pointed out specific areas I needed to improve that I never would have noticed on my own.",
    author: "Sarah M.",
    role: "Software Engineer",
    company: "Landed at Tech Startup",
    rating: 5,
    id: "sarah",
  },
  {
    quote: "I went from failing interviews to getting multiple offers. The structured scoring helped me track my progress objectively.",
    author: "James K.",
    role: "Product Manager",
    company: "Landed at Fortune 500",
    rating: 5,
    id: "james",
  },
  {
    quote: "The mock interviews felt incredibly realistic. The adaptive questions challenged me in ways that prepared me for the real thing.",
    author: "Maria L.",
    role: "Data Scientist",
    company: "Landed at FAANG",
    rating: 5,
    id: "maria",
  },
];

const stats = [
  { value: "93%", label: "Interview Success Rate", id: "success-rate" },
  { value: "2.5x", label: "Faster Improvement", id: "improvement" },
  { value: "50K+", label: "Practice Sessions", id: "sessions" },
  { value: "4.9", label: "Average Rating", id: "avg-rating" },
];

function TestimonialCard({ testimonial, index }: { testimonial: typeof testimonials[0]; index: number }) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-50px" });

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 40 }}
      animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 40 }}
      transition={{ duration: 0.6, delay: index * 0.15 }}
      className="relative group"
      data-testid={`testimonial-card-${testimonial.id}`}
    >
      <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/10 to-purple-500/10 rounded-2xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
      <div className="relative h-full bg-slate-900/50 border border-slate-800 rounded-2xl p-6 transition-all duration-300">
        <Quote className="h-8 w-8 text-cyan-500/30 mb-4" />
        <p className="text-slate-300 leading-relaxed mb-6">"{testimonial.quote}"</p>
        <div className="flex items-center gap-1 mb-4">
          {Array.from({ length: testimonial.rating }).map((_, i) => (
            <Star key={i} className="h-4 w-4 fill-yellow-400 text-yellow-400" />
          ))}
        </div>
        <div>
          <p className="font-semibold text-white">{testimonial.author}</p>
          <p className="text-sm text-slate-400">{testimonial.role}</p>
          <p className="text-xs text-cyan-400 mt-1">{testimonial.company}</p>
        </div>
      </div>
    </motion.div>
  );
}

export function SocialProofSection() {
  const headerRef = useRef(null);
  const statsRef = useRef(null);
  const isHeaderInView = useInView(headerRef, { once: true, margin: "-100px" });
  const isStatsInView = useInView(statsRef, { once: true, margin: "-50px" });

  return (
    <section className="py-24 lg:py-32 bg-slate-950 relative overflow-hidden">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-slate-700 to-transparent" />
      </div>
      
      <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 relative">
        <motion.div 
          ref={headerRef}
          className="text-center mb-16"
          initial={{ opacity: 0, y: 30 }}
          animate={isHeaderInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
          transition={{ duration: 0.8 }}
        >
          <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-4 py-2 text-sm font-medium text-emerald-400 mb-6">
            Trusted Results
          </div>
          <h2 className="font-heading text-3xl font-bold text-white sm:text-4xl lg:text-5xl">
            Real People,{" "}
            <span className="bg-gradient-to-r from-cyan-400 to-purple-500 bg-clip-text text-transparent">
              Real Results
            </span>
          </h2>
          <p className="mt-6 text-lg text-slate-400 max-w-2xl mx-auto">
            Join thousands of job seekers who have transformed their interview performance
          </p>
        </motion.div>
        
        <motion.div 
          ref={statsRef}
          className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-16"
          initial={{ opacity: 0, y: 20 }}
          animate={isStatsInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
          transition={{ duration: 0.6 }}
        >
          {stats.map((stat, index) => (
            <motion.div
              key={stat.label}
              className="text-center p-6 rounded-2xl bg-slate-900/50 border border-slate-800"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={isStatsInView ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.9 }}
              transition={{ delay: index * 0.1, duration: 0.5 }}
              data-testid={`social-stat-${stat.id}`}
            >
              <div className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-cyan-400 to-purple-500 bg-clip-text text-transparent" data-testid={`social-stat-value-${stat.id}`}>
                {stat.value}
              </div>
              <div className="text-sm text-slate-400 mt-2">{stat.label}</div>
            </motion.div>
          ))}
        </motion.div>
        
        <div className="grid md:grid-cols-3 gap-6">
          {testimonials.map((testimonial, index) => (
            <TestimonialCard key={testimonial.author} testimonial={testimonial} index={index} />
          ))}
        </div>
      </div>
    </section>
  );
}
