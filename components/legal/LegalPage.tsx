import React from 'react';
import { Link } from 'react-router-dom';
import { LucideIcon, ShieldCheck } from 'lucide-react';

export interface LegalSection {
  title: string;
  text: string;
  items?: string[];
}

interface LegalPageProps {
  eyebrow: string;
  title: string;
  description: string;
  icon: LucideIcon;
  sections: LegalSection[];
}

const LegalPage: React.FC<LegalPageProps> = ({ eyebrow, title, description, icon: Icon, sections }) => (
  <div className="min-h-screen bg-[#fffaf6]">
    <section className="relative overflow-hidden bg-gray-950 py-20 text-white">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(249,115,22,0.24),transparent_32rem)]" />
      <div className="relative mx-auto max-w-5xl px-4">
        <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-orange-500 shadow-xl shadow-orange-500/20">
          <Icon size={27} />
        </div>
        <p className="mb-3 text-[10px] font-black uppercase tracking-[0.3em] text-orange-400">{eyebrow}</p>
        <h1 className="max-w-4xl text-4xl font-black tracking-tight md:text-6xl">{title}</h1>
        <p className="mt-6 max-w-3xl text-base font-medium leading-relaxed text-gray-300 md:text-lg">{description}</p>
        <p className="mt-6 text-xs font-bold uppercase tracking-widest text-gray-500">Last updated: June 13, 2026</p>
      </div>
    </section>

    <section className="mx-auto max-w-5xl px-4 py-16 md:py-20">
      <div className="grid gap-5">
        {sections.map((section, index) => (
          <article key={section.title} className="rounded-3xl border border-orange-100 bg-white p-7 shadow-sm md:p-9">
            <div className="flex gap-5">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-orange-50 text-xs font-black text-orange-600">
                {String(index + 1).padStart(2, '0')}
              </span>
              <div>
                <h2 className="text-xl font-black text-gray-950 md:text-2xl">{section.title}</h2>
                <p className="mt-3 text-sm font-medium leading-7 text-gray-600 md:text-base">{section.text}</p>
                {section.items && (
                  <ul className="mt-5 grid gap-3 text-sm font-semibold leading-6 text-gray-600">
                    {section.items.map(item => (
                      <li key={item} className="flex gap-3">
                        <ShieldCheck className="mt-0.5 shrink-0 text-emerald-500" size={17} />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          </article>
        ))}
      </div>

      <div className="mt-10 rounded-3xl bg-gray-950 p-8 text-white md:flex md:items-center md:justify-between">
        <div>
          <h2 className="text-xl font-black">Questions about this policy?</h2>
          <p className="mt-2 text-sm font-medium text-gray-400">Contact E-Malla Support for clarification or assistance.</p>
        </div>
        <Link to="/contact" className="mt-6 inline-flex rounded-xl bg-orange-500 px-6 py-3 text-sm font-black transition-colors hover:bg-orange-600 md:mt-0">
          Contact Support
        </Link>
      </div>
    </section>
  </div>
);

export default LegalPage;
