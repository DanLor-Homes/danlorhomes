import React, { useState } from 'react';
import { Loader2, Upload, X, FileText } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { Label } from '@/components/ui/label';

export default function MediaUploader({ label, value = [], onChange, accept, isPrivate = false, buttonLabel = 'Añadir archivo' }) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');

  const handleFiles = async (event) => {
    const files = Array.from(event.target.files || []);
    event.target.value = '';
    if (!files.length) return;
    setUploading(true);
    setError('');
    try {
      const uploaded = [];
      for (const file of files) {
        if (isPrivate) {
          const { file_uri } = await base44.integrations.Core.UploadPrivateFile({ file });
          uploaded.push({ name: file.name, file_uri });
        } else {
          const { file_url } = await base44.integrations.Core.UploadPublicFile({ file });
          uploaded.push({ name: file.name, file_url });
        }
      }
      onChange([...value, ...uploaded]);
    } catch {
      setError('No se pudieron subir los archivos. Inténtalo de nuevo.');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div>
      <Label>{label}</Label>
      <div className="mt-1.5 space-y-1.5">
        {value.map((file, index) => (
          <div
            key={`${file.file_url || file.file_uri}-${index}`}
            className="flex items-center gap-2 rounded-lg border border-border/70 bg-muted/30 px-2.5 py-1.5 text-xs"
          >
            <FileText className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
            <span className="flex-1 truncate">{file.name}</span>
            <button
              type="button"
              onClick={() => onChange(value.filter((_, i) => i !== index))}
              className="text-muted-foreground transition-colors hover:text-destructive"
              aria-label={`Quitar ${file.name}`}
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        ))}
        <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-dashed border-border px-3 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:border-primary/50 hover:text-foreground">
          {uploading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Upload className="h-3.5 w-3.5" />}
          {uploading ? 'Subiendo…' : buttonLabel}
          <input type="file" multiple accept={accept} className="hidden" onChange={handleFiles} disabled={uploading} />
        </label>
        {error && <p className="text-[11px] text-destructive">{error}</p>}
      </div>
    </div>
  );
}