import React, { useEffect } from 'react';
import { ArrowLeft, Home, Search } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';

const NotFound: React.FC = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const robots = document.querySelector('meta[name="robots"]');
    robots?.setAttribute('content', 'noindex, follow');
    return () => robots?.setAttribute('content', 'index, follow');
  }, []);

  return (
    <main className="page-transition flex min-h-[70vh] items-center justify-center px-5 py-20">
      <section className="relative w-full max-w-3xl overflow-hidden rounded-[36px] border border-orange-100 bg-white p-8 text-center shadow-[0_28px_90px_rgba(17,24,39,0.1)] md:p-14">
        <div className="absolute -right-20 -top-20 h-52 w-52 rounded-full bg-orange-100/70 blur-2xl" aria-hidden="true" />
        <div className="absolute -bottom-24 -left-20 h-56 w-56 rounded-full bg-emerald-100/60 blur-2xl" aria-hidden="true" />
        <div className="relative">
          <p className="text-xs font-black uppercase tracking-[0.28em] text-orange-500">Error 404</p>
          <h1 className="mt-4 text-4xl font-black tracking-tight text-gray-950 md:text-6xl">This page took a wrong delivery route.</h1>
          <p className="mx-auto mt-5 max-w-xl text-sm font-semibold leading-7 text-gray-500 md:text-base">
            The page may have moved or the link may be incorrect. Let us help you get back to the marketplace.
          </p>
          <div className="mt-9 flex flex-col justify-center gap-3 sm:flex-row">
            <Link to="/" className="inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl bg-orange-500 px-6 py-4 text-sm font-black text-white shadow-lg shadow-orange-200 transition-colors hover:bg-orange-600">
              <Home size={18} /> Return Home
            </Link>
            <Link to="/shop" className="inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl bg-gray-950 px-6 py-4 text-sm font-black text-white transition-colors hover:bg-gray-800">
              <Search size={18} /> Browse Products
            </Link>
            <button type="button" onClick={() => navigate(-1)} className="inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl border border-gray-200 bg-white px-6 py-4 text-sm font-black text-gray-700 transition-colors hover:border-orange-200 hover:text-orange-600">
              <ArrowLeft size={18} /> Go Back
            </button>
          </div>
        </div>
      </section>
    </main>
  );
};

export default NotFound;
