import { Navigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { supabase } from "@/libs/supabaseClient";

export default function RequireSubscription({ children }: any) {
  const [allowed, setAllowed] = useState<boolean | null>(null);

  useEffect(() => {
    const checkSub = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return setAllowed(false);

      const { data: sub } = await supabase
        .from("subscriptions")
        .select("expires_at")
        .eq("user_id", user.id)
        .maybeSingle();

      if (!sub || new Date(sub.expires_at) < new Date()) {
        setAllowed(false);
      } else {
        setAllowed(true);
      }
    };

    checkSub();
  }, []);

  if (allowed === null) return <div>Checking subscription...</div>;
  if (!allowed) return <Navigate to="/subscribe" replace />;

  return children;
}
