"use client";
// src/app/fees/page.tsx
import { useAdmin }    from "@/context/AdminContext";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Card, CardHeader, Table, Tr, Td, Badge, LiveBadge, EmptyState } from "@/components/ui";

export default function FeesPage() {
  const { fees } = useAdmin();
  const totalPaid   = fees.filter(f => f.status === "paid").reduce((s, f) => s + (f.amount || 0), 0);
  const totalUnpaid = fees.filter(f => f.status === "unpaid").reduce((s, f) => s + (f.amount || 0), 0);

  return (
    <DashboardLayout title="Fees">
      <div className="grid grid-cols-3 gap-4 mb-5">
        {[["🧾","Total Records",fees.length.toString(),""],["✅","Total Paid","₹"+totalPaid.toLocaleString("en-IN"),"text-brand-emerald"],["⏳","Total Unpaid","₹"+totalUnpaid.toLocaleString("en-IN"),"text-brand-rose"]].map(([ic,lbl,val,cls]) => (
          <div key={lbl} className="bg-white rounded-2xl p-5 border border-slate-200 shadow-card">
            <div className="text-2xl mb-2">{ic}</div>
            <div className={`text-[24px] font-black ${cls || "text-navy"}`}>{val}</div>
            <div className="text-[11px] text-slate-400 mt-1">{lbl}</div>
          </div>
        ))}
      </div>
      <Card>
        <CardHeader title="🧾 Fee Records" count={fees.length}>
          <LiveBadge collection="fees" />
        </CardHeader>
        <Table headers={["Student ID","Amount","Due Date","Status","Paid Date"]}>
          {fees.length > 0 ? fees.map(f => (
            <Tr key={f.id}>
              <Td mono>{f.studentId || "—"}</Td>
              <Td><strong className="text-navy">₹{(f.amount || 0).toLocaleString("en-IN")}</strong></Td>
              <Td mono>{f.dueDate || "—"}</Td>
              <Td><Badge status={f.status || "unpaid"} /></Td>
              <Td mono>{f.paidDate || "—"}</Td>
            </Tr>
          )) : <EmptyState icon="🧾" message="No fee records" />}
        </Table>
      </Card>
    </DashboardLayout>
  );
}
