"use client";
// src/app/schools/page.tsx
import { useState } from "react";
import { useRouter } from "next/navigation";
import { collection, addDoc, updateDoc, doc, serverTimestamp } from "firebase/firestore";
import { db }               from "@/lib/firebase";
import { useAdmin }         from "@/context/AdminContext";
import DashboardLayout      from "@/components/layout/DashboardLayout";
import { Card, CardHeader, FilterBar, FilterInput, Table, Tr, Td, Badge, Btn, Avatar, LiveBadge, EmptyState, Modal, FormField, FormInput } from "@/components/ui";

const SCHOOL_COLORS = ["#0D1B2A","#00B4D8","#10B981","#8B5CF6","#F43F5E","#F5A623"];

export default function SchoolsPage() {
  const { schools, teachers, students } = useAdmin();
  const router = useRouter();
  const [search,    setSearch]    = useState("");
  const [showModal, setShowModal] = useState(false);
  const [form,      setForm]      = useState({ name:"", city:"", adminName:"", adminEmail:"", adminPhone:"" });
  const [saving,    setSaving]    = useState(false);

  const filtered = schools.filter(s =>
    !search || (s.name || s.schoolName || s.id || "").toLowerCase().includes(search.toLowerCase())
  );

  const toggleStatus = async (id: string, current?: string) => {
    await updateDoc(doc(db, "schools", id), { status: current === "suspended" ? "active" : "suspended" });
  };

  const createSchool = async () => {
    if (!form.name) return;
    setSaving(true);
    await addDoc(collection(db, "schools"), { ...form, status: "active", createdAt: serverTimestamp() });
    setSaving(false);
    setShowModal(false);
    setForm({ name:"", city:"", adminName:"", adminEmail:"", adminPhone:"" });
  };

  return (
    <DashboardLayout title="Schools Management">
      <Card>
        <CardHeader title="🏫 All Schools" count={filtered.length}>
          <LiveBadge collection="schools" />
          <Btn variant="gold" onClick={() => setShowModal(true)}>＋ Add School</Btn>
        </CardHeader>
        <FilterBar>
          <FilterInput placeholder="🔍  Search schools…" value={search} onChange={setSearch} />
        </FilterBar>
        <Table headers={["Logo","School Name","City","Admin","Teachers","Students","Status","Actions"]}>
          {filtered.length > 0 ? filtered.map((s, i) => {
            const tCount = teachers.filter(t => t.schoolId === s.id || t.school_id === s.id).length;
            const sCount = students.filter(st => st.schoolId === s.id || st.school_id === s.id).length;
            return (
              <Tr key={s.id}>
                <Td>
                  <div className="w-9 h-9 rounded-lg flex items-center justify-center text-[11px] font-black text-white"
                    style={{ background: SCHOOL_COLORS[i % 6] }}>
                    {(s.name || s.schoolName || "S").slice(0, 2).toUpperCase()}
                  </div>
                </Td>
                <Td><span className="font-bold text-navy text-[13px]">{s.name || s.schoolName || s.id}</span></Td>
                <Td><span className="text-slate-500">{s.city || "—"}</span></Td>
                <Td>{s.adminName || "—"}</Td>
                <Td><strong>{tCount}</strong></Td>
                <Td><strong>{sCount}</strong></Td>
                <Td><Badge status={s.status || "active"} /></Td>
                <Td>
                  <div className="flex gap-2">
                    <Btn variant="teal" onClick={() => router.push(`/schools/${s.id}`)}>👁 View</Btn>
                    <Btn variant="danger" onClick={() => toggleStatus(s.id, s.status)}>
                      {s.status === "suspended" ? "✓ Enable" : "⊘ Disable"}
                    </Btn>
                  </div>
                </Td>
              </Tr>
            );
          }) : <EmptyState icon="🏫" message="No schools found — add one to get started" />}
        </Table>
      </Card>

      {showModal && (
        <Modal title="🏫 Add New School" onClose={() => setShowModal(false)}>
          <FormField label="School Name"><FormInput placeholder="e.g. Sree Pragathi High School" value={form.name} onChange={v => setForm(f => ({ ...f, name: v }))} /></FormField>
          <FormField label="City"><FormInput placeholder="e.g. Hyderabad" value={form.city} onChange={v => setForm(f => ({ ...f, city: v }))} /></FormField>
          <FormField label="Admin Name"><FormInput placeholder="e.g. Dr. Ramesh Kumar" value={form.adminName} onChange={v => setForm(f => ({ ...f, adminName: v }))} /></FormField>
          <FormField label="Admin Email"><FormInput placeholder="admin@school.edu.in" value={form.adminEmail} onChange={v => setForm(f => ({ ...f, adminEmail: v }))} type="email" /></FormField>
          <FormField label="Admin Phone"><FormInput placeholder="+91 9876543210" value={form.adminPhone} onChange={v => setForm(f => ({ ...f, adminPhone: v }))} /></FormField>
          <div className="flex gap-3 justify-end mt-5">
            <Btn variant="outline" onClick={() => setShowModal(false)}>Cancel</Btn>
            <Btn variant="gold" onClick={createSchool} disabled={saving || !form.name}>
              {saving ? "Creating…" : "✓ Create School"}
            </Btn>
          </div>
        </Modal>
      )}
    </DashboardLayout>
  );
}
