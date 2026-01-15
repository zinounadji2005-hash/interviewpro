import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { DashboardLayout } from "@/components/dashboard/dashboard-layout";
import { useAuth } from "@/hooks/use-auth";
import { 
  FileText, 
  MessageSquare, 
  TrendingUp, 
  ArrowRight, 
  Clock,
  CheckCircle2,
  AlertCircle
} from "lucide-react";
import type { CV, InterviewSession, Evaluation } from "@shared/schema";

interface DashboardData {
  cvs: CV[];
  sessions: InterviewSession[];
  latestEvaluation: Evaluation | null;
}

export default function Dashboard() {
  const { user } = useAuth();
  
  const { data, isLoading } = useQuery<DashboardData>({
    queryKey: ["/api/dashboard"],
  });

  const hasCv = data?.cvs && data.cvs.length > 0;
  const hasCompletedInterview = data?.sessions?.some(s => s.status === "completed");
  const latestScore = data?.latestEvaluation?.overallScore;

  return (
    <DashboardLayout title="Dashboard">
      <div className="p-6 max-w-7xl mx-auto space-y-8">
        <div className="space-y-2">
          <h2 className="font-serif text-2xl font-bold">
            Welcome back{user?.firstName ? `, ${user.firstName}` : ""}!
          </h2>
          <p className="text-muted-foreground">
            Track your interview preparation progress and continue where you left off.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          <Card className="border-card-border">
            <CardHeader className="flex flex-row items-center justify-between gap-2 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">CV Status</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton className="h-8 w-24" />
              ) : hasCv ? (
                <div className="space-y-1">
                  <p className="text-2xl font-bold text-chart-2 flex items-center gap-2">
                    <CheckCircle2 className="h-5 w-5" />
                    Uploaded
                  </p>
                  <p className="text-xs text-muted-foreground">Ready for optimization</p>
                </div>
              ) : (
                <div className="space-y-1">
                  <p className="text-2xl font-bold text-muted-foreground flex items-center gap-2">
                    <AlertCircle className="h-5 w-5" />
                    Not uploaded
                  </p>
                  <p className="text-xs text-muted-foreground">Upload to get started</p>
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="border-card-border">
            <CardHeader className="flex flex-row items-center justify-between gap-2 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Interviews</CardTitle>
              <MessageSquare className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton className="h-8 w-24" />
              ) : (
                <div className="space-y-1">
                  <p className="text-2xl font-bold">{data?.sessions?.length || 0}</p>
                  <p className="text-xs text-muted-foreground">
                    {hasCompletedInterview ? "Sessions completed" : "No sessions yet"}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="border-card-border">
            <CardHeader className="flex flex-row items-center justify-between gap-2 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Latest Score</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton className="h-8 w-24" />
              ) : latestScore ? (
                <div className="space-y-2">
                  <p className="text-2xl font-bold">{latestScore}/100</p>
                  <Progress value={latestScore} className="h-2" />
                </div>
              ) : (
                <div className="space-y-1">
                  <p className="text-2xl font-bold text-muted-foreground">--</p>
                  <p className="text-xs text-muted-foreground">Complete an interview</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <Card className="border-card-border">
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <Link href="/dashboard/cv">
                <div className="group rounded-xl border border-border bg-card p-6 hover-elevate cursor-pointer">
                  <div className="flex items-start justify-between mb-4">
                    <div className="p-3 rounded-lg bg-chart-1/10">
                      <FileText className="h-6 w-6 text-chart-1" />
                    </div>
                    <ArrowRight className="h-5 w-5 text-muted-foreground group-hover:text-foreground transition-colors" />
                  </div>
                  <h3 className="font-semibold mb-1">{hasCv ? "Manage CV" : "Upload CV"}</h3>
                  <p className="text-sm text-muted-foreground">
                    {hasCv ? "View optimized CV and improvements" : "Upload your resume to get started"}
                  </p>
                </div>
              </Link>

              <Link href="/dashboard/interview">
                <div className="group rounded-xl border border-border bg-card p-6 hover-elevate cursor-pointer">
                  <div className="flex items-start justify-between mb-4">
                    <div className="p-3 rounded-lg bg-chart-2/10">
                      <MessageSquare className="h-6 w-6 text-chart-2" />
                    </div>
                    <ArrowRight className="h-5 w-5 text-muted-foreground group-hover:text-foreground transition-colors" />
                  </div>
                  <h3 className="font-semibold mb-1">Start Interview</h3>
                  <p className="text-sm text-muted-foreground">
                    Practice with AI-powered mock interviews
                  </p>
                </div>
              </Link>

              <Link href="/dashboard/progress">
                <div className="group rounded-xl border border-border bg-card p-6 hover-elevate cursor-pointer">
                  <div className="flex items-start justify-between mb-4">
                    <div className="p-3 rounded-lg bg-chart-3/10">
                      <TrendingUp className="h-6 w-6 text-chart-3" />
                    </div>
                    <ArrowRight className="h-5 w-5 text-muted-foreground group-hover:text-foreground transition-colors" />
                  </div>
                  <h3 className="font-semibold mb-1">View Progress</h3>
                  <p className="text-sm text-muted-foreground">
                    Track improvement across sessions
                  </p>
                </div>
              </Link>
            </div>
          </CardContent>
        </Card>

        {data?.sessions && data.sessions.length > 0 && (
          <Card className="border-card-border">
            <CardHeader className="flex flex-row items-center justify-between gap-2">
              <CardTitle>Recent Activity</CardTitle>
              <Link href="/dashboard/history">
                <Button variant="ghost" size="sm" className="gap-1" data-testid="link-view-all-history">
                  View All <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {data.sessions.slice(0, 3).map((session) => (
                  <div 
                    key={session.id} 
                    className="flex items-center justify-between p-4 rounded-lg bg-muted/50"
                  >
                    <div className="flex items-center gap-4">
                      <div className="p-2 rounded-lg bg-background">
                        <MessageSquare className="h-4 w-4 text-muted-foreground" />
                      </div>
                      <div>
                        <p className="font-medium text-sm">
                          {session.interviewType.charAt(0).toUpperCase() + session.interviewType.slice(1)} Interview
                        </p>
                        <p className="text-xs text-muted-foreground flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {new Date(session.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <Badge variant={session.status === "completed" ? "default" : "secondary"}>
                      {session.status === "completed" ? "Completed" : "In Progress"}
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
}
