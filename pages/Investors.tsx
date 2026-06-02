
import React, { useEffect, useState } from 'react';
import { 
  Users, 
  Globe, 
  TrendingUp, 
  Zap, 
  FileText, 
  Download, 
  ShieldCheck, 
  ChevronRight, 
  Mail,
  Building,
  Target,
  BarChart3,
  Rocket
} from 'lucide-react';
import StatCard from '../components/investor/StatCard';
import MetricCard from '../components/investor/MetricCard';
import TeamMember from '../components/investor/TeamMember';
import { InquiryService } from '../services/inquiryService';
import { PublicSiteService } from '../services/publicSiteService';
import { downloadCsv, html, printPdfDocument, renderTableRows } from '../lib/documentExport';
import { useLanguage } from '../i18n/LanguageContext';

const Investors: React.FC = () => {
  const { t } = useLanguage();
  const [formState, setFormState] = useState({ name: '', email: '', company: '', message: '' });
  const [submitted, setSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [metrics, setMetrics] = useState({
    districtsCovered: 30,
    averageDeliveryFee: 0,
    verifiedMerchants: 0,
    successfulOrders: 0,
    orderGrowth: 0,
    grossRevenue: 0,
    customerAccounts: 0
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitError(null);
    try {
      await InquiryService.submitInvestorInquiry(formState);
      setSubmitted(true);
      setFormState({ name: '', email: '', company: '', message: '' });
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : 'Unable to send investor inquiry right now.');
    } finally {
      setIsSubmitting(false);
    }
  };

  useEffect(() => {
    const load = async () => {
      const insights = await PublicSiteService.getInsights();
      setMetrics({
        districtsCovered: insights.metrics.districtsCovered,
        averageDeliveryFee: insights.metrics.averageDeliveryFee,
        verifiedMerchants: insights.metrics.verifiedMerchants,
        successfulOrders: insights.metrics.successfulOrders,
        orderGrowth: insights.metrics.orderGrowth,
        grossRevenue: insights.metrics.grossRevenue,
        customerAccounts: insights.metrics.customerAccounts
      });
    };

    load();
  }, []);

  const handleDownloadPitchDeck = () => {
    const generatedAt = new Date();
    const bodyHtml = `
      <style>
        .deck {
          display: flex;
          flex-direction: column;
          gap: 24px;
        }
        .slide {
          min-height: 680px;
          padding: 40px 42px;
          border: 1px solid #dbe5f0;
          border-radius: 28px;
          background: linear-gradient(180deg, #ffffff 0%, #f8fbff 100%);
          page-break-after: always;
          position: relative;
          overflow: hidden;
        }
        .slide:last-child { page-break-after: auto; }
        .slide::before {
          content: "";
          position: absolute;
          inset: 0;
          background:
            radial-gradient(circle at top right, rgba(29, 78, 216, 0.08), transparent 26%),
            radial-gradient(circle at bottom left, rgba(13, 148, 136, 0.08), transparent 22%);
          pointer-events: none;
        }
        .slide-content {
          position: relative;
          z-index: 1;
        }
        .eyebrow {
          display: inline-block;
          margin-bottom: 14px;
          padding: 6px 12px;
          border-radius: 999px;
          background: #eff6ff;
          color: #1d4ed8;
          font-size: 11px;
          font-weight: 800;
          letter-spacing: 0.08em;
          text-transform: uppercase;
        }
        .slide h1, .slide h2 {
          margin: 0 0 18px;
          color: #0f172a;
        }
        .slide h1 {
          font-size: 38px;
          line-height: 1.1;
        }
        .slide h2 {
          font-size: 30px;
          line-height: 1.15;
        }
        .lead {
          color: #475569;
          font-size: 18px;
          line-height: 1.7;
          margin: 0 0 22px;
        }
        .two-col {
          display: grid;
          grid-template-columns: 1.15fr 0.85fr;
          gap: 22px;
          align-items: start;
        }
        .list {
          margin: 0;
          padding-left: 18px;
          color: #334155;
          font-size: 17px;
          line-height: 1.8;
        }
        .list li { margin-bottom: 10px; }
        .mini-grid {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 14px;
          margin-top: 18px;
        }
        .stat-box {
          border: 1px solid #dbe5f0;
          border-radius: 20px;
          background: #ffffff;
          padding: 18px;
        }
        .stat-box .k {
          font-size: 11px;
          color: #64748b;
          text-transform: uppercase;
          letter-spacing: 0.08em;
          font-weight: 800;
          margin-bottom: 8px;
        }
        .stat-box .v {
          font-size: 26px;
          font-weight: 800;
          color: #0f172a;
        }
        .visual-panel {
          border: 1px solid #dbe5f0;
          border-radius: 24px;
          background: linear-gradient(180deg, #eff6ff 0%, #f8fafc 100%);
          padding: 18px;
        }
        .visual-card {
          border-radius: 20px;
          background: linear-gradient(145deg, #0f172a, #1e293b);
          padding: 18px;
          color: white;
        }
        .visual-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 10px;
          margin-bottom: 10px;
        }
        .visual-chip {
          border-radius: 16px;
          padding: 12px;
          min-height: 86px;
        }
        .visual-chip.dark {
          background: rgba(255,255,255,0.08);
          border: 1px solid rgba(255,255,255,0.08);
        }
        .visual-chip.light {
          background: rgba(255,255,255,0.96);
          color: #0f172a;
        }
        .visual-footer {
          background: rgba(255,255,255,0.96);
          border-radius: 16px;
          padding: 14px;
          color: #0f172a;
        }
        .tag {
          display: inline-block;
          padding: 5px 10px;
          border-radius: 999px;
          font-size: 11px;
          font-weight: 800;
          margin-right: 8px;
          margin-bottom: 8px;
        }
        .tag.blue { background: #dbeafe; color: #1d4ed8; }
        .tag.green { background: #ccfbf1; color: #0f766e; }
        .tag.slate { background: #e2e8f0; color: #334155; }
        .timeline {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 16px;
          margin-top: 20px;
        }
        .timeline .step {
          border: 1px solid #dbe5f0;
          border-radius: 20px;
          background: #ffffff;
          padding: 18px;
        }
        .timeline .step .phase {
          color: #0f766e;
          font-size: 12px;
          font-weight: 800;
          text-transform: uppercase;
          letter-spacing: 0.08em;
        }
      </style>
      <div class="page">
        <div class="deck">
          <section class="slide">
            <div class="slide-content">
              <div class="eyebrow">Investor Pitch Deck</div>
              <h1>E-Malla Rwanda</h1>
              <p class="lead" style="font-size:24px; color:#1d4ed8; font-weight:700;">Building Rwanda’s Digital Marketplace</p>
              <div class="two-col" style="margin-top:36px;">
                <div>
                  <div class="tag blue">Marketplace</div>
                  <div class="tag green">Logistics</div>
                  <div class="tag slate">Payments</div>
                  <p class="lead" style="margin-top:28px;">
                    A clean, integrated ecommerce infrastructure connecting sellers, buyers, and delivery riders in one scalable system.
                  </p>
                </div>
                <div class="visual-panel">
                  <div class="visual-card">
                    <div class="visual-grid">
                      <div class="visual-chip dark">
                        <div style="font-size:20px; font-weight:800;">E-Malla Rwanda</div>
                        <div style="font-size:11px; color:rgba(255,255,255,0.72); margin-top:10px;">Marketplace • Logistics • Payments</div>
                      </div>
                      <div class="visual-chip light">
                        <div style="font-size:14px; font-weight:800;">Nationwide digital commerce</div>
                        <div style="font-size:11px; color:#64748b; margin-top:10px;">Real platform operations, real seller growth, real delivery trust.</div>
                      </div>
                    </div>
                    <div class="visual-footer">
                      <div style="display:grid; grid-template-columns:repeat(3, minmax(0, 1fr)); gap:10px;">
                        <div><div style="font-weight:800; font-size:12px;">Trusted merchants</div><div style="font-size:10px; color:#64748b; margin-top:6px;">Verified catalog and approvals</div></div>
                        <div><div style="font-weight:800; font-size:12px;">Fast fulfillment</div><div style="font-size:10px; color:#64748b; margin-top:6px;">Admin, seller, buyer, rider in sync</div></div>
                        <div><div style="font-weight:800; font-size:12px;">Secure payments</div><div style="font-size:10px; color:#64748b; margin-top:6px;">MoMo, Airtel, bank, COD</div></div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div class="footer">Presented by John Ntakirutimana</div>
            </div>
          </section>

          <section class="slide"><div class="slide-content"><div class="eyebrow">Slide 2</div><h2>Problem</h2><ul class="list"><li>Many businesses in Rwanda lack strong online selling platforms.</li><li>Customers struggle with reliable delivery.</li><li>Fragmented ecommerce ecosystem slows growth and trust.</li></ul></div></section>

          <section class="slide"><div class="slide-content"><div class="eyebrow">Slide 3</div><h2>Solution</h2><p class="lead">E-Malla Rwanda is a unified platform that connects buyers, sellers, and delivery riders in one seamless experience.</p><div class="mini-grid"><div class="stat-box"><div class="k">Buyers</div><div class="v">Shop Easily</div></div><div class="stat-box"><div class="k">Sellers</div><div class="v">Sell Faster</div></div><div class="stat-box"><div class="k">Riders</div><div class="v">Deliver Efficiently</div></div><div class="stat-box"><div class="k">Platform</div><div class="v">One System</div></div></div></div></section>

          <section class="slide"><div class="slide-content"><div class="eyebrow">Slide 4</div><h2>Product Platform</h2><ul class="list"><li>Web platform</li><li>Admin dashboard</li><li>Seller dashboard</li><li>Buyer dashboard</li><li>Rider dashboard</li></ul><p class="lead" style="margin-top:28px;">The system is already built, operational, and structured for scalable nationwide growth.</p></div></section>

          <section class="slide"><div class="slide-content"><div class="eyebrow">Slide 5</div><h2>Market Opportunity</h2><ul class="list"><li>Growing internet usage in Rwanda.</li><li>Increasing demand for online shopping.</li><li>Untapped local ecommerce potential.</li></ul><div class="mini-grid"><div class="stat-box"><div class="k">Districts Covered</div><div class="v">${html.escape(`${metrics.districtsCovered}/30`)}</div></div><div class="stat-box"><div class="k">Customer Accounts</div><div class="v">${html.escape(String(metrics.customerAccounts))}</div></div></div></div></section>

          <section class="slide"><div class="slide-content"><div class="eyebrow">Slide 6</div><h2>Business Model</h2><table><thead><tr><th>Revenue Stream</th><th>Details</th></tr></thead><tbody>${renderTableRows([
            ['Commission per sale', '5-10% on every completed marketplace sale'],
            ['Delivery fees', 'Operational fulfillment and last-mile logistics revenue'],
            ['Advertising & featured listings', 'Promoted placement and merchant visibility packages']
          ])}</tbody></table></div></section>

          <section class="slide"><div class="slide-content"><div class="eyebrow">Slide 7</div><h2>Traction (Current Status)</h2><ul class="list"><li>Platform is live and operational.</li><li>Multiple dashboards are active across the marketplace.</li><li>Core commerce, delivery, and support workflows are running in production.</li></ul><div class="mini-grid"><div class="stat-box"><div class="k">Verified Merchants</div><div class="v">${html.escape(String(metrics.verifiedMerchants))}</div></div><div class="stat-box"><div class="k">Successful Orders</div><div class="v">${html.escape(String(metrics.successfulOrders))}</div></div><div class="stat-box"><div class="k">Order Growth</div><div class="v">${html.escape(`${metrics.orderGrowth}%`)}</div></div><div class="stat-box"><div class="k">Gross Revenue</div><div class="v">RWF ${html.escape(metrics.grossRevenue.toLocaleString())}</div></div></div></div></section>

          <section class="slide"><div class="slide-content"><div class="eyebrow">Slide 8</div><h2>Competitive Advantage</h2><ul class="list"><li>Local market focus.</li><li>Integrated delivery system.</li><li>Multi-role dashboards.</li><li>Scalable architecture.</li></ul></div></section>

          <section class="slide"><div class="slide-content"><div class="eyebrow">Slide 9</div><h2>Growth Plan</h2><div class="timeline"><div class="step"><div class="phase">Phase 1</div><h3 class="section-title" style="margin-top:8px;">Launch in Kigali</h3><p class="muted">Concentrate supply, logistics, and early customer acquisition in Kigali.</p></div><div class="step"><div class="phase">Phase 2</div><h3 class="section-title" style="margin-top:8px;">Expand to major cities</h3><p class="muted">Scale to Musanze, Huye, Rubavu, Rwamagana, and other urban centers.</p></div><div class="step"><div class="phase">Phase 3</div><h3 class="section-title" style="margin-top:8px;">Nationwide expansion</h3><p class="muted">Extend to full national coverage with stronger logistics density.</p></div></div></div></section>

          <section class="slide"><div class="slide-content"><div class="eyebrow">Slide 10</div><h2>Team</h2><table><thead><tr><th>Name</th><th>Role</th></tr></thead><tbody>${renderTableRows([
            ['John Ntakirutimana', 'Founder / Developer'],
            ['Perfect Technologies', 'Future strategic partner']
          ])}</tbody></table></div></section>

          <section class="slide"><div class="slide-content"><div class="eyebrow">Slide 11</div><h2>Why Perfect Technologies</h2><ul class="list"><li>Existing business network.</li><li>Market experience.</li><li>Growth synergy.</li></ul></div></section>

          <section class="slide"><div class="slide-content"><div class="eyebrow">Slide 12</div><h2>Funding / Partnership Ask</h2><ul class="list"><li>Strategic partnership.</li><li>Investment for scaling.</li><li>Operational support.</li></ul></div></section>

          <section class="slide"><div class="slide-content"><div class="eyebrow">Slide 13</div><h2>Building the future of ecommerce in Rwanda</h2><p class="lead">E-Malla Rwanda is designed to become the digital infrastructure that powers trusted local commerce at scale.</p><div class="card"><div class="card-label">Contact</div><div class="card-value" style="font-size:18px;">Email: support@emallarwanda.com</div><div class="card-value" style="font-size:18px; margin-top:10px;">Phone: +250 784352174</div><div class="subtitle" style="margin-top:16px;">Generated on ${html.escape(generatedAt.toLocaleString('en-RW'))}</div></div></div></section>
        </div>
      </div>
    `;

    printPdfDocument('E-Malla Rwanda Pitch Deck', bodyHtml);
  };

  const handleDownloadFinancialModel = () => {
    const generatedAt = new Date();
    const baseOrders = Math.max(metrics.successfulOrders || 0, 120);
    const averageOrderValue =
      metrics.successfulOrders > 0
        ? Math.max(Math.round(metrics.grossRevenue / Math.max(metrics.successfulOrders, 1)), 18000)
        : 28000;
    const commissionRate = 0.08;
    const deliveryFee = Math.max(metrics.averageDeliveryFee || 0, 1500);
    const adRevenueBase = Math.max(metrics.verifiedMerchants * 4500, 150000);
    const monthlyGrowthRate = Math.max(metrics.orderGrowth || 0, 10) / 100;

    const projectionRows = Array.from({ length: 12 }, (_, index) => {
      const monthNumber = index + 1;
      const growthMultiplier = Math.pow(1 + monthlyGrowthRate, index);
      const projectedOrders = Math.round(baseOrders * growthMultiplier);
      const projectedGmv = projectedOrders * averageOrderValue;
      const commissionRevenue = Math.round(projectedGmv * commissionRate);
      const deliveryRevenue = projectedOrders * deliveryFee;
      const advertisingRevenue = Math.round(adRevenueBase * (1 + index * 0.08));
      const totalRevenue = commissionRevenue + deliveryRevenue + advertisingRevenue;
      const logisticsCost = Math.round(deliveryRevenue * 0.5);
      const operationsCost = Math.round(850000 + index * 85000);
      const technologyCost = Math.round(260000 + index * 18000);
      const marketingCost = Math.round(320000 + index * 45000);
      const totalCost = logisticsCost + operationsCost + technologyCost + marketingCost;
      const netResult = totalRevenue - totalCost;

      return {
        month: `Month ${monthNumber}`,
        projectedOrders,
        averageOrderValue,
        projectedGmv,
        commissionRevenue,
        deliveryRevenue,
        advertisingRevenue,
        totalRevenue,
        logisticsCost,
        operationsCost,
        technologyCost,
        marketingCost,
        totalCost,
        netResult
      };
    });

    downloadCsv(
      `e-malla-financial-model-${generatedAt.toISOString().slice(0, 10)}.csv`,
      projectionRows.map((row) => ({
        Month: row.month,
        'Projected Orders': row.projectedOrders,
        'Average Order Value (RWF)': row.averageOrderValue,
        'Projected GMV (RWF)': row.projectedGmv,
        'Commission Revenue (RWF)': row.commissionRevenue,
        'Delivery Revenue (RWF)': row.deliveryRevenue,
        'Advertising Revenue (RWF)': row.advertisingRevenue,
        'Total Revenue (RWF)': row.totalRevenue,
        'Logistics Cost (RWF)': row.logisticsCost,
        'Operations Cost (RWF)': row.operationsCost,
        'Technology Cost (RWF)': row.technologyCost,
        'Marketing Cost (RWF)': row.marketingCost,
        'Total Cost (RWF)': row.totalCost,
        'Net Result (RWF)': row.netResult
      }))
    );

    const bodyHtml = `
      <div class="page">
        <div class="header">
          <div>
            <div class="brand">E-<span>Malla</span> Rwanda</div>
            <div class="subtitle">Financial Model Summary</div>
          </div>
          <div class="meta">
            Generated: ${html.escape(generatedAt.toLocaleString('en-RW'))}<br />
            Projection: 12 months<br />
            Currency: RWF
          </div>
        </div>

        <div class="grid">
          <div class="card">
            <div class="card-label">Base Orders</div>
            <div class="card-value">${html.escape(String(baseOrders))}</div>
          </div>
          <div class="card">
            <div class="card-label">Avg. Order Value</div>
            <div class="card-value">RWF ${html.escape(averageOrderValue.toLocaleString())}</div>
          </div>
          <div class="card">
            <div class="card-label">Monthly Growth</div>
            <div class="card-value">${html.escape(`${Math.round(monthlyGrowthRate * 100)}%`)}</div>
          </div>
        </div>

        <div class="section">
          <h3 class="section-title">Core Assumptions</h3>
          <table>
            <thead>
              <tr><th>Item</th><th>Value</th></tr>
            </thead>
            <tbody>
              ${renderTableRows([
                ['Base monthly orders', String(baseOrders)],
                ['Average order value', `RWF ${averageOrderValue.toLocaleString()}`],
                ['Commission rate', `${Math.round(commissionRate * 100)}%`],
                ['Average delivery fee', `RWF ${deliveryFee.toLocaleString()}`],
                ['Advertising base revenue', `RWF ${adRevenueBase.toLocaleString()}`],
                ['Monthly order growth', `${Math.round(monthlyGrowthRate * 100)}%`]
              ])}
            </tbody>
          </table>
        </div>

        <div class="section">
          <h3 class="section-title">12-Month Projection</h3>
          <table>
            <thead>
              <tr><th>Month</th><th>Orders</th><th>Total Revenue</th><th>Total Cost</th><th>Net Result</th></tr>
            </thead>
            <tbody>
              ${renderTableRows(
                projectionRows.map((row) => [
                  row.month,
                  row.projectedOrders,
                  `RWF ${row.totalRevenue.toLocaleString()}`,
                  `RWF ${row.totalCost.toLocaleString()}`,
                  `RWF ${row.netResult.toLocaleString()}`
                ])
              )}
            </tbody>
          </table>
        </div>

        <div class="section">
          <h3 class="section-title">Model Notes</h3>
          <div class="card">
            <p>Revenue combines marketplace commissions, delivery income, and merchant visibility products.</p>
            <p class="muted">A matching CSV export is downloaded together with this PDF-ready model for spreadsheet review.</p>
          </div>
        </div>

        <div class="footer">
          E-Malla Rwanda financial model prepared for investor review.
        </div>
      </div>
    `;

    printPdfDocument('E-Malla Rwanda Financial Model', bodyHtml);
  };

  return (
    <div className="bg-white min-h-screen">
      {/* Hero Section */}
      <section className="bg-gray-900 pt-32 pb-24 relative overflow-hidden">
        <div className="absolute inset-0 imigongo-bg opacity-10"></div>
        <div className="max-w-7xl mx-auto px-4 relative z-10 text-center">
          <div className="inline-flex items-center space-x-2 bg-orange-500/10 text-orange-500 px-4 py-1.5 rounded-full mb-8">
            <Rocket size={16} />
            <span className="text-[10px] font-black uppercase tracking-widest">Series A Fundraising Active</span>
          </div>
          <h1 className="text-4xl md:text-7xl font-black text-white mb-8 leading-tight max-w-5xl mx-auto">
            Building Rwanda's Largest <br/>
            <span className="text-orange-500">Digital Marketplace</span>
          </h1>
          <p className="text-gray-400 text-lg md:text-xl max-w-3xl mx-auto leading-relaxed mb-12">
            Connecting 14 million people through a unified digital commerce and logistics infrastructure. E-Malla is the heartbeat of modern Rwandan trade.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <button
              onClick={handleDownloadPitchDeck}
              className="w-full sm:w-auto bg-orange-500 text-white px-10 py-5 rounded-2xl font-black text-lg hover:bg-orange-600 transition-all shadow-xl shadow-orange-500/20 flex items-center justify-center"
            >
              {t.investors.pitchDeck} <Download size={20} className="ml-3" />
            </button>
            <a href="#contact" className="w-full sm:w-auto bg-white/10 text-white border border-white/20 px-10 py-5 rounded-2xl font-black text-lg hover:bg-white/20 transition-all">
              {t.investors.investorFormTitle}
            </a>
          </div>
        </div>
      </section>

      {/* Corporate About */}
      <section className="py-24 max-w-7xl mx-auto px-4">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          <div className="space-y-8">
            <div className="flex items-center space-x-3 text-orange-500">
               <div className="w-12 h-0.5 bg-orange-500"></div>
               <span className="text-xs font-black uppercase tracking-widest">{t.investors.opportunity}</span>
            </div>
            <h2 className="text-4xl font-black text-gray-900 leading-tight">
              {t.investors.heroTitle}
            </h2>
            <p className="text-gray-500 text-lg leading-relaxed">
              {t.investors.heroText} By integrating secure escrow payments with a distributed rider network, we provide local merchants with the infrastructure they need to compete in the global digital era.
            </p>
            <div className="grid grid-cols-2 gap-8 pt-4">
               <div>
                  <h4 className="text-3xl font-black text-gray-900">{metrics.districtsCovered}/30</h4>
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mt-1">Districts Covered</p>
               </div>
               <div>
                  <h4 className="text-3xl font-black text-gray-900">RWF {metrics.averageDeliveryFee.toLocaleString()}</h4>
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mt-1">Avg. Delivery Fee</p>
               </div>
            </div>
          </div>
          <div className="relative">
             <div className="group aspect-video bg-gray-50 rounded-[40px] overflow-hidden border border-gray-100 shadow-2xl p-4 md:p-5 transition-all duration-500 hover:shadow-[0_30px_80px_rgba(251,146,60,0.16)]">
                <div className="relative w-full h-full rounded-[32px] bg-[radial-gradient(circle_at_top_left,_rgba(255,255,255,0.14),_transparent_35%),linear-gradient(145deg,_rgba(31,41,55,0.98),_rgba(17,24,39,0.96))] p-4 md:p-5">
                  <div className="w-full h-full rounded-[26px] border border-white/10 bg-white/[0.03] backdrop-blur-sm p-3 md:p-4 flex flex-col justify-between transition-all duration-500 group-hover:bg-white/[0.06] group-hover:border-orange-300/20">
                    <div className="grid grid-cols-1 sm:grid-cols-[1.15fr,1fr] gap-3">
                      <div className="rounded-[22px] bg-white/[0.06] border border-white/10 p-4 min-w-0 transition-all duration-500 group-hover:bg-white/[0.1]">
                        <p className="text-white font-black text-lg md:text-xl leading-tight break-words">E-Malla Rwanda</p>
                        <p className="text-white/70 text-[10px] md:text-[11px] font-bold uppercase tracking-wide mt-2 leading-relaxed">
                          Marketplace • Logistics • Payments
                        </p>
                      </div>
                      <div className="rounded-[22px] bg-white/95 text-gray-800 border border-white/70 p-4 min-w-0 transition-all duration-500 group-hover:bg-orange-50 group-hover:border-orange-200">
                        <p className="text-xs md:text-sm font-black leading-snug break-words">
                          Nationwide digital commerce
                        </p>
                        <p className="text-[10px] text-gray-500 font-semibold mt-2 leading-relaxed break-words">
                          Real platform operations, real seller growth, real delivery trust.
                        </p>
                      </div>
                    </div>

                    <div className="relative rounded-[22px] bg-white border border-white/80 p-4 shadow-xl shadow-black/10 transition-all duration-500 group-hover:bg-orange-50/95 group-hover:border-orange-200">
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <div className="min-w-0">
                          <p className="text-xs md:text-sm font-black text-gray-900 break-words">Trusted merchants</p>
                          <p className="text-[10px] text-gray-500 font-semibold mt-1.5 leading-relaxed break-words">
                            Verified catalog and approvals
                          </p>
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs md:text-sm font-black text-gray-900 break-words">Fast fulfillment</p>
                          <p className="text-[10px] text-gray-500 font-semibold mt-1.5 leading-relaxed break-words">
                            Admin, seller, buyer, rider in sync
                          </p>
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs md:text-sm font-black text-gray-900 break-words">Secure payments</p>
                          <p className="text-[10px] text-gray-500 font-semibold mt-1.5 leading-relaxed break-words">
                            MoMo, Airtel, bank, COD
                          </p>
                        </div>
                      </div>

                      <div className="absolute left-1/2 top-0 -translate-x-1/2 -translate-y-1/2 pointer-events-none">
                        <div className="w-16 h-16 md:w-18 md:h-18 bg-orange-500 rounded-full flex items-center justify-center text-white shadow-2xl shadow-orange-500/30 animate-pulse">
                          <BarChart3 size={28} />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
             </div>
          </div>
        </div>
      </section>

      {/* Market Opportunity Cards */}
      <section className="py-24 bg-gray-50 border-y border-gray-100">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-black text-gray-900 mb-4">{t.investors.traction}</h2>
            <p className="text-gray-500">Capturing value across a high-growth regional hub.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <StatCard 
              label="Population" 
              value={`${metrics.customerAccounts}+`} 
              subtext="Registered customer accounts currently active on the platform." 
              icon={<Users size={24} />} 
            />
            <StatCard 
              label="Order Growth" 
              value={`${metrics.orderGrowth}%`} 
              subtext="Month-over-month order growth based on current live order data." 
              icon={<Globe size={24} />} 
            />
            <StatCard 
              label="Gross Revenue" 
              value={`RWF ${metrics.grossRevenue.toLocaleString()}`} 
              subtext="Total successful transaction value processed on the platform." 
              icon={<TrendingUp size={24} />} 
            />
            <StatCard 
              label="Merchant Base" 
              value={`${metrics.verifiedMerchants}`} 
              subtext="Verified merchants currently available for platform operations." 
              icon={<Zap size={24} />} 
            />
          </div>
        </div>
      </section>

      {/* Traction Metrics */}
      <section className="py-24 max-w-7xl mx-auto px-4">
        <div className="bg-gray-900 rounded-[60px] p-12 md:p-20 relative overflow-hidden">
          <div className="absolute inset-0 imigongo-bg opacity-5"></div>
          <div className="relative z-10 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
             <MetricCard value={`${metrics.verifiedMerchants}`} suffix="" label="Onboarded Merchants" />
             <MetricCard value={`${metrics.successfulOrders}`} suffix="" label="Successful Orders" />
             <MetricCard value={`${metrics.orderGrowth}`} suffix="%" label="Monthly Order Growth" />
          </div>
        </div>
      </section>

      {/* Business Model */}
      <section className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4">
           <div className="text-center mb-20">
             <h2 className="text-4xl font-black text-gray-900 mb-4">A Multi-Stream Revenue Model</h2>
             <p className="text-gray-500 max-w-xl mx-auto">Diversified income channels ensuring high-margin sustainability.</p>
           </div>
           
           <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
             {[
               { title: "Marketplace Commissions", desc: "We capture 8-12% of every transaction facilitated through the platform, scaling directly with GMV growth.", icon: <ShieldCheck className="text-orange-500" /> },
               { title: "Logistics Fulfillment", desc: "Tiered delivery fees based on weight and distance, powered by our proprietary route-optimization tech.", icon: <Zap className="text-orange-500" /> },
               { title: "Merchant Pro Subscriptions", desc: "Monthly recurring revenue (SaaS model) for advanced inventory tools, CRM, and analytics dashboards.", icon: <Building className="text-orange-500" /> },
               { title: "Targeted Ad-Tech", desc: "High-margin revenue from featured product placement and data-driven merchant advertising.", icon: <Target className="text-orange-500" /> },
             ].map((item, i) => (
               <div key={i} className="flex space-x-6 p-8 bg-white rounded-3xl border border-gray-100 hover:shadow-lg transition-all">
                  <div className="flex-shrink-0 w-12 h-12 bg-gray-50 rounded-2xl flex items-center justify-center">
                    {item.icon}
                  </div>
                  <div>
                    <h4 className="text-xl font-black text-gray-900 mb-2">{item.title}</h4>
                    <p className="text-gray-500 text-sm leading-relaxed">{item.desc}</p>
                  </div>
               </div>
             ))}
           </div>
        </div>
      </section>

      {/* Executive Team */}
      <section className="py-24 bg-gray-50 border-y border-gray-100">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-black text-gray-900 mb-4">Executive Leadership</h2>
            <p className="text-gray-500">Domain experts in logistics, fintech, and regional trade.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <TeamMember 
              image="/brand/portrait-1.svg" 
              name="Jean Pierre Habimana" 
              role="CEO & Founder" 
              bio="12+ years in logistics management across East Africa. Former director at Rwanda Supply Chain Council."
              linkedin="#"
            />
            <TeamMember 
              image="/brand/portrait-2.svg" 
              name="Sarah Mutoni" 
              role="Chief Operations Officer" 
              bio="Fintech specialist with background in mobile banking integrations at leading Pan-African banks."
              linkedin="#"
            />
            <TeamMember 
              image="/brand/portrait-3.svg" 
              name="Eric Mugisha" 
              role="Chief Technical Officer" 
              bio="Full-stack architect with expertise in scalable cloud infrastructures and high-velocity marketplace logic."
              linkedin="#"
            />
          </div>
        </div>
      </section>

      {/* Documents Download */}
      <section className="py-24 max-w-7xl mx-auto px-4">
         <div className="bg-gray-900 rounded-[50px] p-12 md:p-20 text-white relative overflow-hidden flex flex-col lg:flex-row items-center justify-between">
            <div className="absolute inset-0 bg-orange-500 opacity-5 -skew-x-12 transform translate-x-1/2"></div>
            <div className="relative z-10 max-w-xl mb-12 lg:mb-0">
               <h2 className="text-3xl md:text-5xl font-black mb-6 leading-tight">{t.investors.investorFormTitle}</h2>
               <p className="text-gray-400 text-lg">{t.investors.accessText}</p>
            </div>
            
            <div className="relative z-10 grid grid-cols-1 sm:grid-cols-2 gap-4 w-full lg:w-auto">
               <button
                  onClick={handleDownloadPitchDeck}
                  className="bg-white/10 hover:bg-white/20 p-6 rounded-3xl flex items-center space-x-4 border border-white/10 transition-all group"
               >
                  <div className="w-12 h-12 bg-orange-500 rounded-2xl flex items-center justify-center text-white">
                    <FileText size={24} />
                  </div>
                  <div className="text-left">
                    <p className="text-sm font-black">{t.investors.pitchDeck}</p>
                    <p className="text-[10px] text-gray-500 font-bold uppercase">PDF • 12MB</p>
                  </div>
               </button>
               <button
                  onClick={handleDownloadFinancialModel}
                  className="bg-white/10 hover:bg-white/20 p-6 rounded-3xl flex items-center space-x-4 border border-white/10 transition-all group"
               >
                  <div className="w-12 h-12 bg-blue-500 rounded-2xl flex items-center justify-center text-white">
                    <BarChart3 size={24} />
                  </div>
                  <div className="text-left">
                    <p className="text-sm font-black">{t.investors.financialModel}</p>
                    <p className="text-[10px] text-gray-500 font-bold uppercase">PDF + CSV • Dynamic Export</p>
                  </div>
               </button>
            </div>
         </div>
      </section>

      {/* Inquiry Form */}
      <section id="contact" className="py-24 max-w-3xl mx-auto px-4">
         <div className="text-center mb-16">
            <h2 className="text-4xl font-black text-gray-900 mb-4">{t.investors.investorFormTitle}</h2>
            <p className="text-gray-500">{t.investors.investorFormText}</p>
         </div>

         {submitted ? (
            <div className="bg-emerald-50 p-12 rounded-[40px] text-center border border-emerald-100 animate-in fade-in zoom-in duration-500">
               <div className="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-8">
                  <ShieldCheck size={40} />
               </div>
               <h3 className="text-2xl font-black text-gray-900 mb-2">{t.investors.successTitle}</h3>
               <p className="text-gray-500 font-medium">{t.investors.successText}</p>
            </div>
         ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
               <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                     <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">{t.investors.fullName}</label>
                     <input required type="text" value={formState.name} onChange={(e) => setFormState({ ...formState, name: e.target.value })} className="w-full px-6 py-4 bg-gray-50 border-2 border-transparent focus:border-orange-500 focus:bg-white rounded-2xl outline-none font-bold text-gray-900 transition-all" />
                  </div>
                  <div className="space-y-2">
                     <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">{t.investors.professionalEmail}</label>
                     <input required type="email" value={formState.email} onChange={(e) => setFormState({ ...formState, email: e.target.value })} className="w-full px-6 py-4 bg-gray-50 border-2 border-transparent focus:border-orange-500 focus:bg-white rounded-2xl outline-none font-bold text-gray-900 transition-all" />
                  </div>
               </div>
               <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">{t.investors.organization}</label>
                  <input required type="text" value={formState.company} onChange={(e) => setFormState({ ...formState, company: e.target.value })} className="w-full px-6 py-4 bg-gray-50 border-2 border-transparent focus:border-orange-500 focus:bg-white rounded-2xl outline-none font-bold text-gray-900 transition-all" />
               </div>
               <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">{t.investors.message}</label>
                  <textarea rows={5} value={formState.message} onChange={(e) => setFormState({ ...formState, message: e.target.value })} className="w-full px-6 py-4 bg-gray-50 border-2 border-transparent focus:border-orange-500 focus:bg-white rounded-2xl outline-none font-bold text-gray-900 transition-all resize-none"></textarea>
               </div>
               <button type="submit" disabled={isSubmitting} className="w-full bg-black text-white py-5 rounded-2xl font-black text-lg hover:bg-gray-900 transition-all shadow-xl flex items-center justify-center space-x-3 group disabled:opacity-50">
                  <span>{isSubmitting ? t.investors.submitting : t.investors.sendInquiry}</span>
                  <ChevronRight size={20} className="group-hover:translate-x-1 transition-transform" />
               </button>
               {submitError && <p className="text-sm font-semibold text-red-600">{submitError}</p>}
            </form>
         )}
      </section>

      {/* Footer Quote */}
      <section className="py-20 bg-gray-900 text-center px-4 overflow-hidden relative">
         <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-orange-500 to-transparent"></div>
         <p className="max-w-4xl mx-auto text-2xl md:text-3xl font-bold italic text-gray-400 leading-relaxed">
           "Our vision is to make commerce borderless within Rwanda, creating a future where every local artisan has the same reach as a global conglomerate."
         </p>
         <div className="mt-10 flex justify-center items-center space-x-4">
            <div className="w-12 h-0.5 bg-gray-800"></div>
            <span className="text-[10px] font-black uppercase tracking-[4px] text-gray-500">{t.investors.board}</span>
            <div className="w-12 h-0.5 bg-gray-800"></div>
         </div>
      </section>
    </div>
  );
};

export default Investors;
