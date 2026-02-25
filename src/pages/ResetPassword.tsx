import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Building2, Lock, Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

export default function ResetPassword() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [validSession, setValidSession] = useState(false);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    let cancelled = false;

    const establishRecoverySession = async () => {
      try {
        // 1. Try to extract tokens from URL hash (Supabase puts them there on redirect)
        const hashParams = new URLSearchParams(window.location.hash.substring(1));
        const accessToken = hashParams.get("access_token");
        const refreshToken = hashParams.get("refresh_token");
        const type = hashParams.get("type");

        if (accessToken && refreshToken) {
          // Explicitly set the session from the recovery tokens
          const { error } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken,
          });
          if (!error && !cancelled) {
            setValidSession(true);
            // Clean up the hash from the URL
            window.history.replaceState(null, "", window.location.pathname);
            setChecking(false);
            return;
          }
        }

        // 2. Also check query params (some redirect formats use these)
        const urlParams = new URLSearchParams(window.location.search);
        const code = urlParams.get("code");
        if (code) {
          const { error } = await supabase.auth.exchangeCodeForSession(code);
          if (!error && !cancelled) {
            setValidSession(true);
            window.history.replaceState(null, "", window.location.pathname);
            setChecking(false);
            return;
          }
        }

        // 3. Check if there's already a valid session (user may have been redirected and session already set)
        const { data: { session } } = await supabase.auth.getSession();
        if (session && !cancelled) {
          setValidSession(true);
          setChecking(false);
          return;
        }

        // 4. Listen for auth state changes as final fallback
        const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
          if (cancelled) return;
          if (event === "PASSWORD_RECOVERY" || event === "SIGNED_IN") {
            setValidSession(true);
            setChecking(false);
          }
        });

        // Wait a short time for the auth state change, then give up
        setTimeout(() => {
          if (!cancelled) {
            setChecking(false);
            subscription.unsubscribe();
          }
        }, 3000);

        return () => subscription.unsubscribe();
      } catch (err) {
        console.error("Error establishing recovery session:", err);
        if (!cancelled) setChecking(false);
      }
    };

    establishRecoverySession();
    return () => { cancelled = true; };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      toast({ title: "Passwords don't match", variant: "destructive" });
      return;
    }
    if (password.length < 6) {
      toast({ title: "Password too short", description: "Minimum 6 characters.", variant: "destructive" });
      return;
    }
    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) {
        // Handle specific error for same password
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
      // Sign out after password change so user logs in fresh
      await supabase.auth.signOut();
      toast({ title: "Password updated!", description: "Please log in with your new password." });
      navigate("/auth");
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
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
            <p className="mt-4 text-sm text-muted-foreground">Verifying your reset link...</p>
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
            <CardDescription>This password reset link is invalid or has expired.</CardDescription>
          </CardHeader>
          <CardContent>
            <Link to="/forgot-password">
              <Button className="w-full">Request a new link</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

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
            <CardDescription>Enter your new password below.</CardDescription>
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
                    placeholder="Min. 6 characters"
                    className="pl-10 pr-10"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    minLength={6}
                  />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
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
                    minLength={6}
                  />
                </div>
              </div>
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? "Updating..." : "Update Password"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
