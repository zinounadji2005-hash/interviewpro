export function Footer() {
  return (
    <footer className="border-t border-border bg-card/50 py-12">
      <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2">
            <img 
              src="/assets/logo.png" 
              alt="InterviewPro Logo" 
              className="h-8 w-8 rounded-lg object-cover"
            />
            <span className="font-serif font-bold text-lg">InterviewPro</span>
          </div>
          
          <nav className="flex flex-wrap gap-6 text-sm text-muted-foreground">
            <a href="#features" className="hover:text-foreground transition-colors">Features</a>
            <a href="#how-it-works" className="hover:text-foreground transition-colors">How It Works</a>
            <a href="/api/login" className="hover:text-foreground transition-colors">Sign In</a>
          </nav>
          
          <p className="text-sm text-muted-foreground">
            &copy; {new Date().getFullYear()} InterviewPro. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
