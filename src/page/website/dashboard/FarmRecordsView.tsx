import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { motion } from "framer-motion";
import { supabase } from "@/lib/supabaseClient";
import { showToast } from "@/components/ui/ToastComponent";
import { Toaster } from "react-hot-toast";
import { Plus, Edit, Trash2, Save, X } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const FARM_SETUP_RATE = 5000;
const FARM_SUPPORT_RATE = 500;

interface FarmRecord {
  id: string;
  name: string;
  email: string;
  phone: string;
  farm_slots: number;
  months_farm_setup: number;
  months_farm_support: number;
  absentee_fine: number;
  farm_groups: { id: string; name: string; coordinator_id: string };
}

const calcSetup = (r: Pick<FarmRecord, "farm_slots" | "months_farm_setup">) =>
  FARM_SETUP_RATE * r.farm_slots * r.months_farm_setup;
const calcSupport = (r: Pick<FarmRecord, "farm_slots" | "months_farm_support">) =>
  FARM_SUPPORT_RATE * r.farm_slots * r.months_farm_support;
const calcTotal = (r: FarmRecord) => calcSetup(r) + calcSupport(r) + r.absentee_fine;

const FarmRecordsView = () => {
  const [farm, setFarm] = useState<{ id: string; name: string; coordinator_id: string } | null>(null);
  const [records, setRecords] = useState<FarmRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCoordinator, setIsCoordinator] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<Partial<FarmRecord>>({});
  const [emailLookupLoading, setEmailLookupLoading] = useState(false);
  const [autoFilled, setAutoFilled] = useState(false);

  useEffect(() => { fetchUserFarmRecords(); }, []);

  const fetchUserFarmRecords = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user?.email) { setLoading(false); return; }

    // First: try to find farm via member record email match
    const { data: recordData } = await supabase
      .from("farm_records")
      .select("*, farm_groups!inner(id, name, coordinator_id)")
      .eq("email", user.email).limit(1).maybeSingle();

    if (recordData) {
      const farmData = recordData.farm_groups as any;
      setFarm(farmData);
      setIsCoordinator(farmData.coordinator_id === user.id);
      const { data: recordsData } = await supabase
        .from("farm_records").select("*").eq("farm_id", farmData.id).order("name");
      setRecords(recordsData || []);
      setLoading(false);
      return;
    }

    // Fallback: check if the user is a coordinator of any farm group
    const { data: coordinatorFarm } = await supabase
      .from("farm_groups")
      .select("id, name, coordinator_id")
      .eq("coordinator_id", user.id)
      .limit(1).maybeSingle();

    if (coordinatorFarm) {
      setFarm(coordinatorFarm);
      setIsCoordinator(true);
      const { data: recordsData } = await supabase
        .from("farm_records").select("*").eq("farm_id", coordinatorFarm.id).order("name");
      setRecords(recordsData || []);
      setLoading(false);
      return;
    }

    // Neither a member nor a coordinator
    setLoading(false);
  };

  const handleAdd = () => {
    setFormData({ name: "", email: "", phone: "", farm_slots: 0, months_farm_setup: 0, months_farm_support: 0, absentee_fine: 0 });
    setAutoFilled(false);
    setShowAddForm(true);
  };

  const lookupUserByEmail = async (email: string) => {
    if (!email || !email.includes("@")) return;
    setEmailLookupLoading(true);

    const { data, error } = await supabase.rpc("get_member_details_by_email", {
      email_input: email,
    });

    if (error || !data) {
      setAutoFilled(false);
      setEmailLookupLoading(false);
      return;
    }

    setFormData((prev) => ({
      ...prev,
      name: data.full_name || "",
      phone: data.phone || "",
      farm_slots: Number(data.total_slots) || 0,
    }));
    setAutoFilled(true);
    setEmailLookupLoading(false);
  };

  const handleEdit = (record: FarmRecord) => { setFormData(record); setEditingId(record.id); };

  const handleSave = async () => {
    if (!farm) return;

    // Required field validation
    if (!formData.email?.trim()) {
      showToast({ variant: "error", title: "Email is required", description: "Please enter the member's email." });
      return;
    }
    if (!formData.name?.trim()) {
      showToast({ variant: "error", title: "Name is required", description: "Please enter the member's name." });
      return;
    }
    if (!formData.phone?.trim()) {
      showToast({ variant: "error", title: "Phone is required", description: "Please enter the member's phone number." });
      return;
    }
    if (!formData.farm_slots || formData.farm_slots <= 0) {
      showToast({ variant: "error", title: "Farm Slots required", description: "This member has no farm slots purchased." });
      return;
    }

    // On new record only: validate email uniqueness
    if (!editingId && formData.email) {
      const { data: existingRecords } = await supabase
        .from("farm_records")
        .select("farm_id")
        .eq("email", formData.email);

      if (existingRecords && existingRecords.length > 0) {
        const inSameFarm = existingRecords.some((r) => r.farm_id === farm.id);
        if (inSameFarm) {
          showToast({ variant: "error", title: "Email already exists", description: "This email is already in this farm group." });
        } else {
          showToast({ variant: "error", title: "Unable to add member", description: "This email cannot be added at this time." });
        }
        return;
      }
    }

    const data = { ...formData, farm_id: farm.id };
    let error;
    if (editingId) {
      ({ error } = await supabase.from("farm_records").update(data).eq("id", editingId));
    } else {
      ({ error } = await supabase.from("farm_records").insert(data));
    }
    if (error) { showToast({ variant: "error", title: "Failed to save", description: error.message }); return; }
    showToast({ variant: "success", title: editingId ? "Record updated" : "Record added" });
    setShowAddForm(false); setEditingId(null); setFormData({}); setAutoFilled(false);
    fetchUserFarmRecords();
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this record?")) return;
    const { error } = await supabase.from("farm_records").delete().eq("id", id);
    if (error) { showToast({ variant: "error", title: "Failed to delete", description: error.message }); return; }
    showToast({ variant: "success", title: "Record deleted" });
    fetchUserFarmRecords();
  };

  const cancelEdit = () => { setShowAddForm(false); setEditingId(null); setFormData({}); setAutoFilled(false); };
  const set = (field: keyof FarmRecord, val: string | number) =>
    setFormData((prev) => ({ ...prev, [field]: val }));
  const setNum = (field: keyof FarmRecord) => (e: React.ChangeEvent<HTMLInputElement>) =>
    set(field, e.target.value === "" ? 0 : Number(e.target.value));

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <div className="w-8 h-8 border-4 border-green-200 border-t-green-800 rounded-full animate-spin mx-auto mb-4" />
        <p className="text-gray-600">Loading farm records...</p>
      </div>
    </div>
  );

  if (!farm) return (
    <div className="p-4 md:p-6">
      <Card><CardContent className="pt-6">
        <div className="text-center py-8">
          <p className="text-gray-600">You are not registered with any farm group yet.</p>
          <p className="text-sm text-gray-500 mt-2">Contact your farm coordinator to be added.</p>
        </div>
      </CardContent></Card>
    </div>
  );

  const slots = formData.farm_slots || 0;
  const mSetup = formData.months_farm_setup || 0;
  const mSupport = formData.months_farm_support || 0;

  return (
    <div className="p-4 md:p-6">
      <Toaster />
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">{farm.name} Records</h2>
        <p className="text-gray-600">Farm bookkeeping and finance tracking</p>
      </motion.div>

      {isCoordinator && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="mb-6">
          <Button onClick={handleAdd} className="bg-green-800 hover:bg-green-700">
            <Plus className="w-4 h-4 mr-2" /> Add Member Record
          </Button>
        </motion.div>
      )}

      {(showAddForm || editingId) && isCoordinator && (
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="mb-6">
          <Card>
            <CardHeader><CardTitle>{editingId ? "Edit Record" : "Add New Record"}</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {/* Email — first, triggers auto-lookup */}
                <div className="md:col-span-2 lg:col-span-3">
                  <Label>Email</Label>
                  <div className="relative">
                    <Input
                      type="email"
                      value={formData.email || ""}
                      onChange={(e) => {
                        set("email", e.target.value);
                        setAutoFilled(false);
                      }}
                      onBlur={(e) => lookupUserByEmail(e.target.value)}
                      placeholder="Enter member email to auto-fill details"
                      disabled={!!editingId}
                    />
                    {emailLookupLoading && (
                      <div className="absolute right-3 top-1/2 -translate-y-1/2">
                        <div className="w-4 h-4 border-2 border-green-300 border-t-green-700 rounded-full animate-spin" />
                      </div>
                    )}
                  </div>
                  {autoFilled && <p className="text-xs text-green-700 mt-1 font-medium">✓ Member details auto-filled from profile</p>}
                </div>

                {/* Name — read-only, auto-filled */}
                <div>
                  <Label>Name</Label>
                  <Input
                    value={formData.name || ""}
                    readOnly={!editingId}
                    className={!editingId ? "bg-gray-50 text-gray-500 cursor-not-allowed" : ""}
                    placeholder={editingId ? "" : "Auto-filled from email"}
                  />
                </div>

                {/* Phone — read-only, auto-filled */}
                <div>
                  <Label>Phone</Label>
                  <Input
                    value={formData.phone || ""}
                    readOnly={!editingId}
                    className={!editingId ? "bg-gray-50 text-gray-500 cursor-not-allowed" : ""}
                    placeholder={editingId ? "" : "Auto-filled from email"}
                  />
                </div>

                {/* Farm Slots — read-only, auto-filled */}
                <div>
                  <Label>No. of Farm Slots</Label>
                  <Input
                    type="number"
                    value={formData.farm_slots ?? 0}
                    readOnly={!editingId}
                    className={!editingId ? "bg-gray-50 text-gray-500 cursor-not-allowed" : ""}
                    placeholder={editingId ? "" : "Auto-filled from slots"}
                  />
                </div>
                <div>
                  <Label>No. of Months for Farm Setup</Label>
                  <Input type="number" min={0} value={formData.months_farm_setup ?? 0} onChange={setNum("months_farm_setup")} />
                  {slots > 0 && mSetup > 0 && <p className="text-xs text-green-700 mt-1 font-medium">= ₦{(FARM_SETUP_RATE * slots * mSetup).toLocaleString()}</p>}
                </div>
                <div>
                  <Label>No. of Months for Farm Support</Label>
                  <Input type="number" min={0} value={formData.months_farm_support ?? 0} onChange={setNum("months_farm_support")} />
                  {slots > 0 && mSupport > 0 && <p className="text-xs text-green-700 mt-1 font-medium">= ₦{(FARM_SUPPORT_RATE * slots * mSupport).toLocaleString()}</p>}
                </div>
                <div>
                  <Label>Absentee Fine (₦)</Label>
                  <Input type="number" min={0} value={formData.absentee_fine ?? 0} onChange={setNum("absentee_fine")} />
                </div>
              </div>
              <div className="flex gap-2">
                <Button onClick={handleSave} className="bg-green-800 hover:bg-green-700"><Save className="w-4 h-4 mr-2" />Save</Button>
                <Button onClick={cancelEdit} variant="outline"><X className="w-4 h-4 mr-2" />Cancel</Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
        <Card>
          <CardHeader><CardTitle>Member Records ({records.length})</CardTitle></CardHeader>
          <CardContent>
            {records.length === 0 ? (
              <p className="text-gray-500 text-center py-8">No records found</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b bg-gray-50">
                      <th className="text-left p-2">Name</th>
                      <th className="text-left p-2">Email</th>
                      {isCoordinator && <th className="text-left p-2">Phone</th>}
                      <th className="text-left p-2">Farm Slots</th>
                      <th className="text-left p-2">Total Farm Setup</th>
                      <th className="text-left p-2">Total Farm Support</th>
                      <th className="text-left p-2">Absentee Fine</th>
                      <th className="text-left p-2">Total</th>
                      {isCoordinator && <th className="text-left p-2">Actions</th>}
                    </tr>
                  </thead>
                  <tbody>
                    {records.map((record) => (
                      <tr key={record.id} className="border-b hover:bg-gray-50">
                        <td className="p-2 font-medium">{record.name}</td>
                        <td className="p-2 text-gray-600">{record.email}</td>
                        {isCoordinator && <td className="p-2 text-gray-600">{record.phone}</td>}
                        <td className="p-2">{record.farm_slots}</td>
                        <td className="p-2">
                          <div>₦{calcSetup(record).toLocaleString()}</div>
                          <div className="text-xs text-gray-400">{record.months_farm_setup} month{record.months_farm_setup !== 1 ? "s" : ""}</div>
                        </td>
                        <td className="p-2">
                          <div>₦{calcSupport(record).toLocaleString()}</div>
                          <div className="text-xs text-gray-400">{record.months_farm_support} month{record.months_farm_support !== 1 ? "s" : ""}</div>
                        </td>
                        <td className="p-2">₦{record.absentee_fine.toLocaleString()}</td>
                        <td className="p-2 font-semibold text-green-800">₦{calcTotal(record).toLocaleString()}</td>
                        {isCoordinator && (
                          <td className="p-2">
                            <div className="flex gap-1">
                              <Button onClick={() => handleEdit(record)} variant="outline" size="sm"><Edit className="w-4 h-4" /></Button>
                              <Button onClick={() => handleDelete(record.id)} variant="outline" size="sm" className="text-red-600 hover:text-red-700"><Trash2 className="w-4 h-4" /></Button>
                            </div>
                          </td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="border-t-2 font-semibold bg-gray-100">
                      <td className="p-2">Total</td>
                      <td className="p-2" />
                      {isCoordinator && <td className="p-2" />}
                      <td className="p-2">{records.reduce((s, r) => s + r.farm_slots, 0)}</td>
                      <td className="p-2">₦{records.reduce((s, r) => s + calcSetup(r), 0).toLocaleString()}</td>
                      <td className="p-2">₦{records.reduce((s, r) => s + calcSupport(r), 0).toLocaleString()}</td>
                      <td className="p-2">₦{records.reduce((s, r) => s + r.absentee_fine, 0).toLocaleString()}</td>
                      <td className="p-2 font-bold text-green-800">₦{records.reduce((s, r) => s + calcTotal(r), 0).toLocaleString()}</td>
                      {isCoordinator && <td className="p-2" />}
                    </tr>
                  </tfoot>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
};

export default FarmRecordsView;
