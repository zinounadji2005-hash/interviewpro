import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useParams, useLocation } from "wouter";
import { DashboardLayout } from "@/components/dashboard/dashboard-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { 
  ArrowRight, 
  ArrowLeft,
  Loader2,
  MessageSquare,
  CheckCircle2,
  Lightbulb,
  Send
} from "lucide-react";
import type { InterviewSession, InterviewQuestion } from "@shared/schema";

interface SessionWithQuestions extends InterviewSession {
  questions: InterviewQuestion[];
}

export default function InterviewSessionPage() {
  const params = useParams<{ id: string }>();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answer, setAnswer] = useState("");
  const [showModelAnswer, setShowModelAnswer] = useState(false);

  const { data: session, isLoading } = useQuery<SessionWithQuestions>({
    queryKey: ["/api/interviews", params.id],
  });

  const submitAnswerMutation = useMutation({
    mutationFn: async (data: { questionId: number; answer: string }) => {
      return apiRequest("POST", `/api/interviews/${params.id}/answer`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/interviews", params.id] });
      setAnswer("");
      setShowModelAnswer(false);
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
    onError: () => {
      toast({ title: "Failed to complete interview", variant: "destructive" });
    },
  });

  const currentQuestion = session?.questions?.[currentQuestionIndex];
  const totalQuestions = session?.questions?.length || 0;
  const answeredQuestions = session?.questions?.filter(q => q.userAnswer)?.length || 0;
  const progressPercent = totalQuestions > 0 ? (answeredQuestions / totalQuestions) * 100 : 0;

  useEffect(() => {
    if (session?.questions) {
      const firstUnanswered = session.questions.findIndex(q => !q.userAnswer);
      if (firstUnanswered >= 0) {
        setCurrentQuestionIndex(firstUnanswered);
      }
    }
  }, [session?.questions]);

  if (isLoading) {
    return (
      <DashboardLayout title="Interview">
        <div className="p-6 max-w-4xl mx-auto">
          <Skeleton className="h-[600px] w-full" />
        </div>
      </DashboardLayout>
    );
  }

  if (!session || !currentQuestion) {
    return (
      <DashboardLayout title="Interview">
        <div className="p-6 max-w-4xl mx-auto text-center">
          <p className="text-muted-foreground">Interview not found or no questions available.</p>
        </div>
      </DashboardLayout>
    );
  }

  const handleSubmitAnswer = () => {
    if (!answer.trim()) return;
    submitAnswerMutation.mutate({ questionId: currentQuestion.id, answer: answer.trim() });
  };

  const handleNext = () => {
    if (currentQuestionIndex < totalQuestions - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
      setAnswer("");
      setShowModelAnswer(false);
    }
  };

  const handlePrevious = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(prev => prev - 1);
      setAnswer(session.questions[currentQuestionIndex - 1]?.userAnswer || "");
      setShowModelAnswer(false);
    }
  };

  const isLastQuestion = currentQuestionIndex === totalQuestions - 1;
  const allAnswered = answeredQuestions === totalQuestions;
  const currentAnswered = !!currentQuestion.userAnswer;

  return (
    <DashboardLayout title={`${session.interviewType.charAt(0).toUpperCase() + session.interviewType.slice(1)} Interview`}>
      <div className="p-6 max-w-4xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Badge variant="secondary">
              Question {currentQuestionIndex + 1} of {totalQuestions}
            </Badge>
            <span className="text-sm text-muted-foreground">
              {answeredQuestions} answered
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium">{Math.round(progressPercent)}%</span>
            <Progress value={progressPercent} className="w-32 h-2" />
          </div>
        </div>

        <Card className="border-card-border">
          <CardHeader className="pb-4">
            <div className="flex items-start gap-4">
              <div className="p-3 rounded-xl bg-primary/10">
                <MessageSquare className="h-6 w-6 text-primary" />
              </div>
              <div className="flex-1">
                <CardTitle className="text-xl leading-relaxed">
                  {currentQuestion.questionText}
                </CardTitle>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {currentAnswered ? (
              <div className="space-y-4">
                <div className="p-4 rounded-xl bg-muted/50">
                  <p className="text-sm font-medium text-muted-foreground mb-2">Your Answer</p>
                  <p className="whitespace-pre-wrap">{currentQuestion.userAnswer}</p>
                </div>

                {currentQuestion.modelAnswer && (
                  <Accordion type="single" collapsible>
                    <AccordionItem value="model-answer" className="border-none">
                      <AccordionTrigger className="p-4 rounded-xl bg-chart-2/5 hover:bg-chart-2/10 border border-chart-2/20">
                        <div className="flex items-center gap-2">
                          <Lightbulb className="h-4 w-4 text-chart-2" />
                          <span className="text-chart-2 font-medium">View Model Answer</span>
                        </div>
                      </AccordionTrigger>
                      <AccordionContent className="p-4 mt-2 rounded-xl border border-chart-2/20 bg-chart-2/5">
                        <p className="whitespace-pre-wrap mb-4">{currentQuestion.modelAnswer}</p>
                        {currentQuestion.answerExplanation && (
                          <div className="pt-4 border-t border-chart-2/20">
                            <p className="text-sm font-medium text-chart-2 mb-2">Why this works:</p>
                            <p className="text-sm text-muted-foreground">{currentQuestion.answerExplanation}</p>
                          </div>
                        )}
                      </AccordionContent>
                    </AccordionItem>
                  </Accordion>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                <Textarea
                  placeholder="Type your answer here... Take your time to structure your response using the STAR method (Situation, Task, Action, Result) when applicable."
                  value={answer}
                  onChange={(e) => setAnswer(e.target.value)}
                  className="min-h-[200px] resize-none text-base"
                  data-testid="input-interview-answer"
                />
                <div className="flex items-center justify-between">
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
            )}
          </CardContent>
        </Card>

        <div className="flex items-center justify-between">
          <Button
            variant="outline"
            onClick={handlePrevious}
            disabled={currentQuestionIndex === 0}
            className="gap-2"
            data-testid="button-previous-question"
          >
            <ArrowLeft className="h-4 w-4" />
            Previous
          </Button>

          <div className="flex gap-3">
            {!isLastQuestion && currentAnswered && (
              <Button
                onClick={handleNext}
                className="gap-2"
                data-testid="button-next-question"
              >
                Next
                <ArrowRight className="h-4 w-4" />
              </Button>
            )}

            {allAnswered && (
              <Button
                onClick={() => finishInterviewMutation.mutate()}
                disabled={finishInterviewMutation.isPending}
                className="gap-2 bg-chart-2 hover:bg-chart-2/90"
                data-testid="button-finish-interview"
              >
                {finishInterviewMutation.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <CheckCircle2 className="h-4 w-4" />
                )}
                Finish Interview
              </Button>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
