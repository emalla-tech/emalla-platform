
import React from 'react';

interface MetricCardProps {
  value: string;
  label: string;
  suffix?: string;
}

const MetricCard: React.FC<MetricCardProps> = ({ value, label, suffix }) => {
  return (
    <div className="text-center p-10 bg-gray-900 rounded-[40px] border border-white/5 shadow-2xl relative overflow-hidden group">
      <div className="absolute top-0 right-0 w-32 h-32 bg-orange-500 rounded-full blur-[80px] opacity-10 group-hover:opacity-20 transition-opacity"></div>
      <div className="relative z-10">
        <h3 className="text-4xl md:text-5xl font-black text-white mb-3">
          {value}<span className="text-orange-500 ml-1">{suffix}</span>
        </h3>
        <p className="text-gray-400 text-xs font-black uppercase tracking-[3px]">{label}</p>
      </div>
    </div>
  );
};

export default MetricCard;
