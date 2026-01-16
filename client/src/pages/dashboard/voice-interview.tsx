import { useState, useRef, useEffect, useCallback } from "react";
import { useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Mic, MicOff, Play, Square, ArrowLeft, Loader2, Volume2, CheckCircle2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { motion, AnimatePresence } from "framer-motion";

type InterviewPhase = "warmup" | "core" | "deepdive" | "closing";

interface VoiceInterviewResponse {
  sessionKey: string;
  questionText: string;
  questionAudio: string;
  phase: InterviewPhase;
  questionNumber: number;
  totalQuestions: number;
  isComplete: boolean;
}

interface AnswerResponse {
  answerText: string;
  questionText?: string;
  questionAudio?: string;
  phase?: InterviewPhase;
  questionNumber?: number;
  totalQuestions?: number;
  isComplete: boolean;
  closingMessage?: string;
  closingAudio?: string;
  scores?: {
    overall: number;
    communication: number;
    confidence: number;
    relevance: number;
    structure: number;
  };
  conversationHistory?: Array<{ role: string; content: string }>;
}

const phaseColors: Record<InterviewPhase, string> = {
  warmup: "bg-cyan-500",
  core: "bg-blue-500",
  deepdive: "bg-purple-500",
  closing: "bg-emerald-500",
};

const phaseLabels: Record<InterviewPhase, string> = {
  warmup: "Warm-up",
  core: "Core Evaluation",
  deepdive: "Deep Dive",
  closing: "Closing",
};

function WaveformVisualizer({ isRecording, audioLevel }: { isRecording: boolean; audioLevel: number }) {
  const bars = 12;
  
  return (
    <div className="flex items-center justify-center gap-1 h-16">
      {Array.from({ length: bars }).map((_, i) => {
        const baseHeight = isRecording ? 10 + Math.random() * 30 * audioLevel : 8;
        const delay = i * 0.05;
        
        return (
          <motion.div
            key={i}
            className={`w-1.5 rounded-full ${isRecording ? "bg-red-500" : "bg-muted-foreground/30"}`}
            animate={{
              height: isRecording ? baseHeight : 8,
              opacity: isRecording ? 0.8 + audioLevel * 0.2 : 0.3,
            }}
            transition={{
              duration: 0.1,
              delay,
              ease: "easeOut",
            }}
          />
        );
      })}
    </div>
  );
}

function ScoreCard({ label, score }: { label: string; score: number }) {
  const getScoreColor = (s: number) => {
    if (s >= 80) return "text-emerald-500";
    if (s >= 60) return "text-yellow-500";
    return "text-red-500";
  };

  return (
    <div className="text-center p-4 rounded-xl bg-muted/50">
      <div className={`text-3xl font-bold ${getScoreColor(score)}`}>{score}</div>
      <div className="text-sm text-muted-foreground mt-1">{label}</div>
    </div>
  );
}

export default function VoiceInterview() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  
  const [stage, setStage] = useState<"setup" | "interview" | "complete">("setup");
  const [selectedCv, setSelectedCv] = useState<string>("");
  const [interviewType, setInterviewType] = useState<string>("behavioral");
  const [targetRole, setTargetRole] = useState<string>("");
  
  const [sessionKey, setSessionKey] = useState<string>("");
  const [currentQuestion, setCurrentQuestion] = useState<string>("");
  const [currentPhase, setCurrentPhase] = useState<InterviewPhase>("warmup");
  const [questionNumber, setQuestionNumber] = useState(0);
  const [totalQuestions, setTotalQuestions] = useState(8);
  
  const [isRecording, setIsRecording] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [audioLevel, setAudioLevel] = useState(0);
  
  const [transcript, setTranscript] = useState<Array<{ role: string; content: string }>>([]);
  const [finalScores, setFinalScores] = useState<AnswerResponse["scores"] | null>(null);
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const audioElementRef = useRef<HTMLAudioElement | null>(null);

  const { data: cvs } = useQuery<any[]>({
    queryKey: ["/api/cvs"],
  });

  const startInterviewMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/voice-interview/start", {
        cvId: parseInt(selectedCv),
        interviewType,
        targetRole: targetRole || undefined,
      });
      return res.json();
    },
    onSuccess: (data: VoiceInterviewResponse) => {
      setSessionKey(data.sessionKey);
      setCurrentQuestion(data.questionText);
      setCurrentPhase(data.phase);
      setQuestionNumber(data.questionNumber);
      setTotalQuestions(data.totalQuestions);
      setTranscript([{ role: "interviewer", content: data.questionText }]);
      setStage("interview");
      
      playAudio(data.questionAudio);
    },
    onError: (error: any) => {
      toast({
        title: "Failed to start interview",
        description: error.message || "Please try again",
        variant: "destructive",
      });
    },
  });

  const submitAnswerMutation = useMutation({
    mutationFn: async (audioBase64: string) => {
      const res = await apiRequest("POST", "/api/voice-interview/answer", {
        sessionKey,
        audio: audioBase64,
        audioFormat: "webm",
      });
      return res.json();
    },
    onSuccess: (data: AnswerResponse) => {
      setTranscript((prev) => [...prev, { role: "candidate", content: data.answerText }]);
      
      if (data.isComplete) {
        if (data.closingMessage) {
          setTranscript((prev) => [...prev, { role: "interviewer", content: data.closingMessage! }]);
        }
        if (data.scores) {
          setFinalScores(data.scores);
        }
        if (data.closingAudio) {
          playAudio(data.closingAudio);
        }
        setStage("complete");
      } else {
        if (data.questionText) {
          setCurrentQuestion(data.questionText);
          setTranscript((prev) => [...prev, { role: "interviewer", content: data.questionText! }]);
        }
        if (data.phase) setCurrentPhase(data.phase);
        if (data.questionNumber) setQuestionNumber(data.questionNumber);
        if (data.questionAudio) {
          playAudio(data.questionAudio);
        }
      }
      setIsProcessing(false);
    },
    onError: (error: any) => {
      setIsProcessing(false);
      toast({
        title: "Failed to process answer",
        description: error.message || "Please try again",
        variant: "destructive",
      });
    },
  });

  const playAudio = useCallback((base64Audio: string) => {
    if (audioElementRef.current) {
      audioElementRef.current.pause();
      audioElementRef.current = null;
    }
    
    try {
      const audio = new Audio(`data:audio/mp3;base64,${base64Audio}`);
      audioElementRef.current = audio;
      
      setIsPlaying(true);
      
      audio.onended = () => {
        setIsPlaying(false);
        audioElementRef.current = null;
      };
      audio.onerror = (e) => {
        console.error("Audio playback error:", e);
        setIsPlaying(false);
        audioElementRef.current = null;
      };
      audio.onpause = () => {
        setIsPlaying(false);
      };
      
      audio.play().catch((error) => {
        console.error("Failed to play audio:", error);
        setIsPlaying(false);
      });
    } catch (error) {
      console.error("Audio creation error:", error);
      setIsPlaying(false);
    }
  }, []);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      audioContextRef.current = new AudioContext();
      analyserRef.current = audioContextRef.current.createAnalyser();
      const source = audioContextRef.current.createMediaStreamSource(stream);
      source.connect(analyserRef.current);
      analyserRef.current.fftSize = 256;
      
      // Detect supported mimeType
      let mimeType = "audio/webm";
      if (!MediaRecorder.isTypeSupported("audio/webm")) {
        if (MediaRecorder.isTypeSupported("audio/mp4")) {
          mimeType = "audio/mp4";
        } else if (MediaRecorder.isTypeSupported("audio/ogg")) {
          mimeType = "audio/ogg";
        } else {
          mimeType = "";
        }
      }
      
      const mediaRecorder = mimeType 
        ? new MediaRecorder(stream, { mimeType })
        : new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];
      
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };
      
      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: mediaRecorder.mimeType || "audio/webm" });
        const reader = new FileReader();
        reader.onloadend = () => {
          const base64 = (reader.result as string).split(",")[1];
          setIsProcessing(true);
          submitAnswerMutation.mutate(base64);
        };
        reader.readAsDataURL(audioBlob);
        
        stream.getTracks().forEach((track) => track.stop());
      };
      
      mediaRecorder.start();
      setIsRecording(true);
      
      let isActiveRecording = true;
      const updateLevel = () => {
        if (analyserRef.current && isActiveRecording && mediaRecorderRef.current?.state === "recording") {
          const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);
          analyserRef.current.getByteFrequencyData(dataArray);
          const average = dataArray.reduce((a, b) => a + b) / dataArray.length;
          setAudioLevel(average / 255);
          animationFrameRef.current = requestAnimationFrame(updateLevel);
        }
      };
      updateLevel();
    } catch (error) {
      console.error("Failed to start recording:", error);
      toast({
        title: "Microphone access required",
        description: "Please allow microphone access to use voice interview",
        variant: "destructive",
      });
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") {
      mediaRecorderRef.current.stop();
    }
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }
    if (audioContextRef.current) {
      audioContextRef.current.close();
    }
    setIsRecording(false);
    setAudioLevel(0);
  };

  useEffect(() => {
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
      if (audioElementRef.current) {
        audioElementRef.current.pause();
      }
    };
  }, []);

  if (stage === "setup") {
    return (
      <div className="container mx-auto max-w-2xl py-8 px-4">
        <Button 
          variant="ghost" 
          onClick={() => setLocation("/dashboard")}
          className="mb-6"
          data-testid="button-back"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Dashboard
        </Button>
        
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2" data-testid="text-title">
              <Volume2 className="h-6 w-6 text-primary" />
              Voice Interview
            </CardTitle>
            <CardDescription>
              Practice with a realistic AI voice interviewer. Speak naturally and receive adaptive follow-up questions.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <label className="text-sm font-medium">Select CV</label>
              <Select value={selectedCv} onValueChange={setSelectedCv} data-testid="select-cv">
                <SelectTrigger>
                  <SelectValue placeholder="Choose a CV" />
                </SelectTrigger>
                <SelectContent>
                  {cvs?.map((cv: any) => (
                    <SelectItem key={cv.id} value={cv.id.toString()}>
                      {cv.targetRole || `CV #${cv.id}`} - {new Date(cv.createdAt).toLocaleDateString()}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium">Interview Type</label>
              <Select value={interviewType} onValueChange={setInterviewType} data-testid="select-type">
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="behavioral">Behavioral</SelectItem>
                  <SelectItem value="technical">Technical</SelectItem>
                  <SelectItem value="hr">HR / Screening</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium">Target Role (Optional)</label>
              <input
                type="text"
                value={targetRole}
                onChange={(e) => setTargetRole(e.target.value)}
                placeholder="e.g., Senior Software Engineer"
                className="w-full px-3 py-2 border rounded-md bg-background"
                data-testid="input-role"
              />
            </div>
            
            <div className="bg-muted/50 rounded-lg p-4 text-sm text-muted-foreground">
              <p className="font-medium text-foreground mb-2">How it works:</p>
              <ul className="space-y-1 list-disc list-inside">
                <li>The AI interviewer will speak questions aloud</li>
                <li>Click the microphone to record your answer</li>
                <li>Questions adapt based on your responses</li>
                <li>Receive detailed feedback after completion</li>
              </ul>
              <p className="mt-3 text-xs">Cost: 20 credits</p>
            </div>
            
            <Button 
              onClick={() => startInterviewMutation.mutate()}
              disabled={!selectedCv || startInterviewMutation.isPending}
              className="w-full"
              size="lg"
              data-testid="button-start"
            >
              {startInterviewMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Starting Interview...
                </>
              ) : (
                <>
                  <Play className="h-4 w-4 mr-2" />
                  Start Voice Interview
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (stage === "complete") {
    return (
      <div className="container mx-auto max-w-3xl py-8 px-4">
        <Card>
          <CardHeader className="text-center">
            <div className="mx-auto w-16 h-16 rounded-full bg-emerald-500/10 flex items-center justify-center mb-4">
              <CheckCircle2 className="h-8 w-8 text-emerald-500" />
            </div>
            <CardTitle data-testid="text-complete-title">Interview Complete</CardTitle>
            <CardDescription>
              Great job! Here's your performance summary.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {finalScores && (
              <div className="space-y-4">
                <div className="text-center">
                  <div className="text-5xl font-bold text-primary" data-testid="text-overall-score">
                    {finalScores.overall}
                  </div>
                  <div className="text-muted-foreground">Overall Score</div>
                </div>
                
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <ScoreCard label="Communication" score={finalScores.communication} />
                  <ScoreCard label="Confidence" score={finalScores.confidence} />
                  <ScoreCard label="Relevance" score={finalScores.relevance} />
                  <ScoreCard label="Structure" score={finalScores.structure} />
                </div>
              </div>
            )}
            
            <div className="space-y-2">
              <h3 className="font-semibold">Conversation Transcript</h3>
              <div className="max-h-64 overflow-y-auto space-y-3 p-4 bg-muted/30 rounded-lg">
                {transcript.map((entry, i) => (
                  <div 
                    key={i}
                    className={`flex gap-3 ${entry.role === "candidate" ? "justify-end" : ""}`}
                  >
                    <div 
                      className={`max-w-[80%] p-3 rounded-lg text-sm ${
                        entry.role === "candidate" 
                          ? "bg-primary text-primary-foreground" 
                          : "bg-muted"
                      }`}
                      data-testid={`text-transcript-${i}`}
                    >
                      <p className="font-medium text-xs mb-1 opacity-70">
                        {entry.role === "candidate" ? "You" : "Interviewer"}
                      </p>
                      {entry.content}
                    </div>
                  </div>
                ))}
              </div>
            </div>
            
            <Button 
              onClick={() => setLocation("/dashboard")}
              className="w-full"
              data-testid="button-dashboard"
            >
              Return to Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto max-w-3xl py-8 px-4">
      <div className="flex items-center justify-between mb-6">
        <Button 
          variant="ghost" 
          onClick={() => {
            if (confirm("Are you sure you want to end this interview?")) {
              setLocation("/dashboard");
            }
          }}
          data-testid="button-exit"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Exit
        </Button>
        
        <div className="flex items-center gap-2">
          <Badge className={phaseColors[currentPhase]} data-testid="badge-phase">
            {phaseLabels[currentPhase]}
          </Badge>
          <span className="text-sm text-muted-foreground" data-testid="text-progress">
            Question {questionNumber} of {totalQuestions}
          </span>
        </div>
      </div>
      
      <Progress value={(questionNumber / totalQuestions) * 100} className="mb-8" />
      
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
              <Volume2 className="h-5 w-5 text-primary" />
            </div>
            <div className="flex-1">
              <p className="text-xs text-muted-foreground mb-1">Interviewer</p>
              <AnimatePresence mode="wait">
                <motion.p
                  key={currentQuestion}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="text-lg"
                  data-testid="text-question"
                >
                  {currentQuestion}
                </motion.p>
              </AnimatePresence>
            </div>
          </div>
          
          {isPlaying && (
            <div className="mt-4 flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Volume2 className="h-4 w-4 animate-pulse" />
                Speaking...
              </div>
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => {
                  if (audioElementRef.current) {
                    audioElementRef.current.pause();
                    audioElementRef.current = null;
                  }
                  setIsPlaying(false);
                }}
                data-testid="button-skip-audio"
              >
                Skip
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
      
      <Card>
        <CardContent className="py-8">
          <div className="text-center">
            <WaveformVisualizer isRecording={isRecording} audioLevel={audioLevel} />
            
            <div className="mt-6">
              {isProcessing ? (
                <div className="flex flex-col items-center gap-2">
                  <Loader2 className="h-12 w-12 animate-spin text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">Processing your answer...</p>
                </div>
              ) : (
                <Button
                  size="lg"
                  variant={isRecording ? "destructive" : "default"}
                  onClick={() => {
                    if (isRecording) {
                      stopRecording();
                    } else {
                      // Stop any playing audio first
                      if (audioElementRef.current) {
                        audioElementRef.current.pause();
                        audioElementRef.current = null;
                      }
                      setIsPlaying(false);
                      startRecording();
                    }
                  }}
                  className="h-16 w-16 rounded-full"
                  data-testid="button-record"
                >
                  {isRecording ? (
                    <Square className="h-6 w-6" />
                  ) : (
                    <Mic className="h-6 w-6" />
                  )}
                </Button>
              )}
            </div>
            
            <p className="mt-4 text-sm text-muted-foreground">
              {isRecording 
                ? "Recording... Click to stop" 
                : isPlaying 
                  ? "Listen to the question..."
                  : "Click to start recording your answer"
              }
            </p>
          </div>
        </CardContent>
      </Card>
      
      {transcript.length > 2 && (
        <div className="mt-6 space-y-2">
          <p className="text-sm font-medium text-muted-foreground">Previous exchanges:</p>
          <div className="max-h-48 overflow-y-auto space-y-2 p-3 bg-muted/30 rounded-lg text-sm">
            {transcript.slice(0, -2).map((entry, i) => (
              <div key={i} className={entry.role === "candidate" ? "text-right" : ""}>
                <span className="text-xs text-muted-foreground">
                  {entry.role === "candidate" ? "You: " : "Interviewer: "}
                </span>
                <span className={entry.role === "candidate" ? "text-primary" : ""}>
                  {entry.content.substring(0, 100)}...
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
