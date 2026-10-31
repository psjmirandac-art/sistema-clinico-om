'use client';

import { motion } from 'framer-motion';
import { FileText, Download, Plus, File, Trash2, Search, FileBadge, FileHeart, ShieldCheck } from 'lucide-react';
import { useState } from 'react';

interface ClinicalDoc {
  id: string;
  title: string;
  type: 'consentimiento' | 'certificado' | 'test' | 'otro';
  date: string;
  size: string;
}

const mockDocs: ClinicalDoc[] = [
  { id: '1', title: 'Plantilla_Consentimiento_Informado.pdf', type: 'consentimiento', date: '28 Oct 2026', size: '145 KB' },
  { id: '2', title: 'Formato_Certificado_Reposo.docx', type: 'certificado', date: '15 Oct 2026', size: '42 KB' },
  { id: '3', title: 'Escala_Beck_Ansiedad.pdf', type: 'test', date: '02 Sep 2026', size: '1.2 MB' },
];

export default function DocumentosTab({ centerName }: { centerName: string }) {
  const [searchTerm, setSearchTerm] = useState('');

  const getIconForType = (type: ClinicalDoc['type']) => {
    switch (type) {
      case 'consentimiento': return <ShieldCheck size={18} className="text-[#2C4A3B]" />;
      case 'certificado': return <FileBadge size={18} className="text-amber-600" />;
      case 'test': return <FileHeart size={18} className="text-emerald-600" />;
      default: return <File size={18} className="text-stone-400" />;
    }
  };

  const filteredDocs = mockDocs.filter(d => d.title.toLowerCase().includes(searchTerm.toLowerCase()));

  return (
    <motion.div key="documentos" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="max-w-[90rem] mx-auto space-y-6 pb-12">
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-stone-100 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <span className="text-[10px] font-bold uppercase tracking-widest text-[#5F8575]">Gestor Documental</span>
          <h2 className="text-2xl font-bold text-stone-900 mt-0.5">Repositorio Clínico</h2>
          <p className="text-sm text-stone-500 mt-1">Plantillas institucionales y recursos descargables para la sede {centerName}.</p>
        </div>
        <button className="bg-[#2C4A3B] text-white px-5 py-3 rounded-2xl text-xs font-semibold flex items-center gap-2 hover:bg-[#233b2f] shadow-xs">
          <Plus size={16} /> Subir Plantilla
        </button>
      </div>

      <div className="relative max-w-md">
        <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400" />
        <input 
          type="text" 
          placeholder="Buscar documento por nombre..." 
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-10 pr-4 py-3 bg-white border border-stone-200 rounded-2xl text-xs outline-none focus:ring-2 focus:ring-[#2C4A3B]/20 shadow-xs" 
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
        {filteredDocs.length === 0 ? (
           <div className="col-span-full text-center py-16 bg-white rounded-3xl border border-stone-100 shadow-xs">
             <FileText className="mx-auto text-stone-300 mb-3" size={40} />
             <p className="font-semibold text-stone-700 text-sm">No se encontraron documentos.</p>
           </div>
        ) : (
          filteredDocs.map((doc) => (
            <div key={doc.id} className="bg-white rounded-3xl p-5 border border-stone-100 shadow-xs flex flex-col justify-between space-y-4 hover:border-stone-200 hover:shadow-sm transition-all group">
              <div className="flex items-start justify-between gap-3">
                <div className="h-10 w-10 shrink-0 rounded-2xl bg-[#F4F7F5] border border-[#E4ECE7] flex items-center justify-center">
                  {getIconForType(doc.type)}
                </div>
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button className="text-stone-400 hover:text-[#2C4A3B] p-1.5 rounded-lg hover:bg-[#F4F7F5]" title="Descargar"><Download size={15} /></button>
                  <button className="text-stone-400 hover:text-red-600 p-1.5 rounded-lg hover:bg-red-50" title="Eliminar"><Trash2 size={15} /></button>
                </div>
              </div>
              
              <div>
                <h3 className="font-bold text-stone-900 text-sm truncate" title={doc.title}>{doc.title}</h3>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-[10px] font-bold text-stone-500 uppercase">{doc.type}</span>
                  <span className="text-[10px] text-stone-400">•</span>
                  <span className="text-[10px] text-stone-400">{doc.size}</span>
                </div>
              </div>
              
              <div className="pt-3 border-t border-stone-100 text-[10px] text-stone-400 font-semibold">
                Modificado: {doc.date}
              </div>
            </div>
          ))
        )}
      </div>
    </motion.div>
  );
}