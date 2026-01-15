import { useQuery } from "@tanstack/react-query";
import { useParams, Link } from "wouter";
import { DashboardLayout } from "@/components/dashboard/dashboard-layout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { 
  Trophy,
  AlertTriangle,
  TrendingUp,
  Target,
  MessageSquare,
  Lightbulb,
  ArrowRight,
  CheckCircle2,
  XCircle
} from "lucide-react";
import type { Evaluation, InterviewSession, InterviewQuestion } from "@shared/schema";

interface EvaluationData {
  session: InterviewSession & { questions: InterviewQuestion[] };
  evaluation: Evaluation;
}

const scoreCategories = [
  { key: "communicationScore", label: "Communication", icon: MessageSquare, description: "Clarity and articulation" },
  { key: "confidenceScore", label: "Confidence", icon: Trophy, description: "Self-assurance and composure" },
  { key: "relevanceScore", label: "Relevance", icon: Target, description: "Answer alignment with question" },
  { key: "structureScore", label: "Structure", icon: TrendingUp, description: "STAR method and organization" },
];

function getScoreColor(score: number): string {
  if (score >= 80) return "text-chart-2";
  if (score >= 60) return "text-chart-4";
  return "text-destructive";
}

function getProgressColor(score: number): string {
  if (score >= 80) return "bg-chart-2";
  if (score >= 60) return "bg-chart-4";
  return "bg-destructive";
}

export default function EvaluationPage() {
  const params = useParams<{ id: string }>();

  const { data, isLoading } = useQuery<EvaluationData>({
    queryKey: ["/api/evaluations", params.id],
  });

  if (isLoading) {
    return (
      <DashboardLayout title="Evaluation">
        <div className="p-6 max-w-5xl mx-auto space-y-6">
          <Skeleton className="h-48 w-full" />
          <div className="grid md:grid-cols-2 gap-6">
            <Skeleton className="h-32" />
            <Skeleton className="h-32" />
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (!data) {
    return (
      <DashboardLayout title="Evaluation">
        <div className="p-6 max-w-5xl mx-auto text-center">
          <p className="text-muted-foreground">Evaluation not found.</p>
        </div>
      </DashboardLayout>
    );
  }

  const { session, evaluation } = data;
  const mistakes = evaluation.topMistakes as string[] || [];
  const improvements = evaluation.topImprovements as string[] || [];

  return (
    <DashboardLayout title="Interview Evaluation">
      <div className="p-6 max-w-5xl mx-auto space-y-8">
        <Card className="border-card-border overflow-hidden">
          <div className="bg-gradient-to-r from-primary/10 via-primary/5 to-transparent p-8">
            <div className="flex flex-col md:flex-row items-center gap-8">
              <div className="relative">
                <div className="w-32 h-32 rounded-full bg-background flex items-center justify-center border-4 border-primary/20">
                  <span className={`text-5xl font-bold ${getScoreColor(evaluation.overallScore)}`}>
                    {evaluation.overallScore}
                  </span>
                </div>
                <div className="absolute -bottom-2 left-1/2 -translate-x-1/2">
                  <Badge className="text-xs">out of 100</Badge>
                </div>
              </div>
              
              <div className="text-center md:text-left space-y-2">
                <h2 className="font-serif text-3xl font-bold">
                  {evaluation.overallScore >= 80 ? "Excellent Performance!" :
                   evaluation.overallScore >= 60 ? "Good Effort!" : "Keep Practicing!"}
                </h2>
                <p className="text-muted-foreground max-w-md">
                  {evaluation.overallScore >= 80 
                    ? "You demonstrated strong interview skills. Keep refining your answers for even better results."
                    : evaluation.overallScore >= 60
                    ? "You're on the right track. Focus on the improvement areas below to boost your score."
                    : "Every interview is a learning opportunity. Review the feedback below to improve."}
                </p>
                <Badge variant="secondary">
                  {session.interviewType.charAt(0).toUpperCase() + session.interviewType.slice(1)} Interview - Round {session.sessionNumber}
                </Badge>
              </div>
            </div>
          </div>
        </Card>

        <div className="grid md:grid-cols-2 gap-6">
          <Card className="border-card-border">
            <CardHeader>
              <CardTitle className="text-lg">Score Breakdown</CardTitle>
            </CardHeader>
            <CardContent className="space-y-5">
              {scoreCategories.map(({ key, label, icon: Icon, description }) => {
                const score = (evaluation as any)[key] as number;
                return (
                  <div key={key} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Icon className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium text-sm">{label}</span>
                      </div>
                      <span className={`font-bold ${getScoreColor(score)}`}>{score}</span>
                    </div>
                    <Progress 
                      value={score} 
                      className="h-2"
                    />
                    <p className="text-xs text-muted-foreground">{description}</p>
                  </div>
                );
              })}
            </CardContent>
          </Card>

          <div className="space-y-6">
            <Card className="border-destructive/20 bg-destructive/5">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2 text-destructive">
                  <AlertTriangle className="h-5 w-5" />
                  Top 3 Areas to Improve
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3">
                  {mistakes.slice(0, 3).map((mistake, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm">
                      <XCircle className="h-4 w-4 text-destructive mt-0.5 shrink-0" />
                      <span>{mistake}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>

            <Card className="border-chart-2/20 bg-chart-2/5">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2 text-chart-2">
                  <TrendingUp className="h-5 w-5" />
                  Top 3 Strengths
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3">
                  {improvements.slice(0, 3).map((item, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm">
                      <CheckCircle2 className="h-4 w-4 text-chart-2 mt-0.5 shrink-0" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>

        {evaluation.focusPoint && (
          <Card className="border-primary/20 bg-primary/5">
            <CardContent className="p-6">
              <div className="flex items-start gap-4">
                <div className="p-3 rounded-xl bg-primary/10">
                  <Target className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold text-lg mb-1">Your Focus Point</h3>
                  <p className="text-muted-foreground">{evaluation.focusPoint}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        <Card className="border-card-border">
          <CardHeader>
            <CardTitle>Question-by-Question Review</CardTitle>
            <CardDescription>Review your answers and compare with model responses</CardDescription>
          </CardHeader>
          <CardContent>
            <Accordion type="multiple" className="space-y-4">
              {session.questions.map((question, index) => (
                <AccordionItem 
                  key={question.id} 
                  value={`q-${question.id}`}
                  className="border border-border rounded-xl px-4"
                >
                  <AccordionTrigger className="hover:no-underline py-4">
                    <div className="flex items-center gap-3 text-left">
                      <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center text-sm font-medium shrink-0">
                        {index + 1}
                      </div>
                      <span className="text-sm font-medium">{question.questionText}</span>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="pb-4 space-y-4">
                    <div className="p-4 rounded-lg bg-muted/50">
                      <p className="text-xs font-medium text-muted-foreground mb-2">Your Answer</p>
                      <p className="text-sm whitespace-pre-wrap">{question.userAnswer}</p>
                    </div>
                    
                    {question.modelAnswer && (
                      <div className="p-4 rounded-lg bg-chart-2/5 border border-chart-2/20">
                        <div className="flex items-center gap-2 mb-2">
                          <Lightbulb className="h-4 w-4 text-chart-2" />
                          <p className="text-xs font-medium text-chart-2">Model Answer</p>
                        </div>
                        <p className="text-sm whitespace-pre-wrap">{question.modelAnswer}</p>
                        {question.answerExplanation && (
                          <p className="text-xs text-muted-foreground mt-3 pt-3 border-t border-chart-2/20">
                            {question.answerExplanation}
                          </p>
                        )}
                      </div>
                    )}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </CardContent>
        </Card>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link href="/dashboard/interview">
            <Button size="lg" className="gap-2 w-full sm:w-auto" data-testid="button-practice-again">
              Practice Again
              <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
          <Link href="/dashboard/progress">
            <Button size="lg" variant="outline" className="gap-2 w-full sm:w-auto" data-testid="button-view-progress">
              View Progress
              <TrendingUp className="h-4 w-4" />
            </Button>
          </Link>
        </div>
      </div>
    </DashboardLayout>
  );
}
