"use client";
// src/app/feature-control/page.tsx
import { useState, useEffect } from "react";
import { updateDoc, doc, getDoc } from "firebase/firestore";
import { db }             from "@/lib/firebase";
import { useAdmin }       from "@/context/AdminContext";
import DashboardLayout    from "@/components/layout/DashboardLayout";
import { Card, CardHeader, FilterSelect, Toggle, Btn } from "@/components/ui";
import type { FeatureFlags } from "@/types";

const FEATURES: { key: keyof FeatureFlags; icon: string; name: string; desc: string }[] = [
  { key: "marksEntry",  icon: "📝", name: "Marks Entry",   desc: "Allow teachers to submit & edit marks" },
  { key: "attendance",  icon: "✅", name: "Attendance",    desc: "Daily class attendance tracking" },
  { key: "parentLogin", icon: "👨‍👩‍👧", name: "Parent Login", desc: "Parent portal via phone + PIN" },
  { key: "qrLogin",     icon: "📱", name: "QR Login",      desc: "Student QR scanning for bus trips" },
  { key: "smsAlerts",   icon: "💬", name: "SMS Alerts",    desc: "SMS notifications to parents" },
  { key: "reportCards", icon: "📄", name: "Report Cards",  desc: "Auto-generate & share report cards" },
];

export default function FeatureControlPage() {
  const { schools } = useAdmin();
  const [selectedId, setSelectedId] = useState(schools[0]?.id || "");
  const [flags, setFlags] = useState<FeatureFlags>({ marksEntry:true, attendance:true, parentLogin:true, qrLogin:false, smsAlerts:true, reportCards:false });
  const [saving, setSaving] = useState(false);
  const [saved,  setSaved]  = useState(false);

  useEffect(() => {
    if (!selectedId) return;
    getDoc(doc(db, "schools", selectedId)).then(snap => {
      if (snap.exists() && snap.data().features) setFlags(snap.data().features);
    });
  }, [selectedId]);

  const save = async () => {
    if (!selectedId) return;
    setSaving(true);
    await updateDoc(doc(db, "schools", selectedId), { features: flags });
    setSaving(false); setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <DashboardLayout title="Feature Control">
      <Card>
        <CardHeader title="🎛️ Feature Flags per School">
          <FilterSelect
            value={selectedId}
            onChange={v => { setSelectedId(v); setSaved(false); }}
            options={[["","Select School"], ...schools.map(s => [s.id, s.name || s.id] as [string,string])]}
          />
        </CardHeader>
        <div className="grid grid-cols-3 gap-4 p-5">
          {FEATURES.map(f => (
            <div key={f.key} className="flex items-center gap-3.5 bg-slate-50 border border-slate-200 rounded-2xl p-5">
              <span className="text-[26px]">{f.icon}</span>
              <div className="flex-1">
                <div className="text-[13px] font-bold text-navy">{f.name}</div>
                <div className="text-[11px] text-slate-400 mt-1">{f.desc}</div>
              </div>
              <Toggle on={!!flags[f.key]} onToggle={() => setFlags(p => ({ ...p, [f.key]: !p[f.key] }))} />
            </div>
          ))}
        </div>
        <div className="flex items-center justify-between px-5 pb-5">
          <p className="text-[12px] text-slate-400">Changes are saved to Firestore and read by the mobile app in real-time.</p>
          <div className="flex items-center gap-3">
            {saved && <span className="text-brand-emerald text-[12px] font-semibold">✓ Saved!</span>}
            <Btn variant="gold" onClick={save} disabled={saving || !selectedId}>
              {saving ? "Saving…" : "✓ Save Changes"}
            </Btn>
          </div>
        </div>
      </Card>
    </DashboardLayout>
  );
}
