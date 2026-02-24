
import React from 'react';
import { Linkedin } from 'lucide-react';

interface TeamMemberProps {
  avatar: string;
  name: string;
  role: string;
  department: string;
}

const TeamMember: React.FC<TeamMemberProps> = ({ avatar, name, role, department }) => {
  return (
    <div className="flex flex-col items-center text-center group">
      <div className="w-32 h-32 md:w-40 md:h-40 rounded-[48px] overflow-hidden mb-6 relative border-4 border-white shadow-xl group-hover:rotate-2 transition-transform duration-500">
        <img 
          src={avatar} 
          alt={name} 
          className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-700" 
        />
        <div className="absolute inset-0 bg-orange-500/10 opacity-0 group-hover:opacity-100 transition-opacity" />
      </div>
      <div className="space-y-1">
        <h4 className="font-black text-gray-900 text-lg">{name}</h4>
        <p className="text-orange-500 text-xs font-black uppercase tracking-widest">{role}</p>
        <p className="text-gray-400 text-[10px] font-bold uppercase tracking-tighter">{department}</p>
      </div>
      <a 
        href="#" 
        className="mt-4 p-2 bg-gray-50 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all opacity-0 group-hover:opacity-100"
      >
        <Linkedin size={16} />
      </a>
    </div>
  );
};

export default TeamMember;
