import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { DashboardLayout } from "@/components/dashboard/dashboard-layout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  MessageSquare, 
  Clock, 
  ArrowRight, 
  History as HistoryIcon,
  CheckCircle2,
  AlertCircle,
  TrendingUp,
  Mic
} from "lucide-react";
import type { InterviewSession, Evaluation } from "@shared/schema";

interface SessionWithEvaluation extends InterviewSession {
  evaluation: Evaluation | null;
}

function formatDate(dateString: string | Date): string {
  const date = new Date(dateString);
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function getScoreBadgeVariant(score: number): "default" | "secondary" | "destructive" {
  if (score >= 80) return "default";
  if (score >= 60) return "secondary";
  return "destructive";
}

function formatInterviewType(type: string): string {
  if (type.startsWith("voice_")) {
    const baseType = type.replace("voice_", "");
    return `Voice ${baseType.charAt(0).toUpperCase() + baseType.slice(1)}`;
  }
  return type.charAt(0).toUpperCase() + type.slice(1);
}

function isVoiceInterview(type: string): boolean {
  return type.startsWith("voice_");
}

export default function HistoryPage() {
  const { data: sessions, isLoading } = useQuery<SessionWithEvaluation[]>({
    queryKey: ["/api/interviews/history"],
  });

  if (isLoading) {
    return (
      <DashboardLayout title="History">
        <div className="p-6 max-w-5xl mx-auto space-y-4">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-24 w-full" />
          ))}
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="History">
      <div className="p-6 max-w-5xl mx-auto space-y-8">
        <div className="space-y-2">
          <h2 className="font-serif text-2xl font-bold">Interview History</h2>
          <p className="text-muted-foreground">
            View all your past interview sessions and evaluations
          </p>
        </div>

        {!sessions?.length ? (
          <Card className="border-card-border">
            <CardContent className="p-12 text-center space-y-6">
              <div className="w-16 h-16 mx-auto rounded-2xl bg-muted flex items-center justify-center">
                <HistoryIcon className="h-8 w-8 text-muted-foreground" />
              </div>
              <div className="space-y-2">
                <h3 className="text-xl font-semibold">No History Yet</h3>
                <p className="text-muted-foreground max-w-md mx-auto">
                  Complete your first interview to build your history
                </p>
              </div>
              <Link href="/dashboard/interview">
                <Button className="gap-2" data-testid="button-start-interview">
                  Start Interview
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {sessions.map((session) => (
              <Card 
                key={session.id} 
                className="border-card-border hover-elevate"
              >
                <CardContent className="p-6">
                  <div className="flex items-center justify-between gap-6">
                    <div className="flex items-center gap-4">
                      <div className={`p-3 rounded-xl ${
                        session.status === "completed" ? "bg-chart-2/10" : "bg-chart-4/10"
                      }`}>
                        {isVoiceInterview(session.interviewType) ? (
                          <Mic className={`h-5 w-5 ${
                            session.status === "completed" ? "text-chart-2" : "text-chart-4"
                          }`} />
                        ) : (
                          <MessageSquare className={`h-5 w-5 ${
                            session.status === "completed" ? "text-chart-2" : "text-chart-4"
                          }`} />
                        )}
                      </div>
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-semibold">
                            {formatInterviewType(session.interviewType)} Interview
                          </h3>
                          <Badge variant="secondary" className="text-xs">
                            Round {session.sessionNumber}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {formatDate(session.createdAt)}
                          </span>
                          <span className="flex items-center gap-1">
                            {session.status === "completed" ? (
                              <>
                                <CheckCircle2 className="h-3 w-3 text-chart-2" />
                                Completed
                              </>
                            ) : (
                              <>
                                <AlertCircle className="h-3 w-3 text-chart-4" />
                                In Progress
                              </>
                            )}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-4">
                      {session.evaluation && (
                        <div className="text-right">
                          <p className="text-sm text-muted-foreground">Score</p>
                          <Badge 
                            variant={getScoreBadgeVariant(session.evaluation.overallScore)}
                            className="text-lg px-3 py-1"
                          >
                            {session.evaluation.overallScore}/100
                          </Badge>
                        </div>
                      )}

                      {session.status === "completed" ? (
                        <Link href={`/dashboard/evaluation/${session.id}`}>
                          <Button variant="outline" size="sm" className="gap-1" data-testid={`button-view-evaluation-${session.id}`}>
                            View Results
                            <ArrowRight className="h-4 w-4" />
                          </Button>
                        </Link>
                      ) : (
                        <Link href={`/dashboard/interview/${session.id}`}>
                          <Button size="sm" className="gap-1" data-testid={`button-continue-${session.id}`}>
                            Continue
                            <ArrowRight className="h-4 w-4" />
                          </Button>
                        </Link>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {sessions && sessions.length > 0 && (
          <div className="flex gap-4 justify-center pt-4">
            <Link href="/dashboard/progress">
              <Button variant="outline" className="gap-2" data-testid="button-view-progress">
                <TrendingUp className="h-4 w-4" />
                View Progress Analysis
              </Button>
            </Link>
            <Link href="/dashboard/interview">
              <Button className="gap-2" data-testid="button-new-interview">
                Start New Interview
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
