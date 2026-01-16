import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/components/theme-provider";
import { useAuth } from "@/hooks/use-auth";
import Landing from "@/pages/landing";
import Login from "@/pages/auth/login";
import Signup from "@/pages/auth/signup";
import Dashboard from "@/pages/dashboard/index";
import CVManager from "@/pages/dashboard/cv";
import Interview from "@/pages/dashboard/interview";
import InterviewSession from "@/pages/dashboard/interview-session";
import Evaluation from "@/pages/dashboard/evaluation";
import Progress from "@/pages/dashboard/progress";
import History from "@/pages/dashboard/history";
import Logout from "@/pages/logout";
import NotFound from "@/pages/not-found";

function AuthenticatedRoutes() {
  return (
    <Switch>
      <Route path="/dashboard" component={Dashboard} />
      <Route path="/dashboard/cv" component={CVManager} />
      <Route path="/dashboard/interview" component={Interview} />
      <Route path="/dashboard/interview/:id" component={InterviewSession} />
      <Route path="/dashboard/evaluation/:id" component={Evaluation} />
      <Route path="/dashboard/progress" component={Progress} />
      <Route path="/dashboard/history" component={History} />
      <Route component={NotFound} />
    </Switch>
  );
}

function Router() {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse flex flex-col items-center gap-4">
          <div className="h-12 w-12 rounded-xl bg-primary/20" />
          <div className="h-4 w-32 rounded bg-muted" />
        </div>
      </div>
    );
  }

  return (
    <Switch>
      <Route path="/">
        {user ? <Dashboard /> : <Landing />}
      </Route>
      <Route path="/login" component={Login} />
      <Route path="/signup" component={Signup} />
      <Route path="/logout" component={Logout} />
      {user ? (
        <AuthenticatedRoutes />
      ) : (
        <Route path="/dashboard/:rest*">
          <Login />
        </Route>
      )}
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider defaultTheme="system">
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
