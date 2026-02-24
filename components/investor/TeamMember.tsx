
import React from 'react';
import { Linkedin } from 'lucide-react';

interface TeamMemberProps {
  image: string;
  name: string;
  role: string;
  bio: string;
  linkedin?: string;
}

const TeamMember: React.FC<TeamMemberProps> = ({ image, name, role, bio, linkedin }) => {
  return (
    <div className="bg-white p-8 rounded-[40px] border border-gray-100 flex flex-col items-center text-center group hover:border-orange-200 transition-all">
      <div className="w-24 h-24 rounded-full overflow-hidden mb-6 border-4 border-gray-50 shadow-inner">
        <img src={image} alt={name} className="w-full h-full object-cover" />
      </div>
      <h4 className="text-xl font-black text-gray-900">{name}</h4>
      <p className="text-orange-500 text-[10px] font-black uppercase tracking-widest mb-4">{role}</p>
      <p className="text-gray-500 text-sm leading-relaxed mb-6 italic">"{bio}"</p>
      {linkedin && (
        <a 
          href={linkedin} 
          target="_blank" 
          rel="noopener noreferrer" 
          className="p-3 bg-gray-50 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-2xl transition-all"
        >
          <Linkedin size={18} />
        </a>
      )}
    </div>
  );
};

export default TeamMember;
