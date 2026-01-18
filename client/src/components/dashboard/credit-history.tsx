import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  ArrowDownCircle, 
  ArrowUpCircle, 
  Gift, 
  RefreshCw,
  FileText,
  MessageSquare,
  Mic,
  ClipboardCheck
} from "lucide-react";
import { format } from "date-fns";

interface CreditTransaction {
  id: number;
  userId: string;
  amount: number;
  balanceAfter: number;
  transactionType: string;
  source: string;
  featureKey: string | null;
  packageId: number | null;
  referenceId: string | null;
  createdAt: string;
}

const featureIcons: Record<string, typeof FileText> = {
  cv_optimization: FileText,
  start_interview: MessageSquare,
  voice_interview: Mic,
  interview_evaluation: ClipboardCheck,
};

const featureLabels: Record<string, string> = {
  cv_optimization: "CV Optimization",
  start_interview: "Mock Interview",
  voice_interview: "Voice Interview",
  interview_evaluation: "Interview Evaluation",
};

const sourceLabels: Record<string, string> = {
  payment: "Purchase",
  signup_bonus: "Welcome Bonus",
  referral: "Referral Bonus",
  promo_code: "Promo Code",
  admin_grant: "Admin Grant",
  feature_use: "Feature Usage",
  refund: "Refund",
};

function getTransactionIcon(transaction: CreditTransaction) {
  if (transaction.amount > 0) {
    if (transaction.transactionType === "bonus") return Gift;
    if (transaction.transactionType === "refund") return RefreshCw;
    return ArrowUpCircle;
  }
  
  if (transaction.featureKey && featureIcons[transaction.featureKey]) {
    return featureIcons[transaction.featureKey];
  }
  
  return ArrowDownCircle;
}

function getTransactionLabel(transaction: CreditTransaction): string {
  if (transaction.featureKey && featureLabels[transaction.featureKey]) {
    return featureLabels[transaction.featureKey];
  }
  
  if (sourceLabels[transaction.source]) {
    return sourceLabels[transaction.source];
  }
  
  return transaction.transactionType.charAt(0).toUpperCase() + transaction.transactionType.slice(1);
}

export function CreditHistory() {
  const { data: transactions, isLoading } = useQuery<CreditTransaction[]>({
    queryKey: ["/api/credit-history"],
  });

  if (isLoading) {
    return (
      <Card className="border-card-border">
        <CardHeader>
          <CardTitle>Credit History</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="flex items-center gap-4">
              <Skeleton className="h-10 w-10 rounded-full" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-3 w-16" />
              </div>
              <Skeleton className="h-4 w-16" />
            </div>
          ))}
        </CardContent>
      </Card>
    );
  }

  if (!transactions || transactions.length === 0) {
    return (
      <Card className="border-card-border">
        <CardHeader>
          <CardTitle>Credit History</CardTitle>
          <CardDescription>Your credit transactions will appear here</CardDescription>
        </CardHeader>
        <CardContent className="py-8 text-center text-muted-foreground">
          No transactions yet
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-card-border" data-testid="card-credit-history">
      <CardHeader>
        <CardTitle>Credit History</CardTitle>
        <CardDescription>Recent credit transactions</CardDescription>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[300px] pr-4">
          <div className="space-y-4">
            {transactions.map(transaction => {
              const Icon = getTransactionIcon(transaction);
              const isPositive = transaction.amount > 0;
              
              return (
                <div 
                  key={transaction.id} 
                  className="flex items-center gap-4 py-2 border-b border-border last:border-0"
                  data-testid={`transaction-${transaction.id}`}
                >
                  <div className={`p-2 rounded-full ${isPositive ? "bg-chart-2/10" : "bg-muted"}`}>
                    <Icon className={`h-4 w-4 ${isPositive ? "text-chart-2" : "text-muted-foreground"}`} />
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">
                      {getTransactionLabel(transaction)}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {format(new Date(transaction.createdAt), "MMM d, yyyy 'at' h:mm a")}
                    </p>
                  </div>
                  
                  <div className="text-right">
                    <Badge 
                      variant={isPositive ? "default" : "secondary"}
                      className={isPositive ? "bg-chart-2 hover:bg-chart-2/90" : ""}
                    >
                      {isPositive ? "+" : ""}{transaction.amount}
                    </Badge>
                    <p className="text-xs text-muted-foreground mt-1">
                      Bal: {transaction.balanceAfter}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
