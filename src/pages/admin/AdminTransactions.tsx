import { useEffect, useState } from "react";
import { Loader2, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";

interface TransactionRow {
  id: string;
  user_id: string;
  type: string;
  amount_kes: number;
  commission_kes: number;
  status: string;
  reference: string | null;
  created_at: string;
}

export default function AdminTransactions() {
  const [transactions, setTransactions] = useState<TransactionRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");

  useEffect(() => {
    fetchTransactions();
  }, [filter]);

  const fetchTransactions = async () => {
    setLoading(true);
    let query = supabase
      .from("transactions")
      .select("id, user_id, type, amount_kes, commission_kes, status, reference, created_at")
      .order("created_at", { ascending: false })
      .limit(100);

    if (filter !== "all") {
      query = query.eq("status", filter);
    }

    const { data } = await query;
    setTransactions(data || []);
    setLoading(false);
  };

  const statusColor = (s: string) => {
    switch (s) {
      case "completed": return "bg-emerald-500/10 text-emerald-600";
      case "pending": return "bg-amber-500/10 text-amber-600";
      case "failed": return "bg-destructive/10 text-destructive";
      default: return "bg-muted text-muted-foreground";
    }
  };

  const total = transactions.reduce((sum, t) => sum + Number(t.amount_kes), 0);
  const totalCommission = transactions.reduce((sum, t) => sum + Number(t.commission_kes), 0);

  return (
    <div>
      <h1 className="font-display text-2xl font-bold text-foreground mb-4">Transactions</h1>

      <div className="grid gap-4 grid-cols-2 sm:grid-cols-3 mb-4">
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-xs text-muted-foreground">Total Volume</p>
            <p className="font-display text-xl font-bold mt-1">KES {total.toLocaleString()}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-xs text-muted-foreground">Total Commission</p>
            <p className="font-display text-xl font-bold mt-1">KES {totalCommission.toLocaleString()}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-xs text-muted-foreground">Transactions</p>
            <p className="font-display text-xl font-bold mt-1">{transactions.length}</p>
          </CardContent>
        </Card>
      </div>

      <div className="flex gap-3 mb-4">
        <Select value={filter} onValueChange={setFilter}>
          <SelectTrigger className="w-[150px]"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
            <SelectItem value="failed">Failed</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {loading ? (
        <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
      ) : transactions.length === 0 ? (
        <p className="text-center text-muted-foreground py-12">No transactions found.</p>
      ) : (
        <div className="space-y-2">
          {transactions.map(t => (
            <Card key={t.id}>
              <CardContent className="flex items-center gap-4 p-4">
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-foreground">KES {Number(t.amount_kes).toLocaleString()}</p>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
                    <span className="capitalize">{t.type}</span>
                    {t.reference && <><span>·</span><span>{t.reference}</span></>}
                    <span>·</span>
                    <span>{new Date(t.created_at).toLocaleDateString()}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {t.commission_kes > 0 && <span className="text-xs text-muted-foreground">Fee: KES {Number(t.commission_kes).toLocaleString()}</span>}
                  <Badge className={`${statusColor(t.status)} capitalize`}>{t.status}</Badge>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
