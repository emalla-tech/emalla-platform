
import React from 'react';
import { Link } from 'react-router-dom';
import { ShieldAlert, ArrowLeft, Home } from 'lucide-react';

const Unauthorized: React.FC = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="max-w-md w-full text-center space-y-8 animate-in fade-in zoom-in duration-500">
        <div className="w-24 h-24 bg-red-100 text-red-500 rounded-full flex items-center justify-center mx-auto shadow-xl shadow-red-100">
          <ShieldAlert size={48} />
        </div>
        <div className="space-y-4">
          <h1 className="text-4xl font-black text-gray-900 leading-tight">Access Denied</h1>
          <p className="text-gray-500 font-medium">
            You don't have the necessary permissions to view this section of E-Malla Rwanda.
          </p>
        </div>
        <div className="flex flex-col space-y-3 pt-6">
          <Link 
            to="/" 
            className="w-full bg-black text-white py-4 rounded-2xl font-black flex items-center justify-center space-x-2 hover:bg-orange-500 transition-all shadow-lg"
          >
            <Home size={18} />
            <span>Go to Homepage</span>
          </Link>
          <button 
            onClick={() => window.history.back()}
            className="w-full bg-white border border-gray-200 text-gray-600 py-4 rounded-2xl font-black flex items-center justify-center space-x-2 hover:bg-gray-50 transition-all"
          >
            <ArrowLeft size={18} />
            <span>Go Back</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default Unauthorized;
