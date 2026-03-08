"use client";
// src/app/leaves/page.tsx
import { useAdmin }       from "@/context/AdminContext";
import DashboardLayout    from "@/components/layout/DashboardLayout";
import { Card, CardHeader, Table, Tr, Td, Badge, LiveBadge, EmptyState } from "@/components/ui";

export default function LeavesPage() {
  const { leaves } = useAdmin();

  const pending  = leaves.filter(l => l.status === "Pending").length;
  const approved = leaves.filter(l => l.status === "Approved").length;
  const rejected = leaves.filter(l => l.status === "Rejected").length;

  return (
    <DashboardLayout title="Leave Requests">

      {/* Summary Cards */}
      <div className="grid grid-cols-3 gap-4 mb-5">
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-card">
          <div className="text-3xl font-black text-amber-500">{pending}</div>
          <div className="text-sm text-slate-500 font-medium mt-1">⏳ Pending</div>
          <div className="text-xs text-slate-400 mt-1">Awaiting school decision</div>
        </div>
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-card">
          <div className="text-3xl font-black text-emerald-500">{approved}</div>
          <div className="text-sm text-slate-500 font-medium mt-1">✅ Approved</div>
          <div className="text-xs text-slate-400 mt-1">Approved by school</div>
        </div>
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-card">
          <div className="text-3xl font-black text-rose-500">{rejected}</div>
          <div className="text-sm text-slate-500 font-medium mt-1">❌ Rejected</div>
          <div className="text-xs text-slate-400 mt-1">Rejected by school</div>
        </div>
      </div>

      <Card>
        <CardHeader title="📋 Staff Leave Requests — View Only" count={leaves.length}>
          <LiveBadge collection="leave_requests" />
        </CardHeader>

        {/* Read-only notice */}
        <div className="px-5 py-3 bg-blue-50 border-b border-blue-100 flex items-center gap-2">
          <span className="text-blue-500 text-lg">ℹ️</span>
          <p className="text-[12px] text-blue-600 font-semibold">
            View only — Leave approvals are managed by the Class Teacher or Principal within each school.
          </p>
        </div>

        <Table headers={["Name","Role","Reason","From","To","Days","Status"]}>
          {leaves.length > 0 ? leaves.map(l => (
            <Tr key={l.id}>
              <Td><strong className="text-navy">{l.name || l.roleId || "—"}</strong></Td>
              <Td><span className="bg-slate-100 text-slate-500 text-[11px] font-semibold px-2 py-0.5 rounded">{l.role || "—"}</span></Td>
              <Td><span className="text-slate-500 text-[12px]">{l.reason || "—"}</span></Td>
              <Td mono>{l.from || "—"}</Td>
              <Td mono>{l.to || "—"}</Td>
              <Td><strong>{l.days || "—"}</strong></Td>
              <Td><Badge status={l.status || "Pending"} /></Td>
            </Tr>
          )) : <EmptyState icon="📋" message="No leave requests yet" />}
        </Table>

        <div className="px-5 py-3 bg-slate-50 border-t border-slate-100">
          <p className="text-[11px] text-slate-400">
            🔒 Super Admin has read-only access to leaves. Approve/Reject is handled by school staff.
          </p>
        </div>
      </Card>
    </DashboardLayout>
  );
}
