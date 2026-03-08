"use client";
// src/app/teachers/page.tsx
import { useState }       from "react";
import { updateDoc, doc } from "firebase/firestore";
import { db }             from "@/lib/firebase";
import { useAdmin }       from "@/context/AdminContext";
import DashboardLayout    from "@/components/layout/DashboardLayout";
import { Card, CardHeader, FilterBar, FilterInput, FilterSelect, Table, Tr, Td, Badge, Btn, Avatar, SubjectBadge, LiveBadge, EmptyState } from "@/components/ui";

export default function TeachersPage() {
  const { teachers, schools } = useAdmin();
  const [search, setSearch]   = useState("");
  const [school, setSchool]   = useState("");

  const filtered = teachers.filter(t => {
    const name = (t.full_name || t.name || t.id || "").toLowerCase();
    if (search && !name.includes(search.toLowerCase())) return false;
    if (school && t.schoolId !== school && t.school_id !== school) return false;
    return true;
  });

  const toggle = async (id: string, status?: string) => {
    await updateDoc(doc(db, "users", id), { status: status === "inactive" ? "active" : "inactive" });
  };

  return (
    <DashboardLayout title="Teachers Management">
      <Card>
        <CardHeader title="👩‍🏫 Teachers" count={filtered.length}>
          <LiveBadge collection="users" />
        </CardHeader>
        <FilterBar>
          <FilterInput placeholder="🔍  Search teachers…" value={search} onChange={setSearch} />
          <FilterSelect value={school} onChange={setSchool}
            options={[["", "All Schools"], ...schools.map(s => [s.id, s.name || s.id] as [string,string])]} />
        </FilterBar>
        <Table headers={["Teacher","Role ID","Subject","Classes","School","Status","Actions"]}>
          {filtered.length > 0 ? filtered.map(t => (
            <Tr key={t.id}>
              <Td>
                <div className="flex items-center gap-2.5">
                  <Avatar name={t.full_name || t.name} bg="#1a3a5c" />
                  <div>
                    <div className="font-bold text-navy text-[13px]">{t.full_name || t.name || "—"}</div>
                    <div className="text-[10.5px] text-slate-400">{t.email || ""}</div>
                  </div>
                </div>
              </Td>
              <Td mono>{t.role_id || t.id}</Td>
              <Td><SubjectBadge label={t.subject || "—"} /></Td>
              <Td>
                <div className="flex gap-1 flex-wrap">
                  {Array.isArray(t.assignedClasses)
                    ? t.assignedClasses.map(c => <span key={c} className="bg-slate-100 text-slate-500 text-[10px] font-semibold px-1.5 py-0.5 rounded">{c}</span>)
                    : <span className="text-slate-400 text-[12px]">{t.classTeacherOf || "—"}</span>}
                </div>
              </Td>
              <Td><span className="text-[11px] text-slate-400">{t.schoolId || t.school_id || "school_001"}</span></Td>
              <Td><Badge status={t.status || "active"} /></Td>
              <Td>
                <Btn variant="danger" onClick={() => toggle(t.id, t.status)}>
                  {t.status === "inactive" ? "✓ Enable" : "⊘ Disable"}
                </Btn>
              </Td>
            </Tr>
          )) : <EmptyState icon="👩‍🏫" message="No teachers yet" />}
        </Table>
      </Card>
    </DashboardLayout>
  );
}
