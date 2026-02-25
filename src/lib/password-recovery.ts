import { supabase } from "@/integrations/supabase/client";

export type RecoveryBootstrapResult = {
  valid: boolean;
  reason?: string;
};

function getHashParams() {
  const hash = window.location.hash.startsWith("#")
    ? window.location.hash.slice(1)
    : window.location.hash;
  return new URLSearchParams(hash);
}

function clearRecoveryParams() {
  const cleanUrl = `${window.location.origin}${window.location.pathname}`;
  window.history.replaceState(null, "", cleanUrl);
}

export async function bootstrapRecoverySession(): Promise<RecoveryBootstrapResult> {
  const hashParams = getHashParams();
  const queryParams = new URLSearchParams(window.location.search);

  const accessToken = hashParams.get("access_token");
  const refreshToken = hashParams.get("refresh_token");
  const hashType = hashParams.get("type");

  if (accessToken && refreshToken && hashType === "recovery") {
    const { error } = await supabase.auth.setSession({
      access_token: accessToken,
      refresh_token: refreshToken,
    });

    if (error) {
      return { valid: false, reason: "invalid_or_expired" };
    }

    clearRecoveryParams();
    return { valid: true };
  }

  const code = queryParams.get("code");
  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (error) {
      return { valid: false, reason: "invalid_or_expired" };
    }

    clearRecoveryParams();
    return { valid: true };
  }

  const { data } = await supabase.auth.getSession();
  if (data.session) {
    return { valid: true };
  }

  return { valid: false, reason: "invalid_or_expired" };
}
