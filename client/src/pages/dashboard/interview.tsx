import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { DashboardLayout } from "@/components/dashboard/dashboard-layout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { 
  MessageSquare, 
  Users, 
  Code, 
  Briefcase,
  ArrowRight,
  Loader2,
  AlertCircle,
  Play,
  Brain,
  ListChecks
} from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { INTERVIEW_TYPES, type CV, type InterviewSession } from "@shared/schema";

const interviewIcons = {
  behavioral: Users,
  technical: Code,
  hr: Briefcase,
};

export default function Interview() {
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [selectedType, setSelectedType] = useState<string>("behavioral");

  const { data: cvs } = useQuery<CV[]>({
    queryKey: ["/api/cvs"],
  });

  const { data: sessions } = useQuery<InterviewSession[]>({
    queryKey: ["/api/interviews"],
  });

  const hasCv = cvs && cvs.length > 0;
  const inProgressSession = sessions?.find(s => s.status === "in_progress");

  const [interviewMode, setInterviewMode] = useState<"standard" | "adaptive">("adaptive");

  const startMutation = useMutation({
    mutationFn: async () => {
      const endpoint = interviewMode === "adaptive" ? "/api/interviews/adaptive" : "/api/interviews";
      const response = await apiRequest("POST", endpoint, { 
        interviewType: selectedType,
        cvId: cvs?.[0]?.id 
      });
      return response.json();
    },
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ queryKey: ["/api/interviews"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard"] });
      const route = interviewMode === "adaptive" 
        ? `/dashboard/adaptive-interview/${data.id}` 
        : `/dashboard/interview/${data.id}`;
      setLocation(route);
    },
    onError: (error: any) => {
      if (error?.message?.includes("Insufficient credits")) {
        toast({ 
          title: "Insufficient credits", 
          description: "You need 20 credits to start an interview.", 
          variant: "destructive" 
        });
      } else {
        toast({ title: "Failed to start interview", description: "Please try again.", variant: "destructive" });
      }
    },
  });

  if (inProgressSession) {
    return (
      <DashboardLayout title="Mock Interview">
        <div className="p-6 max-w-4xl mx-auto">
          <Card className="border-card-border">
            <CardContent className="p-8 text-center space-y-6">
              <div className="w-16 h-16 mx-auto rounded-2xl bg-chart-4/10 flex items-center justify-center">
                <MessageSquare className="h-8 w-8 text-chart-4" />
              </div>
              <div className="space-y-2">
                <h2 className="text-2xl font-bold">Interview in Progress</h2>
                <p className="text-muted-foreground">
                  You have an unfinished interview session. Would you like to continue?
                </p>
                <Badge variant="secondary" className="mt-2">
                  {inProgressSession.interviewType.charAt(0).toUpperCase() + inProgressSession.interviewType.slice(1)} Interview
                </Badge>
              </div>
              <Button 
                size="lg" 
                className="gap-2"
                onClick={() => setLocation(`/dashboard/interview/${inProgressSession.id}`)}
                data-testid="button-continue-interview"
              >
                Continue Interview
                <ArrowRight className="h-4 w-4" />
              </Button>
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="Mock Interview">
      <div className="p-6 max-w-4xl mx-auto space-y-8">
        <div className="space-y-2">
          <h2 className="font-serif text-2xl font-bold">Start a Mock Interview</h2>
          <p className="text-muted-foreground">
            Practice with AI-powered interviews tailored to your CV and career goals
          </p>
        </div>

        {!hasCv && (
          <Card className="border-chart-4/30 bg-chart-4/5">
            <CardContent className="p-4 flex items-center gap-4">
              <AlertCircle className="h-5 w-5 text-chart-4" />
              <div className="flex-1">
                <p className="font-medium text-sm">CV not uploaded</p>
                <p className="text-sm text-muted-foreground">
                  Upload your CV first for personalized interview questions
                </p>
              </div>
              <Button variant="outline" size="sm" asChild>
                <a href="/dashboard/cv">Upload CV</a>
              </Button>
            </CardContent>
          </Card>
        )}

        <Card className="border-card-border">
          <CardHeader>
            <CardTitle>Select Interview Type</CardTitle>
            <CardDescription>
              Choose the type of interview you want to practice
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <RadioGroup 
              value={selectedType} 
              onValueChange={setSelectedType}
              className="grid gap-4 md:grid-cols-3"
            >
              {INTERVIEW_TYPES.map((type) => {
                const Icon = interviewIcons[type.value as keyof typeof interviewIcons];
                const isSelected = selectedType === type.value;
                
                return (
                  <Label
                    key={type.value}
                    htmlFor={type.value}
                    className={`flex flex-col p-6 rounded-xl border-2 cursor-pointer transition-all ${
                      isSelected 
                        ? "border-primary bg-primary/5" 
                        : "border-border hover:border-primary/30"
                    }`}
                    data-testid={`radio-interview-${type.value}`}
                  >
                    <RadioGroupItem 
                      value={type.value} 
                      id={type.value}
                      className="sr-only"
                    />
                    <div className={`w-12 h-12 rounded-xl mb-4 flex items-center justify-center ${
                      isSelected ? "bg-primary/10" : "bg-muted"
                    }`}>
                      <Icon className={`h-6 w-6 ${isSelected ? "text-primary" : "text-muted-foreground"}`} />
                    </div>
                    <span className="font-semibold mb-1">{type.label}</span>
                    <span className="text-sm text-muted-foreground">{type.description}</span>
                  </Label>
                );
              })}
            </RadioGroup>

            <div className="pt-4 border-t border-border">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <p className="font-medium">Interview Details</p>
                  <p className="text-sm text-muted-foreground">5-7 questions, approximately 15-20 minutes</p>
                </div>
              </div>

              <Button 
                size="lg" 
                className="w-full gap-2"
                onClick={() => startMutation.mutate()}
                disabled={startMutation.isPending}
                data-testid="button-start-interview"
              >
                {startMutation.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Play className="h-4 w-4" />
                )}
                {startMutation.isPending ? "Starting..." : "Begin Interview"}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
