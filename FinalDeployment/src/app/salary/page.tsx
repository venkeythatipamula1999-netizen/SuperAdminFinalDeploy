"use client";
// src/app/salary/page.tsx
import { useAdmin }    from "@/context/AdminContext";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Card, CardHeader, Table, Tr, Td, Btn, LiveBadge, EmptyState } from "@/components/ui";

export default function SalaryPage() {
  const { salaries } = useAdmin();
  return (
    <DashboardLayout title="Staff Salaries">
      <Card>
        <CardHeader title="💰 Salary Records" count={salaries.length}>
          <LiveBadge collection="salaries" />
        </CardHeader>
        <Table headers={["Name","Role","Base Salary","Paid Months","Deductions","Actions"]}>
          {salaries.length > 0 ? salaries.map(s => (
            <Tr key={s.id}>
              <Td><strong className="text-navy">{s.name || s.roleId || "—"}</strong></Td>
              <Td><span className="bg-slate-100 text-slate-500 text-[11px] font-semibold px-2 py-0.5 rounded">{s.role || "—"}</span></Td>
              <Td><strong className="text-navy">₹{(s.baseSalary || 0).toLocaleString("en-IN")}</strong></Td>
              <Td><span className="text-slate-500 text-[12px]">{Array.isArray(s.paidMonths) ? s.paidMonths.join(", ") : (s.paidMonths || "None")}</span></Td>
              <Td><span className={(s.deductions || 0) > 0 ? "text-brand-rose font-semibold" : "text-brand-emerald"}>₹{(s.deductions || 0).toLocaleString("en-IN")}</span></Td>
              <Td><Btn variant="teal">💳 Mark Paid</Btn></Td>
            </Tr>
          )) : <EmptyState icon="💰" message="No salary records" />}
        </Table>
      </Card>
    </DashboardLayout>
  );
}
