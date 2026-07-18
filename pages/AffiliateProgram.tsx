import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  BadgeDollarSign,
  BarChart3,
  CheckCircle2,
  Link2,
  Loader2,
  Megaphone,
  Send,
  ShieldCheck,
  Sparkles,
  Users
} from 'lucide-react';
import { buildAffiliateLink, normalizeAffiliateCode } from '../services/affiliateReferralService';
import { InquiryService } from '../services/inquiryService';

const steps = [
  {
    icon: Link2,
    title: 'Share your E-Malla link',
    text: 'Affiliates promote E-Malla Rwanda through content, communities, social pages, WhatsApp groups, blogs, and partner networks.'
  },
  {
    icon: BarChart3,
    title: 'Track qualified orders',
    text: 'Approved referral codes are captured at checkout and attached to orders so finance can review qualified performance.'
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
  'Future affiliate dashboards will add clicks, pending commission, and paid commission after commission rules are activated.'
];

const AffiliateProgram: React.FC = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    partnerType: '',
    preferredCode: '',
    channel: '',
    audienceSize: '',
    message: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const updateField = (field: keyof typeof formData, value: string) => {
    setFormData((current) => ({ ...current, [field]: value }));
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (isSubmitting) return;

    setIsSubmitting(true);
    setSubmitError(null);
    try {
      const normalizedCode = normalizeAffiliateCode(formData.preferredCode);
      await InquiryService.submitAffiliateApplication({
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        partnerType: formData.partnerType,
        preferredCode: normalizedCode,
        channel: formData.channel,
        audienceSize: formData.audienceSize,
        message: formData.message,
        referralLinkPreview: normalizedCode ? buildAffiliateLink(normalizedCode) : ''
      });
      setSubmitted(true);
      setFormData({
        name: '',
        email: '',
        phone: '',
        partnerType: '',
        preferredCode: '',
        channel: '',
        audienceSize: '',
        message: ''
      });
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : 'Unable to submit affiliate application right now.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const normalizedPreferredCode = normalizeAffiliateCode(formData.preferredCode);
  const referralPreviewLink = normalizedPreferredCode
    ? buildAffiliateLink(normalizedPreferredCode)
    : 'https://www.emallarwanda.com/?ref=YOURCODE';
  const shopPreviewLink = normalizedPreferredCode
    ? buildAffiliateLink(normalizedPreferredCode, '/shop')
    : 'https://www.emallarwanda.com/shop?ref=YOURCODE';

  return (
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
            <a
              href="#affiliate-application"
              className="inline-flex items-center justify-center rounded-2xl bg-orange-500 px-7 py-4 text-sm font-black text-white shadow-2xl shadow-orange-500/20 transition-all hover:bg-orange-600 active:scale-95"
            >
              Apply as Affiliate
              <ArrowRight size={18} className="ml-2" />
            </a>
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
                ['Link format', 'emallarwanda.com/?ref=CODE'],
                ['Tracking', '30-day local attribution prepared'],
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

    <section className="mx-auto max-w-7xl px-4 pb-16 md:pb-20">
      <div className="grid gap-6 rounded-[42px] border border-orange-100 bg-white p-8 shadow-sm md:grid-cols-[0.9fr_1.1fr] md:p-10">
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.28em] text-orange-500">Referral structure</p>
          <h2 className="mt-3 text-3xl font-black text-gray-950 md:text-5xl">Simple links now, full tracking next.</h2>
          <p className="mt-5 text-sm font-medium leading-7 text-gray-600">
            Affiliate links use one clean structure that can work across home, shop, and product pages. The site captures approved referral codes from URL parameters and attaches them to checkout orders for finance review.
          </p>
        </div>
        <div className="grid gap-4">
          {[
            ['Homepage referral', 'https://www.emallarwanda.com/?ref=AFFILIATECODE'],
            ['Shop referral', 'https://www.emallarwanda.com/shop?ref=AFFILIATECODE'],
            ['Accepted aliases', '?ref=CODE, ?affiliate=CODE, ?aff=CODE'],
            ['Code format', '3-40 characters: letters, numbers, dash, underscore']
          ].map(([label, value]) => (
            <div key={label} className="rounded-2xl border border-gray-100 bg-gray-50 px-5 py-4">
              <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">{label}</p>
              <p className="mt-1 break-all text-sm font-black text-gray-900">{value}</p>
            </div>
          ))}
        </div>
      </div>
    </section>

    <section id="affiliate-application" className="mx-auto max-w-7xl scroll-mt-24 px-4 pb-20">
      <div className="overflow-hidden rounded-[42px] bg-gradient-to-r from-orange-500 to-gray-950 p-8 text-white md:p-12">
        <div className="grid gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:items-start">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.26em] text-orange-100">Affiliate launch queue</p>
            <h2 className="mt-3 max-w-3xl text-3xl font-black md:text-5xl">Want to promote E-Malla Rwanda?</h2>
            <p className="mt-4 max-w-2xl text-sm font-semibold leading-7 text-orange-50/90">
              Apply now and our team will review your audience, channels, and fit. Approved partners will be prioritized when referral links, tracking, and payout tools go live.
            </p>
            <div className="mt-8 grid gap-3 text-sm font-bold text-orange-50/90">
              {['Admin review through the existing inquiries desk', 'No automatic payout changes yet', 'Approved referral codes are attached to checkout orders'].map((item) => (
                <div key={item} className="flex items-center gap-3">
                  <CheckCircle2 size={17} className="text-white" />
                  <span>{item}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-[34px] bg-white p-6 text-gray-950 shadow-2xl shadow-black/20 md:p-8">
            {submitted ? (
              <div className="py-8 text-center">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600">
                  <CheckCircle2 size={34} />
                </div>
                <h3 className="mt-6 text-2xl font-black text-gray-950">Application received</h3>
                <p className="mx-auto mt-3 max-w-sm text-sm font-medium leading-7 text-gray-600">
                  Thank you for applying. E-Malla team will review your affiliate profile and contact you with the next steps.
                </p>
                <button
                  type="button"
                  onClick={() => setSubmitted(false)}
                  className="mt-7 rounded-2xl bg-gray-950 px-6 py-3 text-sm font-black text-white transition-all hover:bg-orange-600"
                >
                  Submit another application
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-[0.22em] text-orange-500">Affiliate application</p>
                  <h3 className="mt-2 text-2xl font-black text-gray-950">Tell us how you will promote E-Malla.</h3>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <label className="block">
                    <span className="mb-2 block text-[10px] font-black uppercase tracking-widest text-gray-400">Full name</span>
                    <input
                      required
                      value={formData.name}
                      onChange={(event) => updateField('name', event.target.value)}
                      className="w-full rounded-2xl border-2 border-transparent bg-gray-50 px-5 py-4 text-sm font-bold outline-none transition-all focus:border-orange-500 focus:bg-white"
                      placeholder="Your name"
                    />
                  </label>
                  <label className="block">
                    <span className="mb-2 block text-[10px] font-black uppercase tracking-widest text-gray-400">Email</span>
                    <input
                      required
                      type="email"
                      value={formData.email}
                      onChange={(event) => updateField('email', event.target.value)}
                      className="w-full rounded-2xl border-2 border-transparent bg-gray-50 px-5 py-4 text-sm font-bold outline-none transition-all focus:border-orange-500 focus:bg-white"
                      placeholder="you@example.com"
                    />
                  </label>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <label className="block">
                    <span className="mb-2 block text-[10px] font-black uppercase tracking-widest text-gray-400">Phone / WhatsApp</span>
                    <input
                      required
                      type="tel"
                      value={formData.phone}
                      onChange={(event) => updateField('phone', event.target.value)}
                      className="w-full rounded-2xl border-2 border-transparent bg-gray-50 px-5 py-4 text-sm font-bold outline-none transition-all focus:border-orange-500 focus:bg-white"
                      placeholder="+250 7xx xxx xxx"
                    />
                  </label>
                  <label className="block">
                    <span className="mb-2 block text-[10px] font-black uppercase tracking-widest text-gray-400">Partner type</span>
                    <select
                      required
                      value={formData.partnerType}
                      onChange={(event) => updateField('partnerType', event.target.value)}
                      className="w-full rounded-2xl border-2 border-transparent bg-gray-50 px-5 py-4 text-sm font-bold outline-none transition-all focus:border-orange-500 focus:bg-white"
                    >
                      <option value="">Select type</option>
                      <option>Content creator</option>
                      <option>Influencer / social page</option>
                      <option>Campus ambassador</option>
                      <option>Business partner</option>
                      <option>Community leader</option>
                      <option>Other</option>
                    </select>
                  </label>
                </div>

                <label className="block rounded-[28px] border border-orange-100 bg-orange-50/70 p-5">
                  <span className="mb-2 block text-[10px] font-black uppercase tracking-widest text-orange-600">Preferred referral code</span>
                  <input
                    value={formData.preferredCode}
                    onChange={(event) => updateField('preferredCode', event.target.value)}
                    className="w-full rounded-2xl border-2 border-transparent bg-white px-5 py-4 text-sm font-bold uppercase outline-none transition-all focus:border-orange-500"
                    placeholder="e.g. KIGALI-TECH"
                  />
                  <div className="mt-4 grid gap-2 rounded-2xl bg-white px-4 py-4 text-xs font-bold text-gray-600">
                    <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">Preview links</p>
                    <p className="break-all text-gray-950">{referralPreviewLink}</p>
                    <p className="break-all text-gray-500">{shopPreviewLink}</p>
                    {formData.preferredCode && !normalizedPreferredCode ? (
                      <p className="text-red-600">Use 3-40 characters: letters, numbers, dash, or underscore.</p>
                    ) : null}
                  </div>
                </label>

                <div className="grid gap-4 md:grid-cols-2">
                  <label className="block">
                    <span className="mb-2 block text-[10px] font-black uppercase tracking-widest text-gray-400">Primary channel</span>
                    <input
                      required
                      value={formData.channel}
                      onChange={(event) => updateField('channel', event.target.value)}
                      className="w-full rounded-2xl border-2 border-transparent bg-gray-50 px-5 py-4 text-sm font-bold outline-none transition-all focus:border-orange-500 focus:bg-white"
                      placeholder="Instagram, TikTok, WhatsApp, blog..."
                    />
                  </label>
                  <label className="block">
                    <span className="mb-2 block text-[10px] font-black uppercase tracking-widest text-gray-400">Audience size</span>
                    <input
                      value={formData.audienceSize}
                      onChange={(event) => updateField('audienceSize', event.target.value)}
                      className="w-full rounded-2xl border-2 border-transparent bg-gray-50 px-5 py-4 text-sm font-bold outline-none transition-all focus:border-orange-500 focus:bg-white"
                      placeholder="e.g. 2,000 followers"
                    />
                  </label>
                </div>

                <label className="block">
                  <span className="mb-2 block text-[10px] font-black uppercase tracking-widest text-gray-400">Promotion plan</span>
                  <textarea
                    required
                    rows={5}
                    value={formData.message}
                    onChange={(event) => updateField('message', event.target.value)}
                    className="w-full resize-none rounded-2xl border-2 border-transparent bg-gray-50 px-5 py-4 text-sm font-bold outline-none transition-all focus:border-orange-500 focus:bg-white"
                    placeholder="Tell us what audience you reach and how you plan to promote E-Malla Rwanda."
                  />
                </label>

                {submitError ? (
                  <div className="rounded-2xl border border-red-100 bg-red-50 px-5 py-4 text-sm font-bold text-red-600">
                    {submitError}
                  </div>
                ) : null}

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="inline-flex w-full items-center justify-center rounded-2xl bg-orange-500 px-7 py-4 text-sm font-black text-white shadow-xl shadow-orange-500/20 transition-all hover:bg-orange-600 disabled:cursor-not-allowed disabled:opacity-70"
                >
                  {isSubmitting ? <Loader2 size={18} className="mr-2 animate-spin" /> : <Send size={18} className="mr-2" />}
                  {isSubmitting ? 'Submitting...' : 'Submit Affiliate Application'}
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </section>
  </div>
);

};

export default AffiliateProgram;
