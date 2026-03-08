"use client";
// src/app/schools/[id]/page.tsx
import { useParams, useRouter } from "next/navigation";
import { updateDoc, doc }       from "firebase/firestore";
import { db }                   from "@/lib/firebase";
import { useAdmin }             from "@/context/AdminContext";
import DashboardLayout          from "@/components/layout/DashboardLayout";
import { Card, CardHeader, Badge, Btn, Table, Tr, Td, SubjectBadge, MarksDiff, EmptyState, Toggle, LiveBadge } from "@/components/ui";
import type { FeatureFlags }    from "@/types";
import { useState }             from "react";

const FEATURES: { key: keyof FeatureFlags; icon: string; name: string; desc: string }[] = [
  { key: "marksEntry",  icon: "📝", name: "Marks Entry",   desc: "Allow teachers to submit & edit marks" },
  { key: "attendance",  icon: "✅", name: "Attendance",    desc: "Daily class attendance tracking" },
  { key: "parentLogin", icon: "👨‍👩‍👧", name: "Parent Login", desc: "Parent portal via phone + PIN" },
  { key: "qrLogin",     icon: "📱", name: "QR Login",      desc: "Student QR code scanning" },
  { key: "smsAlerts",   icon: "💬", name: "SMS Alerts",    desc: "SMS notifications to parents" },
  { key: "reportCards", icon: "📄", name: "Report Cards",  desc: "Auto-generate report cards" },
];

export default function SchoolDetailPage() {
  const { id }    = useParams<{ id: string }>();
  const router    = useRouter();
  const { schools, teachers, students, classes, marksAudit } = useAdmin();

  const school = schools.find(s => s.id === id);
  const [flags, setFlags] = useState<FeatureFlags>(school?.features || {
    marksEntry: true, attendance: true, parentLogin: true, qrLogin: false, smsAlerts: true, reportCards: false,
  });
  const [saving, setSaving] = useState(false);

  if (!school) return (
    <DashboardLayout title="School Detail">
      <div className="text-center py-20 text-slate-400">
        <div className="text-4xl mb-3">🏫</div>
        <p>School not found — it may still be loading</p>
        <Btn variant="outline" onClick={() => router.push("/schools")} className="mt-4">← Back to Schools</Btn>
      </div>
    </DashboardLayout>
  );

  const schoolTeachers = teachers.filter(t => t.schoolId === id || t.school_id === id);
  const schoolStudents = students.filter(s => s.schoolId === id || s.school_id === id);
  const schoolClasses  = classes.filter(c => c.schoolId === id || c.school_id === id);
  const schoolAudit    = marksAudit.filter(m => m.schoolId === id || m.school_id === id).slice(0, 5);

  const saveFeatures = async () => {
    setSaving(true);
    await updateDoc(doc(db, "schools", id), { features: flags });
    setSaving(false);
  };

  const toggleStatus = async () => {
    await updateDoc(doc(db, "schools", id), { status: school.status === "suspended" ? "active" : "suspended" });
  };

  return (
    <DashboardLayout title={school.name || school.schoolName || id}>
      <Btn variant="outline" onClick={() => router.push("/schools")} className="mb-4">← Back to Schools</Btn>

      {/* Header card */}
      <Card className="mb-4">
        <div className="flex items-center gap-4 px-5 py-4 border-b border-slate-100">
          <div className="w-12 h-12 rounded-xl bg-navy flex items-center justify-center text-white text-[14px] font-black">
            {(school.name || "S").slice(0, 2).toUpperCase()}
          </div>
          <div className="flex-1">
            <h2 className="text-navy text-lg font-extrabold">{school.name || school.schoolName || id}</h2>
            <p className="text-slate-400 text-[11.5px] mt-0.5">
              ID: <code className="bg-slate-100 px-1.5 py-0.5 rounded text-[10px]">{id}</code>
              {school.city && <> · {school.city}</>}
              {school.adminName && <> · Admin: {school.adminName}</>}
            </p>
          </div>
          <Badge status={school.status || "active"} />
          <Btn variant="danger" onClick={toggleStatus}>
            {school.status === "suspended" ? "✓ Enable School" : "⊘ Suspend School"}
          </Btn>
        </div>
        <div className="grid grid-cols-4 gap-3 p-5">
          {[["👩‍🏫","Teachers",schoolTeachers.length],["🎓","Students",schoolStudents.length],["📚","Classes",schoolClasses.length],["📝","Mark Edits",schoolAudit.length]].map(([ic,lbl,val]) => (
            <div key={String(lbl)} className="bg-slate-50 rounded-xl p-4 border border-slate-200">
              <div className="text-xl mb-1">{ic}</div>
              <div className="text-[22px] font-black text-navy">{val}</div>
              <div className="text-[11px] text-slate-400 mt-0.5">{lbl}</div>
            </div>
          ))}
        </div>
      </Card>

      <div className="grid grid-cols-2 gap-4 mb-4">
        {/* Teachers */}
        <Card>
          <CardHeader title="👩‍🏫 Teachers" count={schoolTeachers.length} />
          <Table headers={["Name","Subject","Class","Status"]}>
            {schoolTeachers.length > 0 ? schoolTeachers.map(t => (
              <Tr key={t.id}>
                <Td><span className="font-semibold text-navy">{t.full_name || t.name || "—"}</span></Td>
                <Td><SubjectBadge label={t.subject || "—"} /></Td>
                <Td><span className="text-slate-500 text-[12px]">{t.classTeacherOf || Array.isArray(t.assignedClasses) ? t.assignedClasses?.join(", ") : "—"}</span></Td>
                <Td><Badge status={t.status || "active"} /></Td>
              </Tr>
            )) : <EmptyState icon="👩‍🏫" message="No teachers for this school" />}
          </Table>
        </Card>

        {/* Marks audit */}
        <Card>
          <CardHeader title="📝 Marks Audit" count={schoolAudit.length}>
            <LiveBadge collection="markEdits" />
          </CardHeader>
          <Table headers={["Student","Subject","Change","By","Time"]}>
            {schoolAudit.length > 0 ? schoolAudit.map(m => (
              <Tr key={m.id}>
                <Td><span className="font-semibold text-navy">{m.studentName || "—"}</span></Td>
                <Td><SubjectBadge label={m.subject || "—"} /></Td>
                <Td><MarksDiff oldVal={m.oldMarks ?? m.old} newVal={m.newMarks ?? m.new} /></Td>
                <Td><span className="text-slate-500 text-[12px]">{m.editedBy || "—"}</span></Td>
                <Td mono>{m.ts}</Td>
              </Tr>
            )) : <EmptyState icon="📝" message="No audit entries for this school" />}
          </Table>
        </Card>
      </div>

      {/* Feature flags */}
      <Card>
        <CardHeader title="🎛️ Feature Flags for this School" />
        <div className="grid grid-cols-3 gap-3 p-5">
          {FEATURES.map(f => (
            <div key={f.key} className="flex items-center gap-3 bg-slate-50 rounded-xl p-4 border border-slate-200">
              <span className="text-2xl">{f.icon}</span>
              <div className="flex-1">
                <div className="text-[13px] font-bold text-navy">{f.name}</div>
                <div className="text-[11px] text-slate-400 mt-0.5">{f.desc}</div>
              </div>
              <Toggle on={!!flags[f.key]} onToggle={() => setFlags(prev => ({ ...prev, [f.key]: !prev[f.key] }))} />
            </div>
          ))}
        </div>
        <div className="flex justify-end gap-3 px-5 pb-5">
          <Btn variant="gold" onClick={saveFeatures} disabled={saving}>
            {saving ? "Saving…" : "✓ Save Feature Flags"}
          </Btn>
        </div>
      </Card>
    </DashboardLayout>
  );
}
