import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { DashboardLayout } from "@/components/dashboard/dashboard-layout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  TrendingUp, 
  TrendingDown,
  Minus,
  AlertTriangle,
  Target,
  ArrowRight,
  BarChart3,
  MessageSquare
} from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Legend, Tooltip } from "recharts";
import type { Evaluation, WeaknessPattern, InterviewSession } from "@shared/schema";

interface ProgressData {
  evaluations: (Evaluation & { session: InterviewSession })[];
  patterns: WeaknessPattern[];
  comparison: {
    round1: Evaluation | null;
    round2: Evaluation | null;
  } | null;
}

const categories = [
  { key: "communicationScore", label: "Communication" },
  { key: "confidenceScore", label: "Confidence" },
  { key: "relevanceScore", label: "Relevance" },
  { key: "structureScore", label: "Structure" },
];

function getDiffIcon(diff: number) {
  if (diff > 0) return <TrendingUp className="h-4 w-4 text-chart-2" />;
  if (diff < 0) return <TrendingDown className="h-4 w-4 text-destructive" />;
  return <Minus className="h-4 w-4 text-muted-foreground" />;
}

function getDiffColor(diff: number) {
  if (diff > 0) return "text-chart-2";
  if (diff < 0) return "text-destructive";
  return "text-muted-foreground";
}

export default function ProgressPage() {
  const { data, isLoading } = useQuery<ProgressData>({
    queryKey: ["/api/progress"],
  });

  if (isLoading) {
    return (
      <DashboardLayout title="Progress">
        <div className="p-6 max-w-6xl mx-auto space-y-6">
          <Skeleton className="h-48 w-full" />
          <div className="grid md:grid-cols-2 gap-6">
            <Skeleton className="h-64" />
            <Skeleton className="h-64" />
          </div>
        </div>
      </DashboardLayout>
    );
  }

  const hasComparison = data?.comparison?.round1 && data?.comparison?.round2;

  const chartData = hasComparison ? categories.map(({ key, label }) => ({
    name: label,
    "Round 1": (data.comparison?.round1 as any)?.[key] || 0,
    "Round 2": (data.comparison?.round2 as any)?.[key] || 0,
  })) : [];

  return (
    <DashboardLayout title="Progress">
      <div className="p-6 max-w-6xl mx-auto space-y-8">
        <div className="space-y-2">
          <h2 className="font-serif text-2xl font-bold">Your Progress</h2>
          <p className="text-muted-foreground">
            Track your improvement across interview sessions
          </p>
        </div>

        {!data?.evaluations?.length ? (
          <Card className="border-card-border">
            <CardContent className="p-12 text-center space-y-6">
              <div className="w-16 h-16 mx-auto rounded-2xl bg-muted flex items-center justify-center">
                <BarChart3 className="h-8 w-8 text-muted-foreground" />
              </div>
              <div className="space-y-2">
                <h3 className="text-xl font-semibold">No Data Yet</h3>
                <p className="text-muted-foreground max-w-md mx-auto">
                  Complete your first interview to start tracking your progress
                </p>
              </div>
              <Link href="/dashboard/interview">
                <Button className="gap-2" data-testid="button-start-first-interview">
                  Start Interview
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <>
            {hasComparison && (
              <>
                <Card className="border-card-border">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <TrendingUp className="h-5 w-5" />
                      Round Comparison
                    </CardTitle>
                    <CardDescription>Compare your Round 1 and Round 2 performance</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-col lg:flex-row gap-8 items-center">
                      <div className="flex gap-8 items-center">
                        <div className="text-center">
                          <p className="text-sm text-muted-foreground mb-1">Round 1</p>
                          <p className="text-4xl font-bold">{data.comparison?.round1?.overallScore}</p>
                        </div>
                        <div className="text-center">
                          <p className="text-sm text-muted-foreground mb-2">Change</p>
                          {(() => {
                            const diff = (data.comparison?.round2?.overallScore || 0) - (data.comparison?.round1?.overallScore || 0);
                            return (
                              <div className={`flex items-center gap-1 text-2xl font-bold ${getDiffColor(diff)}`}>
                                {getDiffIcon(diff)}
                                {diff > 0 ? "+" : ""}{diff}
                              </div>
                            );
                          })()}
                        </div>
                        <div className="text-center">
                          <p className="text-sm text-muted-foreground mb-1">Round 2</p>
                          <p className="text-4xl font-bold text-chart-2">{data.comparison?.round2?.overallScore}</p>
                        </div>
                      </div>

                      <div className="flex-1 w-full h-64">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={chartData} barGap={8}>
                            <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                            <XAxis dataKey="name" className="text-xs" tick={{ fill: 'hsl(var(--muted-foreground))' }} />
                            <YAxis domain={[0, 100]} className="text-xs" tick={{ fill: 'hsl(var(--muted-foreground))' }} />
                            <Tooltip 
                              contentStyle={{ 
                                backgroundColor: 'hsl(var(--card))', 
                                borderColor: 'hsl(var(--border))',
                                borderRadius: '8px'
                              }}
                            />
                            <Legend />
                            <Bar dataKey="Round 1" fill="hsl(var(--muted-foreground))" radius={[4, 4, 0, 0]} />
                            <Bar dataKey="Round 2" fill="hsl(var(--chart-2))" radius={[4, 4, 0, 0]} />
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <div className="grid md:grid-cols-4 gap-4">
                  {categories.map(({ key, label }) => {
                    const r1 = (data.comparison?.round1 as any)?.[key] || 0;
                    const r2 = (data.comparison?.round2 as any)?.[key] || 0;
                    const diff = r2 - r1;
                    return (
                      <Card key={key} className="border-card-border">
                        <CardContent className="p-4">
                          <p className="text-sm text-muted-foreground mb-2">{label}</p>
                          <div className="flex items-end justify-between">
                            <div>
                              <span className="text-2xl font-bold">{r2}</span>
                              <span className="text-muted-foreground text-sm">/100</span>
                            </div>
                            <div className={`flex items-center gap-1 text-sm font-medium ${getDiffColor(diff)}`}>
                              {getDiffIcon(diff)}
                              {diff > 0 ? "+" : ""}{diff}
                            </div>
                          </div>
                          <Progress value={r2} className="h-1.5 mt-3" />
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              </>
            )}

            {data.patterns && data.patterns.length > 0 && (
              <Card className="border-chart-4/30 bg-chart-4/5">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-chart-4">
                    <AlertTriangle className="h-5 w-5" />
                    Detected Weakness Patterns
                  </CardTitle>
                  <CardDescription>
                    Recurring issues identified across your interview sessions
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {data.patterns.map((pattern) => (
                      <div 
                        key={pattern.id}
                        className="p-4 rounded-xl bg-background border border-border"
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div className="space-y-1">
                            <p className="font-medium">{pattern.description}</p>
                            {pattern.suggestion && (
                              <p className="text-sm text-muted-foreground">{pattern.suggestion}</p>
                            )}
                          </div>
                          <Badge variant="secondary">
                            Detected {pattern.frequency}x
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            <div className="flex gap-4 justify-center">
              <Link href="/dashboard/interview">
                <Button className="gap-2" data-testid="button-practice-more">
                  <MessageSquare className="h-4 w-4" />
                  Practice More
                </Button>
              </Link>
              <Link href="/dashboard/history">
                <Button variant="outline" className="gap-2" data-testid="button-view-history">
                  View Full History
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            </div>
          </>
        )}
      </div>
    </DashboardLayout>
  );
}
