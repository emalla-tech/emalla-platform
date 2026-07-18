import React from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  BadgeDollarSign,
  BarChart3,
  CheckCircle2,
  Link2,
  Megaphone,
  ShieldCheck,
  Sparkles,
  Users
} from 'lucide-react';

const steps = [
  {
    icon: Link2,
    title: 'Share your E-Malla link',
    text: 'Affiliates promote E-Malla Rwanda through content, communities, social pages, WhatsApp groups, blogs, and partner networks.'
  },
  {
    icon: BarChart3,
    title: 'Track qualified orders',
    text: 'The next platform phase will connect affiliate links or codes to clicks, buyers, approved orders, and commission records.'
  },
  {
    icon: BadgeDollarSign,
    title: 'Earn after order completion',
    text: 'Commission is designed to be released only after the customer receives the order and the transaction is no longer pending.'
  }
];

const partnerTypes = [
  'Content creators and reviewers',
  'Technology communities',
  'Campus ambassadors',
  'Business pages and influencers',
  'Local media and niche blogs',
  'Trusted sales partners'
];

const rules = [
  'Commissions apply only to valid completed orders.',
  'Canceled, refunded, test, duplicate, or fraudulent orders are excluded.',
  'Affiliate payouts are reviewed by the E-Malla finance team before release.',
  'Affiliate links and codes must not mislead customers or impersonate E-Malla Rwanda.',
  'Future affiliate dashboards will show clicks, orders, pending commission, and paid commission.'
];

const AffiliateProgram: React.FC = () => (
  <div className="min-h-screen bg-[#fffaf6]">
    <section className="relative overflow-hidden bg-gray-950 text-white">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(249,115,22,0.3),transparent_34rem)]" />
      <div className="absolute bottom-0 right-0 h-80 w-80 rounded-full bg-orange-500/10 blur-3xl" />
      <div className="relative mx-auto grid max-w-7xl gap-12 px-4 py-20 md:grid-cols-[1.05fr_0.95fr] md:items-center md:py-28">
        <div>
          <span className="inline-flex items-center gap-2 rounded-full border border-orange-400/30 bg-orange-500/10 px-4 py-2 text-[10px] font-black uppercase tracking-[0.28em] text-orange-300">
            <Sparkles size={14} />
            Growth Partner Program
          </span>
          <h1 className="mt-8 max-w-4xl text-4xl font-black leading-[0.95] tracking-tight md:text-7xl">
            Earn by helping Rwanda discover E-Malla.
          </h1>
          <p className="mt-7 max-w-2xl text-base font-medium leading-8 text-gray-300 md:text-lg">
            The E-Malla Affiliate Program is being prepared for creators, communities, and trusted partners who can bring qualified buyers to the marketplace.
          </p>
          <div className="mt-10 flex flex-col gap-4 sm:flex-row">
            <Link
              to="/contact?topic=affiliate"
              className="inline-flex items-center justify-center rounded-2xl bg-orange-500 px-7 py-4 text-sm font-black text-white shadow-2xl shadow-orange-500/20 transition-all hover:bg-orange-600 active:scale-95"
            >
              Apply as Affiliate
              <ArrowRight size={18} className="ml-2" />
            </Link>
            <Link
              to="/how-it-works"
              className="inline-flex items-center justify-center rounded-2xl border border-white/10 bg-white/5 px-7 py-4 text-sm font-black text-white transition-all hover:bg-white/10 active:scale-95"
            >
              See how E-Malla works
            </Link>
          </div>
        </div>

        <div className="rounded-[42px] border border-white/10 bg-white/10 p-6 shadow-2xl shadow-black/30 backdrop-blur md:p-8">
          <div className="rounded-[34px] bg-white p-7 text-gray-950 md:p-9">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.22em] text-orange-500">Phase 1</p>
                <h2 className="mt-2 text-2xl font-black">Partner interest now open</h2>
              </div>
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-orange-50 text-orange-600">
                <Megaphone size={27} />
              </div>
            </div>
            <div className="mt-7 grid gap-4">
              {[
                ['Program status', 'Application interest'],
                ['Best for', 'Creators, communities, sales partners'],
                ['Tracking', 'Referral links and codes planned'],
                ['Payout review', 'Finance controlled']
              ].map(([label, value]) => (
                <div key={label} className="rounded-2xl border border-gray-100 bg-gray-50 px-5 py-4">
                  <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">{label}</p>
                  <p className="mt-1 text-sm font-black text-gray-900">{value}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>

    <section className="mx-auto max-w-7xl px-4 py-16 md:py-20">
      <div className="mb-10 max-w-3xl">
        <p className="text-[10px] font-black uppercase tracking-[0.28em] text-orange-500">How it works</p>
        <h2 className="mt-3 text-3xl font-black text-gray-950 md:text-5xl">A simple referral engine for marketplace growth.</h2>
      </div>
      <div className="grid gap-5 md:grid-cols-3">
        {steps.map(({ icon: Icon, title, text }, index) => (
          <article key={title} className="rounded-[34px] border border-orange-100 bg-white p-7 shadow-sm">
            <div className="flex items-center justify-between">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-orange-50 text-orange-600">
                <Icon size={25} />
              </div>
              <span className="text-xs font-black text-gray-300">{String(index + 1).padStart(2, '0')}</span>
            </div>
            <h3 className="mt-8 text-xl font-black text-gray-950">{title}</h3>
            <p className="mt-3 text-sm font-medium leading-7 text-gray-600">{text}</p>
          </article>
        ))}
      </div>
    </section>

    <section className="mx-auto grid max-w-7xl gap-6 px-4 pb-16 md:grid-cols-[0.95fr_1.05fr] md:pb-20">
      <div className="rounded-[38px] bg-gray-950 p-8 text-white md:p-10">
        <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-orange-500">
          <Users size={27} />
        </div>
        <h2 className="text-3xl font-black">Who can join?</h2>
        <p className="mt-4 text-sm font-medium leading-7 text-gray-300">
          We are prioritizing partners who can bring real buyers, trusted recommendations, and long-term marketplace value.
        </p>
        <div className="mt-8 grid gap-3">
          {partnerTypes.map((item) => (
            <div key={item} className="flex items-center gap-3 rounded-2xl bg-white/5 px-4 py-3 text-sm font-bold text-gray-200">
              <CheckCircle2 size={17} className="text-emerald-400" />
              {item}
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-[38px] border border-orange-100 bg-white p-8 shadow-sm md:p-10">
        <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600">
          <ShieldCheck size={27} />
        </div>
        <h2 className="text-3xl font-black text-gray-950">Trust and payout rules</h2>
        <p className="mt-4 text-sm font-medium leading-7 text-gray-600">
          The affiliate program should grow sales without creating payout confusion, spam, or fake orders.
        </p>
        <ul className="mt-8 grid gap-4">
          {rules.map((item) => (
            <li key={item} className="flex gap-3 text-sm font-semibold leading-6 text-gray-700">
              <ShieldCheck className="mt-0.5 shrink-0 text-emerald-500" size={17} />
              <span>{item}</span>
            </li>
          ))}
        </ul>
      </div>
    </section>

    <section className="mx-auto max-w-7xl px-4 pb-20">
      <div className="overflow-hidden rounded-[42px] bg-gradient-to-r from-orange-500 to-gray-950 p-8 text-white md:p-12">
        <div className="grid gap-8 md:grid-cols-[1fr_auto] md:items-center">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.26em] text-orange-100">Affiliate launch queue</p>
            <h2 className="mt-3 max-w-3xl text-3xl font-black md:text-5xl">Want to promote E-Malla Rwanda?</h2>
            <p className="mt-4 max-w-2xl text-sm font-semibold leading-7 text-orange-50/90">
              Contact the team now. We will review partner fit first, then enable tracking and payout tools in the next affiliate system phase.
            </p>
          </div>
          <Link
            to="/contact?topic=affiliate"
            className="inline-flex items-center justify-center rounded-2xl bg-white px-7 py-4 text-sm font-black text-gray-950 transition-all hover:bg-orange-50 active:scale-95"
          >
            Contact E-Malla
            <ArrowRight size={18} className="ml-2" />
          </Link>
        </div>
      </div>
    </section>
  </div>
);

export default AffiliateProgram;
