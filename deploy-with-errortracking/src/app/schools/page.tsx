"use client";
// src/app/schools/page.tsx
import { useState, useEffect } from "react";
import { useRouter }           from "next/navigation";
import { collection, addDoc, updateDoc, doc, serverTimestamp, getDocs, query, where } from "firebase/firestore";
import { db }               from "@/lib/firebase";
import { useAdmin }         from "@/context/AdminContext";
import DashboardLayout      from "@/components/layout/DashboardLayout";
import { Card, CardHeader, FilterBar, FilterInput, Table, Tr, Td, Badge, Btn, LiveBadge, EmptyState, Modal, FormField, FormInput } from "@/components/ui";

const SCHOOL_COLORS = ["#0D1B2A","#00B4D8","#10B981","#8B5CF6","#F43F5E","#F5A623"];

// ── SCHOOL CODE GENERATION ────────────────────────────────────

function getInitials(schoolName: string): string {
  return schoolName
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .map(w => w[0].toUpperCase())
    .join("");
}

function getAreaCode(place: string): string {
  if (!place) return "LOC";
  const cleaned = place.trim().toUpperCase();
  // Remove vowels except first letter
  const first = cleaned[0];
  const rest  = cleaned.slice(1).replace(/[AEIOU]/g, "");
  const combined = (first + rest).replace(/[^A-Z]/g, "");
  // Take first 4 meaningful letters
  return combined.slice(0, 4).padEnd(3, combined[combined.length - 1] || "X");
}

function generateSchoolCode(schoolName: string, village: string): string {
  const initials = getInitials(schoolName);
  const area     = getAreaCode(village);
  return `${initials}-${area}`;
}

// ── AUTO NEXT SCHOOL ID ───────────────────────────────────────
async function getNextSchoolId(): Promise<string> {
  const snap = await getDocs(collection(db, "schools"));
  const num  = snap.size + 1;
  return `SCH${String(num).padStart(6, "0")}`;
}

// ── DUPLICATE CHECK ───────────────────────────────────────────
async function resolveUniqueCode(baseCode: string): Promise<string> {
  const snap = await getDocs(
    query(collection(db, "schools"), where("school_code", ">=", baseCode), where("school_code", "<=", baseCode + "\uf8ff"))
  );
  const existing = snap.docs.map(d => d.data().school_code as string);
  if (!existing.includes(baseCode)) return baseCode;
  let i = 1;
  while (true) {
    const candidate = `${baseCode}-${String(i).padStart(2, "0")}`;
    if (!existing.includes(candidate)) return candidate;
    i++;
  }
}

// ── QR CODE GENERATOR (pure JS, no library) ──────────────────
function QRDisplay({ value }: { value: string }) {
  return (
    <div className="flex flex-col items-center gap-2">
      <div className="w-32 h-32 bg-white border-2 border-navy rounded-xl flex items-center justify-center p-2 shadow">
        {/* Simple visual placeholder — real QR via API */}
        <img
          src={`https://api.qrserver.com/v1/create-qr-code/?size=120x120&data=${encodeURIComponent(value)}&bgcolor=ffffff&color=0f2744`}
          alt={`QR for ${value}`}
          className="w-full h-full object-contain"
        />
      </div>
      <span className="font-mono text-xs text-slate-500 bg-slate-100 px-2 py-1 rounded">{value}</span>
    </div>
  );
}

// ── MAIN COMPONENT ────────────────────────────────────────────
export default function SchoolsPage() {
  const { schools, teachers, students } = useAdmin();
  const router = useRouter();

  const [search,    setSearch]    = useState("");
  const [showModal, setShowModal] = useState(false);
  const [showQR,    setShowQR]    = useState<string | null>(null);
  const [saving,    setSaving]    = useState(false);
  const [preview,   setPreview]   = useState("");

  const [form, setForm] = useState({
    school_name:  "",
    village:      "",
    district:     "",
    state:        "",
    adminName:    "",
    adminEmail:   "",
    adminPhone:   "",
  });

  // Live preview of school code as user types
  useEffect(() => {
    if (form.school_name && form.village) {
      setPreview(generateSchoolCode(form.school_name, form.village));
    } else {
      setPreview("");
    }
  }, [form.school_name, form.village]);

  const filtered = schools.filter(s =>
    !search || (s.name || s.schoolName || s.id || "").toLowerCase().includes(search.toLowerCase())
  );

  const toggleStatus = async (id: string, current?: string) => {
    await updateDoc(doc(db, "schools", id), {
      status: current === "suspended" ? "active" : "suspended"
    });
  };

  const createSchool = async () => {
    if (!form.school_name || !form.village) return;
    setSaving(true);
    try {
      const baseCode    = generateSchoolCode(form.school_name, form.village);
      const school_code = await resolveUniqueCode(baseCode);
      const school_id   = await getNextSchoolId();

      await addDoc(collection(db, "schools"), {
        school_id,
        school_code,
        name:        form.school_name,
        schoolName:  form.school_name,
        village:     form.village,
        district:    form.district,
        state:       form.state,
        city:        form.village,
        adminName:   form.adminName,
        adminEmail:  form.adminEmail,
        adminPhone:  form.adminPhone,
        status:      "active",
        createdAt:   serverTimestamp(),
      });

      setShowModal(false);
      setShowQR(school_code);
      setForm({ school_name:"", village:"", district:"", state:"", adminName:"", adminEmail:"", adminPhone:"" });
    } finally {
      setSaving(false);
    }
  };

  return (
    <DashboardLayout title="Schools Management">

      {/* Summary */}
      <div className="grid grid-cols-3 gap-4 mb-5">
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-card">
          <div className="text-3xl font-black text-navy">{schools.length}</div>
          <div className="text-sm text-slate-500 font-medium mt-1">🏫 Total Schools</div>
        </div>
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-card">
          <div className="text-3xl font-black text-emerald-500">{schools.filter(s => s.status !== "suspended").length}</div>
          <div className="text-sm text-slate-500 font-medium mt-1">✅ Active Schools</div>
        </div>
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-card">
          <div className="text-3xl font-black text-rose-400">{schools.filter(s => s.status === "suspended").length}</div>
          <div className="text-sm text-slate-500 font-medium mt-1">⊘ Suspended</div>
        </div>
      </div>

      <Card>
        <CardHeader title="🏫 All Schools" count={filtered.length}>
          <LiveBadge collection="schools" />
          <Btn variant="gold" onClick={() => setShowModal(true)}>＋ Onboard School</Btn>
        </CardHeader>
        <FilterBar>
          <FilterInput placeholder="🔍  Search schools…" value={search} onChange={setSearch} />
        </FilterBar>
        <Table headers={["School","School Code","Location","Admin","Teachers","Students","Status","Actions"]}>
          {filtered.length > 0 ? filtered.map((s, i) => {
            const tCount = teachers.filter(t => t.schoolId === s.id || t.school_id === s.id).length;
            const sCount = students.filter(st => st.schoolId === s.id || st.school_id === s.id).length;
            const code   = (s as any).school_code || s.id;
            return (
              <Tr key={s.id}>
                <Td>
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-lg flex items-center justify-center text-[11px] font-black text-white flex-shrink-0"
                      style={{ background: SCHOOL_COLORS[i % 6] }}>
                      {(s.name || s.schoolName || "S").slice(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <div className="font-bold text-navy text-[13px]">{s.name || s.schoolName || s.id}</div>
                      <div className="text-[10px] text-slate-400 font-mono">{(s as any).school_id || "—"}</div>
                    </div>
                  </div>
                </Td>
                <Td>
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-[12px] bg-navy/5 text-navy px-2 py-1 rounded">{code}</span>
                    <button onClick={() => setShowQR(code)}
                      className="text-slate-400 hover:text-navy text-xs cursor-pointer" title="Show QR">
                      📱
                    </button>
                  </div>
                </Td>
                <Td>
                  <div className="text-[12px]">
                    <div className="font-semibold text-slate-700">{(s as any).village || s.city || "—"}</div>
                    <div className="text-slate-400 text-[10px]">{(s as any).district || ""} {(s as any).state ? `· ${(s as any).state}` : ""}</div>
                  </div>
                </Td>
                <Td>
                  <div className="text-[12px]">
                    <div className="font-semibold text-slate-700">{s.adminName || "—"}</div>
                    <div className="text-slate-400 text-[10px]">{s.adminEmail || ""}</div>
                  </div>
                </Td>
                <Td><strong>{tCount}</strong></Td>
                <Td><strong>{sCount}</strong></Td>
                <Td><Badge status={s.status || "active"} /></Td>
                <Td>
                  <div className="flex gap-2">
                    <Btn variant="teal" onClick={() => router.push(`/schools/${s.id}`)}>👁 View</Btn>
                    <Btn variant="danger" onClick={() => toggleStatus(s.id, s.status)}>
                      {s.status === "suspended" ? "✓ Enable" : "⊘ Suspend"}
                    </Btn>
                  </div>
                </Td>
              </Tr>
            );
          }) : <EmptyState icon="🏫" message="No schools yet — onboard your first school!" />}
        </Table>
      </Card>

      {/* ── ONBOARD MODAL ── */}
      {showModal && (
        <Modal title="🏫 Onboard New School" onClose={() => setShowModal(false)}>
          <div className="space-y-1">

            {/* School Code Preview */}
            {preview && (
              <div className="bg-gold/10 border border-gold/30 rounded-xl px-4 py-3 mb-4 flex items-center justify-between">
                <div>
                  <div className="text-[10px] font-bold text-gold uppercase tracking-wide">Generated School Code</div>
                  <div className="font-mono font-black text-navy text-xl mt-0.5">{preview}</div>
                  <div className="text-[10px] text-slate-400 mt-0.5">Final code may add -01, -02 if duplicate exists</div>
                </div>
                <div className="text-3xl">🏫</div>
              </div>
            )}

            <FormField label="School Name *">
              <FormInput placeholder="e.g. Akshara High School" value={form.school_name}
                onChange={v => setForm(f => ({ ...f, school_name: v }))} />
            </FormField>
            <FormField label="Village / City *">
              <FormInput placeholder="e.g. Gopalraopet" value={form.village}
                onChange={v => setForm(f => ({ ...f, village: v }))} />
            </FormField>
            <div className="grid grid-cols-2 gap-3">
              <FormField label="District">
                <FormInput placeholder="e.g. Siddipet" value={form.district}
                  onChange={v => setForm(f => ({ ...f, district: v }))} />
              </FormField>
              <FormField label="State">
                <select
                  value={form.state}
                  onChange={e => setForm(f => ({ ...f, state: e.target.value }))}
                  className="w-full border border-slate-200 bg-slate-50 px-3.5 py-2.5 rounded-xl text-[13px] text-navy outline-none focus:border-brand-teal focus:bg-white transition font-sans"
                >
                  <option value="">Select State</option>
                  <option>Andhra Pradesh</option>
                  <option>Arunachal Pradesh</option>
                  <option>Assam</option>
                  <option>Bihar</option>
                  <option>Chhattisgarh</option>
                  <option>Goa</option>
                  <option>Gujarat</option>
                  <option>Haryana</option>
                  <option>Himachal Pradesh</option>
                  <option>Jharkhand</option>
                  <option>Karnataka</option>
                  <option>Kerala</option>
                  <option>Madhya Pradesh</option>
                  <option>Maharashtra</option>
                  <option>Manipur</option>
                  <option>Meghalaya</option>
                  <option>Mizoram</option>
                  <option>Nagaland</option>
                  <option>Odisha</option>
                  <option>Punjab</option>
                  <option>Rajasthan</option>
                  <option>Sikkim</option>
                  <option>Tamil Nadu</option>
                  <option>Telangana</option>
                  <option>Tripura</option>
                  <option>Uttar Pradesh</option>
                  <option>Uttarakhand</option>
                  <option>West Bengal</option>
                  <option>Andaman and Nicobar Islands</option>
                  <option>Chandigarh</option>
                  <option>Dadra and Nagar Haveli and Daman and Diu</option>
                  <option>Delhi</option>
                  <option>Jammu and Kashmir</option>
                  <option>Ladakh</option>
                  <option>Lakshadweep</option>
                  <option>Puducherry</option>
                </select>
              </FormField>
            </div>

            <div className="border-t border-slate-100 pt-3 mt-3">
              <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wide mb-3">School Admin Credentials</div>
              <FormField label="Admin Name">
                <FormInput placeholder="e.g. Dr. Ramesh Kumar" value={form.adminName}
                  onChange={v => setForm(f => ({ ...f, adminName: v }))} />
              </FormField>
              <FormField label="Admin Email">
                <FormInput placeholder="admin@schoolname.edu.in" value={form.adminEmail}
                  onChange={v => setForm(f => ({ ...f, adminEmail: v }))} type="email" />
              </FormField>
              <FormField label="Admin Phone">
                <FormInput placeholder="+91 9876543210" value={form.adminPhone}
                  onChange={v => setForm(f => ({ ...f, adminPhone: v }))} />
              </FormField>
            </div>
          </div>

          <div className="flex gap-3 justify-end mt-5">
            <Btn variant="outline" onClick={() => setShowModal(false)}>Cancel</Btn>
            <Btn variant="gold" onClick={createSchool}
              disabled={saving || !form.school_name || !form.village}>
              {saving ? "Creating…" : "✓ Onboard School"}
            </Btn>
          </div>
        </Modal>
      )}

      {/* ── QR CODE MODAL ── */}
      {showQR && (
        <Modal title="📱 School QR Code" onClose={() => setShowQR(null)}>
          <div className="flex flex-col items-center gap-5 py-4">
            <QRDisplay value={showQR} />
            <div className="text-center">
              <div className="text-sm font-bold text-navy">School Code: <span className="font-mono">{showQR}</span></div>
              <div className="text-xs text-slate-400 mt-1">Scan this QR code in the mobile app to load the school login page</div>
            </div>
            <div className="bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-3 w-full">
              <p className="text-[12px] text-emerald-700 font-semibold text-center">
                ✅ School onboarded successfully!<br/>
                <span className="font-normal">Share this QR code with the School Admin</span>
              </p>
            </div>
            <Btn variant="outline" onClick={() => setShowQR(null)}>Close</Btn>
          </div>
        </Modal>
      )}

    </DashboardLayout>
  );
}
