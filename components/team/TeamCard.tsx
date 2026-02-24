
import React from 'react';
import { Mail, ArrowRight } from 'lucide-react';

interface TeamCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  email: string;
}

const TeamCard: React.FC<TeamCardProps> = ({ icon, title, description, email }) => {
  return (
    <div className="bg-white p-8 rounded-[32px] border border-gray-100 shadow-sm hover:shadow-xl hover:border-orange-200 transition-all group flex flex-col h-full">
      <div className="w-14 h-14 bg-gray-50 text-orange-500 rounded-2xl flex items-center justify-center mb-6 group-hover:bg-orange-500 group-hover:text-white transition-all duration-300">
        {icon}
      </div>
      <h3 className="text-xl font-black text-gray-900 mb-4">{title}</h3>
      <p className="text-gray-500 text-sm leading-relaxed mb-8 flex-grow">
        {description}
      </p>
      <div className="pt-6 border-t border-gray-50 flex items-center justify-between">
        <div className="flex items-center space-x-2 text-gray-400 group-hover:text-orange-600 transition-colors">
          <Mail size={16} />
          <span className="text-xs font-bold">{email}</span>
        </div>
        <ArrowRight size={18} className="text-gray-200 group-hover:text-orange-500 group-hover:translate-x-1 transition-all" />
      </div>
    </div>
  );
};

export default TeamCard;
