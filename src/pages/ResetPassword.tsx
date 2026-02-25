import { useState, useEffect, useRef } from "react";
import { useNavigate, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Building2, Lock, Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import PasswordStrengthIndicator, { validatePassword } from "@/components/PasswordStrengthIndicator";

const SESSION_TIMEOUT_MS = 8000;
const UPDATE_TIMEOUT_MS = 12000;

export default function ResetPassword() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [validSession, setValidSession] = useState(false);
  const [checking, setChecking] = useState(true);
  const handled = useRef(false);

  useEffect(() => {
    if (handled.current) return;
    handled.current = true;

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if ((event === "PASSWORD_RECOVERY" || event === "SIGNED_IN") && session) {
        setValidSession(true);
        setChecking(false);
        window.history.replaceState(null, "", window.location.pathname);
      }
    });

    const timeout = setTimeout(() => {
      setChecking((prev) => {
        if (prev) {
          setValidSession(false);
          return false;
        }
        return prev;
      });
    }, SESSION_TIMEOUT_MS);

    return () => {
      clearTimeout(timeout);
      subscription.unsubscribe();
    };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;

    if (!validatePassword(password)) {
      toast({
        title: "Password too weak",
        description: "Please meet all the password requirements listed below.",
        variant: "destructive",
      });
      return;
    }

    if (password !== confirmPassword) {
      toast({ title: "Passwords don't match", variant: "destructive" });
      return;
    }

    setLoading(true);
    try {
      const timeoutPromise = new Promise<{ data: { user: null }; error: Error }>((resolve) => {
        setTimeout(() => {
          resolve({
            data: { user: null },
            error: new Error("Password update timed out. Please request a fresh reset link."),
          });
        }, UPDATE_TIMEOUT_MS);
      });

      const { error } = await Promise.race([
        supabase.auth.updateUser({ password }),
        timeoutPromise,
      ]);

      if (error) {
        if (error.message?.toLowerCase().includes("same password")) {
          toast({
            title: "Choose a different password",
            description: "Your new password must be different from your current password.",
            variant: "destructive",
          });
        } else {
          throw error;
        }
        return;
      }

      // Navigate immediately — don't block on signOut lock contention
      navigate("/auth", { replace: true });
      toast({
        title: "Password updated successfully!",
        description: "You've been logged out of all sessions. Please log in with your new password.",
      });

      // Sign out in background to invalidate sessions
      setTimeout(() => {
        void supabase.auth.signOut({ scope: "local" }).catch(() => {});
      }, 0);
    } catch (error: any) {
      const msg = error?.message || "Something went wrong";
      if (msg.toLowerCase().includes("lock") || msg.toLowerCase().includes("timed out")) {
        toast({
          title: "Session busy",
          description: "Please close duplicate tabs for this app and try once more.",
          variant: "destructive",
        });
      } else {
        toast({ title: "Error", description: msg, variant: "destructive" });
      }
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
              This password reset link is invalid, expired, or has already been used.
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
            <CardDescription>
              Choose a strong password for your account.
            </CardDescription>
          </CardHeader>
          <CardContent>
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
                {passwordsMatch && (
                  <p className="text-xs text-green-500">Passwords match ✓</p>
                )}
              </div>

              <Button
                type="submit"
                className="w-full"
                disabled={loading || !passwordValid || !passwordsMatch}
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
