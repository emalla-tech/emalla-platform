import React from 'react';
import { ArrowRight, BadgeCheck, Headphones, Landmark, Route, ShieldCheck } from 'lucide-react';
import { useAuth } from '../../auth/AuthContext';
import { UserRole } from '../../types';

const roleContent = {
  [UserRole.LOGISTICS]: {
    eyebrow: 'Delivery Control',
    title: 'Logistics Operations',
    description: 'A secure workspace for dispatch, rider coordination, delivery timing, and operational exceptions.',
    accent: 'from-emerald-950 via-emerald-900 to-gray-950',
    cards: [
      ['Dispatch Board', 'Coordinate ready-for-pickup and active deliveries.', Route],
      ['Rider Operations', 'Manage rider availability and delivery assignments.', BadgeCheck],
      ['Delivery Incidents', 'Escalate delayed, failed, or disputed deliveries.', ShieldCheck]
    ]
  },
  [UserRole.FINANCE]: {
    eyebrow: 'Financial Control',
    title: 'Finance Management',
    description: 'A protected workspace for verification, reconciliation, settlements, payouts, and refund controls.',
    accent: 'from-blue-950 via-slate-900 to-gray-950',
    cards: [
      ['Payment Verification', 'Review payment evidence and transaction status.', Landmark],
      ['Settlements', 'Prepare controlled seller and rider settlements.', BadgeCheck],
      ['Reconciliation', 'Track COD and digital collection exceptions.', ShieldCheck]
    ]
  },
  [UserRole.SUPPORT]: {
    eyebrow: 'Customer Care',
    title: 'Support Desk',
    description: 'A focused workspace for customer tickets, return requests, escalations, and service follow-up.',
    accent: 'from-orange-950 via-gray-900 to-gray-950',
    cards: [
      ['Support Queue', 'Review and respond to incoming customer requests.', Headphones],
      ['Returns & Refunds', 'Prepare evidence for operational and finance review.', BadgeCheck],
      ['Escalations', 'Route delivery and payment issues to the correct team.', ShieldCheck]
    ]
  }
} as const;

const StaffOverview: React.FC = () => {
  const { user } = useAuth();
  const role = user?.role as UserRole.LOGISTICS | UserRole.FINANCE | UserRole.SUPPORT;
  const content = roleContent[role];

  return (
    <div className="space-y-7">
      <section className={`overflow-hidden rounded-[38px] bg-gradient-to-br ${content.accent} p-7 text-white shadow-xl md:p-11`}>
        <p className="text-[10px] font-black uppercase tracking-[0.35em] text-white/60">{content.eyebrow}</p>
        <div className="mt-5 grid gap-8 lg:grid-cols-[1fr_auto] lg:items-end">
          <div className="max-w-3xl">
            <h2 className="text-3xl font-black md:text-5xl">Welcome, {user?.name}</h2>
            <p className="mt-4 max-w-2xl text-sm leading-relaxed text-white/70 md:text-base">{content.description}</p>
          </div>
          <div className="rounded-3xl border border-white/10 bg-white/10 px-6 py-5 backdrop-blur">
            <p className="text-[9px] font-black uppercase tracking-widest text-white/55">Access Level</p>
            <p className="mt-2 text-xl font-black capitalize">{user?.staffLevel || 'Officer'}</p>
            <p className="mt-1 text-xs text-white/60">Least-privilege session active</p>
          </div>
        </div>
      </section>

      <section className="grid gap-5 md:grid-cols-3">
        {content.cards.map(([title, description, Icon]) => (
          <article key={title} className="group rounded-[30px] border border-gray-100 bg-white p-6 shadow-sm">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gray-950 text-white">
              <Icon size={21} />
            </div>
            <h3 className="mt-6 text-lg font-black text-gray-950">{title}</h3>
            <p className="mt-2 text-sm leading-relaxed text-gray-500">{description}</p>
            <div className="mt-6 flex items-center text-[10px] font-black uppercase tracking-widest text-gray-400">
              Permission module prepared <ArrowRight size={14} className="ml-2" />
            </div>
          </article>
        ))}
      </section>

      <section className="flex items-start gap-4 rounded-[30px] border border-emerald-100 bg-emerald-50 p-6">
        <ShieldCheck className="mt-0.5 shrink-0 text-emerald-600" size={22} />
        <div>
          <h3 className="font-black text-emerald-950">Secure workspace foundation active</h3>
          <p className="mt-2 text-sm leading-relaxed text-emerald-800">
            Your account can access only this department. Operational actions will appear as their server-side permission modules are enabled.
          </p>
        </div>
      </section>
    </div>
  );
};

export default StaffOverview;
