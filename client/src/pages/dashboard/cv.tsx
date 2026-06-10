import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { DashboardLayout } from "@/components/dashboard/dashboard-layout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { 
  Upload, 
  FileText, 
  Target, 
  Sparkles, 
  CheckCircle2,
  ArrowRight,
  Loader2,
  AlertCircle,
  AlertTriangle,
  UserCheck,
  XCircle
} from "lucide-react";
import { JOB_ROLES, type CV } from "@shared/schema";

interface NameValidation {
  extractedName: string;
  matchScore: number;
  status: "verified" | "needs_confirmation" | "mismatch";
  message: string;
}

interface CVWithValidation extends CV {
  nameValidation?: NameValidation;
}

export default function CVManager() {
  const { toast } = useToast();
  const [file, setFile] = useState<File | null>(null);
  const [targetRole, setTargetRole] = useState<string>("");
  const [jobDescription, setJobDescription] = useState<string>("");
  const [dragActive, setDragActive] = useState(false);
  const [pendingCv, setPendingCv] = useState<CVWithValidation | null>(null);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [showMismatchAlert, setShowMismatchAlert] = useState(false);

  const { data: cvs, isLoading } = useQuery<CV[]>({
    queryKey: ["/api/cvs"],
  });

  const latestCv = cvs?.[0];

  const uploadMutation = useMutation({
    mutationFn: async (formData: FormData) => {
      const response = await fetch("/api/cvs/upload", {
        method: "POST",
        body: formData,
        credentials: "include",
      });
      if (!response.ok) throw new Error("Failed to upload CV");
      return response.json() as Promise<CVWithValidation>;
    },
    onSuccess: (data) => {
      const validation = data.nameValidation;
      
      if (!validation || validation.status === "verified") {
        queryClient.invalidateQueries({ queryKey: ["/api/cvs"] });
        queryClient.invalidateQueries({ queryKey: ["/api/dashboard"] });
        toast({ 
          title: "CV uploaded successfully!", 
          description: validation?.extractedName 
            ? `Welcome, ${validation.extractedName}! Your CV is ready for optimization.`
            : "Your CV is ready for optimization." 
        });
        setFile(null);
      } else if (validation.status === "needs_confirmation") {
        setPendingCv(data);
        setShowConfirmDialog(true);
      } else if (validation.status === "mismatch") {
        setPendingCv(data);
        setShowMismatchAlert(true);
      }
    },
    onError: () => {
      toast({ title: "Upload failed", description: "Please try again.", variant: "destructive" });
    },
  });

  const confirmCvMutation = useMutation({
    mutationFn: async (cvId: number) => {
      const response = await apiRequest("POST", `/api/cvs/${cvId}/confirm`);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/cvs"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard"] });
      toast({ title: "CV confirmed!", description: "Your CV is ready for optimization." });
      setFile(null);
      setPendingCv(null);
      setShowConfirmDialog(false);
    },
    onError: () => {
      toast({ title: "Confirmation failed", description: "Please try again.", variant: "destructive" });
    },
  });

  const optimizeMutation = useMutation({
    mutationFn: async (cvId: number) => {
      return apiRequest("POST", `/api/cvs/${cvId}/optimize`, { targetRole, jobDescription });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/cvs"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard"] });
      toast({ title: "CV optimized!", description: "View your improved CV below." });
    },
    onError: (error: any) => {
      if (error?.message?.includes("Insufficient credits")) {
        toast({ 
          title: "Insufficient credits", 
          description: "You need 10 credits to optimize your CV.", 
          variant: "destructive" 
        });
      } else {
        toast({ title: "Optimization failed", description: "Please try again.", variant: "destructive" });
      }
    },
  });

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    const droppedFile = e.dataTransfer.files?.[0];
    if (droppedFile && (droppedFile.type === "application/pdf" || 
        droppedFile.type === "application/vnd.openxmlformats-officedocument.wordprocessingml.document")) {
      setFile(droppedFile);
    } else {
      toast({ title: "Invalid file type", description: "Please upload a PDF or DOCX file.", variant: "destructive" });
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
    }
  };

  const handleUpload = () => {
    if (!file) return;
    const formData = new FormData();
    formData.append("cv", file);
    if (targetRole) formData.append("targetRole", targetRole);
    if (jobDescription) formData.append("jobDescription", jobDescription);
    uploadMutation.mutate(formData);
  };

  return (
    <DashboardLayout title="CV Manager">
      <div className="p-4 sm:p-6 max-w-6xl mx-auto space-y-6 sm:space-y-8">
        {!latestCv ? (
          <Card className="border-card-border">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Upload className="h-5 w-5" />
                Upload Your CV
              </CardTitle>
              <CardDescription>
                Upload your resume to get AI-powered optimization suggestions
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div
                className={`border-2 border-dashed rounded-xl p-12 text-center transition-colors ${
                  dragActive ? "border-primary bg-primary/5" : "border-border hover:border-primary/50"
                }`}
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
              >
                {file ? (
                  <div className="space-y-4">
                    <div className="w-16 h-16 mx-auto rounded-xl bg-chart-2/10 flex items-center justify-center">
                      <FileText className="h-8 w-8 text-chart-2" />
                    </div>
                    <div>
                      <p className="font-medium">{file.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {(file.size / 1024 / 1024).toFixed(2)} MB
                      </p>
                    </div>
                    <Button variant="outline" size="sm" onClick={() => setFile(null)}>
                      Remove
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="w-16 h-16 mx-auto rounded-xl bg-muted flex items-center justify-center">
                      <Upload className="h-8 w-8 text-muted-foreground" />
                    </div>
                    <div>
                      <p className="font-medium">Drag and drop your CV here</p>
                      <p className="text-sm text-muted-foreground">or click to browse</p>
                    </div>
                    <Input
                      type="file"
                      accept=".pdf,.docx"
                      onChange={handleFileChange}
                      className="hidden"
                      id="cv-upload"
                      data-testid="input-cv-file"
                    />
                    <Label htmlFor="cv-upload">
                      <Button variant="outline" asChild>
                        <span>Select File</span>
                      </Button>
                    </Label>
                    <p className="text-xs text-muted-foreground">PDF or DOCX, up to 10MB</p>
                  </div>
                )}
              </div>

              <div className="grid gap-6 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="target-role">Target Job Role (Optional)</Label>
                  <Select value={targetRole} onValueChange={setTargetRole}>
                    <SelectTrigger id="target-role" data-testid="select-target-role">
                      <SelectValue placeholder="Select a role..." />
                    </SelectTrigger>
                    <SelectContent>
                      {JOB_ROLES.map((role) => (
                        <SelectItem key={role} value={role}>{role}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="job-description">Job Description (Optional)</Label>
                  <Textarea
                    id="job-description"
                    placeholder="Paste a job description for more targeted optimization..."
                    value={jobDescription}
                    onChange={(e) => setJobDescription(e.target.value)}
                    className="resize-none h-20"
                    data-testid="input-job-description"
                  />
                </div>
              </div>

              <Button 
                className="w-full gap-2" 
                size="lg"
                onClick={handleUpload}
                disabled={!file || uploadMutation.isPending}
                data-testid="button-upload-cv"
              >
                {uploadMutation.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Upload className="h-4 w-4" />
                )}
                {uploadMutation.isPending ? "Uploading..." : "Upload CV"}
              </Button>
            </CardContent>
          </Card>
        ) : (
          <>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="space-y-1">
                <h2 className="font-serif text-xl sm:text-2xl font-bold">Your CV</h2>
                <p className="text-muted-foreground">
                  {latestCv.improvedText ? "Review your optimized CV" : "Optimize your CV for better results"}
                </p>
              </div>
              {!latestCv.improvedText && (
                <Button 
                  className="gap-2"
                  onClick={() => optimizeMutation.mutate(latestCv.id)}
                  disabled={optimizeMutation.isPending}
                  data-testid="button-optimize-cv"
                >
                  {optimizeMutation.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Sparkles className="h-4 w-4" />
                  )}
                  {optimizeMutation.isPending ? "Optimizing..." : "Optimize CV"}
                </Button>
              )}
            </div>

            {latestCv.targetRole && (
              <div className="flex items-center gap-2">
                <Target className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">Target Role:</span>
                <Badge variant="secondary">{latestCv.targetRole}</Badge>
              </div>
            )}

            <Tabs defaultValue={latestCv.improvedText ? "improved" : "original"} className="space-y-6">
              <TabsList>
                <TabsTrigger value="original" data-testid="tab-original-cv">Original CV</TabsTrigger>
                <TabsTrigger value="improved" disabled={!latestCv.improvedText} data-testid="tab-improved-cv">
                  Improved CV
                </TabsTrigger>
                {!!latestCv.analysis && (
                  <TabsTrigger value="analysis" data-testid="tab-cv-analysis">Analysis</TabsTrigger>
                )}
              </TabsList>

              <TabsContent value="original">
                <Card className="border-card-border">
                  <CardContent className="p-6">
                    <ScrollArea className="h-[500px]">
                      <div className="prose prose-sm dark:prose-invert max-w-none whitespace-pre-wrap">
                        {latestCv.originalText}
                      </div>
                    </ScrollArea>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="improved">
                <Card className="border-card-border border-chart-2/30 bg-chart-2/5">
                  <CardHeader className="pb-2">
                    <div className="flex items-center gap-2 text-chart-2">
                      <CheckCircle2 className="h-5 w-5" />
                      <span className="font-medium">Optimized for ATS & Impact</span>
                    </div>
                  </CardHeader>
                  <CardContent className="p-6 pt-2">
                    <ScrollArea className="h-[500px]">
                      <div className="prose prose-sm dark:prose-invert max-w-none whitespace-pre-wrap">
                        {latestCv.improvedText}
                      </div>
                    </ScrollArea>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="analysis">
                <Card className="border-card-border">
                  <CardContent className="p-6">
                    <div className="space-y-6">
                      {!!latestCv.analysis && typeof latestCv.analysis === "object" && (
                        <>
                          {(latestCv.analysis as any).improvements && (
                            <div className="space-y-4">
                              <h3 className="font-semibold flex items-center gap-2">
                                <Sparkles className="h-4 w-4 text-chart-4" />
                                Key Improvements Made
                              </h3>
                              <ul className="space-y-2">
                                {((latestCv.analysis as any).improvements as string[]).map((item: string, i: number) => (
                                  <li key={i} className="flex items-start gap-2 text-sm">
                                    <ArrowRight className="h-4 w-4 text-chart-2 mt-0.5 shrink-0" />
                                    {item}
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}
                          {(latestCv.analysis as any).atsScore && (
                            <div className="p-4 rounded-xl bg-muted/50">
                              <p className="text-sm text-muted-foreground mb-1">ATS Compatibility Score</p>
                              <p className="text-3xl font-bold">{(latestCv.analysis as any).atsScore}%</p>
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </>
        )}
      </div>

      <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 rounded-xl bg-chart-4/10">
                <AlertTriangle className="h-5 w-5 text-chart-4" />
              </div>
              <AlertDialogTitle>Confirm CV Ownership</AlertDialogTitle>
            </div>
            <AlertDialogDescription className="space-y-3">
              <p>{pendingCv?.nameValidation?.message}</p>
              <div className="p-3 rounded-lg bg-muted/50 space-y-1">
                <p className="text-sm">
                  <span className="text-muted-foreground">Name on CV:</span>{" "}
                  <span className="font-medium text-foreground">{pendingCv?.nameValidation?.extractedName}</span>
                </p>
                <p className="text-sm">
                  <span className="text-muted-foreground">Match confidence:</span>{" "}
                  <span className="font-medium text-foreground">{pendingCv?.nameValidation?.matchScore}%</span>
                </p>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel 
              onClick={() => {
                setPendingCv(null);
                setFile(null);
              }}
            >
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => pendingCv && confirmCvMutation.mutate(pendingCv.id)}
              disabled={confirmCvMutation.isPending}
              data-testid="button-confirm-cv"
            >
              {confirmCvMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <UserCheck className="h-4 w-4 mr-2" />
              )}
              Yes, this is my CV
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={showMismatchAlert} onOpenChange={setShowMismatchAlert}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 rounded-xl bg-destructive/10">
                <XCircle className="h-5 w-5 text-destructive" />
              </div>
              <AlertDialogTitle>Name Mismatch Detected</AlertDialogTitle>
            </div>
            <AlertDialogDescription className="space-y-3">
              <p>{pendingCv?.nameValidation?.message}</p>
              <div className="p-3 rounded-lg bg-muted/50 space-y-1">
                <p className="text-sm">
                  <span className="text-muted-foreground">Name on CV:</span>{" "}
                  <span className="font-medium text-foreground">{pendingCv?.nameValidation?.extractedName || "Not detected"}</span>
                </p>
                <p className="text-sm">
                  <span className="text-muted-foreground">Match confidence:</span>{" "}
                  <span className="font-medium text-destructive">{pendingCv?.nameValidation?.matchScore}%</span>
                </p>
              </div>
              <p className="text-sm">
                To proceed, please upload a CV that matches your account name, or update your account profile with the correct name.
              </p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction 
              onClick={() => {
                setPendingCv(null);
                setFile(null);
                setShowMismatchAlert(false);
              }}
              data-testid="button-upload-different-cv"
            >
              Upload Different CV
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </DashboardLayout>
  );
}
