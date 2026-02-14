import { Navigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { supabase } from "@/libs/supabaseClient";
import { Loader } from "lucide-react";

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

  if (allowed === null)
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center justify-center gap-4">
          <Loader className="animate animate-spin text-greem-800" size={48} />
          <p> Checking subscription...</p>
        </div>
      </div>
    );
  if (!allowed) return <Navigate to="/subscribe" replace />;

  return children;
}
