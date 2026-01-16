import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useParams, useLocation } from "wouter";
import { DashboardLayout } from "@/components/dashboard/dashboard-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { 
  Loader2,
  MessageSquare,
  CheckCircle2,
  Lightbulb,
  Send,
  Brain,
  TrendingUp,
  Sparkles
} from "lucide-react";
import type { InterviewSession, InterviewQuestion } from "@shared/schema";

interface SessionWithQuestion extends InterviewSession {
  currentQuestion?: InterviewQuestion;
  questions?: InterviewQuestion[];
  isAdaptive: boolean;
  canEnd: boolean;
  endReason: string | null;
}

interface AdaptiveAnswerResponse {
  success: boolean;
  nextQuestion: InterviewQuestion | null;
  shouldEnd: boolean;
  endReason: string | null;
  strategy?: string;
  memory?: {
    topicsCovered: string[];
    skillsDiscussed: string[];
    difficultyLevel: number;
  };
}

const strategyLabels: Record<string, { label: string; color: string; icon: typeof Sparkles }> = {
  clarify: { label: "Seeking Clarity", color: "text-chart-4", icon: MessageSquare },
  deepen: { label: "Going Deeper", color: "text-chart-2", icon: TrendingUp },
  challenge: { label: "Challenging", color: "text-primary", icon: Brain },
  move_forward: { label: "New Topic", color: "text-chart-1", icon: Sparkles },
};

export default function AdaptiveInterviewPage() {
  const params = useParams<{ id: string }>();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [answer, setAnswer] = useState("");
  const [currentQuestion, setCurrentQuestion] = useState<InterviewQuestion | null>(null);
  const [questionNumber, setQuestionNumber] = useState(1);
  const [memory, setMemory] = useState<{ topicsCovered: string[]; skillsDiscussed: string[]; difficultyLevel: number } | null>(null);
  const [lastStrategy, setLastStrategy] = useState<string | null>(null);
  const [canEnd, setCanEnd] = useState(false);
  const [endReason, setEndReason] = useState<string | null>(null);

  const { data: session, isLoading } = useQuery<SessionWithQuestion>({
    queryKey: ["/api/interviews", params.id],
    refetchOnMount: true,
  });

  useState(() => {
    if (session?.currentQuestion) {
      setCurrentQuestion(session.currentQuestion);
    }
  });

  const submitAnswerMutation = useMutation({
    mutationFn: async (data: { questionId: number; answer: string }) => {
      const response = await apiRequest("POST", `/api/interviews/${params.id}/adaptive-answer`, data);
      return response as AdaptiveAnswerResponse;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/interviews", params.id] });
      
      if (data.memory) {
        setMemory(data.memory);
      }
      
      if (data.strategy) {
        setLastStrategy(data.strategy);
      }

      if (data.shouldEnd) {
        setCanEnd(true);
        setEndReason(data.endReason);
        setCurrentQuestion(null);
        toast({ 
          title: "Interview Complete", 
          description: data.endReason || "You've covered enough ground for a thorough evaluation." 
        });
      } else if (data.nextQuestion) {
        setCurrentQuestion(data.nextQuestion);
        setQuestionNumber(prev => prev + 1);
        setAnswer("");
      }
    },
    onError: () => {
      toast({ title: "Failed to submit answer", variant: "destructive" });
    },
  });

  const finishInterviewMutation = useMutation({
    mutationFn: async () => {
      return apiRequest("POST", `/api/interviews/${params.id}/finish`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/interviews"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard"] });
      setLocation(`/dashboard/evaluation/${params.id}`);
    },
    onError: (error: any) => {
      if (error?.message?.includes("Insufficient credits")) {
        toast({ 
          title: "Insufficient credits", 
          description: "You need 15 credits to get your evaluation.", 
          variant: "destructive" 
        });
      } else {
        toast({ title: "Failed to complete interview", variant: "destructive" });
      }
    },
  });

  if (isLoading) {
    return (
      <DashboardLayout title="Interview">
        <div className="p-6 max-w-4xl mx-auto">
          <Skeleton className="h-[600px] w-full" />
        </div>
      </DashboardLayout>
    );
  }

  const activeQuestion = currentQuestion || (session?.questions as InterviewQuestion[])?.[0];

  if (!session) {
    return (
      <DashboardLayout title="Interview">
        <div className="p-6 max-w-4xl mx-auto text-center">
          <p className="text-muted-foreground">Interview not found.</p>
        </div>
      </DashboardLayout>
    );
  }

  const handleSubmitAnswer = () => {
    if (!answer.trim() || !activeQuestion) return;
    submitAnswerMutation.mutate({ questionId: activeQuestion.id, answer: answer.trim() });
  };

  const strategyInfo = lastStrategy ? strategyLabels[lastStrategy] : null;
  const StrategyIcon = strategyInfo?.icon || Sparkles;

  return (
    <DashboardLayout title={`${session.interviewType.charAt(0).toUpperCase() + session.interviewType.slice(1)} Interview`}>
      <div className="p-6 max-w-4xl mx-auto space-y-6">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-3">
            <Badge variant="secondary">
              Question {questionNumber}
            </Badge>
            {memory && (
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="text-xs">
                  Difficulty: {memory.difficultyLevel}/5
                </Badge>
                <Badge variant="outline" className="text-xs">
                  Topics: {memory.topicsCovered.length}
                </Badge>
              </div>
            )}
          </div>
          {strategyInfo && (
            <Badge className={`gap-1 ${strategyInfo.color}`} variant="outline">
              <StrategyIcon className="h-3 w-3" />
              {strategyInfo.label}
            </Badge>
          )}
        </div>

        {memory && memory.skillsDiscussed.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {memory.skillsDiscussed.slice(0, 6).map((skill, i) => (
              <Badge key={i} variant="secondary" className="text-xs">
                {skill}
              </Badge>
            ))}
          </div>
        )}

        {canEnd ? (
          <Card className="border-chart-2/30 bg-chart-2/5">
            <CardContent className="p-8 text-center space-y-6">
              <div className="w-16 h-16 mx-auto rounded-2xl bg-chart-2/10 flex items-center justify-center">
                <CheckCircle2 className="h-8 w-8 text-chart-2" />
              </div>
              <div className="space-y-2">
                <h2 className="text-2xl font-bold">Interview Complete</h2>
                <p className="text-muted-foreground">
                  {endReason || "You've completed the adaptive interview. Ready for your evaluation?"}
                </p>
                {memory && (
                  <div className="flex flex-wrap justify-center gap-2 mt-4">
                    <Badge variant="secondary">{memory.topicsCovered.length} topics covered</Badge>
                    <Badge variant="secondary">{memory.skillsDiscussed.length} skills discussed</Badge>
                    <Badge variant="secondary">Difficulty level {memory.difficultyLevel}/5</Badge>
                  </div>
                )}
              </div>
              <Button 
                size="lg" 
                className="gap-2 bg-chart-2 hover:bg-chart-2/90"
                onClick={() => finishInterviewMutation.mutate()}
                disabled={finishInterviewMutation.isPending}
                data-testid="button-finish-interview"
              >
                {finishInterviewMutation.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <CheckCircle2 className="h-4 w-4" />
                )}
                Get Evaluation (15 credits)
              </Button>
            </CardContent>
          </Card>
        ) : activeQuestion ? (
          <Card className="border-card-border">
            <CardHeader className="pb-4">
              <div className="flex items-start gap-4">
                <div className="p-3 rounded-xl bg-primary/10">
                  <MessageSquare className="h-6 w-6 text-primary" />
                </div>
                <div className="flex-1">
                  <CardTitle className="text-xl leading-relaxed">
                    {activeQuestion.questionText}
                  </CardTitle>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <Textarea
                  placeholder="Type your answer here... Be specific with examples and explain your reasoning."
                  value={answer}
                  onChange={(e) => setAnswer(e.target.value)}
                  className="min-h-[200px] resize-none text-base"
                  data-testid="input-interview-answer"
                />
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <p className="text-sm text-muted-foreground">
                    {answer.length} characters
                  </p>
                  <Button 
                    className="gap-2"
                    onClick={handleSubmitAnswer}
                    disabled={!answer.trim() || submitAnswerMutation.isPending}
                    data-testid="button-submit-answer"
                  >
                    {submitAnswerMutation.isPending ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Send className="h-4 w-4" />
                    )}
                    Submit Answer
                  </Button>
                </div>
              </div>

              {activeQuestion.modelAnswer && (
                <Accordion type="single" collapsible>
                  <AccordionItem value="model-answer" className="border-none">
                    <AccordionTrigger className="p-4 rounded-xl bg-chart-2/5 hover:bg-chart-2/10 border border-chart-2/20">
                      <div className="flex items-center gap-2">
                        <Lightbulb className="h-4 w-4 text-chart-2" />
                        <span className="text-chart-2 font-medium">View Model Answer (hint)</span>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent className="p-4 mt-2 rounded-xl border border-chart-2/20 bg-chart-2/5">
                      <p className="whitespace-pre-wrap mb-4">{activeQuestion.modelAnswer}</p>
                      {activeQuestion.answerExplanation && (
                        <div className="pt-4 border-t border-chart-2/20">
                          <p className="text-sm font-medium text-chart-2 mb-2">Why this works:</p>
                          <p className="text-sm text-muted-foreground">{activeQuestion.answerExplanation}</p>
                        </div>
                      )}
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>
              )}
            </CardContent>
          </Card>
        ) : (
          <Card className="border-card-border">
            <CardContent className="p-8 text-center">
              <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
              <p className="text-muted-foreground">Loading next question...</p>
            </CardContent>
          </Card>
        )}

        {questionNumber >= 3 && !canEnd && (
          <div className="text-center">
            <Button
              variant="outline"
              onClick={() => {
                setCanEnd(true);
                setEndReason("Interview ended early by user");
              }}
              data-testid="button-end-early"
            >
              End Interview Early
            </Button>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
