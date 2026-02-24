
import React from 'react';
import { ArrowUpRight } from 'lucide-react';

interface StatCardProps {
  label: string;
  value: string;
  subtext: string;
  icon: React.ReactNode;
}

const StatCard: React.FC<StatCardProps> = ({ label, value, subtext, icon }) => {
  return (
    <div className="bg-white p-8 rounded-[32px] border border-gray-100 shadow-sm hover:shadow-xl transition-all duration-300">
      <div className="flex justify-between items-start mb-6">
        <div className="w-12 h-12 bg-orange-50 text-orange-500 rounded-2xl flex items-center justify-center">
          {icon}
        </div>
        <div className="flex items-center text-emerald-500 text-[10px] font-black uppercase tracking-widest bg-emerald-50 px-2 py-1 rounded-lg">
          <ArrowUpRight size={12} className="mr-1" />
          Growing
        </div>
      </div>
      <p className="text-gray-400 text-[10px] font-black uppercase tracking-[2px] mb-2">{label}</p>
      <h3 className="text-3xl font-black text-gray-900 mb-2">{value}</h3>
      <p className="text-gray-500 text-sm font-medium leading-relaxed">{subtext}</p>
    </div>
  );
};

export default StatCard;
