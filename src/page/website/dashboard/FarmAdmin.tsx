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
const ABSENTEE_FINE_RATE = 500;

interface FarmRecord {
  id: string;
  name: string;
  email: string;
  phone: string;
  farm_slots: number;
  months_farm_setup: number;
  months_farm_support: number;
  absentee_fine: number;
}

interface FarmExpense {
  id: string;
  farm_id: string;
  category: string;
  amount: number;
  description?: string;
  created_at: string;
}

const EXPENSE_CATEGORIES = [
  "Ginger seedlings + compost fertilizer",
  "Garlic intercrop",
  "Bush clearing & de-stumping",
  "Borehole",
  "Tank + scaffold",
  "Solar pump",
  "Land preparation",
  "Rice straw",
  "Farm workers",
  "Biofungicide & biopesticide",
  "Irrigation setup",
  "Coordinator",
  "Insurance",
  "Miscellaneous",
];

interface FarmGroup { id: string; name: string; slug: string; coordinator_id: string; }

const calcSetup = (r: FarmRecord) => FARM_SETUP_RATE * r.farm_slots * r.months_farm_setup;
const calcSupport = (r: FarmRecord) => FARM_SUPPORT_RATE * r.farm_slots * r.months_farm_support;
const calcSlotFee = (r: Pick<FarmRecord, "farm_slots">) => r.farm_slots * 2000;
const calcFine = (r: Pick<FarmRecord, "farm_slots" | "absentee_fine">) => ABSENTEE_FINE_RATE * r.farm_slots * r.absentee_fine;
const calcTotal = (r: FarmRecord) => calcSetup(r) + calcSupport(r) + calcSlotFee(r) + calcFine(r);

const FarmAdmin = () => {
  const [farms, setFarms] = useState<FarmGroup[]>([]);
  const [selectedFarm, setSelectedFarm] = useState<FarmGroup | null>(null);
  const [records, setRecords] = useState<FarmRecord[]>([]);
  const [expenses, setExpenses] = useState<FarmExpense[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [showExpenseForm, setShowExpenseForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingExpenseId, setEditingExpenseId] = useState<string | null>(null);
  const [formData, setFormData] = useState<Partial<FarmRecord>>({});
  const [expenseFormData, setExpenseFormData] = useState<Partial<FarmExpense>>({});
  const [emailLookupLoading, setEmailLookupLoading] = useState(false);
  const [autoFilled, setAutoFilled] = useState(false);

  useEffect(() => { fetchFarms(); }, []);

  const fetchFarms = async () => {
    const { data, error } = await supabase.from("farm_groups").select("*").order("name");
    if (error) { showToast({ variant: "error", title: "Failed to load farms", description: error.message }); }
    else { setFarms(data || []); }
    setLoading(false);
  };

  const fetchRecords = async (farmId: string) => {
    const [recRes, expRes] = await Promise.all([
      supabase.from("farm_records").select("*").eq("farm_id", farmId).order("name"),
      supabase.from("farm_expenses").select("*").eq("farm_id", farmId).order("created_at", { ascending: false })
    ]);

    if (recRes.error) { showToast({ variant: "error", title: "Failed to load records", description: recRes.error.message }); }
    else { setRecords(recRes.data || []); }

    if (expRes.error) { console.error("Error fetching expenses:", expRes.error); }
    else { setExpenses(expRes.data || []); }
  };

  const handleSelectFarm = (farmId: string) => {
    const farm = farms.find((f) => f.id === farmId) || null;
    setSelectedFarm(farm);
    if (farm) fetchRecords(farm.id);
    setShowAddForm(false); setEditingId(null);
  };

  const handleAdd = () => {
    setFormData({ name: "", email: "", phone: "", farm_slots: 0, months_farm_setup: 0, months_farm_support: 0, absentee_fine: 0 });
    setAutoFilled(false);
    setShowAddForm(true);
  };

  const lookupUserByEmail = async (email: string) => {
    if (!email || !email.includes("@")) return;
    setEmailLookupLoading(true);
    const { data, error } = await supabase.rpc("get_member_details_by_email", { email_input: email });
    if (error || !data) { setAutoFilled(false); setEmailLookupLoading(false); return; }

    // Fetch setup and support months from other_payments
    let setupMonths = 0;
    let supportMonths = 0;

    // Try to get user ID from the RPC data first
    let userId = data.id || data.user_id;

    // If not found, try looking up profile by phone number (returned by RPC)
    if (!userId && data.phone) {
      const { data: profileByPhone } = await supabase
        .from("profiles")
        .select("id")
        .eq("phone", data.phone)
        .maybeSingle();
      if (profileByPhone) userId = profileByPhone.id;
    }

    if (userId) {
      const { data: payments } = await supabase
        .from("other_payments")
        .select("months, payment_type")
        .eq("user_id", userId)
        .eq("status", "success");

      if (payments) {
        setupMonths = payments
          .filter((p) => p.payment_type === "farm_setup")
          .reduce((sum, p) => sum + (p.months || 0), 0);
        supportMonths = payments
          .filter((p) => p.payment_type === "farm_support")
          .reduce((sum, p) => sum + (p.months || 0), 0);
      }
    }

    setFormData((prev) => ({
      ...prev,
      name: data.full_name || "",
      phone: data.phone || "",
      farm_slots: Number(data.total_slots) || 0,
      months_farm_setup: setupMonths,
      months_farm_support: supportMonths,
    }));
    setAutoFilled(true);
    setEmailLookupLoading(false);
  };

  const handleEdit = (record: FarmRecord) => { 
    setFormData(record); 
    setEditingId(record.id); 
    lookupUserByEmail(record.email);
  };

  const handleSave = async () => {
    if (!selectedFarm) return;

    if (!formData.email?.trim()) { showToast({ variant: "error", title: "Email is required", description: "Please enter the member's email." }); return; }
    if (!formData.name?.trim()) { showToast({ variant: "error", title: "Name is required", description: "Please enter the member's name." }); return; }
    if (!formData.phone?.trim()) { showToast({ variant: "error", title: "Phone is required", description: "Please enter the member's phone number." }); return; }
    if (!formData.farm_slots || formData.farm_slots <= 0) { showToast({ variant: "error", title: "Farm Slots required", description: "This member has no farm slots purchased." }); return; }

    if (formData.email) {
      const { data: existing, error: checkError } = await supabase.from("farm_records").select("id, farm_id").eq("email", formData.email);
      if (checkError) console.error("Email check error:", checkError);
      
      if (existing && existing.length > 0) {
        const duplicate = existing.find(r => r.id !== editingId);
        if (duplicate) {
          const inSameFarm = duplicate.farm_id === selectedFarm.id;
          showToast({ variant: "error", title: inSameFarm ? "Email already exists" : "Unable to add member", description: inSameFarm ? "This email is already in this farm group." : "This email cannot be added at this time." });
          return;
        }
      }
    }

    // Prepare strictly typed payload for Supabase
    const payload = {
      name: formData.name,
      email: formData.email,
      phone: formData.phone,
      farm_slots: formData.farm_slots,
      months_farm_setup: formData.months_farm_setup,
      months_farm_support: formData.months_farm_support,
      absentee_fine: formData.absentee_fine,
      farm_id: selectedFarm.id
    };
    
    let error;
    if (editingId) {
      const { error: updateError } = await supabase.from("farm_records").update(payload).eq("id", editingId);
      error = updateError;
    } else {
      const { error: insertError } = await supabase.from("farm_records").insert(payload);
      error = insertError;
    }

    if (error) {
      console.error("Supabase Save Error:", error);
      showToast({ variant: "error", title: "Supabase Error", description: error.message }); 
      return; 
    }

    showToast({ variant: "success", title: editingId ? "Record updated" : "Record added" });
    setShowAddForm(false); setEditingId(null); setFormData({}); setAutoFilled(false);
    fetchRecords(selectedFarm.id);
  };

  const handleDeleteRecord = async (id: string) => {
    if (!confirm("Delete this record?")) return;
    const { error } = await supabase.from("farm_records").delete().eq("id", id);
    
    if (error) { 
      console.error("Supabase Delete Record Error:", error);
      showToast({ variant: "error", title: "Failed to delete record", description: error.message }); 
      return; 
    }
    
    showToast({ variant: "success", title: "Record deleted" });
    if (selectedFarm) fetchRecords(selectedFarm.id);
  };

  const handleAddExpense = () => {
    setExpenseFormData({ category: "", amount: 0, description: "" });
    setEditingExpenseId(null);
    setShowExpenseForm(true);
  };

  const handleEditExpense = (expense: FarmExpense) => {
    setExpenseFormData(expense);
    setEditingExpenseId(expense.id);
    setShowExpenseForm(true);
  };

  const handleSaveExpense = async () => {
    if (!selectedFarm) return;
    if (!expenseFormData.category) {
      showToast({ variant: "error", title: "Category required", description: "Please select an expense category." });
      return;
    }
    if (!expenseFormData.amount || expenseFormData.amount <= 0) {
      showToast({ variant: "error", title: "Amount required", description: "Please enter a valid expense amount." });
      return;
    }

    const data = { ...expenseFormData, farm_id: selectedFarm.id };
    let error;
    if (editingExpenseId) {
      ({ error } = await supabase.from("farm_expenses").update(data).eq("id", editingExpenseId));
    } else {
      ({ error } = await supabase.from("farm_expenses").insert(data));
    }

    if (error) { showToast({ variant: "error", title: "Failed to save", description: error.message }); return; }
    showToast({ variant: "success", title: editingExpenseId ? "Expense updated" : "Expense added" });
    setShowExpenseForm(false); setEditingExpenseId(null); setExpenseFormData({});
    fetchRecords(selectedFarm.id);
  };

  const handleDeleteExpense = async (id: string) => {
    if (!confirm("Delete this expense record?")) return;
    const { error } = await supabase.from("farm_expenses").delete().eq("id", id);
    if (error) { showToast({ variant: "error", title: "Failed to delete", description: error.message }); return; }
    showToast({ variant: "success", title: "Expense deleted" });
    if (selectedFarm) fetchRecords(selectedFarm.id);
  };

  const handleDeleteFarm = async (farmId: string) => {
    if (!confirm("Delete this entire farm group and all its member records? This cannot be undone.")) return;
    
    // 1. Delete expenses
    await supabase.from("farm_expenses").delete().eq("farm_id", farmId);

    // 2. Delete member records
    const { error: recordsError } = await supabase.from("farm_records").delete().eq("farm_id", farmId);
    if (recordsError) {
      console.error("Supabase Records Cleanup Error:", recordsError);
      showToast({ variant: "error", title: "Cleanup Failed", description: recordsError.message });
      return;
    }

    // 3. Delete farm group
    const { error: farmError } = await supabase.from("farm_groups").delete().eq("id", farmId);
    if (farmError) {
      console.error("Supabase Farm Delete Error:", farmError);
      showToast({ variant: "error", title: "Delete Failed", description: farmError.message });
      return;
    }

    showToast({ variant: "success", title: "Farm group and all records deleted" });
    setSelectedFarm(null);
    fetchFarms();
  };

  const cancelEdit = () => { setShowAddForm(false); setEditingId(null); setFormData({}); setAutoFilled(false); };
  const cancelExpenseEdit = () => { setShowExpenseForm(false); setEditingExpenseId(null); setExpenseFormData({}); };
  const set = (field: keyof FarmRecord, val: string | number) =>
    setFormData((prev) => ({ ...prev, [field]: val }));
  const setNum = (field: keyof FarmRecord) => (e: React.ChangeEvent<HTMLInputElement>) =>
    set(field, e.target.value === "" ? 0 : Number(e.target.value));

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <div className="w-8 h-8 border-4 border-green-200 border-t-green-800 rounded-full animate-spin mx-auto mb-4" />
        <p className="text-gray-600">Loading farm administration...</p>
      </div>
    </div>
  );

  const slots = formData.farm_slots || 0;
  const mSetup = formData.months_farm_setup || 0;
  const mSupport = formData.months_farm_support || 0;

  const totalFarmSlots = records.reduce((s, r) => s + r.farm_slots, 0);
  const totalFarmSupport = records.reduce((s, r) => s + calcSupport(r), 0);
  const totalFarmSetup = records.reduce((s, r) => s + calcSetup(r), 0);
  const totalAbsenteeFine = records.reduce((s, r) => s + calcFine(r), 0);
  const totalExpensesValue = expenses.reduce((sum, exp) => sum + exp.amount, 0);

  const totalFarmIncome = records.reduce((s, r) => s + calcTotal(r), 0);
  const agrohealBalance = (totalFarmSlots * 2000) + totalFarmSupport;
  const grossBalance = totalFarmSetup + totalAbsenteeFine;
  const netBalance = grossBalance - totalExpensesValue;

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-6">
      <Toaster />
      <div className="max-w-7xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Farm Administration</h1>
          <p className="text-gray-600">Manage all farm groups and member records</p>
        </motion.div>

        {/* Farm Group Selector */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-6">
          <label htmlFor="farm-select" className="text-sm font-medium text-gray-700 whitespace-nowrap">
            Select Farm Group:
          </label>
          <select
            id="farm-select"
            className="flex-1 max-w-xs border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-green-700"
            value={selectedFarm?.id || ""}
            onChange={(e) => handleSelectFarm(e.target.value)}
          >
            <option value="" disabled>-- Choose a farm group --</option>
            {farms.map((farm) => (
              <option key={farm.id} value={farm.id}>{farm.name} (/{farm.slug})</option>
            ))}
          </select>
          {selectedFarm && (
            <Button
              onClick={() => handleDeleteFarm(selectedFarm.id)}
              variant="outline"
              className="text-red-600 hover:text-red-700 border-red-200 text-sm"
            >
              <Trash2 className="w-4 h-4 mr-1" /> Delete Farm
            </Button>
          )}
        </div>

        <div className="space-y-6">
            {selectedFarm && (
              <>
                {!showAddForm && !editingId && !showExpenseForm && (
                  <div className="flex flex-col sm:flex-row gap-3">
                    <Button onClick={handleAdd} className="bg-green-800 hover:bg-green-700 w-full sm:w-auto">
                      <Plus className="w-4 h-4 mr-2" /> Add Member Record
                    </Button>
                    <Button onClick={handleAddExpense} variant="outline" className="border-green-800 text-green-800 hover:bg-green-50 w-full sm:w-auto">
                      <Plus className="w-4 h-4 mr-2" /> Add Expenses
                    </Button>
                  </div>
                )}

                {(showAddForm || editingId) && (
                  <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}>
                    <Card>
                      <CardHeader><CardTitle>{editingId ? "Edit Record" : "Add New Record"}</CardTitle></CardHeader>
                      <CardContent className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                          {/* Email first — triggers auto-lookup */}
                          <div className="md:col-span-2 lg:col-span-3">
                            <Label>Email</Label>
                            <div className="relative">
                              <Input
                                type="email"
                                value={formData.email || ""}
                                onChange={(e) => { set("email", e.target.value); setAutoFilled(false); }}
                                onBlur={(e) => lookupUserByEmail(e.target.value)}
                                placeholder="Enter member email to auto-fill details"
                                readOnly={!!editingId}
                                className={editingId ? "bg-gray-50 text-gray-500 cursor-not-allowed" : ""}
                              />
                              {emailLookupLoading && (
                                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                                  <div className="w-4 h-4 border-2 border-green-300 border-t-green-700 rounded-full animate-spin" />
                                </div>
                              )}
                            </div>
                            {autoFilled && <p className="text-xs text-green-700 mt-1 font-medium">✓ Member details auto-filled from profile</p>}
                          </div>

                          <div>
                            <Label>Name</Label>
                            <Input
                              value={formData.name || ""}
                              readOnly
                              className="bg-gray-50 text-gray-500 cursor-not-allowed"
                              placeholder="Auto-filled from email"
                            />
                          </div>
                          <div>
                            <Label>Phone</Label>
                            <Input
                              value={formData.phone || ""}
                              readOnly
                              className="bg-gray-50 text-gray-500 cursor-not-allowed"
                              placeholder="Auto-filled from email"
                            />
                          </div>
                          <div>
                            <Label>No. of Farm Slots</Label>
                            <Input
                              type="number"
                              value={formData.farm_slots ?? 0}
                              readOnly
                              className="bg-gray-50 text-gray-500 cursor-not-allowed"
                              placeholder="0"
                            />
                          </div>
                          <div>
                            <Label>No. of Months for Farm Setup</Label>
                            <Input
                              type="number"
                              min={0}
                              value={formData.months_farm_setup ?? 0}
                              onChange={setNum("months_farm_setup")}
                            />
                            {slots > 0 && mSetup > 0 && <p className="text-xs text-green-700 mt-1 font-medium">= ₦{(FARM_SETUP_RATE * slots * mSetup).toLocaleString()}</p>}
                          </div>
                          <div>
                            <Label>No. of Months for Farm Support</Label>
                            <Input
                              type="number"
                              min={0}
                              value={formData.months_farm_support ?? 0}
                              onChange={setNum("months_farm_support")}
                            />
                            {slots > 0 && mSupport > 0 && <p className="text-xs text-green-700 mt-1 font-medium">= ₦{(FARM_SUPPORT_RATE * slots * mSupport).toLocaleString()}</p>}
                          </div>
                          <div>
                            <Label>No. of Months for Absentee Fine</Label>
                            <Input type="number" min={0} value={formData.absentee_fine ?? 0} onChange={setNum("absentee_fine")} />
                            {slots > 0 && (formData.absentee_fine ?? 0) > 0 && <p className="text-xs text-green-700 mt-1 font-medium">= ₦{(ABSENTEE_FINE_RATE * slots * (formData.absentee_fine || 0)).toLocaleString()}</p>}
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

                {showExpenseForm && (
                  <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}>
                    <Card>
                      <CardHeader><CardTitle>{editingExpenseId ? "Edit Expense" : "Add New Expense"}</CardTitle></CardHeader>
                      <CardContent className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <Label>Category</Label>
                            <select
                              className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm"
                              value={expenseFormData.category || ""}
                              onChange={(e) => setExpenseFormData(prev => ({ ...prev, category: e.target.value }))}
                            >
                              <option value="" disabled>Select category</option>
                              {EXPENSE_CATEGORIES.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                            </select>
                          </div>
                          <div>
                            <Label>Amount (₦)</Label>
                            <Input
                              type="number"
                              value={expenseFormData.amount ?? 0}
                              onChange={(e) => setExpenseFormData(prev => ({ ...prev, amount: Number(e.target.value) }))}
                            />
                          </div>
                          {/* 
                          <div className="md:col-span-2">
                            <Label>Description (Optional)</Label>
                            <Input
                              value={expenseFormData.description || ""}
                              onChange={(e) => setExpenseFormData(prev => ({ ...prev, description: e.target.value }))}
                              placeholder="Brief details about the expense"
                            />
                          </div>
                          */}
                        </div>
                        <div className="flex gap-2">
                          <Button onClick={handleSaveExpense} className="bg-green-800 hover:bg-green-700"><Save className="w-4 h-4 mr-2" />Save</Button>
                          <Button onClick={cancelExpenseEdit} variant="outline"><X className="w-4 h-4 mr-2" />Cancel</Button>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                )}

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
                              <th className="text-left p-2">Phone</th>
                              <th className="text-left p-2">Farm Slots</th>
                              <th className="text-left p-2">Slot Fee</th>
                              <th className="text-left p-2">Farm Setup</th>
                              <th className="text-left p-2">Farm Support</th>
                              <th className="text-left p-2">Absentee Fine</th>
                              <th className="text-left p-2">Total</th>
                              <th className="text-left p-2">Actions</th>
                            </tr>
                          </thead>
                          <tbody>
                            {records.map((record) => (
                              <tr key={record.id} className="border-b hover:bg-gray-50">
                                <td className="p-2 font-medium">{record.name}</td>
                                <td className="p-2 text-gray-600">{record.email}</td>
                                <td className="p-2 text-gray-600">{record.phone}</td>
                                <td className="p-2">{record.farm_slots}</td>
                                <td className="p-2">₦{calcSlotFee(record).toLocaleString()}</td>
                                <td className="p-2">
                                  <div>₦{calcSetup(record).toLocaleString()}</div>
                                  <div className="text-xs text-gray-400">{record.months_farm_setup} month{record.months_farm_setup !== 1 ? "s" : ""}</div>
                                </td>
                                <td className="p-2">
                                  <div>₦{calcSupport(record).toLocaleString()}</div>
                                  <div className="text-xs text-gray-400">{record.months_farm_support} month{record.months_farm_support !== 1 ? "s" : ""}</div>
                                </td>
                                <td className="p-2">
                                  <div>₦{calcFine(record).toLocaleString()}</div>
                                  <div className="text-xs text-gray-400">{record.absentee_fine} month{record.absentee_fine !== 1 ? "s" : ""}</div>
                                </td>
                                <td className="p-2 font-semibold text-green-800">₦{calcTotal(record).toLocaleString()}</td>
                                <td className="p-2">
                                  <div className="flex gap-1">
                                    <Button onClick={() => handleEdit(record)} variant="outline" size="sm"><Edit className="w-4 h-4" /></Button>
                                    <Button onClick={() => handleDeleteRecord(record.id)} variant="outline" size="sm" className="text-red-600 hover:text-red-700"><Trash2 className="w-4 h-4" /></Button>
                                  </div>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                          <tfoot>
                            <tr className="border-t-2 font-semibold bg-gray-100">
                              <td className="p-2">Total</td>
                              <td className="p-2" /><td className="p-2" />
                              <td className="p-2">{records.reduce((s, r) => s + r.farm_slots, 0)}</td>
                              <td className="p-2">₦{records.reduce((s, r) => s + calcSlotFee(r), 0).toLocaleString()}</td>
                              <td className="p-2">₦{records.reduce((s, r) => s + calcSetup(r), 0).toLocaleString()}</td>
                              <td className="p-2">₦{records.reduce((s, r) => s + calcSupport(r), 0).toLocaleString()}</td>
                              <td className="p-2">₦{records.reduce((s, r) => s + calcFine(r), 0).toLocaleString()}</td>
                              <td className="p-2 font-bold text-green-800">₦{records.reduce((s, r) => s + calcTotal(r), 0).toLocaleString()}</td>
                              <td className="p-2" />
                            </tr>
                          </tfoot>
                        </table>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Expenses Table */}
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="mt-8">
                  <Card>
                    <CardHeader><CardTitle>Farm Expenses</CardTitle></CardHeader>
                    <CardContent>
                      {expenses.length === 0 ? (
                        <p className="text-gray-500 text-center py-8">No expense records found</p>
                      ) : (
                        <div className="overflow-x-auto">
                          <table className="w-full text-sm">
                            <thead>
                              <tr className="border-b bg-gray-50">
                                <th className="text-left p-2">Date</th>
                                <th className="text-left p-2">Category</th>
                                {/* <th className="text-left p-2">Description</th> */}
                                <th className="text-right p-2">Amount</th>
                                <th className="text-center p-2">Actions</th>
                              </tr>
                            </thead>
                            <tbody>
                              {expenses.map((expense) => (
                                <tr key={expense.id} className="border-b hover:bg-gray-50">
                                  <td className="p-2 text-gray-600">
                                    {new Date(expense.created_at).toLocaleDateString()}
                                  </td>
                                  <td className="p-2 font-medium text-gray-900">{expense.category}</td>
                                  {/* <td className="p-2 text-gray-500 italic">{expense.description || "-"}</td> */}
                                  <td className="p-2 text-right font-semibold">₦{expense.amount.toLocaleString()}</td>
                                  <td className="p-2">
                                    <div className="flex justify-center gap-1">
                                      <Button onClick={() => handleEditExpense(expense)} variant="outline" size="sm"><Edit className="w-3 h-3" /></Button>
                                      <Button onClick={() => handleDeleteExpense(expense.id)} variant="outline" size="sm" className="text-red-600 hover:text-red-700"><Trash2 className="w-3 h-3" /></Button>
                                    </div>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                            <tfoot>
                              <tr className="border-t-2 font-bold bg-gray-100">
                                <td colSpan={2} className="p-2 text-right uppercase tracking-wider">Total Expenses</td>
                                <td className="p-2 text-right text-red-700">
                                  ₦{expenses.reduce((sum, exp) => sum + exp.amount, 0).toLocaleString()}
                                </td>
                                <td className="p-2" />
                              </tr>
                            </tfoot>
                          </table>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </motion.div>

                {/* Account Balance Section */}
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="mt-8 mb-12">
                  <Card className="border-2 border-green-800/20 overflow-hidden">
                    <CardHeader className="bg-green-800 text-white">
                      <CardTitle className="text-xl">Account Balance Summary</CardTitle>
                    </CardHeader>
                    <CardContent className="p-0">
                      <div className="divide-y">
                        <div className="p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                          <div>
                            <h4 className="font-semibold text-gray-900">Total Farm Income</h4>
                            <p className="text-xs text-gray-500">(Total sum of all member payments)</p>
                          </div>
                          <span className="text-xl font-bold text-green-800">₦{totalFarmIncome.toLocaleString()}</span>
                        </div>

                        <div className="p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 bg-gray-50/50">
                          <div>
                            <h4 className="font-semibold text-gray-900">Agroheal Fees (Farm Slot, Marketing & Support)</h4>
                            <p className="text-xs text-gray-500">(Farm Slot Fee + Total Support Fee)</p>
                          </div>
                          <span className="text-xl font-bold text-green-800">₦{agrohealBalance.toLocaleString()}</span>
                        </div>

                        <div className="p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                          <div>
                            <h4 className="font-semibold text-gray-900">{selectedFarm.name} Gross Balance</h4>
                            <p className="text-xs text-gray-500">(Farm Setup + Total Absentee Fine)</p>
                          </div>
                          <span className="text-xl font-bold text-green-800">₦{grossBalance.toLocaleString()}</span>
                        </div>

                        <div className="p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 bg-gray-50/50">
                          <div>
                            <h4 className="font-semibold text-gray-900">Total Expenses</h4>
                            <p className="text-xs text-gray-500">(Sum of all recorded farm expenses)</p>
                          </div>
                          <span className="text-xl font-bold text-red-600">₦{totalExpensesValue.toLocaleString()}</span>
                        </div>

                        <div className="p-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-green-50">
                          <div>
                            <h3 className="text-lg font-bold text-gray-900">{selectedFarm.name} Net Balance</h3>
                            <p className="text-sm text-gray-600">Available funds after expenses</p>
                          </div>
                          <div className="text-right">
                            <span className={`text-3xl font-black ${netBalance >= 0 ? "text-green-800" : "text-red-800"}`}>
                              ₦{netBalance.toLocaleString()}
                            </span>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              </>
            )}
        </div>
      </div>
    </div>
  );
};

export default FarmAdmin;
