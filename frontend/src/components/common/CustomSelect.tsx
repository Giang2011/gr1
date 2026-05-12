import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check } from 'lucide-react';

interface Option {
  id: string | number;
  name: string;
}

interface CustomSelectProps {
  label?: string;
  options: Option[];
  value: string | number;
  onChange: (value: string | number) => void;
  placeholder?: string;
  icon?: React.ReactNode;
  className?: string;
}

const CustomSelect: React.FC<CustomSelectProps> = ({ 
  label, 
  options, 
  value, 
  onChange, 
  placeholder = '-- Chọn --', 
  icon,
  className = ""
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const selectedOption = options.find(opt => opt.id.toString() === value.toString());

  return (
    <div className={`space-y-2 ${className}`} ref={dropdownRef}>
      {label && (
        <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1 block">
          {label}
        </label>
      )}
      <div className="relative">
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className={`w-full flex items-center justify-between px-5 py-3.5 bg-slate-50 border transition-all duration-300 rounded-2xl group ${
            isOpen ? 'border-indigo-500 ring-4 ring-indigo-500/10' : 'border-slate-200 hover:border-slate-300'
          }`}
        >
          <div className="flex items-center gap-3 overflow-hidden">
            {icon && <div className="text-slate-400 group-hover:text-indigo-500 transition-colors flex-shrink-0">{icon}</div>}
            <span className={`text-sm font-bold truncate ${selectedOption ? 'text-slate-900' : 'text-slate-400'}`}>
              {selectedOption ? selectedOption.name : placeholder}
            </span>
          </div>
          <ChevronDown 
            size={18} 
            className={`text-slate-400 transition-transform duration-300 flex-shrink-0 ${isOpen ? 'rotate-180 text-indigo-500' : ''}`} 
          />
        </button>

        {isOpen && (
          <div className="absolute top-full mt-2 left-0 right-0 bg-white border border-slate-100 rounded-2xl shadow-2xl z-[100] py-2 animate-in fade-in zoom-in-95 duration-200 overflow-hidden ring-1 ring-slate-200/50 max-h-60 overflow-y-auto custom-scrollbar">
            {options.length === 0 ? (
              <div className="px-5 py-4 text-xs font-bold text-slate-400 text-center">Không có dữ liệu</div>
            ) : (
              options.map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => {
                    onChange(opt.id);
                    setIsOpen(false);
                  }}
                  className={`w-full text-left px-5 py-3 text-sm font-bold transition-colors flex items-center justify-between ${
                    value.toString() === opt.id.toString() 
                      ? 'bg-indigo-50 text-indigo-700' 
                      : 'text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <span className="truncate">{opt.name}</span>
                  {value.toString() === opt.id.toString() && <Check size={14} />}
                </button>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default CustomSelect;
