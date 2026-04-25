import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { motion } from "framer-motion";
import { supabase } from "@/lib/supabaseClient";
import { showToast } from "@/components/ui/ToastComponent";
import { Toaster } from "react-hot-toast";

const CreateFarmGroup = () => {
  const navigate = useNavigate();
  const [farmName, setFarmName] = useState("");
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(true);

  // On mount, check if this user already has a farm group
  useEffect(() => {
    const checkExisting = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        setChecking(false);
        return;
      }

      const { data: existing } = await supabase
        .from("farm_groups")
        .select("id")
        .eq("coordinator_id", user.id)
        .maybeSingle();

      if (existing) {
        // Already has a farm — redirect straight to farm records
        navigate("/dashboard/farm-records", { replace: true });
      } else {
        setChecking(false);
      }
    };
    checkExisting();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!farmName.trim()) return;
    setLoading(true);

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      showToast({
        variant: "error",
        title: "Authentication required",
        description: "Please login to create a farm group",
      });
      setLoading(false);
      return;
    }

    const slug = farmName.trim().toLowerCase().replace(/\s+/g, "-");

    // Check if slug already exists
    const { data: slugExists } = await supabase
      .from("farm_groups")
      .select("id")
      .eq("slug", slug)
      .maybeSingle();

    if (slugExists) {
      showToast({
        variant: "error",
        title: "Farm name already taken",
        description: "Please choose a different name",
      });
      setLoading(false);
      return;
    }

    const { error } = await supabase.from("farm_groups").insert({
      name: farmName.trim(),
      slug,
      coordinator_id: user.id,
    });

    setLoading(false);

    if (error) {
      showToast({
        variant: "error",
        title: "Failed to create farm group",
        description: error.message,
      });
      return;
    }

    showToast({ variant: "success", title: "Farm group created!" });
    navigate("/dashboard/farm-records", { replace: true });
  };

  const fadeUp = {
    initial: { opacity: 0, y: 18 },
    animate: { opacity: 1, y: 0 },
    transition: {
      duration: 0.5,
      ease: [0.22, 1, 0.36, 1] as [number, number, number, number],
    },
  };

  if (checking)
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-green-200 border-t-green-800 rounded-full animate-spin" />
      </div>
    );

  return (
    <div className="max-w-md mx-auto p-6 mt-8">
      <Toaster />
      <motion.div {...fadeUp} className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Create Farm Group
        </h1>
        <p className="text-gray-600">
          Create a farm group to start bookkeeping and tracking member finances.
        </p>
      </motion.div>

      <motion.form {...fadeUp} onSubmit={handleCreate} className="space-y-6">
        <div className="space-y-2">
          <Label
            htmlFor="farmName"
            className="text-sm font-semibold text-gray-700"
          >
            Farm Group Name
          </Label>
          <Input
            id="farmName"
            type="text"
            value={farmName}
            onChange={(e) => setFarmName(e.target.value)}
            placeholder="e.g. Star Farm"
            className="h-11"
            required
          />
        </div>

        <Button
          type="submit"
          disabled={loading || !farmName.trim()}
          className="w-full h-11 bg-green-800 hover:bg-green-700"
        >
          {loading ? "Creating..." : "Create Farm Group"}
        </Button>
      </motion.form>
    </div>
  );
};

export default CreateFarmGroup;
