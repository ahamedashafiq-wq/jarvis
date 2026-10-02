import React, { useState, useRef } from 'react';
import {
  Eye,
  Camera,
  UploadCloud,
  FileImage,
  AlertTriangle,
  CheckCircle2,
  Sparkles,
  Loader2,
  X,
  ExternalLink,
} from 'lucide-react';
import { VisionMode, VisionAnalysisResult, RoutePath } from '../../types';
import { VisionService } from '../../services/vision';
import { soundService } from '../../services/sound';

interface VisionCoreWidgetProps {
  userId: string;
  onNavigate: (path: RoutePath) => void;
}

const VISION_MODES: { id: VisionMode; label: string }[] = [
  { id: 'GENERAL_ANALYSIS', label: 'GENERAL' },
  { id: 'UI_REVIEW', label: 'UI / UX' },
  { id: 'CODE_SCREENSHOT', label: 'CODE' },
  { id: 'SCREENSHOT_DEBUGGER', label: 'ERROR' },
  { id: 'DIAGRAM_ANALYSIS', label: 'DIAGRAM' },
  { id: 'CHART_ANALYSIS', label: 'CHART' },
  { id: 'DOCUMENT_IMAGE', label: 'DOCUMENT' },
];

export const VisionCoreWidget: React.FC<VisionCoreWidgetProps> = ({
  userId,
  onNavigate,
}) => {
  const [selectedMode, setSelectedMode] = useState<VisionMode>('GENERAL_ANALYSIS');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<VisionAnalysisResult | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileDrop = (file: File) => {
    if (!file.type.startsWith('image/')) {
      setErrorMsg('Please provide a valid PNG, JPG, or WEBP image.');
      return;
    }
    setErrorMsg(null);
    setSelectedFile(file);
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
    soundService.play('CLICK');
  };

  const handleAnalyze = async () => {
    if (!selectedFile || isAnalyzing) return;

    soundService.play('COMMAND_RECEIVED');
    setIsAnalyzing(true);
    setErrorMsg(null);

    try {
      const processed = await VisionService.validateAndPreprocessFile(selectedFile);
      if (!processed.valid || !processed.base64Data || !processed.meta) {
        throw new Error(processed.error || 'Failed to preprocess image.');
      }

      const result = await VisionService.analyzeImage({
        userId,
        imageMeta: processed.meta,
        base64Data: processed.base64Data,
        mode: selectedMode,
      });

      setAnalysisResult(result);
      soundService.play('COMMAND_SUCCESS');
    } catch (err: any) {
      console.error('Vision analysis error:', err);
      setErrorMsg(err.message || 'Vision analysis failed.');
      soundService.play('ERROR');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const clearImage = () => {
    setSelectedFile(null);
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(null);
    setAnalysisResult(null);
    setErrorMsg(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
    soundService.play('CLICK');
  };

  return (
    <div className="rounded-lg border border-jarvis-border bg-jarvis-surfaceElevated p-4 space-y-4 font-mono">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-jarvis-border/60 pb-3">
        <div className="flex items-center gap-2">
          <Eye className="w-4 h-4 text-jarvis-secondary animate-pulse" />
          <div>
            <h2 className="text-xs sm:text-sm font-bold text-jarvis-text tracking-wider">
              ZORO VISION CORE 2.0
            </h2>
            <p className="text-[10px] text-jarvis-textMuted">THREE-STAGE INGEST • UNDERSTAND • ACT</p>
          </div>
        </div>

        <button
          onClick={() => onNavigate('/vision')}
          className="text-xs text-jarvis-secondary hover:underline flex items-center gap-1"
        >
          <span>FULL STUDIO</span>
          <ExternalLink className="w-3 h-3" />
        </button>
      </div>

      {/* Analysis Mode Selector */}
      <div className="flex flex-wrap gap-1">
        {VISION_MODES.map((m) => (
          <button
            key={m.id}
            onClick={() => {
              setSelectedMode(m.id);
              soundService.play('CLICK');
            }}
            className={`px-2 py-0.5 rounded text-[10px] transition-colors ${
              selectedMode === m.id
                ? 'bg-jarvis-secondary/20 text-jarvis-secondary border border-jarvis-secondary/50 font-bold'
                : 'text-jarvis-textMuted hover:text-jarvis-text bg-jarvis-surface'
            }`}
          >
            {m.label}
          </button>
        ))}
      </div>

      {/* Upload & Ingestion Stage */}
      {!previewUrl ? (
        <div
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => {
            e.preventDefault();
            if (e.dataTransfer.files?.[0]) handleFileDrop(e.dataTransfer.files[0]);
          }}
          onClick={() => fileInputRef.current?.click()}
          className="border border-dashed border-jarvis-border hover:border-jarvis-secondary/60 rounded-md p-6 flex flex-col items-center justify-center text-center cursor-pointer transition-colors bg-jarvis-surface/40 hover:bg-jarvis-surface"
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="image/png,image/jpeg,image/webp"
            className="hidden"
            onChange={(e) => {
              if (e.target.files?.[0]) handleFileDrop(e.target.files[0]);
            }}
            id="vision-upload-input"
            aria-label="Drop Image or File"
          />
          <UploadCloud className="w-8 h-8 text-jarvis-secondary mb-2" />
          <div className="text-xs font-semibold text-jarvis-text">DROP IMAGE / FILE</div>
          <div className="text-[10px] text-jarvis-textMuted mt-1">
            PNG, JPG, WEBP • Max 15MB • Zero secret telemetry leakage
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          <div className="flex items-center justify-between p-2 rounded bg-jarvis-surface border border-jarvis-border text-xs">
            <div className="flex items-center gap-2 truncate">
              <FileImage className="w-4 h-4 text-jarvis-secondary shrink-0" />
              <span className="text-jarvis-text font-medium truncate max-w-xs">
                {selectedFile?.name}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={handleAnalyze}
                disabled={isAnalyzing}
                className="px-3 py-1 rounded border border-jarvis-secondary bg-jarvis-secondary text-black font-semibold text-xs hover:bg-jarvis-secondary/90 transition-all flex items-center gap-1.5"
              >
                {isAnalyzing ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>ANALYZING</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>ANALYZE</span>
                  </>
                )}
              </button>
              <button
                onClick={clearImage}
                className="p-1 rounded text-jarvis-textMuted hover:text-jarvis-danger"
                aria-label="Clear image"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="max-h-48 overflow-hidden rounded border border-jarvis-border bg-black/40 flex items-center justify-center">
            <img
              src={previewUrl}
              alt="Vision Analysis Preview"
              className="max-h-48 object-contain"
            />
          </div>
        </div>
      )}

      {errorMsg && (
        <div className="p-2 rounded bg-jarvis-danger/10 border border-jarvis-danger/30 text-jarvis-danger text-xs flex items-center gap-1.5">
          <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Analysis Output (Understand & Act) */}
      {analysisResult && (
        <div className="p-3 rounded border border-jarvis-secondary/40 bg-jarvis-surface space-y-2.5 text-xs">
          <div className="flex items-center justify-between border-b border-jarvis-border/40 pb-1.5">
            <span className="text-jarvis-secondary font-bold">ANALYSIS SUMMARY</span>
            <span className="text-[10px] text-jarvis-primary">CONFIDENCE: HIGH</span>
          </div>

          <p className="text-jarvis-text leading-relaxed text-[11px]">{analysisResult.summary}</p>

          {analysisResult.observations && analysisResult.observations.length > 0 && (
            <div className="space-y-1">
              <span className="text-[10px] text-jarvis-textMuted uppercase font-semibold">
                KEY FINDINGS:
              </span>
              <ul className="space-y-0.5 text-[11px] text-jarvis-textSecondary">
                {analysisResult.observations.slice(0, 3).map((obs, i) => (
                  <li key={i} className="flex items-start gap-1.5">
                    <span className="text-jarvis-secondary">›</span>
                    <span>{obs}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {analysisResult.recommendations && analysisResult.recommendations.length > 0 && (
            <div className="space-y-1">
              <span className="text-[10px] text-jarvis-textMuted uppercase font-semibold">
                RECOMMENDED ACTIONS:
              </span>
              <ul className="space-y-0.5 text-[11px] text-jarvis-primary">
                {analysisResult.recommendations.slice(0, 2).map((rec, i) => (
                  <li key={i} className="flex items-start gap-1.5">
                    <span>✓</span>
                    <span>{rec}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
