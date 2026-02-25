import { useEffect, useState, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Send, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";

interface Message {
  id: string;
  sender_id: string;
  receiver_id: string;
  content: string;
  created_at: string;
  is_read: boolean;
}

interface OtherUser {
  name: string;
  avatarUrl: string | null;
}

export default function Conversation() {
  const { userId } = useParams<{ userId: string }>();
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [messages, setMessages] = useState<Message[]>([]);
  const [otherUser, setOtherUser] = useState<OtherUser>({ name: "...", avatarUrl: null });
  const [newMsg, setNewMsg] = useState("");
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!authLoading && !user) navigate("/auth");
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (user && userId) {
      fetchMessages();
      fetchOtherUser();
    }
  }, [user, userId]);

  // Realtime
  useEffect(() => {
    if (!user || !userId) return;
    const channel = supabase
      .channel(`chat-${userId}`)
      .on("postgres_changes", {
        event: "INSERT", schema: "public", table: "messages",
      }, (payload) => {
        const msg = payload.new as Message;
        if ((msg.sender_id === userId && msg.receiver_id === user.id) ||
            (msg.sender_id === user.id && msg.receiver_id === userId)) {
          setMessages(prev => [...prev, msg]);
          // Mark as read if we're the receiver
          if (msg.receiver_id === user.id) {
            supabase.from("messages").update({ is_read: true }).eq("id", msg.id).then();
          }
        }
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [user, userId]);

  // Auto-scroll
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const fetchOtherUser = async () => {
    if (!userId) return;
    const { data } = await supabase.from("profiles").select("full_name, avatar_url").eq("user_id", userId).maybeSingle();
    if (data) setOtherUser({ name: data.full_name, avatarUrl: data.avatar_url });
  };

  const fetchMessages = async () => {
    if (!user || !userId) return;
    // Get all messages between these two users
    const { data } = await supabase
      .from("messages")
      .select("*")
      .or(`and(sender_id.eq.${user.id},receiver_id.eq.${userId}),and(sender_id.eq.${userId},receiver_id.eq.${user.id})`)
      .order("created_at", { ascending: true });
    setMessages(data || []);
    setLoading(false);

    // Mark unread messages as read
    if (data && data.length > 0) {
      const unreadIds = data.filter(m => m.receiver_id === user.id && !m.is_read).map(m => m.id);
      if (unreadIds.length > 0) {
        await supabase.from("messages").update({ is_read: true }).in("id", unreadIds);
      }
    }
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMsg.trim() || !user || !userId) return;
    setSending(true);
    const { error } = await supabase.from("messages").insert({
      sender_id: user.id,
      receiver_id: userId,
      content: newMsg.trim(),
    });
    if (!error) setNewMsg("");
    setSending(false);
  };

  if (authLoading || loading) {
    return <div className="flex min-h-screen items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  }

  return (
    <div className="flex min-h-screen flex-col bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card shrink-0">
        <div className="container flex h-14 items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate("/messages")}><ArrowLeft className="h-5 w-5" /></Button>
          <Avatar className="h-8 w-8">
            <AvatarImage src={otherUser.avatarUrl || undefined} />
            <AvatarFallback>{otherUser.name.charAt(0).toUpperCase()}</AvatarFallback>
          </Avatar>
          <h1 className="font-display text-lg font-bold text-foreground truncate">{otherUser.name}</h1>
        </div>
      </header>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
        {messages.length === 0 && (
          <p className="text-center text-sm text-muted-foreground py-8">No messages yet. Say hello!</p>
        )}
        {messages.map((m) => {
          const isMine = m.sender_id === user?.id;
          return (
            <div key={m.id} className={`flex ${isMine ? "justify-end" : "justify-start"}`}>
              <div className={`max-w-[75%] rounded-2xl px-4 py-2.5 text-sm ${
                isMine
                  ? "bg-primary text-primary-foreground rounded-br-md"
                  : "bg-muted text-foreground rounded-bl-md"
              }`}>
                <p>{m.content}</p>
                <p className={`text-[10px] mt-1 ${isMine ? "text-primary-foreground/60" : "text-muted-foreground"}`}>
                  {new Date(m.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                </p>
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="border-t border-border bg-card p-3 shrink-0 mb-16 md:mb-0">
        <form onSubmit={handleSend} className="container flex gap-2">
          <Input
            value={newMsg}
            onChange={(e) => setNewMsg(e.target.value)}
            placeholder="Type a message..."
            className="flex-1"
            autoFocus
          />
          <Button type="submit" size="icon" disabled={sending || !newMsg.trim()}>
            {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          </Button>
        </form>
      </div>
    </div>
  );
}
