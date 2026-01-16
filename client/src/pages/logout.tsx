import { useState } from "react";
import { useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { LogOut, ArrowLeft, Loader2 } from "lucide-react";

export default function LogoutPage() {
  const [, setLocation] = useLocation();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleLogout = async () => {
    setIsLoggingOut(true);
    window.location.href = "/api/logout";
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md border-card-border">
        <CardHeader className="text-center space-y-4">
          <div className="mx-auto w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center">
            <LogOut className="h-8 w-8 text-destructive" />
          </div>
          <div>
            <CardTitle className="text-2xl">Log Out</CardTitle>
            <CardDescription className="mt-2">
              Are you sure you want to log out of your account?
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button
            variant="destructive"
            className="w-full gap-2"
            onClick={handleLogout}
            disabled={isLoggingOut}
            data-testid="button-confirm-logout"
          >
            {isLoggingOut ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <LogOut className="h-4 w-4" />
            )}
            {isLoggingOut ? "Logging out..." : "Yes, Log Out"}
          </Button>
          <Button
            variant="outline"
            className="w-full gap-2"
            onClick={() => setLocation("/dashboard")}
            disabled={isLoggingOut}
            data-testid="button-cancel-logout"
          >
            <ArrowLeft className="h-4 w-4" />
            Go Back
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
