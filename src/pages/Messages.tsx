import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, MessageSquare, Loader2, Building2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";

interface Thread {
  userId: string;
  name: string;
  avatarUrl: string | null;
  lastMessage: string;
  lastMessageAt: string;
  unreadCount: number;
}

export default function Messages() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [threads, setThreads] = useState<Thread[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) navigate("/auth");
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (user) fetchThreads();
  }, [user]);

  // Realtime: refresh threads on new messages
  useEffect(() => {
    if (!user) return;
    const channel = supabase
      .channel("threads-refresh")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "messages", filter: `receiver_id=eq.${user.id}` }, () => fetchThreads())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [user]);

  const fetchThreads = async () => {
    if (!user) return;
    const { data: msgs } = await supabase
      .from("messages")
      .select("*")
      .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`)
      .order("created_at", { ascending: false });

    if (!msgs || msgs.length === 0) { setThreads([]); setLoading(false); return; }

    // Group by other user
    const threadMap = new Map<string, { lastMessage: string; lastMessageAt: string; unreadCount: number }>();
    for (const m of msgs) {
      const otherId = m.sender_id === user.id ? m.receiver_id : m.sender_id;
      if (!threadMap.has(otherId)) {
        threadMap.set(otherId, { lastMessage: m.content, lastMessageAt: m.created_at, unreadCount: 0 });
      }
      if (m.receiver_id === user.id && !m.is_read) {
        const t = threadMap.get(otherId)!;
        t.unreadCount++;
      }
    }

    // Fetch profiles
    const userIds = [...threadMap.keys()];
    const { data: profiles } = await supabase.from("profiles").select("user_id, full_name, avatar_url").in("user_id", userIds);
    const profileMap = new Map((profiles || []).map(p => [p.user_id, p]));

    const result: Thread[] = userIds.map(uid => {
      const t = threadMap.get(uid)!;
      const p = profileMap.get(uid);
      return { userId: uid, name: p?.full_name || "Unknown", avatarUrl: p?.avatar_url || null, ...t };
    });

    // Sort by last message time
    result.sort((a, b) => new Date(b.lastMessageAt).getTime() - new Date(a.lastMessageAt).getTime());
    setThreads(result);
    setLoading(false);
  };

  if (authLoading || loading) {
    return <div className="flex min-h-screen items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card">
        <div className="container flex h-14 items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}><ArrowLeft className="h-5 w-5" /></Button>
          <h1 className="font-display text-lg font-bold text-foreground">Messages</h1>
        </div>
      </header>

      <main className="container max-w-2xl py-6">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          {threads.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                <MessageSquare className="h-10 w-10 text-muted-foreground/30 mb-3" />
                <h3 className="font-display font-semibold text-foreground">No messages yet</h3>
                <p className="text-sm text-muted-foreground mt-1">Messages from project requests will appear here.</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-2">
              {threads.map((t) => (
                <Card key={t.userId} className="cursor-pointer hover:bg-muted/50 transition-colors" onClick={() => navigate(`/messages/${t.userId}`)}>
                  <CardContent className="flex items-center gap-3 p-4">
                    <Avatar className="h-10 w-10 shrink-0">
                      <AvatarImage src={t.avatarUrl || undefined} />
                      <AvatarFallback>{t.name.charAt(0).toUpperCase()}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <p className="font-semibold text-foreground truncate">{t.name}</p>
                        <span className="text-xs text-muted-foreground shrink-0">
                          {new Date(t.lastMessageAt).toLocaleDateString()}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground truncate mt-0.5">{t.lastMessage}</p>
                    </div>
                    {t.unreadCount > 0 && (
                      <Badge className="bg-primary text-primary-foreground shrink-0">{t.unreadCount}</Badge>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </motion.div>
      </main>
    </div>
  );
}
