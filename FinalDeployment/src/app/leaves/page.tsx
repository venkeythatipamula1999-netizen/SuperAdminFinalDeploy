"use client";
// src/app/leaves/page.tsx
import { updateDoc, doc } from "firebase/firestore";
import { db }             from "@/lib/firebase";
import { api }            from "@/services/api";
import { useAdmin }       from "@/context/AdminContext";
import DashboardLayout    from "@/components/layout/DashboardLayout";
import { Card, CardHeader, Table, Tr, Td, Badge, Btn, LiveBadge, EmptyState } from "@/components/ui";

export default function LeavesPage() {
  const { leaves } = useAdmin();

  const approve = async (id: string) => {
    await api.post("/api/admin/leaves/approve", { leaveId: id });
    await updateDoc(doc(db, "leave_requests", id), { status: "Approved" });
  };
  const reject = async (id: string) => {
    await api.post("/api/admin/leaves/reject", { leaveId: id, reason: "Rejected by super admin" });
    await updateDoc(doc(db, "leave_requests", id), { status: "Rejected" });
  };

  return (
    <DashboardLayout title="Leave Requests">
      <Card>
        <CardHeader title="📋 Staff Leave Requests" count={leaves.length}>
          <LiveBadge collection="leave_requests" />
        </CardHeader>
        <Table headers={["Name","Role","Reason","From","To","Days","Status","Actions"]}>
          {leaves.length > 0 ? leaves.map(l => (
            <Tr key={l.id}>
              <Td><strong className="text-navy">{l.name || l.roleId || "—"}</strong></Td>
              <Td><span className="bg-slate-100 text-slate-500 text-[11px] font-semibold px-2 py-0.5 rounded">{l.role || "—"}</span></Td>
              <Td><span className="text-slate-500 text-[12px]">{l.reason || "—"}</span></Td>
              <Td mono>{l.from || "—"}</Td>
              <Td mono>{l.to || "—"}</Td>
              <Td><strong>{l.days || "—"}</strong></Td>
              <Td><Badge status={l.status || "Pending"} /></Td>
              <Td>
                {l.status === "Pending" && (
                  <div className="flex gap-2">
                    <Btn variant="teal" onClick={() => approve(l.id)}>✓ Approve</Btn>
                    <Btn variant="danger" onClick={() => reject(l.id)}>✗ Reject</Btn>
                  </div>
                )}
              </Td>
            </Tr>
          )) : <EmptyState icon="📋" message="No leave requests" />}
        </Table>
      </Card>
    </DashboardLayout>
  );
}
