import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Building2, Lock, Eye, EyeOff, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import PasswordStrengthIndicator, { validatePassword } from "@/components/PasswordStrengthIndicator";
import { bootstrapRecoverySession } from "@/lib/password-recovery";

const SUCCESS_REDIRECT_MS = 2500;

export default function ResetPassword() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [validSession, setValidSession] = useState(false);
  const [checking, setChecking] = useState(true);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    const init = async () => {
      setChecking(true);
      const result = await bootstrapRecoverySession();
      if (!mounted) return;

      setValidSession(result.valid);
      setChecking(false);

      if (!result.valid) {
        setStatusMessage("This password reset link is invalid, expired, or already used.");
      }
    };

    void init();

    return () => {
      mounted = false;
    };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;

    if (!validatePassword(password)) {
      toast({
        title: "Password too weak",
        description: "Please meet all password requirements before continuing.",
        variant: "destructive",
      });
      return;
    }

    if (password !== confirmPassword) {
      toast({
        title: "Passwords do not match",
        description: "Please ensure both password fields are identical.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({ password });

      if (error) {
        throw error;
      }

      setStatusMessage("Your password has been successfully changed.");

      toast({
        title: "Password reset successful",
        description: "Your password was updated. Redirecting to login…",
      });

      // Sign out from all devices/sessions after password change.
      await supabase.auth.signOut({ scope: "global" });

      window.setTimeout(() => {
        navigate("/auth?tab=login&reset=success", { replace: true });
      }, SUCCESS_REDIRECT_MS);
    } catch (error: any) {
      const message = String(error?.message || "Unable to reset password.").toLowerCase();

      if (message.includes("session") || message.includes("expired") || message.includes("token")) {
        setValidSession(false);
        setStatusMessage("Your reset link is no longer valid. Please request a new one.");
      } else if (message.includes("same password")) {
        setStatusMessage("Please choose a new password different from your current password.");
      } else {
        setStatusMessage(error?.message || "Unable to reset password. Please try again.");
      }

      toast({
        title: "Password reset failed",
        description: error?.message || "Please request a new reset link and try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (checking) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4">
        <Card className="w-full max-w-md">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
            <p className="mt-4 text-sm text-muted-foreground">Verifying your reset link…</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!validSession) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Invalid or Expired Link</CardTitle>
            <CardDescription>
              {statusMessage || "This password reset link is invalid, expired, or has already been used."}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Link to="/forgot-password">
              <Button className="w-full">Request a new link</Button>
            </Link>
            <Link to="/auth">
              <Button variant="outline" className="w-full">Back to Login</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  const passwordValid = validatePassword(password);
  const passwordsMatch = password === confirmPassword && confirmPassword.length > 0;

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4 py-8">
      <motion.div
        className="w-full max-w-md"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <div className="mb-8 flex flex-col items-center text-center">
          <Link to="/" className="mb-4 flex items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary">
              <Building2 className="h-6 w-6 text-primary-foreground" />
            </div>
            <span className="font-display text-2xl font-bold text-foreground">Larmex Hub</span>
          </Link>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Set New Password</CardTitle>
            <CardDescription>Choose a strong password for your account.</CardDescription>
          </CardHeader>
          <CardContent>
            {statusMessage === "Your password has been successfully changed." && (
              <Alert className="mb-4">
                <CheckCircle2 className="h-4 w-4" />
                <AlertTitle>Password Updated</AlertTitle>
                <AlertDescription>
                  Your password has been successfully changed. Redirecting to login now.
                </AlertDescription>
              </Alert>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="new-password">New Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="new-password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter new password"
                    className="pl-10 pr-10"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    autoComplete="new-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                <PasswordStrengthIndicator password={password} />
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirm-password">Confirm Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="confirm-password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Re-enter password"
                    className="pl-10 pr-10"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    autoComplete="new-password"
                  />
                </div>
                {confirmPassword && !passwordsMatch && (
                  <p className="text-xs text-destructive">Passwords do not match</p>
                )}
                {passwordsMatch && <p className="text-xs text-primary">Passwords match ✓</p>}
              </div>

              <Button
                type="submit"
                className="w-full"
                disabled={loading || !passwordValid || !passwordsMatch || statusMessage === "Your password has been successfully changed."}
              >
                {loading ? "Updating…" : "Update Password"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
