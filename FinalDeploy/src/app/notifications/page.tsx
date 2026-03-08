"use client";
// src/app/notifications/page.tsx
import { updateDoc, doc, getDocs, query, collection, where, writeBatch } from "firebase/firestore";
import { db }             from "@/lib/firebase";
import { useAdmin }       from "@/context/AdminContext";
import DashboardLayout    from "@/components/layout/DashboardLayout";
import { Card, CardHeader, Btn, LiveBadge } from "@/components/ui";

export default function NotificationsPage() {
  const { notifications, unreadCount } = useAdmin();

  const markRead = async (id: string) => {
    await updateDoc(doc(db, "alerts", id), { read: true });
  };
  const markAllRead = async () => {
    const snap  = await getDocs(query(collection(db, "alerts"), where("read", "==", false)));
    const batch = writeBatch(db);
    snap.docs.forEach(d => batch.update(d.ref, { read: true }));
    await batch.commit();
  };

  return (
    <DashboardLayout title="Notifications Center">
      <Card>
        <CardHeader title="🔔 All Alerts" count={notifications.length}>
          <LiveBadge collection="alerts" />
          {unreadCount > 0 && (
            <span className="bg-brand-rose/10 text-brand-rose text-[11px] font-bold px-2.5 py-0.5 rounded-full">{unreadCount} unread</span>
          )}
          <Btn variant="outline" onClick={markAllRead}>✓ Mark All Read</Btn>
        </CardHeader>
        <div className="divide-y divide-slate-50">
          {notifications.length > 0 ? notifications.map(n => (
            <div key={n.id}
              onClick={() => !n.read && markRead(n.id)}
              className={`flex items-start gap-3 px-5 py-4 transition-colors cursor-pointer hover:bg-slate-50 ${!n.read ? "bg-gold/[0.02]" : ""}`}>
              <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center text-lg flex-shrink-0">
                {n.type === "error" ? "⚠️" : n.driverId ? "🚌" : n.studentId ? "🎓" : "ℹ️"}
              </div>
              <div className="flex-1">
                <p className={`text-[13px] ${n.read ? "font-medium text-slate-700" : "font-bold text-navy"}`}>{n.message || n.title || "Alert"}</p>
                {n.type && <p className="text-[11px] text-slate-400 mt-0.5">Type: {n.type}</p>}
                <p className="text-[10.5px] text-slate-400 mt-1 font-mono">{n.ts}</p>
              </div>
              {!n.read && <span className="w-2.5 h-2.5 bg-gold rounded-full mt-1.5 flex-shrink-0" />}
            </div>
          )) : (
            <div className="text-center py-16 text-slate-400">
              <div className="text-5xl mb-3">🔔</div>
              <p>No notifications yet</p>
            </div>
          )}
        </div>
      </Card>
    </DashboardLayout>
  );
}
