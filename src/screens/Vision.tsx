import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  Mission,
  RiskLevel,
  RoutePath,
  VisionAnalysisResult,
  VisionImageMeta,
  VisionMode,
  VisionProposedAction,
  VisionSession,
} from '../types';
import { VisionService } from '../services/vision';
import { MissionService } from '../services/mission';
import { NeuralMemoryService } from '../services/neuralMemory';
import { speechService } from '../services/speech';
import { realtimeService } from '../services/realtime';
import { useToast } from '../components/Toast';
import {
  Eye,
  Camera,
  Upload,
  Sparkles,
  Shield,
  CheckCircle,
  AlertTriangle,
  ArrowRight,
  RefreshCw,
  Trash2,
  Lock,
  Target,
  Database,
  Code,
  Bug,
  Layout,
  Network,
  BarChart,
  FileText,
  HelpCircle,
  Volume2,
  Copy,
  Check,
  X,
  Search,
  ArrowLeft,
  Maximize2,
  Layers,
  Terminal,
} from 'lucide-react';

interface VisionProps {
  onNavigate: (path: RoutePath) => void;
}

export const VisionScreen: React.FC<VisionProps> = ({ onNavigate }) => {
  const { currentSession, createNotification, trackEvent } = useAuth();
  const userId = currentSession?.userId || 'guest';
  const { showToast } = useToast();

  // Selected Image & File State
  const [selectedMeta, setSelectedMeta] = useState<VisionImageMeta | null>(null);
  const [selectedBase64, setSelectedBase64] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  // Analysis Configuration State
  const [selectedMode, setSelectedMode] = useState<VisionMode>('GENERAL_ANALYSIS');
  const [customQuestion, setCustomQuestion] = useState('');
  const [selectedMissionId, setSelectedMissionId] = useState<string>('');
  const [activeMissions, setActiveMissions] = useState<Mission[]>([]);

  // Processing & Loading States
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisStep, setAnalysisStep] = useState<string>('');
  const [analysisResult, setAnalysisResult] = useState<VisionAnalysisResult | null>(null);

  // Camera State
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  // Action Execution State
  const [isExecutingAction, setIsExecutingAction] = useState(false);
  const [actionExecutedMessage, setActionExecutedMessage] = useState<string | null>(null);

  // History & Search State
  const [historySessions, setHistorySessions] = useState<VisionSession[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedHistorySession, setSelectedHistorySession] = useState<VisionSession | null>(null);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // 1. Initial Load: Missions & History
  useEffect(() => {
    loadMissions();
    loadHistory();

    const unsubCompleted = realtimeService.subscribe('VISION_ANALYSIS_COMPLETED', () => {
      loadHistory();
    });
    const unsubDeleted = realtimeService.subscribe('VISION_DELETED', () => {
      loadHistory();
    });

    return () => {
      unsubCompleted();
      unsubDeleted();
      stopCamera();
    };
  }, [userId]);

  // Global Paste Listener (Ctrl+V / Cmd+V to paste screenshot from clipboard)
  useEffect(() => {
    const handlePaste = (e: ClipboardEvent) => {
      if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement)?.tagName)) {
        return;
      }
      const items = e.clipboardData?.items;
      if (!items) return;

      for (let i = 0; i < items.length; i++) {
        if (items[i].type.startsWith('image/')) {
          const file = items[i].getAsFile();
          if (file) {
            handleProcessFile(file);
            showToast('CLIPBOARD INGESTED', 'Screenshot received from clipboard.', 'TASK');
            break;
          }
        }
      }
    };

    window.addEventListener('paste', handlePaste);
    return () => window.removeEventListener('paste', handlePaste);
  }, []);

  const loadMissions = () => {
    const m = MissionService.getMissions(userId);
    setActiveMissions(m);
    if (m.length > 0 && !selectedMissionId) {
      setSelectedMissionId(m[0].id);
    }
  };

  const loadHistory = () => {
    const list = VisionService.getVisionSessions(userId);
    setHistorySessions(list);
  };

  // 2. File Ingestion Handlers
  const handleProcessFile = async (file: File) => {
    const res = await VisionService.validateAndPreprocessFile(file);
    if (!res.valid || !res.meta || !res.base64Data) {
      showToast('VALIDATION ERROR', res.error || 'Failed to process image.', 'ERROR');
      return;
    }

    setSelectedMeta(res.meta);
    setSelectedBase64(res.base64Data);
    setPreviewUrl(res.meta.thumbnailDataUrl || null);
    setAnalysisResult(null);
    setActionExecutedMessage(null);

    // Heuristic auto-suggest mode if filename hints at error or code
    const lower = file.name.toLowerCase();
    if (lower.includes('error') || lower.includes('crash') || lower.includes('bug') || lower.includes('exception')) {
      setSelectedMode('SCREENSHOT_DEBUGGER');
    } else if (lower.includes('code') || lower.includes('ts') || lower.includes('js') || lower.includes('py')) {
      setSelectedMode('CODE_SCREENSHOT');
    } else if (lower.includes('ui') || lower.includes('dash') || lower.includes('screen')) {
      setSelectedMode('UI_REVIEW');
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleProcessFile(file);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      handleProcessFile(file);
    }
  };

  const handleClearImage = () => {
    setSelectedMeta(null);
    setSelectedBase64(null);
    setPreviewUrl(null);
    setAnalysisResult(null);
    setActionExecutedMessage(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // 3. Camera Capture Flow
  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } },
      });
      setCameraStream(stream);
      setIsCameraActive(true);
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
      showToast('CAMERA ARMED', 'Live optical feed active. Position target and capture.', 'INFO');
    } catch (err: any) {
      showToast('CAMERA DENIED', 'Camera access was denied or is unavailable on this device.', 'ERROR');
    }
  };

  const stopCamera = () => {
    if (cameraStream) {
      cameraStream.getTracks().forEach((track) => track.stop());
      setCameraStream(null);
    }
    setIsCameraActive(false);
  };

  const captureFrame = () => {
    if (!videoRef.current) return;
    const canvas = document.createElement('canvas');
    canvas.width = videoRef.current.videoWidth || 1280;
    canvas.height = videoRef.current.videoHeight || 720;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
    const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
    const base64Data = dataUrl.split(',')[1] || '';

    const meta: VisionImageMeta = {
      filename: `camera_capture_${new Date().toISOString().slice(11, 19).replace(/:/g, '-')}.jpg`,
      mimeType: 'image/jpeg',
      sizeBytes: Math.round(base64Data.length * 0.75),
      width: canvas.width,
      height: canvas.height,
      thumbnailDataUrl: dataUrl,
    };

    setSelectedMeta(meta);
    setSelectedBase64(base64Data);
    setPreviewUrl(dataUrl);
    setAnalysisResult(null);
    setActionExecutedMessage(null);
    stopCamera();
    showToast('FRAME CAPTURED', 'Frame ingested into Vision Core for analysis.', 'SUCCESS');
  };

  // 4. Run Vision Analysis
  const handleAnalyze = async () => {
    if (!selectedMeta || !selectedBase64) {
      showToast('INPUT REQUIRED', 'Please upload or capture an image first.', 'WARNING');
      return;
    }

    setIsAnalyzing(true);
    setAnalysisStep('VISION CORE SCANNING...');

    const timer1 = setTimeout(() => setAnalysisStep('UNDERSTANDING IMAGE...'), 600);
    const timer2 = setTimeout(() => setAnalysisStep('SYNTHESIZING TELEMETRY...'), 1400);

    try {
      const result = await VisionService.analyzeImage({
        userId,
        imageMeta: selectedMeta,
        base64Data: selectedBase64,
        mode: selectedMode,
        question: customQuestion.trim() || undefined,
        missionId: selectedMode === 'PROJECT_REVIEW' ? selectedMissionId : undefined,
      });

      setAnalysisResult(result);
      showToast('ANALYSIS READY', result.summary, 'SUCCESS');
      trackEvent('VISION_ANALYZED', JSON.stringify({ mode: selectedMode, filename: selectedMeta.filename }));

      // Voice Output: speak brief summary if speech is enabled
      speechService.speak(`Vision analysis completed: ${result.summary}`);
    } catch (err: any) {
      showToast('ANALYSIS ERROR', err?.message || 'Error analyzing visual data.', 'ERROR');
    } finally {
      clearTimeout(timer1);
      clearTimeout(timer2);
      setIsAnalyzing(false);
      setAnalysisStep('');
    }
  };

  // 5. Execute Proposed Vision Action through Agentic Brain
  const handleApproveAction = async (action: VisionProposedAction) => {
    setIsExecutingAction(true);
    try {
      const res = await VisionService.executeApprovedAction(userId, action);
      if (res.success) {
        showToast('DIRECTIVE DISPATCHED', res.message, 'SUCCESS');
        createNotification('VISION DIRECTIVE COMMITTED', res.message, 'TASK');
        setActionExecutedMessage(res.message);
        if (analysisResult) {
          setAnalysisResult({
            ...analysisResult,
            proposedAction: { ...action, status: 'EXECUTED' },
          });
        }
      } else {
        showToast('EXECUTION FAILED', res.message, 'ERROR');
      }
    } catch (err: any) {
      showToast('ERROR', err?.message || 'Failed to dispatch directive.', 'ERROR');
    } finally {
      setIsExecutingAction(false);
    }
  };

  // 6. Save Analysis to Memory Bank (Blade 03)
  const handleSaveToMemory = () => {
    if (!analysisResult || !selectedMeta) return;

    const dummySession: VisionSession = {
      id: 'vis_mem_' + Date.now(),
      user_id: userId,
      analysis_type: selectedMode,
      question: customQuestion,
      result_summary: analysisResult.summary,
      result: analysisResult,
      image_meta: selectedMeta,
      created_at: Date.now(),
    };

    const saved = VisionService.saveAnalysisToMemory(userId, dummySession, 'Visual insight archived via Vision Core.');
    if (saved) {
      const activeMission = activeMissions.find((m) => m.id === selectedMissionId);
      NeuralMemoryService.autoLinkVision(
        userId,
        dummySession.id,
        selectedMeta.filename,
        activeMission?.title
      );
      showToast('ARCHIVED TO KNOWLEDGE', 'Visual observations committed to Neural Memory & Knowledge Graph.', 'SUCCESS');
      createNotification('MEMORY STORED', `Archived vision analysis: "${analysisResult.summary}"`, 'MEMORY');
    } else {
      showToast('ERROR', 'Failed to archive memory.', 'ERROR');
    }
  };

  // 7. Delete Session from History
  const handleDeleteSession = (id: string, filename: string) => {
    VisionService.deleteVisionSession(userId, id);
    showToast('SESSION DELETED', `Visual telemetry "${filename}" removed.`, 'TASK');
    if (selectedHistorySession?.id === id) {
      setSelectedHistorySession(null);
    }
  };

  // Filtered History
  const filteredHistory = VisionService.searchVisionSessions(userId, searchQuery);

  const getModeIcon = (mode: VisionMode) => {
    switch (mode) {
      case 'SCREENSHOT_DEBUGGER':
        return <Bug className="w-4 h-4 text-[#FF3B30]" />;
      case 'CODE_SCREENSHOT':
        return <Code className="w-4 h-4 text-[#38E1FF]" />;
      case 'UI_REVIEW':
        return <Layout className="w-4 h-4 text-[#19F59A]" />;
      case 'DIAGRAM_ANALYSIS':
        return <Network className="w-4 h-4 text-[#E6C665]" />;
      case 'CHART_ANALYSIS':
        return <BarChart className="w-4 h-4 text-[#38E1FF]" />;
      case 'DOCUMENT_IMAGE':
        return <FileText className="w-4 h-4 text-[#F5F7F6]" />;
      case 'PROJECT_REVIEW':
        return <Target className="w-4 h-4 text-[#19F59A]" />;
      case 'CUSTOM_QUESTION':
        return <HelpCircle className="w-4 h-4 text-[#E6C665]" />;
      default:
        return <Eye className="w-4 h-4 text-[#19F59A]" />;
    }
  };

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto space-y-6 font-mono text-xs text-[#F5F7F6]">
      {/* Header Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#16281F] pb-4">
        <div>
          <div className="flex items-center gap-2.5">
            <span className="p-2 rounded-xl bg-[#00D084]/10 border border-[#00D084]/30 text-[#19F59A] shadow-[0_0_15px_rgba(0,208,132,0.15)]">
              <Eye className="w-6 h-6 text-[#19F59A]" />
            </span>
            <div>
              <h1 className="text-xl font-black text-[#F5F7F6] tracking-wider flex items-center gap-2">
                ZORO VISION CORE
                <span className="text-[10px] px-2 py-0.5 rounded bg-[#00D084]/20 border border-[#00D084]/40 text-[#19F59A] font-bold">
                  PHASE 10
                </span>
              </h1>
              <p className="text-[10px] text-[#8B9992] tracking-widest mt-0.5">
                SEE. UNDERSTAND. ACT. • THREE BLADES. ONE INTELLIGENCE.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => onNavigate('/dashboard')}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#0A100D] border border-[#16281F] text-[#8B9992] hover:text-[#19F59A] transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>COMMAND DECK</span>
          </button>
          <button
            onClick={() => onNavigate('/chat')}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#121C17] border border-[#16281F] text-[#38E1FF] hover:border-[#38E1FF]/40 transition-colors"
          >
            <span>MULTIMODAL CHAT</span>
          </button>
        </div>
      </div>

      {/* Main Grid: Upload / Camera on Left, Context & Analysis on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Dropzone & Camera (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          {/* Ingestion Surface */}
          <div className="p-5 rounded-2xl bg-[#0A100D] border border-[#16281F] space-y-4 shadow-xl">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-[#F5F7F6] flex items-center gap-2">
                <Upload className="w-4 h-4 text-[#19F59A]" />
                VISUAL INGESTION SURFACE
              </span>
              <span className="text-[9px] text-[#8B9992]">PNG, JPG, WEBP &lt; 15MB</span>
            </div>

            {/* Hidden File Input */}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/png,image/jpeg,image/webp,image/gif,image/bmp"
              onChange={handleFileChange}
              className="hidden"
            />

            {/* Live Camera View (when active) */}
            {isCameraActive ? (
              <div className="relative rounded-xl overflow-hidden border border-[#00D084] bg-black aspect-video flex items-center justify-center">
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-full object-cover"
                />
                {/* Tactical HUD Overlay Target Lines */}
                <div className="absolute inset-0 pointer-events-none border border-[#00D084]/40 m-4 rounded flex items-center justify-center">
                  <div className="w-12 h-12 border-t-2 border-l-2 border-[#19F59A] absolute top-2 left-2" />
                  <div className="w-12 h-12 border-t-2 border-r-2 border-[#19F59A] absolute top-2 right-2" />
                  <div className="w-12 h-12 border-b-2 border-l-2 border-[#19F59A] absolute bottom-2 left-2" />
                  <div className="w-12 h-12 border-b-2 border-r-2 border-[#19F59A] absolute bottom-2 right-2" />
                  <div className="text-[9px] text-[#19F59A] font-bold bg-black/60 px-2 py-0.5 rounded">
                    ALIGN TARGET
                  </div>
                </div>

                {/* Camera Buttons */}
                <div className="absolute bottom-3 inset-x-0 flex items-center justify-center gap-3">
                  <button
                    onClick={captureFrame}
                    className="px-4 py-2 rounded-xl bg-[#00D084] text-[#050706] font-bold text-xs hover:bg-[#19F59A] shadow-[0_0_15px_rgba(0,208,132,0.4)]"
                  >
                    CAPTURE FRAME
                  </button>
                  <button
                    onClick={stopCamera}
                    className="px-3 py-2 rounded-xl bg-[#050706]/80 text-[#8B9992] hover:text-[#F5F7F6] text-xs border border-[#16281F]"
                  >
                    DISMISS
                  </button>
                </div>
              </div>
            ) : previewUrl && selectedMeta ? (
              /* Image Preview Box */
              <div className="space-y-3">
                <div className="relative rounded-xl overflow-hidden border border-[#16281F] bg-[#050706] flex items-center justify-center max-h-72">
                  <img
                    src={previewUrl}
                    alt={selectedMeta.filename}
                    className="w-full h-auto max-h-72 object-contain"
                  />
                  <button
                    onClick={handleClearImage}
                    className="absolute top-2 right-2 p-1.5 rounded-lg bg-black/70 hover:bg-[#FF3B30] text-white transition-colors"
                    title="Remove Image"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Telemetry strip */}
                <div className="p-2.5 rounded-lg bg-[#050706] border border-[#16281F] flex items-center justify-between text-[10px] text-[#8B9992]">
                  <span className="truncate max-w-[160px] text-[#F5F7F6] font-bold">
                    {selectedMeta.filename}
                  </span>
                  <span>
                    {selectedMeta.width}x{selectedMeta.height} px
                  </span>
                  <span>{(selectedMeta.sizeBytes / 1024).toFixed(0)} KB</span>
                </div>
              </div>
            ) : (
              /* Drag and Drop Zone */
              <div
                onDragOver={(e) => {
                  e.preventDefault();
                  setIsDragging(true);
                }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`p-8 rounded-xl border-2 border-dashed transition-all cursor-pointer flex flex-col items-center justify-center space-y-3 text-center ${
                  isDragging
                    ? 'border-[#00D084] bg-[#00D084]/10'
                    : 'border-[#16281F] hover:border-[#00D084]/50 bg-[#050706]'
                }`}
              >
                <div className="p-3 rounded-full bg-[#121C17] border border-[#16281F] text-[#19F59A]">
                  <Upload className="w-6 h-6" />
                </div>
                <div>
                  <div className="text-sm font-bold text-[#F5F7F6]">
                    DROP IMAGE OR SCREENSHOT HERE
                  </div>
                  <p className="text-[10px] text-[#8B9992] mt-1">
                    Click to browse or paste from clipboard (Ctrl + V)
                  </p>
                </div>
              </div>
            )}

            {/* Ingestion Trigger Controls */}
            {!isCameraActive && (
              <div className="grid grid-cols-2 gap-2 pt-1">
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="py-2 px-3 rounded-lg bg-[#121C17] border border-[#16281F] hover:border-[#19F59A]/40 text-[#19F59A] text-xs font-bold transition-all flex items-center justify-center gap-1.5"
                >
                  <Upload className="w-3.5 h-3.5" />
                  <span>SELECT FILE</span>
                </button>
                <button
                  onClick={startCamera}
                  className="py-2 px-3 rounded-lg bg-[#121C17] border border-[#16281F] hover:border-[#38E1FF]/40 text-[#38E1FF] text-xs font-bold transition-all flex items-center justify-center gap-1.5"
                >
                  <Camera className="w-3.5 h-3.5" />
                  <span>OPEN CAMERA</span>
                </button>
              </div>
            )}
          </div>

          {/* Privacy & Safety Guarantee */}
          <div className="p-3.5 rounded-xl bg-[#0A100D] border border-[#16281F] space-y-1.5 text-[10px] text-[#8B9992]">
            <div className="flex items-center gap-1.5 text-[#19F59A] font-bold">
              <Shield className="w-3.5 h-3.5" />
              <span>PRIVACY & SECURITY CONSTITUTION</span>
            </div>
            <p>
              • Zero background surveillance. Camera and screen access only open upon explicit user clicks.
            </p>
            <p>
              • All visible text inside images is treated strictly as untrusted DATA (prompt injection defense).
            </p>
            <p>
              • Visible API keys, tokens, or passwords are masked with security warnings.
            </p>
          </div>
        </div>

        {/* Right Column: Mode Config & Analysis Output (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          {/* Analysis Configuration Card */}
          <div className="p-5 rounded-2xl bg-[#0A100D] border border-[#16281F] space-y-4 shadow-xl">
            <div className="flex items-center justify-between border-b border-[#16281F] pb-3">
              <span className="text-xs font-bold text-[#F5F7F6] flex items-center gap-2">
                <Target className="w-4 h-4 text-[#38E1FF]" />
                VISION ANALYSIS PROTOCOL
              </span>
              <span className="text-[10px] text-[#19F59A] font-bold">
                BLADE 01 • KNOWLEDGE
              </span>
            </div>

            {/* Mode Selector Buttons */}
            <div className="space-y-1.5">
              <label className="text-[10px] text-[#8B9992] uppercase font-bold">
                Select Analysis Mode
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {(
                  [
                    { mode: 'GENERAL_ANALYSIS', label: 'GENERAL VISION' },
                    { mode: 'SCREENSHOT_DEBUGGER', label: 'ERROR DEBUGGER' },
                    { mode: 'CODE_SCREENSHOT', label: 'CODE REVIEW' },
                    { mode: 'UI_REVIEW', label: 'UI / UX REVIEW' },
                    { mode: 'DIAGRAM_ANALYSIS', label: 'DIAGRAM / ARCH' },
                    { mode: 'CHART_ANALYSIS', label: 'CHART / METRICS' },
                    { mode: 'DOCUMENT_IMAGE', label: 'DOCUMENT / OCR' },
                    { mode: 'PROJECT_REVIEW', label: 'PROJECT SYNC' },
                    { mode: 'CUSTOM_QUESTION', label: 'CUSTOM QUERY' },
                  ] as const
                ).map((item) => (
                  <button
                    key={item.mode}
                    onClick={() => setSelectedMode(item.mode)}
                    className={`p-2 rounded-lg border text-left flex items-center gap-2 transition-all ${
                      selectedMode === item.mode
                        ? 'bg-[#121C17] border-[#00D084] text-[#19F59A] shadow-[0_0_10px_rgba(0,208,132,0.15)] font-bold'
                        : 'bg-[#050706] border-[#16281F] text-[#8B9992] hover:text-[#F5F7F6]'
                    }`}
                  >
                    {getModeIcon(item.mode)}
                    <span className="text-[10px] truncate">{item.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Project / Mission Context Selector (For PROJECT_REVIEW mode) */}
            {selectedMode === 'PROJECT_REVIEW' && (
              <div className="p-3 rounded-lg bg-[#050706] border border-[#16281F] space-y-1.5">
                <label className="text-[10px] text-[#19F59A] font-bold flex items-center gap-1.5">
                  <Target className="w-3.5 h-3.5" />
                  LINK WITH ACTIVE STRATEGIC MISSION
                </label>
                <select
                  value={selectedMissionId}
                  onChange={(e) => setSelectedMissionId(e.target.value)}
                  className="w-full px-3 py-1.5 rounded bg-[#0A100D] border border-[#16281F] text-[#F5F7F6] text-xs"
                >
                  {activeMissions.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.title} ({m.progress}% • {m.status})
                    </option>
                  ))}
                </select>
                <p className="text-[9px] text-[#8B9992]">
                  JARVIS will compare visual elements with real database progress and tasks.
                </p>
              </div>
            )}

            {/* Custom Inquiry Input */}
            <div className="space-y-1">
              <label className="text-[10px] text-[#8B9992] uppercase font-bold">
                Specific Inquiries / Directives (Optional)
              </label>
              <input
                type="text"
                value={customQuestion}
                onChange={(e) => setCustomQuestion(e.target.value)}
                placeholder="e.g. Why is this error appearing? or Why does this UI feel crowded?"
                className="w-full px-3 py-2 rounded-lg bg-[#050706] border border-[#16281F] text-[#F5F7F6] focus:border-[#00D084] outline-none text-xs"
              />
            </div>

            {/* Main Action Execute Button */}
            <button
              onClick={handleAnalyze}
              disabled={isAnalyzing || !selectedBase64}
              className="w-full py-2.5 px-4 rounded-xl bg-[#00D084] text-[#050706] font-black text-xs hover:bg-[#19F59A] transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(0,208,132,0.3)]"
            >
              {isAnalyzing ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>{analysisStep || 'ANALYZING VISUAL TELEMETRY...'}</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 stroke-[2.5]" />
                  <span>ENGAGE VISION ANALYSIS</span>
                </>
              )}
            </button>
          </div>

          {/* Analysis Results Display */}
          {analysisResult && (
            <div className="p-5 rounded-2xl bg-[#0A100D] border border-[#16281F] space-y-4 shadow-xl animate-in fade-in">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#16281F] pb-3">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-[#19F59A] animate-pulse" />
                  <h3 className="text-sm font-bold text-[#F5F7F6]">
                    TACTICAL VISUAL OBSERVATIONS
                  </h3>
                  <span className="text-[9px] px-2 py-0.5 rounded bg-[#121C17] border border-[#16281F] text-[#8B9992]">
                    {analysisResult.mode}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => speechService.speak(analysisResult.summary)}
                    className="p-1.5 rounded bg-[#121C17] border border-[#16281F] text-[#8B9992] hover:text-[#38E1FF]"
                    title="Speak Summary"
                  >
                    <Volume2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={handleSaveToMemory}
                    className="flex items-center gap-1 px-2.5 py-1 rounded bg-[#121C17] border border-[#16281F] text-[#19F59A] hover:border-[#19F59A]/40 text-[10px]"
                    title="Archive to Neural Memory Bank & Knowledge Graph"
                  >
                    <Database className="w-3 h-3" />
                    <span>SAVE TO KNOWLEDGE</span>
                  </button>
                </div>
              </div>

              {/* Secrets Detection Warning Banner */}
              {analysisResult.secretsDetected && analysisResult.secretsDetected.length > 0 && (
                <div className="p-3.5 rounded-xl bg-[#FF3B30]/15 border border-[#FF3B30]/50 text-[#FF3B30] space-y-2">
                  <div className="flex items-center gap-2 font-bold text-xs">
                    <AlertTriangle className="w-4 h-4" />
                    <span>SECURITY ADVISORY: CREDENTIAL DETECTED IN IMAGE</span>
                  </div>
                  {analysisResult.secretsDetected.map((sec, i) => (
                    <div key={i} className="text-[10px] space-y-0.5 bg-black/40 p-2 rounded">
                      <div>
                        Type: <strong>{sec.type}</strong> • Snippet: <code>{sec.maskedSnippet}</code>
                      </div>
                      <p className="text-[#8B9992]">{sec.recommendation}</p>
                    </div>
                  ))}
                </div>
              )}

              {/* Summary Statement */}
              <div className="p-3.5 rounded-xl bg-[#050706] border border-[#16281F]">
                <div className="text-[10px] text-[#8B9992] uppercase font-bold mb-1">
                  Executive Summary
                </div>
                <p className="text-xs text-[#F5F7F6] leading-relaxed">
                  {analysisResult.summary}
                </p>
              </div>

              {/* Observations List */}
              {analysisResult.observations.length > 0 && (
                <div className="space-y-1.5">
                  <div className="text-[10px] text-[#8B9992] uppercase font-bold">
                    Visible Observations
                  </div>
                  <div className="space-y-1">
                    {analysisResult.observations.map((obs, i) => (
                      <div
                        key={i}
                        className="p-2 rounded-lg bg-[#050706] border border-[#16281F] flex items-start gap-2 text-xs"
                      >
                        <span className="text-[#19F59A] font-bold mt-0.5">•</span>
                        <span>{obs}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Issues / Debug Diagnostics */}
              {analysisResult.issues.length > 0 && (
                <div className="space-y-2">
                  <div className="text-[10px] text-[#8B9992] uppercase font-bold">
                    Diagnosed Issues & Root Causes
                  </div>
                  {analysisResult.issues.map((iss, i) => (
                    <div
                      key={i}
                      className="p-3 rounded-xl bg-[#050706] border border-[#16281F] space-y-2"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-[#FF3B30] text-xs">
                          {iss.problem}
                        </span>
                        <span className="text-[9px] px-1.5 py-0.5 rounded bg-[#121C17] text-[#38E1FF] font-bold">
                          {iss.certainty}
                        </span>
                      </div>

                      {iss.likelyCause && (
                        <div className="text-[11px] text-[#8B9992]">
                          <strong className="text-[#F5F7F6]">Likely Cause: </strong>
                          {iss.likelyCause}
                        </div>
                      )}

                      {iss.whatToCheck && (
                        <div className="text-[11px] text-[#8B9992]">
                          <strong className="text-[#38E1FF]">Verification: </strong>
                          {iss.whatToCheck}
                        </div>
                      )}

                      {iss.suggestedFix && (
                        <div className="p-2 rounded bg-[#121C17] border border-[#16281F] text-[11px] text-[#19F59A]">
                          <strong>Suggested Fix: </strong>
                          {iss.suggestedFix}
                        </div>
                      )}

                      {iss.codeSnippet && (
                        <pre className="p-2 rounded bg-black border border-[#16281F] text-[10px] overflow-x-auto text-[#19F59A]">
                          {iss.codeSnippet}
                        </pre>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {/* Project Comparison View */}
              {analysisResult.projectComparison && (
                <div className="p-3.5 rounded-xl bg-[#050706] border border-[#16281F] space-y-2">
                  <div className="text-[10px] text-[#19F59A] font-bold uppercase flex items-center gap-1.5">
                    <Target className="w-3.5 h-3.5" />
                    PROJECT TELEMETRY VS. LIVE DATABASE
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-[11px] text-[#8B9992]">
                    <div className="p-2 rounded bg-[#0A100D] border border-[#16281F]">
                      <span className="block text-[9px] text-[#8B9992]">MISSION TITLE</span>
                      <strong className="text-[#F5F7F6]">
                        {analysisResult.projectComparison.missionTitle}
                      </strong>
                    </div>
                    <div className="p-2 rounded bg-[#0A100D] border border-[#16281F]">
                      <span className="block text-[9px] text-[#8B9992]">RECORDED PROGRESS</span>
                      <strong className="text-[#19F59A]">
                        {analysisResult.projectComparison.missionProgress}%
                      </strong>
                    </div>
                  </div>
                  {analysisResult.projectComparison.visualDiscrepancies.map((disc, idx) => (
                    <div key={idx} className="text-[11px] text-[#FFB000] p-2 rounded bg-[#FFB000]/10 border border-[#FFB000]/30">
                      ⚠ {disc}
                    </div>
                  ))}
                </div>
              )}

              {/* OCR Extracted Text */}
              {analysisResult.extractedText && (
                <div className="p-3 rounded-lg bg-[#050706] border border-[#16281F] space-y-1">
                  <div className="flex items-center justify-between text-[10px] text-[#8B9992]">
                    <span className="font-bold uppercase">Extracted Text (OCR)</span>
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(analysisResult.extractedText || '');
                        showToast('COPIED', 'Extracted text copied to clipboard.', 'SUCCESS');
                      }}
                      className="hover:text-[#19F59A] flex items-center gap-1"
                    >
                      <Copy className="w-3 h-3" />
                      <span>Copy</span>
                    </button>
                  </div>
                  <pre className="text-[11px] text-[#8B9992] bg-black/40 p-2 rounded border border-[#16281F] max-h-36 overflow-y-auto whitespace-pre-wrap font-mono">
                    {analysisResult.extractedText}
                  </pre>
                </div>
              )}

              {/* Recommendations */}
              {analysisResult.recommendations.length > 0 && (
                <div className="space-y-1">
                  <div className="text-[10px] text-[#8B9992] uppercase font-bold">
                    Recommendations
                  </div>
                  <div className="space-y-1">
                    {analysisResult.recommendations.map((rec, i) => (
                      <div key={i} className="text-[11px] text-[#8B9992] flex items-start gap-1.5">
                        <Check className="w-3.5 h-3.5 text-[#19F59A] shrink-0 mt-0.5" />
                        <span>{rec}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Uncertainties (Truthfulness Guarantee) */}
              {analysisResult.uncertainties.length > 0 && (
                <div className="p-2.5 rounded-lg bg-[#050706] border border-[#16281F] text-[10px] text-[#8B9992] space-y-1">
                  <span className="text-[#8B9992] font-bold uppercase">
                    Visual Boundary & Uncertainties
                  </span>
                  {analysisResult.uncertainties.map((unc, i) => (
                    <div key={i}>• {unc}</div>
                  ))}
                </div>
              )}

              {/* VISION + AGENTIC BRAIN: PROPOSED ACTION PLAN */}
              {analysisResult.proposedAction && (
                <div className="p-4 rounded-xl bg-[#121C17] border border-[#00D084]/40 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Terminal className="w-4 h-4 text-[#19F59A]" />
                      <span className="text-xs font-bold text-[#19F59A] uppercase tracking-wider">
                        VISION-BASED ACTION DIRECTIVE
                      </span>
                    </div>
                    <span className="text-[9px] px-2 py-0.5 rounded bg-[#00D084]/20 text-[#19F59A] font-bold">
                      {analysisResult.proposedAction.riskLevel} RISK
                    </span>
                  </div>

                  <div className="space-y-1 text-xs">
                    <div className="font-bold text-[#F5F7F6]">
                      {analysisResult.proposedAction.title}
                    </div>
                    <p className="text-[11px] text-[#8B9992]">
                      {analysisResult.proposedAction.description}
                    </p>
                  </div>

                  {actionExecutedMessage ? (
                    <div className="p-2 rounded bg-[#00D084]/20 border border-[#00D084]/40 text-[#19F59A] text-[11px] font-bold flex items-center gap-2">
                      <CheckCircle className="w-4 h-4" />
                      <span>{actionExecutedMessage}</span>
                    </div>
                  ) : (
                    <div className="flex items-center justify-end gap-2 pt-1 border-t border-[#16281F]">
                      <button
                        onClick={() =>
                          setAnalysisResult({ ...analysisResult, proposedAction: undefined })
                        }
                        className="px-3 py-1.5 rounded-lg bg-[#050706] border border-[#16281F] text-[#8B9992] hover:text-[#F5F7F6] text-[10px]"
                      >
                        Dismiss
                      </button>
                      <button
                        onClick={() => handleApproveAction(analysisResult.proposedAction!)}
                        disabled={isExecutingAction}
                        className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-[#00D084] text-[#050706] font-bold text-xs hover:bg-[#19F59A] transition-all disabled:opacity-50 shadow-[0_0_10px_rgba(0,208,132,0.3)]"
                      >
                        {isExecutingAction ? (
                          <>
                            <RefreshCw className="w-3 h-3 animate-spin" />
                            <span>EXECUTING...</span>
                          </>
                        ) : (
                          <>
                            <Check className="w-3.5 h-3.5 stroke-[3]" />
                            <span>APPROVE & DISPATCH</span>
                          </>
                        )}
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Recent Visual Analyses (Phase 10 Vision History & Audit) */}
      <div className="p-5 rounded-2xl bg-[#0A100D] border border-[#16281F] space-y-4 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#16281F] pb-3">
          <div className="flex items-center gap-2">
            <Eye className="w-4 h-4 text-[#19F59A]" />
            <h2 className="text-xs font-bold text-[#F5F7F6] tracking-wider uppercase">
              RECENT VISUAL ANALYSES & TELEMETRY HISTORY
            </h2>
            <span className="text-[10px] text-[#8B9992]">({historySessions.length})</span>
          </div>

          <div className="relative w-full sm:w-64">
            <Search className="w-3.5 h-3.5 text-[#8B9992] absolute left-2.5 top-2.5" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search vision records..."
              className="w-full pl-8 pr-3 py-1.5 rounded-lg bg-[#050706] border border-[#16281F] text-xs text-[#F5F7F6] focus:border-[#00D084] outline-none"
            />
          </div>
        </div>

        {filteredHistory.length === 0 ? (
          <div className="p-8 text-center text-[#8B9992] text-xs">
            Zero visual analysis sessions recorded. Drag or capture an image above to log telemetry.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {filteredHistory.map((sess) => (
              <div
                key={sess.id}
                className="p-3 rounded-xl bg-[#050706] border border-[#16281F] hover:border-[#00D084]/40 transition-all flex flex-col justify-between space-y-2"
              >
                <div className="flex items-center justify-between text-[10px]">
                  <span className="px-2 py-0.5 rounded bg-[#121C17] border border-[#16281F] text-[#19F59A] font-bold">
                    {sess.analysis_type}
                  </span>
                  <span className="text-[#8B9992]">
                    {new Date(sess.created_at).toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                </div>

                <div className="flex items-center gap-2.5">
                  {sess.image_meta.thumbnailDataUrl ? (
                    <img
                      src={sess.image_meta.thumbnailDataUrl}
                      alt={sess.image_meta.filename}
                      className="w-12 h-12 rounded object-cover border border-[#16281F] shrink-0"
                    />
                  ) : (
                    <div className="w-12 h-12 rounded bg-[#0A100D] border border-[#16281F] flex items-center justify-center shrink-0">
                      <Eye className="w-5 h-5 text-[#8B9992]" />
                    </div>
                  )}

                  <div className="overflow-hidden space-y-0.5">
                    <div className="text-xs font-bold text-[#F5F7F6] truncate">
                      {sess.image_meta.filename}
                    </div>
                    <p className="text-[10px] text-[#8B9992] line-clamp-2">
                      {sess.result_summary}
                    </p>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-1 border-t border-[#16281F] text-[10px]">
                  <button
                    onClick={() => {
                      setSelectedMeta(sess.image_meta);
                      setSelectedMode(sess.analysis_type);
                      setAnalysisResult(sess.result);
                      setPreviewUrl(sess.image_meta.thumbnailDataUrl || null);
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                    }}
                    className="text-[#38E1FF] hover:underline"
                  >
                    Load into Inspector
                  </button>
                  <button
                    onClick={() => handleDeleteSession(sess.id, sess.image_meta.filename)}
                    className="text-[#8B9992] hover:text-[#FF3B30]"
                    title="Delete telemetry record"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
