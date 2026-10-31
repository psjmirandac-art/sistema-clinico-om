'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { FileText, Download, Plus, File, Trash2, Search, FileBadge, FileHeart, ShieldCheck, Loader2, X, UploadCloud, AlertCircle } from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabase';

// ⚠️ CORRECCIÓN: Interfaz alineada exactamente con FileObject de Supabase Storage
interface ClinicalDoc {
  id: string;
  name: string;
  created_at: string;
  metadata: {
    size: number;
    mimetype: string;
  };
}

export default function DocumentosTab({ centerName, centerId }: { centerName: string; centerId?: string }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [documents, setDocuments] = useState<ClinicalDoc[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Estados para subir archivos
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Estados de carga individual (descarga/eliminación)
  const [processingDocs, setProcessingDocs] = useState<Record<string, 'downloading' | 'deleting' | null>>({});

  // Cargar lista de documentos desde el bucket
  const fetchDocuments = async () => {
    if (!centerId) return;
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .storage
        .from('clinical_documents')
        .list(`${centerId}/`, {
          limit: 100,
          offset: 0,
          sortBy: { column: 'created_at', order: 'desc' },
        });

      if (error) throw error;
      
      // Mapeo seguro validando que la metadata exista (Supabase devuelve FileObject[])
      const validDocs = (data || [])
        .filter(doc => doc.name !== '.emptyFolderPlaceholder')
        .map(doc => ({
          id: doc.id || doc.name,
          name: doc.name,
          created_at: doc.created_at || new Date().toISOString(),
          metadata: {
            size: doc.metadata?.size || 0,
            mimetype: doc.metadata?.mimetype || 'application/octet-stream',
          }
        })) as ClinicalDoc[];

      setDocuments(validDocs);
    } catch (error) {
      console.error('Error al cargar documentos:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDocuments();
  }, [centerId]);

  // Manejar subida de archivo
  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !centerId) return;

    // Validación básica (10MB limit)
    if (file.size > 10 * 1024 * 1024) { 
      setUploadError("El archivo es demasiado grande (máx 10MB).");
      return;
    }

    setIsUploading(true);
    setUploadError(null);

    try {
      const cleanFileName = file.name.replace(/[^a-zA-Z0-9.\-_]/g, '_');
      const filePath = `${centerId}/${Date.now()}_${cleanFileName}`;

      const { error: uploadError } = await supabase.storage
        .from('clinical_documents')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) throw uploadError;

      await fetchDocuments();
      setIsUploadModalOpen(false);
      
    } catch (error: any) {
      console.error('Error uploading file:', error);
      setUploadError("Ocurrió un error al subir el archivo.");
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  // Manejar descarga segura
  const handleDownload = async (doc: ClinicalDoc) => {
    if (!centerId) return;
    
    setProcessingDocs(prev => ({ ...prev, [doc.name]: 'downloading' }));
    
    try {
      const { data, error } = await supabase.storage
        .from('clinical_documents')
        .createSignedUrl(`${centerId}/${doc.name}`, 60);

      if (error) throw error;

      const link = document.createElement('a');
      link.href = data.signedUrl;
      link.download = doc.name;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

    } catch (error) {
      console.error('Error downloading file:', error);
      alert('No se pudo descargar el archivo.');
    } finally {
      setProcessingDocs(prev => ({ ...prev, [doc.name]: null }));
    }
  };

  // Manejar eliminación
  const handleDelete = async (doc: ClinicalDoc) => {
    if (!centerId || !window.confirm(`¿Seguro que deseas eliminar "${doc.name}"?`)) return;

    setProcessingDocs(prev => ({ ...prev, [doc.name]: 'deleting' }));
    
    try {
      const { error } = await supabase.storage
        .from('clinical_documents')
        .remove([`${centerId}/${doc.name}`]);

      if (error) throw error;

      setDocuments(prev => prev.filter(d => d.name !== doc.name));
      
    } catch (error) {
      console.error('Error deleting file:', error);
      alert('Error al eliminar el archivo.');
    } finally {
      setProcessingDocs(prev => ({ ...prev, [doc.name]: null }));
    }
  };

  // Helpers de visualización
  const formatFileSize = (bytes: number) => {
    if (!bytes) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  const formatDate = (isoString: string) => {
    return new Date(isoString).toLocaleDateString('es-CL', { day: '2-digit', month: 'short', year: 'numeric' });
  };

  const getIconForType = (mimeType: string, fileName: string) => {
    const lowerName = fileName.toLowerCase();
    if (lowerName.includes('consentimiento')) return <ShieldCheck size={18} className="text-[#2C4A3B]" />;
    if (lowerName.includes('certificado')) return <FileBadge size={18} className="text-amber-600" />;
    if (lowerName.includes('test') || lowerName.includes('escala')) return <FileHeart size={18} className="text-emerald-600" />;
    
    if (mimeType.includes('pdf')) return <FileText size={18} className="text-red-500" />;
    if (mimeType.includes('word') || lowerName.endsWith('.docx') || lowerName.endsWith('.doc')) return <FileText size={18} className="text-blue-500" />;
    if (mimeType.includes('image')) return <File size={18} className="text-purple-500" />;
    
    return <File size={18} className="text-stone-400" />;
  };

  const filteredDocs = documents.filter(d => d.name.toLowerCase().includes(searchTerm.toLowerCase()));

  return (
    <motion.div key="documentos" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="max-w-[90rem] mx-auto space-y-6 pb-12">
      
      {/* Header del Módulo */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-stone-100 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <span className="text-[10px] font-bold uppercase tracking-widest text-[#5F8575]">Gestor Documental</span>
          <h2 className="text-2xl font-bold text-stone-900 mt-0.5">Repositorio Clínico</h2>
          <p className="text-sm text-stone-500 mt-1">Archivos institucionales privados para terapeutas de la sede {centerName}.</p>
        </div>
        <button 
          onClick={() => setIsUploadModalOpen(true)}
          className="bg-[#2C4A3B] text-white px-5 py-3 rounded-2xl text-xs font-semibold flex items-center gap-2 hover:bg-[#233b2f] shadow-xs transition-colors"
        >
          <Plus size={16} /> Subir Documento
        </button>
      </div>

      {/* Buscador */}
      <div className="relative max-w-md">
        <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400" />
        <input 
          type="text" 
          placeholder="Buscar documento por nombre..." 
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-10 pr-4 py-3 bg-white border border-stone-200 rounded-2xl text-xs outline-none focus:ring-2 focus:ring-[#2C4A3B]/20 shadow-xs transition-all" 
        />
      </div>

      {/* Grilla de Documentos */}
      {isLoading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="animate-spin text-[#2C4A3B]" size={32} />
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {filteredDocs.length === 0 ? (
            <div className="col-span-full text-center py-16 bg-white rounded-3xl border border-stone-100 shadow-xs">
              <FileText className="mx-auto text-stone-300 mb-3" size={40} />
              <p className="font-semibold text-stone-700 text-sm">No se encontraron documentos.</p>
              <p className="text-xs text-stone-500 mt-1">Haz clic en "Subir Documento" para comenzar.</p>
            </div>
          ) : (
            filteredDocs.map((doc) => {
              const displayName = doc.name.replace(/^\d+_/, ''); 
              const isProcessing = processingDocs[doc.name];

              return (
                <div key={doc.id} className="bg-white rounded-3xl p-5 border border-stone-100 shadow-xs flex flex-col justify-between space-y-4 hover:border-stone-200 hover:shadow-sm transition-all group relative overflow-hidden">
                  
                  {isProcessing && (
                    <div className="absolute inset-0 bg-white/80 backdrop-blur-sm z-10 flex items-center justify-center">
                      <Loader2 className="animate-spin text-[#2C4A3B]" size={24} />
                    </div>
                  )}

                  <div className="flex items-start justify-between gap-3">
                    <div className="h-10 w-10 shrink-0 rounded-2xl bg-[#F4F7F5] border border-[#E4ECE7] flex items-center justify-center">
                      {getIconForType(doc.metadata.mimetype, doc.name)}
                    </div>
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button 
                        onClick={() => handleDownload(doc)}
                        disabled={!!isProcessing}
                        className="text-stone-400 hover:text-[#2C4A3B] p-1.5 rounded-lg hover:bg-[#F4F7F5] disabled:opacity-50 transition-colors" 
                        title="Descargar"
                      >
                        <Download size={15} />
                      </button>
                      <button 
                        onClick={() => handleDelete(doc)}
                        disabled={!!isProcessing}
                        className="text-stone-400 hover:text-red-600 p-1.5 rounded-lg hover:bg-red-50 disabled:opacity-50 transition-colors" 
                        title="Eliminar"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </div>
                  
                  <div>
                    <h3 className="font-bold text-stone-900 text-sm truncate" title={displayName}>{displayName}</h3>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-[10px] font-bold text-stone-500 uppercase truncate max-w-[80px]">{doc.metadata.mimetype.split('/')[1] || 'Archivo'}</span>
                      <span className="text-[10px] text-stone-400">•</span>
                      <span className="text-[10px] text-stone-400">{formatFileSize(doc.metadata.size)}</span>
                    </div>
                  </div>
                  
                  <div className="pt-3 border-t border-stone-100 text-[10px] text-stone-400 font-semibold">
                    Subido: {formatDate(doc.created_at)}
                  </div>
                </div>
              )
            })
          )}
        </div>
      )}

      {/* Modal de Subida de Archivos */}
      <AnimatePresence>
        {isUploadModalOpen && (
          <div className="fixed inset-0 bg-stone-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }} 
              animate={{ opacity: 1, scale: 1 }} 
              exit={{ opacity: 0, scale: 0.95 }} 
              className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-5"
            >
              <div className="flex justify-between items-center border-b border-stone-100 pb-4">
                <div>
                  <h3 className="font-bold text-lg text-stone-900">Subir Documento Clínico</h3>
                  <p className="text-xs text-stone-400">Archivos PDF, Word o Imágenes (Máx 10MB).</p>
                </div>
                <button 
                  onClick={() => !isUploading && setIsUploadModalOpen(false)} 
                  className="text-stone-400 hover:text-stone-700 p-1 rounded-lg hover:bg-stone-50 transition-colors"
                  disabled={isUploading}
                >
                  <X size={20}/>
                </button>
              </div>

              <div 
                className={`border-2 border-dashed rounded-2xl p-8 text-center transition-colors ${
                  isUploading ? 'border-stone-200 bg-stone-50 opacity-70' : 'border-[#2C4A3B]/30 bg-[#F4F7F5]/50 hover:bg-[#F4F7F5]'
                }`}
              >
                {isUploading ? (
                  <div className="flex flex-col items-center justify-center space-y-3">
                    <Loader2 className="animate-spin text-[#2C4A3B]" size={32} />
                    <p className="text-sm font-semibold text-stone-700">Subiendo archivo a entorno seguro...</p>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center space-y-3">
                    <div className="h-12 w-12 rounded-full bg-white flex items-center justify-center shadow-xs text-[#2C4A3B]">
                      <UploadCloud size={24} />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-stone-700">Haz clic para seleccionar un archivo</p>
                      <p className="text-xs text-stone-500 mt-1">Los documentos se encriptan en tránsito.</p>
                    </div>
                    <input 
                      type="file" 
                      ref={fileInputRef}
                      onChange={handleFileUpload}
                      className="hidden"
                      accept=".pdf,.doc,.docx,.jpg,.jpeg,.png" 
                    />
                    <button 
                      onClick={() => fileInputRef.current?.click()}
                      className="mt-2 text-xs font-bold text-white bg-[#2C4A3B] px-4 py-2 rounded-xl hover:bg-[#233b2f] transition-colors shadow-xs"
                    >
                      Examinar archivos
                    </button>
                  </div>
                )}
              </div>

              {uploadError && (
                <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl text-xs flex items-center gap-2">
                  <AlertCircle size={15} className="shrink-0 text-red-600" />
                  <span>{uploadError}</span>
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </motion.div>
  );
}