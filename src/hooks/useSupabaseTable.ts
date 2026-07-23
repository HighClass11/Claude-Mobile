import * as React from "react";
import type { SupabaseClient } from "@supabase/supabase-js";

import { supabase } from "@/lib/supabase";
import { useAuth } from "@/hooks/useAuth";

// Table names are dynamic here, so this generic helper talks to the client
// through an untyped view; concrete entity hooks pin the Row/Insert/Update
// generics and restore full type safety at the call site.
const db = supabase as unknown as SupabaseClient;

// Generic CRUD + realtime hook shared by every entity hook in src/hooks/entities.
// Internally untyped against the Supabase client (table names are dynamic), but
// every exported entity hook (useTasks, usePipeline, ...) pins Row/Insert/Update
// to its concrete domain type, so callers get full type safety.
export function useSupabaseTable<Row, InsertRow, UpdateRow>(
  table: string,
  opts: { orderBy?: string; ascending?: boolean } = {},
) {
  const { user } = useAuth();
  const [data, setData] = React.useState<Row[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  const refresh = React.useCallback(async () => {
    if (!user) {
      setData([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    let query = db.from(table).select("*");
    if (opts.orderBy) query = query.order(opts.orderBy, { ascending: opts.ascending ?? true });
    const { data: rows, error: err } = await query;
    if (err) setError(err.message);
    else {
      setError(null);
      setData((rows ?? []) as Row[]);
    }
    setLoading(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, table, opts.orderBy, opts.ascending]);

  React.useEffect(() => {
    refresh();
  }, [refresh]);

  React.useEffect(() => {
    if (!user) return;
    const channel = db
      .channel(`realtime:${table}:${user.id}`)
      .on("postgres_changes", { event: "*", schema: "public", table }, () => refresh())
      .subscribe();
    return () => {
      db.removeChannel(channel);
    };
  }, [user, table, refresh]);

  const insert = React.useCallback(
    async (row: InsertRow) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: inserted, error: err } = await db.from(table).insert(row as any).select().single();
      if (err) throw new Error(err.message);
      await refresh();
      return inserted as Row;
    },
    [table, refresh],
  );

  const update = React.useCallback(
    async (id: string, patch: UpdateRow) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error: err } = await db.from(table).update(patch as any).eq("id", id);
      if (err) throw new Error(err.message);
      await refresh();
    },
    [table, refresh],
  );

  const remove = React.useCallback(
    async (id: string) => {
      const { error: err } = await db.from(table).delete().eq("id", id);
      if (err) throw new Error(err.message);
      await refresh();
    },
    [table, refresh],
  );

  return { data, loading, error, refresh, insert, update, remove };
}
