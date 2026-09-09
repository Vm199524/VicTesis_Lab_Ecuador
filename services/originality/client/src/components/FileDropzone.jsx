import { useCallback, useRef, useState } from "react";
import { UploadCloud, FileText, Loader2, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { UPLOAD_LIMITS } from "../../../shared/schema";

const FORMAT_LABELS = {
  pdf: "PDF",
  docx: "Word (DOCX)",
  doc: "Word 97-2003 (DOC)",
  rtf: "RTF",
  text: "Texto plano",
  markdown: "Markdown",
};

/**
 * Drag-and-drop document upload. Posts the file to /api/extract and hands the
 * extracted plain text back to the parent through `onExtracted`.
 */
export default function FileDropzone({ onExtracted, onError, disabled }) {
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [loaded, setLoaded] = useState(null);
  const inputRef = useRef(null);

  const uploadFile = useCallback(
    async (file) => {
      if (!file) return;

      const ext = (file.name.match(/\.[^.]+$/)?.[0] || "").toLowerCase();
      if (!UPLOAD_LIMITS.extensions.includes(ext)) {
        onError(`Formato no soportado: ${ext || "desconocido"}. Usa PDF, DOCX, DOC, RTF, TXT o MD.`);
        return;
      }
      if (file.size > UPLOAD_LIMITS.maxBytes) {
        onError(`El archivo supera el límite de ${Math.round(UPLOAD_LIMITS.maxBytes / 1024 / 1024)}MB.`);
        return;
      }

      setIsUploading(true);
      try {
        const body = new FormData();
        body.append("file", file);

        const response = await fetch("/api/extract", { method: "POST", body });
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || "No se pudo leer el documento.");
        }

        // El tamaño en bytes viene del File original del navegador (no lo
        // devuelve el servidor), así que se adjunta aquí para el resumen.
        const enriched = { ...data, fileSizeBytes: file.size };
        setLoaded(enriched);
        onExtracted(enriched);
      } catch (error) {
        onError(error.message);
        setLoaded(null);
      } finally {
        setIsUploading(false);
        // Reset so re-selecting the same file fires a change event again.
        if (inputRef.current) inputRef.current.value = "";
      }
    },
    [onExtracted, onError]
  );

  const handleDrop = useCallback(
    (event) => {
      event.preventDefault();
      setIsDragging(false);
      if (disabled || isUploading) return;
      uploadFile(event.dataTransfer.files?.[0]);
    },
    [disabled, isUploading, uploadFile]
  );

  if (loaded) {
    return (
      <div
        className="flex items-center gap-3 rounded-xl border-2 border-emerald-200 bg-emerald-50/60 p-4"
        data-testid="file-loaded"
      >
        <FileText className="h-8 w-8 shrink-0 text-emerald-600" />
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-slate-800" data-testid="text-filename">
            {loaded.filename}
          </p>
          <p className="text-xs text-slate-500">
            {FORMAT_LABELS[loaded.format] ?? loaded.format} ·{" "}
            {loaded.words.toLocaleString("es")} palabras ·{" "}
            {loaded.characters.toLocaleString("es")} caracteres
            {loaded.meta?.pages ? ` · ${loaded.meta.pages} págs.` : ""}
            {loaded.truncated ? " · recortado al límite" : ""}
          </p>
        </div>
        <Button
          variant="ghost"
          size="icon"
          data-testid="button-clear-file"
          onClick={() => {
            setLoaded(null);
            onExtracted(null);
          }}
          disabled={disabled}
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
    );
  }

  return (
    <div
      role="button"
      tabIndex={0}
      data-testid="dropzone"
      onDragOver={(event) => {
        event.preventDefault();
        if (!disabled && !isUploading) setIsDragging(true);
      }}
      onDragLeave={() => setIsDragging(false)}
      onDrop={handleDrop}
      onClick={() => !disabled && !isUploading && inputRef.current?.click()}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          if (!disabled && !isUploading) inputRef.current?.click();
        }
      }}
      className={`flex min-h-[176px] cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed p-6 text-center transition-colors ${
        isDragging ? "border-emerald-400 bg-emerald-50/70" : "border-slate-300 bg-slate-50/40 hover:border-emerald-300 hover:bg-emerald-50/40"
      } ${disabled || isUploading ? "pointer-events-none opacity-60" : ""}`}
    >
      <input
        ref={inputRef}
        type="file"
        accept={UPLOAD_LIMITS.accept}
        className="hidden"
        data-testid="input-file"
        onChange={(event) => uploadFile(event.target.files?.[0])}
      />

      {isUploading ? (
        <>
          <Loader2 className="h-9 w-9 animate-spin text-emerald-600" />
          <p className="text-sm font-medium text-slate-600">Extrayendo texto…</p>
        </>
      ) : (
        <>
          <UploadCloud className="h-9 w-9 text-slate-400" />
          <p className="text-sm font-semibold text-slate-700">
            Arrastra tu archivo aquí (.docx, .pdf, .txt)
          </p>
          <p className="text-xs text-slate-400">o haz clic para subir</p>
        </>
      )}
    </div>
  );
}
