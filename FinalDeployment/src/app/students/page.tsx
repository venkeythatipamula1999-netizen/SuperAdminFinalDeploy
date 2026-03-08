"use client";
// src/app/students/page.tsx
import { useState, useRef }       from "react";
import { useAdmin }         from "@/context/AdminContext";
import { api }              from "@/services/api";
import DashboardLayout      from "@/components/layout/DashboardLayout";
import { Card, CardHeader, FilterBar, FilterInput, FilterSelect, Table, Tr, Td, Badge, Btn, Avatar, ClassBadge, LiveBadge, EmptyState } from "@/components/ui";

export default function StudentsPage() {
  const { students, schools } = useAdmin();
  const [search, setSearch]   = useState("");
  const [cls,    setCls]      = useState("");
  const [school, setSchool]   = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  const classes = [...new Set(students.map(s => s.classId || s.class || "").filter(Boolean))];
  const filtered = students.filter(s => {
    if (search && !(s.name || "").toLowerCase().includes(search.toLowerCase())) return false;
    if (cls    && s.classId !== cls && s.class !== cls)                          return false;
    if (school && s.schoolId !== school && s.school_id !== school)               return false;
    return true;
  });

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const formData = new FormData();
    formData.append("file", file);
    const token = await import("@/lib/firebase").then(m => m.auth.currentUser?.getIdToken());
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/admin/import-csv`, {
      method: "POST",
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      body: formData,
    });
    const data = await res.json();
    alert(data.message || "Import complete!");
  };

  return (
    <DashboardLayout title="Students Management">
      <input ref={fileRef} type="file" accept=".csv" className="hidden" onChange={handleImport} />
      <Card>
        <CardHeader title="🎓 Students" count={filtered.length}>
          <LiveBadge collection="students" />
          <Btn variant="outline" onClick={() => fileRef.current?.click()}>📥 Import CSV</Btn>
        </CardHeader>
        <FilterBar>
          <FilterInput placeholder="🔍  Search students…" value={search} onChange={setSearch} />
          <FilterSelect value={cls} onChange={setCls}
            options={[["", "All Classes"], ...classes.map(c => [c, c] as [string,string])]} />
          <FilterSelect value={school} onChange={setSchool}
            options={[["", "All Schools"], ...schools.map(s => [s.id, s.name || s.id] as [string,string])]} />
        </FilterBar>
        <Table headers={["Student","Class","Roll No","Parent Phone","Student ID","School"]}>
          {filtered.length > 0 ? filtered.map(s => (
            <Tr key={s.id}>
              <Td>
                <div className="flex items-center gap-2.5">
                  <Avatar name={s.name} bg="#00B4D8" />
                  <span className="font-bold text-navy text-[13px]">{s.name || "—"}</span>
                </div>
              </Td>
              <Td><ClassBadge label={s.classId || s.class || "—"} /></Td>
              <Td mono>{s.rollNumber || "—"}</Td>
              <Td mono>{s.parentPhone || "—"}</Td>
              <Td mono>{s.studentId || s.id}</Td>
              <Td><span className="text-[11px] text-slate-400">{s.schoolId || s.school_id || "—"}</span></Td>
            </Tr>
          )) : <EmptyState icon="🎓" message="No students yet" />}
        </Table>
      </Card>
    </DashboardLayout>
  );
}
