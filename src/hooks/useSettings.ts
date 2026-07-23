import * as React from "react";
import type { SupabaseClient } from "@supabase/supabase-js";

import { supabase } from "@/lib/supabase";
import { useAuth } from "@/hooks/useAuth";
import type { Settings } from "@/types/domain";

const db = supabase as unknown as SupabaseClient;

export function useSettings() {
  const { user } = useAuth();
  const [settings, setSettings] = React.useState<Settings | null>(null);
  const [loading, setLoading] = React.useState(true);

  const refresh = React.useCallback(async () => {
    if (!user) {
      setSettings(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    const { data } = await db.from("settings").select("*").eq("owner_user_id", user.id).maybeSingle();
    setSettings(data as Settings | null);
    setLoading(false);
  }, [user]);

  React.useEffect(() => {
    refresh();
  }, [refresh]);

  const update = React.useCallback(
    async (patch: Partial<Settings>) => {
      if (!user) return;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error } = await db.from("settings").update(patch as any).eq("owner_user_id", user.id);
      if (error) throw new Error(error.message);
      await refresh();
    },
    [user, refresh],
  );

  return { settings, loading, update, refresh };
}
