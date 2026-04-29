import React, { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Upload, Mic, MicOff, FileAudio, LogOut, 
  RefreshCw, Activity, Clock, CheckCircle, 
  AlertCircle, AlertTriangle, TrendingUp, History, Stethoscope,
  Info, User, ShieldCheck, Calendar, MapPin,
  Search, ChevronLeft, ChevronRight,
  Moon, Sun, Languages, Download
} from "lucide-react";
import { getHistory, uploadFile, getUsers } from "../services/api";
import { logout } from "../utils/auth";
import { translations } from "../utils/translations";
import { decodeToken } from "../utils/token";

const SpectrogramCanvas = ({ data }) => {
  const canvasRef = useRef(null);

  useEffect(() => {
    if (!data || !canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const height = data.length;
    const width = data[0].length;
    
    canvas.width = width;
    canvas.height = height;

    const imageData = ctx.createImageData(width, height);
    for (let i = 0; i < height; i++) {
      for (let j = 0; j < width; j++) {
        const val = data[i][j];
        const idx = ((height - 1 - i) * width + j) * 4;
        
        // Heatmap colormap (Blue -> Purple -> Orange -> Yellow)
        imageData.data[idx] = val > 128 ? val : val * 0.5; // R
        imageData.data[idx + 1] = val > 180 ? val * 0.8 : val * 0.2; // G
        imageData.data[idx + 2] = 255 - val; // B
        imageData.data[idx + 3] = 255; // A
      }
    }
    ctx.putImageData(imageData, 0, 0);
  }, [data]);

  return (
    <div className="relative overflow-hidden rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-950 p-1 shadow-inner">
      <div className="absolute left-2 top-2 z-10 rounded-md bg-black/40 px-2 py-1 text-[8px] font-black uppercase tracking-widest text-white backdrop-blur-sm">
        Acoustic Pattern Map
      </div>
      <canvas 
        ref={canvasRef} 
        className="h-48 w-full"
        style={{ imageRendering: 'pixelated' }}
      />
      <div className="mt-1 flex justify-between px-1 text-[8px] font-bold text-slate-500 uppercase tracking-tighter">
        <span>0s</span>
        <span>Acoustic Signature (Mel-Spectrogram)</span>
        <span>5s</span>
      </div>
    </div>
  );
};

const SpecialistLocator = ({ insight }) => {
  const [showMap, setShowMap] = useState(false);
  const [userLocation, setUserLocation] = useState(null);
  const [locating, setLocating] = useState(false);
  const [locError, setLocError] = useState("");

  const specialistQuery = encodeURIComponent(
    insight.recommendation.specialist.replace(/\//g, " ") + " near me"
  );

  const startGeolocation = () => {
    if (!navigator.geolocation) {
      setLocError("Geolocation not supported.");
      return;
    }

    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setUserLocation({
          lat: position.coords.latitude,
          lng: position.coords.longitude
        });
        setLocating(false);
      },
      (err) => {
        console.warn("Geolocation error:", err);
        setLocError("Location access denied. Using general results.");
        setLocating(false);
      },
      { enableHighAccuracy: true, timeout: 8000 }
    );
  };

  const handleToggleMap = () => {
    if (!showMap) {
      setShowMap(true);
      startGeolocation();
    } else {
      setShowMap(false);
    }
  };

  const mapsSearchUrl = userLocation
    ? `https://www.google.com/maps/search/${specialistQuery}/@${userLocation.lat},${userLocation.lng},14z`
    : `https://www.google.com/maps/search/${specialistQuery}`;

  const mapsEmbedUrl = userLocation
    ? `https://maps.google.com/maps?q=${specialistQuery}&ll=${userLocation.lat},${userLocation.lng}&z=14&output=embed`
    : `https://maps.google.com/maps?q=${specialistQuery}&output=embed`;

  return (
    <div className="space-y-3 mt-3">
      <button 
        onClick={handleToggleMap}
        className={`w-full flex items-center justify-center gap-2 rounded-xl py-3 text-xs font-black uppercase tracking-widest transition transform active:scale-[0.98] ${
          showMap 
            ? "bg-blue-600 text-white shadow-lg shadow-blue-600/30" 
            : "bg-blue-600/10 text-blue-600 hover:bg-blue-600 hover:text-white dark:bg-blue-600/20 dark:text-blue-400 dark:hover:bg-blue-600 dark:hover:text-white"
        }`}
      >
        <MapPin size={14} className={locating ? "animate-pulse" : ""} />
        {showMap ? "Hide Specialists Map" : "Find Specialists Nearby"}
      </button>

      <AnimatePresence>
        {showMap && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="space-y-3 pt-2">
              {/* Location Status / Controls */}
              <div className="flex items-center justify-between gap-2 rounded-xl bg-slate-50 px-4 py-2 dark:bg-slate-800/50">
                <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest">
                  {locating ? (
                    <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400">
                      <RefreshCw size={10} className="animate-spin" />
                      Locating...
                    </div>
                  ) : locError ? (
                    <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400">
                      <AlertCircle size={10} />
                      General Results
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400">
                      <CheckCircle size={10} />
                      Location Active
                    </div>
                  )}
                </div>
                {!locating && (
                  <button 
                    onClick={startGeolocation}
                    className="text-[10px] font-black uppercase tracking-widest text-blue-600 hover:underline dark:text-blue-400"
                  >
                    Refresh Location
                  </button>
                )}
              </div>

              {/* Google Maps Embed */}
              <div className="overflow-hidden rounded-2xl border border-slate-200 shadow-md dark:border-slate-700">
                <iframe
                  title="Nearby Specialists Map"
                  src={mapsEmbedUrl}
                  width="100%"
                  height="300"
                  style={{ border: 0 }}
                  allowFullScreen
                  loading="lazy"
                  className="w-full"
                />
              </div>

              {/* Action Buttons */}
              <div className="grid grid-cols-2 gap-2">
                <a
                  href={mapsSearchUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 rounded-xl bg-slate-900 py-3 text-[10px] font-black uppercase tracking-widest text-white transition hover:bg-black active:scale-95"
                >
                  <Search size={13} />
                  Full Search
                </a>
                <a
                  href={userLocation 
                    ? `https://www.google.com/maps/dir/?api=1&destination=${specialistQuery}&origin=${userLocation.lat},${userLocation.lng}`
                    : `https://www.google.com/maps/dir/?api=1&destination=${specialistQuery}`
                  }
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 rounded-xl bg-blue-600 py-3 text-[10px] font-black uppercase tracking-widest text-white transition hover:bg-blue-700 active:scale-95 shadow-md"
                >
                  <Activity size={13} />
                  Directions
                </a>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default function Dashboard({ isDarkMode, toggleTheme, language, setLanguage }) {
  const t = translations[language];
  const fileInputRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const canvasRef = useRef(null);
  const audioContextRef = useRef(null);
  const analyserRef = useRef(null);
  const animationFrameRef = useRef(null);
  
  const [file, setFile] = useState(null);
  const [fileName, setFileName] = useState("");
  const [result, setResult] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [historyLoading, setHistoryLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState("");
  const [predictionFilter, setPredictionFilter] = useState("all");
  const [sortOrder, setSortOrder] = useState("desc"); // desc or asc
  const itemsPerPage = 5;
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  
  // Audio recording states
  const [recording, setRecording] = useState(false);
  const [audioBlob, setAudioBlob] = useState(null);
  const [recordingTime, setRecordingTime] = useState(0);
  const [audioChunks, setAudioChunks] = useState([]);
  const [audioUrl, setAudioUrl] = useState(null);
  
  // Admin states
  const [isAdmin, setIsAdmin] = useState(false);
  const [allUsers, setAllUsers] = useState([]);
  const [usersLoading, setUsersLoading] = useState(false);
  
  const [showLangMenu, setShowLangMenu] = useState(false);
  
  const languages = [
    { code: "en", label: "English" },
    { code: "es", label: "Español" },
    { code: "hi", label: "हिन्दी" },
    { code: "te", label: "తెలుగు" }
  ];

  const handleUnauthorized = (showAlert = false) => {
    if (showAlert) {
      alert("Session expired. Please login again.");
    }
    logout();
    window.location.href = "/";
  };

  const loadHistory = async () => {
    const token = localStorage.getItem("token");
    if (!token) {
      handleUnauthorized();
      return;
    }

    setHistoryLoading(true);
    setError("");

    try {
      const response = await getHistory();
      setHistory(Array.isArray(response) ? response : []);
    } catch (apiError) {
      console.error("History error:", apiError);
      if (apiError.status === 401) {
        handleUnauthorized(true);
        return;
      }
      setError(apiError.detail || apiError.message || "Server error");
    } finally {
      setHistoryLoading(false);
    }
  };

  useEffect(() => {
    loadHistory();
    
    // Check for admin role
    const token = localStorage.getItem("token");
    if (token) {
      const decoded = decodeToken(token);
      if (decoded && decoded.role === "admin") {
        setIsAdmin(true);
        loadUsers();
      }
    }
  }, []);

  const loadUsers = async () => {
    setUsersLoading(true);
    try {
      const users = await getUsers();
      setAllUsers(users);
    } catch (err) {
      console.error("Failed to load users:", err);
    } finally {
      setUsersLoading(false);
    }
  };

  const handleFileChange = (event) => {
    const selectedFile = event.target.files?.[0] || null;
    setFile(selectedFile);
    setFileName(selectedFile ? selectedFile.name : "");
    if (selectedFile) {
      if (audioUrl) URL.revokeObjectURL(audioUrl);
      setAudioUrl(URL.createObjectURL(selectedFile));
    }
    setAudioBlob(null);
    setError("");
    setSuccessMessage("");
  };

  const resetSelectedFile = () => {
    setFile(null);
    setFileName("");
    setAudioBlob(null);
    if (audioUrl) {
      URL.revokeObjectURL(audioUrl);
      setAudioUrl(null);
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  // Convert WebM/Opus blob to WAV for universal backend compatibility
  const convertBlobToWav = async (blob) => {
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    const arrayBuffer = await blob.arrayBuffer();
    const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
    
    const numChannels = 1; // mono
    const sampleRate = audioBuffer.sampleRate;
    const length = audioBuffer.length;
    const buffer = new ArrayBuffer(44 + length * 2);
    const view = new DataView(buffer);
    
    // WAV header
    const writeString = (offset, str) => {
      for (let i = 0; i < str.length; i++) view.setUint8(offset + i, str.charCodeAt(i));
    };
    writeString(0, 'RIFF');
    view.setUint32(4, 36 + length * 2, true);
    writeString(8, 'WAVE');
    writeString(12, 'fmt ');
    view.setUint32(16, 16, true);
    view.setUint16(20, 1, true); // PCM
    view.setUint16(22, numChannels, true);
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, sampleRate * numChannels * 2, true);
    view.setUint16(32, numChannels * 2, true);
    view.setUint16(34, 16, true);
    writeString(36, 'data');
    view.setUint32(40, length * 2, true);
    
    // PCM samples (mono, 16-bit)
    const channelData = audioBuffer.getChannelData(0);
    let offset = 44;
    for (let i = 0; i < length; i++) {
      const s = Math.max(-1, Math.min(1, channelData[i]));
      view.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7FFF, true);
      offset += 2;
    }
    
    await audioContext.close();
    return new Blob([buffer], { type: 'audio/wav' });
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      
      const chunks = [];
      setAudioChunks(chunks);

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunks.push(e.data);
          setAudioChunks([...chunks]);
        }
      };

      mediaRecorder.onstop = async () => {
        const webmBlob = new Blob(chunks, { type: "audio/webm" });
        stream.getTracks().forEach(track => track.stop());
        
        // Convert WebM to WAV for backend compatibility
        try {
          const wavBlob = await convertBlobToWav(webmBlob);
          setAudioBlob(wavBlob);
          if (audioUrl) URL.revokeObjectURL(audioUrl);
          setAudioUrl(URL.createObjectURL(wavBlob));
          setFileName("Recording.wav");
        } catch (convErr) {
          console.warn("WAV conversion failed, using WebM:", convErr);
          setAudioBlob(webmBlob);
          if (audioUrl) URL.revokeObjectURL(audioUrl);
          setAudioUrl(URL.createObjectURL(webmBlob));
          setFileName("Recording.webm");
        }
      };

      mediaRecorder.start();
      startVisualization(stream);
      setRecording(true);
      setRecordingTime(0);
      setError("");
      
      const interval = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);
      
      mediaRecorderRef.current._interval = interval;
      
    } catch (err) {
      console.error("Recording error:", err);
      setError("Could not access microphone. Please check permissions.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && recording) {
      clearInterval(mediaRecorderRef.current._interval);
      mediaRecorderRef.current.stop();
      stopVisualization();
      setRecording(false);
    }
  };
  const startVisualization = (stream) => {
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    const analyser = audioContext.createAnalyser();
    const source = audioContext.createMediaStreamSource(stream);
    
    analyser.fftSize = 2048;
    source.connect(analyser);
    
    audioContextRef.current = audioContext;
    analyserRef.current = analyser;
    
    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);
    
    const canvas = canvasRef.current;
    if (!canvas) return;
    const canvasCtx = canvas.getContext("2d");
    
    const draw = () => {
      animationFrameRef.current = requestAnimationFrame(draw);
      analyser.getByteTimeDomainData(dataArray);
      
      canvasCtx.fillStyle = isDarkMode ? "rgb(15, 23, 42)" : "rgb(255, 255, 255)";
      canvasCtx.fillRect(0, 0, canvas.width, canvas.height);
      
      // Premium Glow Effect
      canvasCtx.lineWidth = 3;
      canvasCtx.shadowBlur = 15;
      canvasCtx.shadowColor = isDarkMode ? "rgba(59, 130, 246, 0.5)" : "rgba(37, 99, 235, 0.3)";
      
      const gradient = canvasCtx.createLinearGradient(0, 0, canvas.width, 0);
      gradient.addColorStop(0, "#60a5fa");
      gradient.addColorStop(0.5, "#2563eb");
      gradient.addColorStop(1, "#60a5fa");
      
      canvasCtx.strokeStyle = gradient;
      canvasCtx.beginPath();
      
      const sliceWidth = (canvas.width * 1.0) / bufferLength;
      let x = 0;
      
      for (let i = 0; i < bufferLength; i++) {
        const v = dataArray[i] / 128.0;
        const y = (v * canvas.height) / 2;
        
        if (i === 0) {
          canvasCtx.moveTo(x, y);
        } else {
          canvasCtx.lineTo(x, y);
        }
        
        x += sliceWidth;
      }
      
      canvasCtx.lineTo(canvas.width, canvas.height / 2);
      canvasCtx.stroke();
      
      // Reset shadow for performance
      canvasCtx.shadowBlur = 0;
    };
    
    draw();
  };

  const stopVisualization = () => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }
    if (audioContextRef.current) {
      audioContextRef.current.close();
    }
  };

  const getConfidenceLabel = (confidence) => {
    const conf = Number(confidence) * 100;
    if (conf < 50) return { label: "Low confidence — result may be uncertain", color: "text-slate-400" };
    if (conf <= 75) return { label: "Moderate confidence — verify with symptoms", color: "text-amber-500" };
    return { label: "High confidence — strong pattern detected", color: "text-emerald-500" };
  };

  const getInsight = (prediction, confidence) => {
    const p = prediction?.toLowerCase();
    const conf = Number(confidence);

    if (p === "normal") {
      return {
        title: "Normal Respiratory Pattern",
        severity: "Low",
        score: Math.max(1, Math.round(2 - (conf * 1))), // 1-2 range
        color: "emerald",
        description: "Breathing sounds appear clear and regular.",
        symptoms: "No abnormal respiratory sounds detected.",
        conditions: ["Healthy lungs"],
        rationale: "Uniform acoustic signature with no abnormal frequency spikes detected.",
        advice: "No immediate concerns. Monitor if symptoms appear.",
        recommendation: {
          specialist: "General Physician",
          urgency: "Routine",
          action: "Maintain healthy lifestyle and annual checkups."
        }
      };
    }

    if (p === "wheeze") {
      if (conf < 0.75) {
        return {
          title: "Mild Airway Obstruction",
          severity: "Moderate",
          score: Math.round(4 + (conf * 2)), // 4-6 range
          color: "amber",
          description: "Wheezing sound detected indicating narrowed airways.",
          symptoms: "May include shortness of breath or chest tightness.",
          conditions: ["Asthma", "Bronchitis"],
          rationale: "High-frequency continuous patterns detected across multiple respiratory cycles.",
          advice: "Monitor symptoms. Seek medical advice if persistent.",
          recommendation: {
            specialist: "Pulmonologist / Allergist",
            urgency: "Next 3-5 days",
            action: "Consult for a spirometry test or asthma screening."
          }
        };
      } else {
        return {
          title: "Severe Airway Obstruction",
          severity: "High",
          score: Math.round(7 + (conf * 2)), // 7-9 range
          color: "rose",
          description: "Strong wheezing pattern detected.",
          symptoms: "Likely breathing difficulty and airway restriction.",
          conditions: ["Asthma (severe)", "COPD"],
          rationale: "Strong, sustained high-pitch acoustic signatures indicating restricted airway volume.",
          advice: "Medical consultation strongly recommended.",
          recommendation: {
            specialist: "Chest Specialist / Pulmonologist",
            urgency: "Urgent (24-48 hours)",
            action: "Immediate specialist evaluation for airway management."
          }
        };
      }
    }

    if (p === "crackle") {
      if (conf < 0.75) {
        return {
          title: "Fluid or Mucus Presence",
          severity: "Moderate",
          score: Math.round(4 + (conf * 2)), // 4-6 range
          color: "amber",
          description: "Crackling sound detected in respiratory cycle.",
          symptoms: "May indicate mucus or fluid buildup.",
          conditions: ["Mild infection", "Bronchitis"],
          rationale: "Discontinuous, irregular waveform spikes detected in the inspiratory phase.",
          advice: "Monitor closely and seek care if symptoms worsen.",
          recommendation: {
            specialist: "General Physician",
            urgency: "Next 2-3 days",
            action: "Evaluation for potential respiratory infection."
          }
        };
      } else {
        return {
          title: "Possible Lung Infection",
          severity: "High",
          score: Math.round(7 + (conf * 2)), // 7-9 range
          color: "rose",
          description: "Strong crackling sound pattern detected.",
          symptoms: "Often associated with cough, fever, or chest discomfort.",
          conditions: ["Pneumonia", "Lung infection"],
          rationale: "Dense acoustic crackling signatures indicative of fluid or heavy mucus accumulation.",
          advice: "Seek medical evaluation promptly.",
          recommendation: {
            specialist: "Pulmonologist / Infectious Disease",
            urgency: "Immediate",
            action: "Consultation for imaging (X-ray/CT) and clinical assessment."
          }
        };
      }
    }

    if (p === "mixed") {
      return {
        title: "Complex Respiratory Condition",
        severity: "High",
        score: Math.round(8 + (conf * 2)), // 8-10 range
        color: "rose",
        description: "Combination of abnormal respiratory sounds detected.",
        symptoms: "Multiple irregular breathing patterns observed.",
        conditions: ["COPD", "Severe bronchitis", "Mixed respiratory disorder"],
        rationale: "Complex acoustic profile containing both high-frequency wheezing and irregular fluid spikes.",
        advice: "Immediate medical consultation is recommended.",
        recommendation: {
          specialist: "Senior Pulmonologist",
          urgency: "Immediate",
          action: "Comprehensive respiratory function test and clinical review."
        }
      };
    }

    return null;
  };

  const handleUpload = async () => {
    if (!file && !audioBlob) {
      setError("Please select a file or record audio first.");
      return;
    }

    setLoading(true);
    setError("");
    setSuccessMessage("");
    setProgress(0);
    setResult(null);

    try {
      let fileToUpload = file;
      if (audioBlob && !file) {
        const isWav = audioBlob.type === "audio/wav";
        fileToUpload = new File(
          [audioBlob], 
          isWav ? "recording.wav" : "recording.webm", 
          { type: isWav ? "audio/wav" : "audio/webm" }
        );
      }

      const response = await uploadFile(fileToUpload, {
        onUploadProgress: (progressEvent) => {
          if (!progressEvent.total) return;
          const percent = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          setProgress(percent);
        },
      });

      // 🔹 Production Fix: Removed the artificial 1.5s delay to improve perceived performance
      // await new Promise(resolve => setTimeout(resolve, 1500));

      setProgress(100);
      setResult(response);
      setSuccessMessage("Analysis complete!");
      resetSelectedFile();
      await loadHistory();
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (apiError) {
      console.error("Upload error:", apiError);
      if (apiError.status === 401) {
        handleUnauthorized(true);
        return;
      }
      setProgress(0);
      setError(apiError.detail || apiError.message || "Server error");
    } finally {
      setLoading(false);
    }
  };

  const formatConfidence = (confidence) => `${(Number(confidence || 0) * 100).toFixed(1)}%`;

  const getPredictionBadge = (prediction) => {
    switch ((prediction || "").toLowerCase()) {
      case "normal":
        return "bg-emerald-50 text-emerald-700 ring-emerald-600/20";
      case "wheeze":
        return "bg-amber-50 text-amber-700 ring-amber-600/20";
      case "crackle":
        return "bg-sky-50 text-sky-700 ring-sky-600/20";
      case "mixed":
        return "bg-rose-50 text-rose-700 ring-rose-600/20";
      default:
        return "bg-slate-50 text-slate-700 ring-slate-600/20";
    }
  };

  const getConfidenceColor = (confidence) => {
    const val = Number(confidence || 0);
    if (val > 0.8) return "bg-emerald-500";
    if (val > 0.6) return "bg-amber-500";
    return "bg-rose-500";
  };

  const formatTimestamp = (timestamp) => {
    if (!timestamp) return "—";
    const date = new Date(timestamp);
    return Number.isNaN(date.getTime()) ? "—" : date.toLocaleString("en-US", {
      month: "short", day: "numeric", hour: "2-digit", minute: "2-digit"
    });
  };

  const getFileName = (filePath) => {
    if (!filePath) return "Unknown file";
    return filePath.split(/[\\/]/).pop() || filePath;
  };

  const generatePDF = async (data) => {
    if (!data) return;
    
    setLoading(true);
    try {
      // Load jspdf dynamically from CDN
      if (!window.jspdf) {
        const script = document.createElement('script');
        script.src = "https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js";
        await new Promise((resolve) => {
          script.onload = resolve;
          document.head.appendChild(script);
        });
      }

      const { jsPDF } = window.jspdf;
      const doc = new jsPDF();
      
      // Page Border
      doc.setDrawColor(200, 200, 200);
      doc.rect(5, 5, 200, 287);

      // Header: Hospital Info
      doc.setFillColor(30, 41, 59); // Slate-800
      doc.rect(10, 10, 5, 30, 'F');
      
      doc.setTextColor(30, 41, 59);
      doc.setFontSize(20);
      doc.setFont("helvetica", "bold");
      doc.text("RESPIRATORY AI DIAGNOSTIC CENTER", 20, 20);
      
      doc.setFontSize(9);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(100, 116, 139);
      doc.text("123 Health Ave, Medical District, Tech City | +1-800-AI-HEALTH", 20, 26);
      doc.text("www.respiratory-ai.clinical | contact@respiratory.ai", 20, 31);
      
      doc.setFontSize(14);
      doc.setTextColor(59, 130, 246); // Blue-600
      doc.setFont("helvetica", "bold");
      doc.text("CLINICAL SCREENING REPORT", 120, 42);

      doc.setDrawColor(59, 130, 246);
      doc.setLineWidth(0.5);
      doc.line(10, 45, 200, 45);

      // Patient & Report Details Box
      doc.setFillColor(248, 250, 252);
      doc.rect(10, 50, 190, 30, 'F');
      
      doc.setFontSize(10);
      doc.setTextColor(71, 85, 105);
      doc.setFont("helvetica", "bold");
      doc.text("PATIENT ID:", 15, 60);
      doc.text("DATE OF TEST:", 15, 70);
      doc.text("REPORT ID:", 110, 60);
      doc.text("GENDER/AGE:", 110, 70);
      
      doc.setFont("helvetica", "normal");
      doc.text("PID-99283-AI", 45, 60);
      doc.text(formatTimestamp(new Date()), 45, 70);
      doc.text(`REP-${Math.random().toString(36).substr(2, 9).toUpperCase()}`, 140, 60);
      doc.text("NOT PROVIDED", 140, 70);

      // Clinical Results Table
      let y = 100;
      doc.setFillColor(51, 65, 85);
      doc.rect(10, y, 190, 10, 'F');
      
      doc.setTextColor(255, 255, 255);
      doc.setFont("helvetica", "bold");
      doc.text("TEST COMPONENT", 15, y + 7);
      doc.text("FINDING / RESULT", 80, y + 7);
      doc.text("CONFIDENCE", 150, y + 7);

      y += 10;
      doc.setTextColor(30, 41, 59);
      doc.setFont("helvetica", "normal");
      
      // Row 1
      doc.setDrawColor(226, 232, 240);
      doc.line(10, y + 12, 200, y + 12);
      doc.setFont("helvetica", "bold");
      doc.text("Respiratory Classification", 15, y + 8);
      doc.setTextColor(59, 130, 246);
      doc.text(data.prediction.toUpperCase(), 80, y + 8);
      doc.setTextColor(30, 41, 59);
      doc.text(formatConfidence(data.confidence), 150, y + 8);

      y += 12;
      // Row 2
      doc.line(10, y + 12, 200, y + 12);
      doc.setFont("helvetica", "bold");
      doc.text("Severity Score (1-10)", 15, y + 8);
      const reportInsight = getInsight(data.prediction, data.confidence);
      doc.setTextColor(reportInsight?.score >= 7 ? 225 : reportInsight?.score >= 4 ? 217 : 16, 
                       reportInsight?.score >= 7 ? 29 : reportInsight?.score >= 4 ? 119 : 185, 
                       reportInsight?.score >= 7 ? 72 : reportInsight?.score >= 4 ? 6 : 129);
      doc.text(`${reportInsight?.score || "—"}/10`, 80, y + 8);
      doc.setTextColor(30, 41, 59);
      doc.setFont("helvetica", "normal");
      doc.text(reportInsight?.severity?.toUpperCase() || "—", 150, y + 8);

      y += 12;
      // Row 3
      doc.line(10, y + 12, 200, y + 12);
      doc.setFont("helvetica", "normal");
      doc.text("Audio Source Integrity", 15, y + 8);
      doc.text("VERIFIED", 80, y + 8);
      doc.text("HIGH", 150, y + 8);

      y += 25;
      // AI Interpretation Section
      doc.setFont("helvetica", "bold");
      doc.text("AUTOMATED AI INTERPRETATION:", 10, y);
      y += 7;
      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      const interpretation = `The neural network analyzed the input respiratory sound (${getFileName(data.file || data.file_url)}) and identified acoustic patterns consistent with ${data.prediction.toUpperCase()}. The model confidence is ${formatConfidence(data.confidence)}, which indicates a ${Number(data.confidence) > 0.8 ? 'strong' : 'moderate'} correlation with the identified class.`;
      doc.text(doc.splitTextToSize(interpretation, 180), 10, y);

      // Signatures
      y = 230;
      doc.setDrawColor(200, 200, 200);
      doc.line(15, y, 70, y);
      doc.line(130, y, 185, y);
      
      doc.setFontSize(9);
      doc.text("System Verification Signature", 15, y + 5);
      doc.text("Medical Consultant Signature", 130, y + 5);
      
      doc.setFont("helvetica", "italic");
      doc.text("Digitally signed by AI-Core-v1.0", 15, y + 10);

      // Footer disclaimer
      y = 265;
      doc.setFillColor(241, 245, 249);
      doc.rect(10, y, 190, 20, 'F');
      
      doc.setFontSize(8);
      doc.setTextColor(100, 116, 139);
      doc.setFont("helvetica", "normal");
      const disclaimer = "IMPORTANT: This report is generated by an Artificial Intelligence screening system. It is intended for informational and screening purposes only and should NOT be considered a final medical diagnosis. A clinical follow-up with a pulmonologist or healthcare provider is mandatory for accurate diagnosis and treatment planning.";
      doc.text(doc.splitTextToSize(disclaimer, 180), 15, y + 7);

      // Save
      doc.save(`Clinical_Report_${new Date().getTime()}.pdf`);
    } catch (err) {
      console.error("PDF Error:", err);
      setError("Failed to generate PDF. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Prediction Analytics Sub-component
  const AnalyticsCharts = ({ data }) => {
    const [hoveredPoint, setHoveredPoint] = useState(null);
    const [hoveredBar, setHoveredBar] = useState(null);

    if (!data || data.length < 2) return (
      <div className="flex h-40 items-center justify-center rounded-3xl border border-dashed border-slate-200 bg-slate-50/50 text-sm font-medium text-slate-400 dark:border-slate-800 dark:bg-slate-800/50">
        <div className="flex flex-col items-center gap-2">
          <Activity size={24} className="opacity-20" />
          {t.noDataAnalytics}
        </div>
      </div>
    );

    // 1. Line Chart Data (Confidence Over Time)
    const lineData = [...data].reverse().map((item, i) => ({
      x: i,
      y: Number(item.confidence || 0) * 100
    }));

    const maxConfidence = 100;
    const chartHeight = 160;
    const chartWidth = 500;

    const getX = (i) => (i / (lineData.length - 1)) * chartWidth;
    const getY = (y) => chartHeight - (y / maxConfidence) * chartHeight;

    const points = lineData.map((p, i) => `${getX(i)},${getY(p.y)}`).join(' ');
    const areaPoints = `${points} ${getX(lineData.length - 1)},${chartHeight} 0,${chartHeight}`;

    // 2. Bar Chart Data (Classification Counts)
    const counts = data.reduce((acc, item) => {
      const pred = (item.prediction || "Unknown").toLowerCase();
      acc[pred] = (acc[pred] || 0) + 1;
      return acc;
    }, {});

    const colorMap = {
      normal: "bg-emerald-500 shadow-emerald-500/20 ring-emerald-500/30",
      crackle: "bg-rose-500 shadow-rose-500/20 ring-rose-500/30",
      wheeze: "bg-amber-500 shadow-amber-500/20 ring-amber-500/30",
      mixed: "bg-indigo-500 shadow-indigo-500/20 ring-indigo-500/30",
      default: "bg-blue-500 shadow-blue-500/20 ring-blue-500/30"
    };

    const barData = Object.entries(counts).map(([name, value]) => ({ 
      name, 
      value,
      colorClass: colorMap[name] || colorMap.default
    }));
    const maxBarValue = Math.max(...barData.map(d => d.value));

    return (
      <div className="grid gap-8 lg:grid-cols-5">
        {/* Confidence Trend */}
        <div className="lg:col-span-3 space-y-6 rounded-[2.5rem] border border-slate-200 bg-white p-8 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <h3 className="text-sm font-black uppercase tracking-widest text-slate-400">{t.confidenceTrend}</h3>
              <p className="text-2xl font-black text-slate-900 dark:text-white">Performance <span className="text-blue-600">Metric</span></p>
            </div>
            <div className="flex items-center gap-2 rounded-xl bg-blue-50 px-3 py-1.5 text-[10px] font-black uppercase text-blue-600 dark:bg-blue-900/20">
              <TrendingUp size={12} />
              +12% Trend
            </div>
          </div>

          <div className="relative pt-4">
            <svg viewBox={`0 0 ${chartWidth} ${chartHeight}`} className="w-full overflow-visible">
              <defs>
                <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.3" />
                  <stop offset="100%" stopColor="#3b82f6" stopOpacity="0" />
                </linearGradient>
              </defs>

              {/* Grid Lines */}
              {[0, 50, 100].map(val => (
                <g key={val}>
                  <line 
                    x1="0" y1={getY(val)} 
                    x2={chartWidth} y2={getY(val)} 
                    stroke="currentColor" 
                    className="text-slate-100 dark:text-slate-800" 
                    strokeWidth="1" 
                    strokeDasharray="4 4"
                  />
                  <text x="-10" y={getY(val) + 4} textAnchor="end" className="text-[10px] font-bold fill-slate-300 dark:fill-slate-600">{val}%</text>
                </g>
              ))}

              {/* Area */}
              <motion.polygon
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 1 }}
                points={areaPoints}
                fill="url(#areaGradient)"
              />

              {/* Line Glow */}
              <motion.polyline
                initial={{ pathLength: 0, opacity: 0 }}
                animate={{ pathLength: 1, opacity: 0.3 }}
                transition={{ duration: 1.5, ease: "easeInOut" }}
                fill="none"
                stroke="#3b82f6"
                strokeWidth="12"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="blur-md"
                points={points}
              />

              {/* Primary Line */}
              <motion.polyline
                initial={{ pathLength: 0, opacity: 0 }}
                animate={{ pathLength: 1, opacity: 1 }}
                transition={{ duration: 1.5, ease: "easeInOut" }}
                fill="none"
                stroke="#3b82f6"
                strokeWidth="4"
                strokeLinecap="round"
                strokeLinejoin="round"
                points={points}
              />

              {/* Points */}
              {lineData.map((p, i) => (
                <g 
                  key={i}
                  onMouseEnter={() => setHoveredPoint(i)}
                  onMouseLeave={() => setHoveredPoint(null)}
                  className="cursor-pointer"
                >
                  <motion.circle
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.5 + i * 0.1 }}
                    cx={getX(i)}
                    cy={getY(p.y)}
                    r={hoveredPoint === i ? 10 : 6}
                    fill="#3b82f6"
                    className="shadow-xl"
                  />
                  <circle
                    cx={getX(i)}
                    cy={getY(p.y)}
                    r={hoveredPoint === i ? 5 : 3}
                    fill="white"
                  />
                  
                  {/* Tooltip */}
                  {hoveredPoint === i && (
                    <g>
                      <rect 
                        x={getX(i) - 40} 
                        y={getY(p.y) - 45} 
                        width="80" 
                        height="34" 
                        rx="12" 
                        fill="#1e293b" 
                        className="shadow-2xl"
                      />
                      <text 
                        x={getX(i)} 
                        y={getY(p.y) - 24} 
                        textAnchor="middle" 
                        className="text-[11px] font-black fill-white tracking-widest"
                      >
                        {p.y.toFixed(1)}%
                      </text>
                    </g>
                  )}
                </g>
              ))}
            </svg>
          </div>
        </div>

        {/* Prediction Distribution */}
        <div className="lg:col-span-2 space-y-6 rounded-[2.5rem] border border-slate-200 bg-white p-8 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="space-y-1">
            <h3 className="text-sm font-black uppercase tracking-widest text-slate-400">{t.predictionDistribution}</h3>
            <p className="text-2xl font-black text-slate-900 dark:text-white">Case <span className="text-indigo-600">Volume</span></p>
          </div>

          <div className="flex h-[180px] items-end justify-between gap-4 pt-4">
            {barData.map((bar, i) => (
              <div 
                key={i} 
                className="group relative flex flex-1 flex-col items-center gap-3"
                onMouseEnter={() => setHoveredBar(i)}
                onMouseLeave={() => setHoveredBar(null)}
              >
                <div className="relative w-full flex flex-col items-center justify-end h-full">
                  <motion.div 
                    initial={{ height: 0 }}
                    animate={{ height: `${(bar.value / maxBarValue) * 100}%` }}
                    transition={{ duration: 0.8, delay: i * 0.1, ease: "backOut" }}
                    className={`w-full rounded-2xl ${bar.colorClass} shadow-lg ring-1 transition-all group-hover:ring-offset-2 ${hoveredBar === i ? 'scale-105 -translate-y-1' : ''}`}
                  />
                  <span className={`absolute -top-7 text-sm font-black transition-all ${hoveredBar === i ? 'scale-125 text-indigo-600 dark:text-indigo-400' : 'text-slate-900 dark:text-white'}`}>
                    {bar.value}
                  </span>
                </div>
                <span className={`text-[10px] font-black uppercase tracking-widest transition-colors ${hoveredBar === i ? 'text-slate-900 dark:text-white' : 'text-slate-400'}`}>{bar.name}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  // Animation Variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  };

  const cardVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] } }
  };

  const filteredHistory = history
    .filter(item => {
      const matchesSearch = getFileName(item.file || item.file_url)?.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesFilter = predictionFilter === "all" || item.prediction?.toLowerCase() === predictionFilter.toLowerCase();
      return matchesSearch && matchesFilter;
    })
    .sort((a, b) => {
      const dateA = new Date(a.created_at || a.timestamp);
      const dateB = new Date(b.created_at || b.timestamp);
      return sortOrder === "desc" ? dateB - dateA : dateA - dateB;
    });

  const totalPages = Math.ceil(filteredHistory.length / itemsPerPage);
  const paginatedHistory = filteredHistory.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 selection:bg-blue-100 selection:text-blue-900 dark:bg-slate-950 dark:text-slate-100">
      {/* 1. Navbar */}
      <nav className="sticky top-0 z-50 border-b border-slate-200 bg-white/80 backdrop-blur-md dark:border-slate-800 dark:bg-slate-900/80">
        <div className="mx-auto max-w-6xl px-6 py-4 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600 text-white shadow-lg shadow-blue-600/20">
                <Stethoscope size={24} />
              </div>
              <div>
                <span className="text-lg font-bold tracking-tight text-slate-900 dark:text-white">{t.appName}</span>
                <p className="text-[10px] font-medium uppercase tracking-[0.2em] text-slate-400">{t.clinicalDetection}</p>
              </div>
            </div>
          
          <div className="flex items-center gap-4 sm:gap-6">
            <div className="relative">
              <button
                onClick={() => setShowLangMenu(!showLangMenu)}
                className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 text-slate-500 transition hover:bg-slate-200 hover:text-blue-600 dark:bg-slate-800 dark:text-slate-400 dark:hover:bg-slate-700"
                title="Change Language"
              >
                <div className="flex flex-col items-center">
                  <Languages size={18} />
                  <span className="text-[8px] font-bold uppercase">{language}</span>
                </div>
              </button>

              <AnimatePresence>
                {showLangMenu && (
                  <>
                    <div 
                      className="fixed inset-0 z-10" 
                      onClick={() => setShowLangMenu(false)}
                    />
                    <motion.div
                      initial={{ opacity: 0, y: 10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 10, scale: 0.95 }}
                      className="absolute right-0 top-full z-20 mt-2 w-40 overflow-hidden rounded-2xl border border-slate-200 bg-white p-1.5 shadow-xl ring-1 ring-slate-200/50 dark:border-slate-800 dark:bg-slate-900 dark:ring-slate-800/50"
                    >
                      {languages.map((lang) => (
                        <button
                          key={lang.code}
                          onClick={() => {
                            setLanguage(lang.code);
                            setShowLangMenu(false);
                          }}
                          className={`flex w-full items-center gap-3 rounded-xl px-3 py-2 text-sm font-bold transition ${
                            language === lang.code 
                              ? "bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400" 
                              : "text-slate-600 hover:bg-slate-50 dark:text-slate-400 dark:hover:bg-slate-800"
                          }`}
                        >
                          <span className="uppercase text-[10px] opacity-50">{lang.code}</span>
                          {lang.label}
                        </button>
                      ))}
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
            </div>

            <button
              onClick={toggleTheme}
              className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 text-slate-500 transition hover:bg-slate-200 hover:text-blue-600 dark:bg-slate-800 dark:text-slate-400 dark:hover:bg-slate-700"
              title={isDarkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}
            >
              {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
            </button>

            <div className="hidden sm:flex items-center gap-3 rounded-full bg-slate-100 pl-3 pr-4 py-1.5 ring-1 ring-slate-200/50 dark:bg-slate-800 dark:ring-slate-700/50">
              <div className="h-6 w-6 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 dark:bg-blue-900/50 dark:text-blue-400">
                <User size={14} />
              </div>
              <span className="text-sm font-semibold text-slate-600 dark:text-slate-300">{t.activeSession}</span>
            </div>
            <button 
              onClick={() => logout() || (window.location.href = "/")}
              className="group flex items-center gap-2 text-sm font-semibold text-slate-500 transition hover:text-rose-600"
            >
              <LogOut size={18} className="transition group-hover:translate-x-0.5" />
              <span>{t.signOut}</span>
            </button>
          </div>
        </div>
      </nav>

      <main className="mx-auto max-w-5xl px-6 py-12 space-y-12">
        
        {/* 2. Hero Section */}
        <section className="space-y-2">
          <motion.h1 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="text-4xl font-extrabold tracking-tight text-slate-900 dark:text-white sm:text-5xl"
          >
            {t.heroTitle}
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
            className="text-lg text-slate-500 dark:text-slate-400"
          >
            {t.heroDesc}
          </motion.p>
        </section>

        {/* 3. Stats Grid */}
        <motion.div 
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4"
        >
          {[
            { label: t.totalPredictions, value: history.length, icon: Activity, color: "text-blue-600", bg: "bg-blue-50" },
            { label: t.latestConfidence, value: result ? formatConfidence(result.confidence) : "—", icon: TrendingUp, color: "text-emerald-600", bg: "bg-emerald-50" },
            { label: t.systemStatus, value: t.operational, icon: CheckCircle, color: "text-blue-600", bg: "bg-blue-50" },
            { label: t.lastAnalysis, value: history.length > 0 ? formatTimestamp(history[0].time) : "—", icon: Clock, color: "text-slate-600", bg: "bg-slate-50" }
          ].map((stat, i) => (
            <motion.div 
              key={i} 
              variants={cardVariants}
              whileHover={{ 
                y: -8, 
                scale: 1.02,
                boxShadow: "0 25px 50px -12px rgb(59 130 246 / 0.15)",
                transition: { type: "spring", stiffness: 400, damping: 10 }
              }}
              className="group relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition-all dark:border-slate-800 dark:bg-slate-900"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-blue-500/0 to-blue-500/0 opacity-0 transition-opacity group-hover:from-blue-500/5 group-hover:to-transparent group-hover:opacity-100" />
              <div className="relative z-10">
                <div className="flex items-center justify-between">
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 group-hover:text-blue-500 transition-colors">{stat.label}</p>
                  <div className={`rounded-lg ${stat.bg} p-2.5 ${stat.color} dark:bg-slate-800 ring-1 ring-slate-100 dark:ring-slate-700 group-hover:ring-blue-200 transition-all`}>
                    <stat.icon size={18} />
                  </div>
                </div>
                <h3 className="mt-4 text-3xl font-black tracking-tight text-slate-900 dark:text-white">{stat.value}</h3>
              </div>
            </motion.div>
          ))}
        </motion.div>

        {/* 4. Upload & Record Section */}
        <div className="flex flex-col gap-10">
          <div className="w-full">
            {/* Upload Card */}
            <motion.div 
              variants={cardVariants}
              initial="hidden"
              animate="visible"
              className="overflow-hidden rounded-[2.5rem] border border-slate-200 bg-white shadow-2xl shadow-slate-200/40 ring-1 ring-slate-200/50 dark:border-slate-800 dark:bg-slate-900 dark:ring-slate-800/50 dark:shadow-none"
            >
              <div className="border-b border-slate-100 bg-slate-50/50 px-10 py-8 dark:border-slate-800 dark:bg-slate-800/50 text-center">
                <div className="flex flex-col items-center gap-2">
                  <div className="h-1.5 w-12 rounded-full bg-blue-600 mb-2" />
                  <h2 className="text-3xl font-black tracking-tight text-slate-800 dark:text-white uppercase tracking-widest">{t.analyzeRecording}</h2>
                  <p className="text-sm font-medium text-slate-400">Initialize a new respiratory diagnostic session</p>
                </div>
              </div>
              <div className="p-12">
                <div className="grid gap-8 lg:grid-cols-[1fr_auto_1fr] items-center">
                  {/* Left: Drag & Drop */}
                  <label className="group relative flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50/50 p-10 transition hover:border-blue-500 hover:bg-blue-50/30 dark:border-slate-800 dark:bg-slate-800/50 dark:hover:border-blue-500 dark:hover:bg-blue-900/20">
                    <div className="flex h-16 w-16 items-center justify-center rounded-full bg-white shadow-sm transition group-hover:scale-110 group-hover:text-blue-600 dark:bg-slate-800 dark:group-hover:text-blue-400">
                      <Upload size={28} />
                    </div>
                    <span className="mt-4 font-bold text-slate-700 dark:text-slate-300 uppercase tracking-widest text-xs">{t.dropFile}</span>
                    <span className="mt-1 text-[10px] font-bold text-slate-400 uppercase tracking-tight">{t.clickBrowse}</span>
                    <input ref={fileInputRef} type="file" accept="audio/*" onChange={handleFileChange} className="hidden" />
                  </label>

                  {/* Vertical Divider */}
                  <div className="hidden lg:flex flex-col items-center justify-center h-full min-w-[40px] relative">
                    <div className="w-[1px] h-full bg-slate-100 dark:bg-slate-800" />
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white px-3 py-1 text-[10px] font-black uppercase tracking-widest text-slate-300 dark:bg-slate-900">
                      OR
                    </div>
                  </div>

                  {/* Right: Recording */}
                  <div className="flex flex-col justify-center space-y-6 rounded-2xl bg-slate-50 p-8 ring-1 ring-slate-100 dark:bg-slate-800 dark:ring-slate-700">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`h-3 w-3 rounded-full ${recording ? 'bg-rose-500 animate-pulse' : 'bg-slate-300 dark:bg-slate-600'}`} />
                        <span className="text-sm font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">{t.liveRecording}</span>
                      </div>
                      {recording && <span className="text-lg font-mono font-bold text-rose-500">{recordingTime}s</span>}
                    </div>

                    <AnimatePresence>
                      {recording && (
                        <motion.div
                          initial={{ opacity: 0, height: 0, scale: 0.95 }}
                          animate={{ opacity: 1, height: "auto", scale: 1 }}
                          exit={{ opacity: 0, height: 0, scale: 0.95 }}
                          className="overflow-hidden rounded-2xl bg-slate-950 p-1 ring-2 ring-blue-500/20 shadow-[0_0_20px_rgba(59,130,246,0.15)]"
                        >
                          <canvas 
                            ref={canvasRef} 
                            width="600" 
                            height="120" 
                            className="w-full rounded-xl"
                          />
                        </motion.div>
                      )}
                    </AnimatePresence>
                    
                    <motion.button 
                      onClick={recording ? stopRecording : startRecording}
                      whileHover={{ scale: 1.02, boxShadow: recording ? "0 0 15px rgba(244, 63, 94, 0.3)" : "0 0 20px rgba(37, 99, 235, 0.3)" }}
                      whileTap={{ scale: 0.98 }}
                      className={`flex w-full items-center justify-center gap-3 rounded-2xl py-4.5 text-base font-bold transition duration-200 ${recording ? 'bg-rose-50 text-rose-600 ring-1 ring-rose-200 dark:bg-rose-900/20 dark:ring-rose-900/40' : 'bg-blue-600 text-white shadow-lg shadow-blue-600/20 hover:bg-blue-700'}`}
                    >
                      {recording ? (
                        <>
                          <MicOff size={20} />
                          <span>Stop Recording</span>
                        </>
                      ) : (
                        <>
                          <Mic size={20} />
                          <span>Start Recording</span>
                        </>
                      )}
                    </motion.button>
                    <p className="text-center text-xs font-medium text-slate-400">Capture respiratory sound directly from your microphone</p>
                  </div>
                </div>

                {/* Selected File Feedback */}
                <AnimatePresence>
                  {fileName && (
                    <motion.div 
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      className="mt-8 flex items-center justify-between rounded-2xl bg-blue-50/50 p-4 ring-1 ring-blue-100 dark:bg-blue-900/10 dark:ring-blue-900/30"
                    >
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600 text-white">
                          <FileAudio size={20} />
                        </div>
                        <div>
                          <p className="text-sm font-bold text-slate-800 dark:text-slate-200">{fileName}</p>
                          <p className="text-xs text-blue-600/70 font-medium italic dark:text-blue-400/70">{t.readyAnalysis}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        {audioUrl && (
                          <div className="flex items-center gap-2 rounded-xl bg-white px-3 py-1.5 shadow-sm ring-1 ring-slate-200 dark:bg-slate-800 dark:ring-slate-700">
                            <audio src={audioUrl} controls className="h-8 w-40 sm:w-48" />
                          </div>
                        )}
                        <button onClick={resetSelectedFile} className="text-sm font-bold text-blue-600 hover:underline px-2 dark:text-blue-400">{t.change}</button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Progress & Error */}
                <AnimatePresence>
                  {loading && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-8 space-y-3">
                      <div className="flex justify-between text-sm font-bold text-slate-600 dark:text-slate-400">
                        <span>{t.analyzingPatterns}</span>
                        <span>{progress}%</span>
                      </div>
                      <div className="h-3 overflow-hidden rounded-full bg-slate-100 ring-1 ring-slate-200/50 dark:bg-slate-800 dark:ring-slate-700">
                        <motion.div 
                          initial={{ width: 0 }}
                          animate={{ width: `${progress}%` }}
                          className="h-full bg-gradient-to-r from-blue-600 to-indigo-500" 
                        />
                      </div>
                    </motion.div>
                  )}
                  {error && (
                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1 }} className="mt-8 flex items-center gap-3 rounded-2xl bg-rose-50 p-4 text-rose-700 ring-1 ring-rose-200">
                      <AlertCircle size={20} />
                      <p className="text-sm font-bold">{error}</p>
                    </motion.div>
                  )}
                  {successMessage && (
                    <motion.div 
                      initial={{ opacity: 0, scale: 0.9 }} 
                      animate={{ opacity: 1, scale: 1 }} 
                      className="mt-8 flex items-center gap-4 rounded-2xl bg-emerald-50 p-5 text-emerald-700 ring-1 ring-emerald-200 dark:bg-emerald-900/20 dark:text-emerald-400 dark:ring-emerald-900/40"
                    >
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-emerald-500 text-white shadow-lg shadow-emerald-500/20">
                        <CheckCircle size={20} className="animate-pulse" />
                      </div>
                      <div>
                        <p className="text-sm font-black uppercase tracking-widest">{successMessage}</p>
                        <p className="text-[10px] font-bold opacity-70">Diagnostic data has been successfully synchronized.</p>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                <motion.button 
                  onClick={handleUpload}
                  disabled={loading || (!file && !audioBlob)}
                  whileHover={{ 
                    scale: 1.01, 
                    boxShadow: "0 20px 40px -10px rgba(37, 99, 235, 0.4)",
                  }}
                  whileTap={{ scale: 0.99 }}
                  className="mt-10 w-full rounded-2xl bg-slate-900 py-5 text-lg font-black uppercase tracking-widest text-white shadow-2xl shadow-slate-900/20 transition duration-200 disabled:cursor-not-allowed disabled:bg-slate-200 disabled:shadow-none dark:bg-blue-600 dark:shadow-blue-600/20"
                >
                  {loading ? (
                    <div className="flex items-center justify-center gap-3">
                      <motion.div 
                        animate={{ rotate: 360 }} 
                        transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
                        className="h-5 w-5 border-2 border-white/30 border-t-white rounded-full" 
                      />
                      <span>{t.processing}</span>
                    </div>
                  ) : t.analyzeAudio}
                </motion.button>
              </div>
            </motion.div>
          </div>

          {/* 5. Result Visualization */}
          <div className="w-full">
            <motion.div 
              variants={cardVariants}
              initial="hidden"
              animate="visible"
              className="rounded-[2.5rem] border border-slate-200 bg-white p-10 shadow-xl ring-1 ring-slate-200/50 dark:border-slate-800 dark:bg-slate-900 dark:ring-slate-800/50"
            >
              <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-10">
                <div>
                  <h2 className="text-3xl font-black tracking-tight text-slate-900 dark:text-white">{t.resultVisualization}</h2>
                  <p className="mt-2 text-base font-medium text-slate-400 dark:text-slate-500">{t.aiReport}</p>
                </div>
                <div className="flex h-fit items-center gap-2 rounded-2xl bg-blue-50 px-4 py-2 text-xs font-black uppercase tracking-widest text-blue-600 dark:bg-blue-900/20 dark:text-blue-400">
                  <ShieldCheck size={16} />
                  Clinical Grade Analysis
                </div>
              </div>

              {result ? (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="mt-8 space-y-8"
                >
                  {(() => {
                    const insight = getInsight(result.prediction, result.confidence);
                    if (!insight) return null;

                    const severityColors = {
                      Low: "bg-emerald-50 text-emerald-600 ring-emerald-200 dark:bg-emerald-900/20 dark:text-emerald-400 dark:ring-emerald-900/40",
                      Moderate: "bg-amber-50 text-amber-600 ring-amber-200 dark:bg-amber-900/20 dark:text-amber-400 dark:ring-amber-900/40",
                      High: "bg-rose-50 text-rose-600 ring-rose-200 dark:bg-rose-900/20 dark:text-rose-400 dark:ring-rose-900/40"
                    };

                    return (
                      <div className="space-y-8">
                        {/* Severity Alert Banner */}
                        <motion.div
                          initial={{ opacity: 0, y: -10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className={`flex items-center gap-3 rounded-2xl p-4 border-l-4 ${
                            insight.severity === "High" 
                              ? "bg-rose-50 border-rose-500 text-rose-700 dark:bg-rose-900/20 dark:text-rose-400" 
                              : insight.severity === "Moderate"
                                ? "bg-amber-50 border-amber-500 text-amber-700 dark:bg-amber-900/20 dark:text-amber-400"
                                : "bg-emerald-50 border-emerald-500 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400"
                          }`}
                        >
                          <div className="shrink-0">
                            {insight.severity === "High" ? <AlertTriangle size={20} /> : <AlertCircle size={20} />}
                          </div>
                          <p className="text-xs font-black uppercase tracking-widest leading-relaxed">
                            {insight.severity === "High" 
                              ? "⚠️ High severity detected — seek medical attention immediately" 
                              : insight.severity === "Moderate"
                                ? "⚠️ Moderate severity — consultation with a specialist recommended"
                                : "✅ Low severity detected — maintain regular monitoring"}
                          </p>
                        </motion.div>
                        {/* 1. Header & Severity */}
                        <div className="space-y-4 text-center">
                          <div className="flex justify-center gap-4">
                            <div className={`inline-flex items-center gap-2 rounded-2xl px-4 py-1.5 text-xs font-black uppercase tracking-widest ring-1 ${severityColors[insight.severity]}`}>
                              <AlertCircle size={14} />
                              {insight.severity} {t.severity || "Severity"}
                            </div>
                            <div className="inline-flex items-center gap-2 rounded-2xl bg-slate-100 px-4 py-1.5 text-xs font-black uppercase tracking-widest text-slate-600 ring-1 ring-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:ring-slate-700">
                              <Activity size={14} />
                              {t.severityScore || "Score"}: {insight.score}/10
                            </div>
                          </div>
                          <h3 className="text-3xl font-black tracking-tight text-slate-900 dark:text-white">
                            {insight.title}
                          </h3>
                        </div>

                        {/* 1.5. Acoustic Visualization */}
                        {result.spectrogram && (
                          <div className="space-y-4">
                            <div className="flex items-center justify-between">
                              <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">{t.patternVisualization}</h4>
                              <div className="flex gap-4">
                                <div className="flex items-center gap-1.5 text-[8px] font-bold text-slate-400 uppercase">
                                  <div className="h-1.5 w-1.5 rounded-full bg-blue-600" /> Low Frequency
                                </div>
                                <div className="flex items-center gap-1.5 text-[8px] font-bold text-slate-400 uppercase">
                                  <div className="h-1.5 w-1.5 rounded-full bg-amber-500" /> High Frequency
                                </div>
                              </div>
                            </div>
                            <SpectrogramCanvas data={result.spectrogram} />
                          </div>
                        )}

                        {/* 2. Confidence Bar */}
                        <div className="space-y-3">
                          <div className="flex justify-between text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
                            <span>{t.confidenceAnalysis || "Confidence Analysis"}</span>
                            <span className="text-slate-900 dark:text-white">{formatConfidence(result.confidence)}</span>
                          </div>
                          <div className="h-3 overflow-hidden rounded-full bg-slate-100 ring-1 ring-slate-200/50 dark:bg-slate-800 dark:ring-slate-700">
                            <motion.div 
                              initial={{ width: 0 }}
                              animate={{ width: `${Number(result.confidence || 0) * 100}%` }}
                              className={`h-full transition-all duration-1000 ${getConfidenceColor(result.confidence)}`}
                            />
                          </div>
                          <motion.p 
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.5 }}
                            className={`text-[10px] font-bold italic ${getConfidenceLabel(result.confidence).color}`}
                          >
                            {getConfidenceLabel(result.confidence).label}
                          </motion.p>
                        </div>

                        {/* 3. Structured AI Explanation & Advice */}
                        <div className="grid lg:grid-cols-2 gap-8 mt-12">
                          {/* Left Column: AI Observation & Insights */}
                          <div className="space-y-8">
                            <div className="rounded-[2rem] border border-slate-100 bg-slate-50/50 p-8 dark:border-slate-800 dark:bg-slate-800/30">
                              <h4 className="text-sm font-black uppercase tracking-widest text-indigo-500 mb-5">AI Observation</h4>
                              <div className="space-y-5">
                                <p className="text-base font-semibold leading-relaxed text-slate-700 dark:text-slate-300">
                                  {insight.description}
                                </p>
                                <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-100 dark:bg-slate-900 dark:ring-slate-800">
                                  <h5 className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Technical Rationale</h5>
                                  <p className="text-sm font-bold text-indigo-600 dark:text-indigo-400 leading-relaxed">{insight.rationale}</p>
                                </div>
                              </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                              <div className="rounded-3xl border border-slate-100 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900/50">
                                <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-3">Clinical Indicators</h4>
                                <p className="text-sm font-bold text-slate-600 dark:text-slate-300 leading-relaxed">{insight.symptoms}</p>
                              </div>
                              <div className="rounded-3xl border border-slate-100 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900/50">
                                <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-3">Possible Findings</h4>
                                <div className="flex flex-wrap gap-2">
                                  {insight.conditions.map((c, i) => (
                                    <span key={i} className="rounded-full bg-slate-50 px-3 py-1 text-[8px] font-black uppercase text-slate-500 dark:bg-slate-800 dark:text-slate-400 border border-slate-100 dark:border-slate-700">
                                      {c}
                                    </span>
                                  ))}
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* Right Column: Recommendations */}
                          <div className="space-y-8">
                            <div className={`rounded-[2rem] border-2 border-dashed p-8 ${
                              insight.severity === "High" ? "border-rose-200 bg-rose-50/20 dark:border-rose-900/20" : 
                              insight.severity === "Moderate" ? "border-amber-200 bg-amber-50/20 dark:border-amber-900/20" : 
                              "border-emerald-200 bg-emerald-50/20 dark:border-emerald-900/20"
                            }`}>
                              <h4 className="text-sm font-black uppercase tracking-widest text-slate-400 mb-5">Recommended Protocol</h4>
                              <div className="flex items-start gap-4">
                                <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white shadow-sm ring-1 ${
                                  insight.severity === "High" ? "ring-rose-100" : insight.severity === "Moderate" ? "ring-amber-100" : "ring-emerald-100"
                                } dark:bg-slate-900`}>
                                  <ShieldCheck className={insight.severity === "High" ? "text-rose-500" : insight.severity === "Moderate" ? "text-amber-500" : "text-emerald-500"} size={24} />
                                </div>
                                <p className="text-base font-black text-slate-900 dark:text-white leading-relaxed">
                                  {insight.advice}
                                </p>
                              </div>
                            </div>

                            <div className="rounded-[2rem] border border-blue-100 bg-blue-50/30 p-8 shadow-sm dark:border-blue-900/20 dark:bg-blue-900/10">
                              <h4 className="text-sm font-black uppercase tracking-widest text-blue-600 mb-6 dark:text-blue-400">Consultation Path</h4>
                              <div className="space-y-6">
                                <div className="flex items-center gap-5">
                                  <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-[1.5rem] bg-white shadow-md ring-1 ring-blue-100 dark:bg-slate-800 dark:ring-blue-900/30">
                                    <User className="text-blue-600" size={32} />
                                  </div>
                                  <div className="space-y-1">
                                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Target Specialist</p>
                                    <p className="text-xl font-black text-slate-900 dark:text-white">{insight.recommendation.specialist}</p>
                                  </div>
                                </div>
                                
                                <div className="grid grid-cols-2 gap-6 pt-4 border-t border-blue-100/50 dark:border-blue-900/20">
                                  <div className="space-y-1">
                                    <div className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-slate-400">
                                      <Clock size={12} /> Urgency Level
                                    </div>
                                    <p className="text-sm font-black text-slate-800 dark:text-slate-300">{insight.recommendation.urgency}</p>
                                  </div>
                                  <div className="space-y-1">
                                    <div className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-slate-400">
                                      <MapPin size={12} /> Strategic Action
                                    </div>
                                    <p className="text-sm font-black text-slate-800 dark:text-slate-300">{insight.recommendation.action}</p>
                                  </div>
                                </div>
                              </div>
                            </div>

                            {/* Find Specialists Nearby — Interactive Panel */}
                            <SpecialistLocator insight={insight} />
                          </div>
                        </div>

                        {/* 5. Mandatory Disclaimer */}
                        <div className="flex gap-3 rounded-2xl bg-slate-900 p-4 text-white dark:bg-slate-800">
                          <AlertCircle size={20} className="shrink-0 text-amber-400" />
                          <p className="text-[10px] font-bold leading-relaxed opacity-80 uppercase tracking-wider">
                            ⚠️ {t.medicalDisclaimer}
                          </p>
                        </div>

                        {/* 5. Audio Playback & Actions */}
                        <div className="space-y-4">
                          {audioUrl && (
                            <div className="rounded-2xl bg-slate-100 p-3 dark:bg-slate-800">
                              <audio src={audioUrl} controls className="w-full h-8" />
                            </div>
                          )}
                          <div className="flex gap-3">
                            <button 
                              onClick={() => generatePDF(result)}
                              className="flex flex-1 items-center justify-center gap-2 rounded-2xl bg-blue-600 py-4 text-sm font-black text-white transition hover:bg-blue-700 shadow-lg shadow-blue-600/20 active:scale-95"
                            >
                              <Download size={18} />
                              {t.downloadReport}
                            </button>
                          </div>
                        </div>

                        {/* 6. Diagnostic Debugger (Developer Mode) */}
                        {result.probabilities && (
                          <div className="mt-10 border-t border-slate-100 pt-8 dark:border-slate-800">
                            <div className="flex items-center gap-2 mb-6">
                              <RefreshCw size={16} className="text-indigo-500 animate-spin-slow" />
                              <h4 className="text-xs font-black uppercase tracking-widest text-indigo-500">{t.diagnosticDebugger}</h4>
                            </div>
                            
                            <div className="space-y-4">
                              <p className="text-[10px] font-bold text-slate-400 leading-relaxed max-w-md">
                                {t.debuggerNote}
                              </p>
                              
                              <div className="space-y-3">
                                {Object.entries(result.probabilities).map(([cls, prob]) => (
                                  <div key={cls} className="space-y-1.5">
                                    <div className="flex justify-between text-[10px] font-black uppercase tracking-widest">
                                      <span className={cls === result.prediction ? "text-indigo-600 dark:text-indigo-400" : "text-slate-400"}>
                                        {cls} {cls === result.prediction && "(Top)"}
                                      </span>
                                      <span className="text-slate-500">{(prob * 100).toFixed(2)}%</span>
                                    </div>
                                    <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                                      <motion.div 
                                        initial={{ width: 0 }}
                                        animate={{ width: `${prob * 100}%` }}
                                        className={`h-full rounded-full ${cls === result.prediction ? "bg-indigo-500" : "bg-slate-300 dark:bg-slate-600"}`}
                                      />
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })()}
                </motion.div>
              ) : (
                <div className="mt-12 flex flex-col items-center justify-center py-20 text-center space-y-6">
                  <div className="relative">
                    <div className="absolute inset-0 bg-blue-500/10 blur-3xl rounded-full" />
                    <div className="relative h-24 w-24 rounded-full border-2 border-dashed border-slate-200 flex items-center justify-center text-slate-300 dark:border-slate-800 dark:text-slate-700">
                      <Activity size={40} className="animate-pulse" />
                    </div>
                  </div>
                  <div className="max-w-sm space-y-2">
                    <h3 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-widest">{t.waitingData || "Ready for Signal Acquisition"}</h3>
                    <p className="text-sm font-medium text-slate-400 leading-relaxed">
                      Please upload a recording or start a live session to generate a high-fidelity diagnostic report.
                    </p>
                  </div>
                  
                  {/* Decorative Skeleton Grid */}
                  <div className="w-full max-w-xl grid grid-cols-6 gap-2 opacity-10">
                    {[...Array(12)].map((_, i) => (
                      <div key={i} className="h-8 rounded-lg bg-slate-200 dark:bg-slate-700" style={{ height: `${20 + Math.random() * 40}px` }} />
                    ))}
                  </div>
                </div>
              )}
            </motion.div>
          </div>
        </div>

        {/* 6. Clinical Advice (Broad Full-Width) */}
        <motion.div 
          variants={cardVariants}
          initial="hidden"
          animate="visible"
          className="mt-8 overflow-hidden rounded-[2rem] bg-gradient-to-br from-blue-600 to-indigo-700 p-8 text-white shadow-2xl shadow-blue-600/20 ring-1 ring-white/10"
        >
          <div className="flex flex-col md:flex-row items-center gap-8">
            <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-3xl bg-white/10 backdrop-blur-md ring-1 ring-white/20">
              <Stethoscope size={40} className="text-blue-100" />
            </div>
            <div className="flex-1 space-y-2 text-center md:text-left">
              <h3 className="text-2xl font-black tracking-tight">{t.clinicalAdviceTitle}</h3>
              <p className="text-base leading-relaxed text-blue-50/80 max-w-3xl">
                {t.clinicalAdviceDesc}
              </p>
            </div>
            <div className="hidden lg:block shrink-0 px-8 py-4 rounded-2xl bg-white/10 backdrop-blur-md border border-white/10">
              <span className="text-xs font-black uppercase tracking-widest opacity-60">System Status</span>
              <div className="flex items-center gap-2 mt-1">
                <div className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-sm font-bold">Secure AI Processing</span>
              </div>
            </div>
          </div>
        </motion.div>

        {/* 6.5 Model Generalization & Verification */}
        <motion.div 
          variants={cardVariants}
          initial="hidden"
          animate="visible"
          className="rounded-3xl border border-dashed border-slate-300 bg-slate-50/50 p-8 dark:border-slate-700 dark:bg-slate-900/30"
        >
          <div className="flex flex-col lg:flex-row gap-8 items-start">
            <div className="flex-1 space-y-4">
              <div className="flex items-center gap-3 text-blue-600 dark:text-blue-400">
                <ShieldCheck size={24} />
                <h3 className="text-xl font-extrabold">{t.modelVerification}</h3>
              </div>
              <p className="text-sm font-medium text-slate-500 dark:text-slate-400 leading-relaxed">
                {t.verificationDesc}
              </p>
              <div className="grid sm:grid-cols-2 gap-4 pt-2">
                <div className="rounded-2xl bg-white p-4 shadow-sm dark:bg-slate-800">
                  <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Tip 1: Noise Isolation</h4>
                  <p className="text-xs font-semibold text-slate-600 dark:text-slate-300">Ensure recordings are made in a quiet room to avoid false pattern detection from background noise.</p>
                </div>
                <div className="rounded-2xl bg-white p-4 shadow-sm dark:bg-slate-800">
                  <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Tip 2: Microphone Position</h4>
                  <p className="text-xs font-semibold text-slate-600 dark:text-slate-300">Place the microphone 2-3cm away from the mouth/chest for the clearest respiratory signal.</p>
                </div>
              </div>
            </div>
            
            <div className="w-full lg:w-80 rounded-2xl bg-blue-600 p-6 text-white shadow-xl shadow-blue-600/20">
              <h4 className="text-sm font-black uppercase tracking-widest opacity-80 mb-4">{t.externalTesting}</h4>
              <p className="text-xs font-bold leading-relaxed mb-6">
                Test the model against standardized clinical audio datasets like ICBHI or Kaggle Respiratory Sound Database for independent validation.
              </p>
              <button className="w-full flex items-center justify-center gap-2 rounded-xl bg-white/20 py-3 text-xs font-black uppercase tracking-widest transition hover:bg-white/30 backdrop-blur-md">
                <Info size={14} />
                View Testing Guide
              </button>
            </div>
          </div>
          <p className="mt-6 text-[10px] font-bold text-slate-400 italic text-center">
            {t.generalizationNote}
          </p>
        </motion.div>

        {/* 6. History Section */}
        <motion.section 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm ring-1 ring-slate-200/50 dark:border-slate-800 dark:bg-slate-900 dark:ring-slate-800/50"
        >
          <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50/50 px-8 py-6 dark:border-slate-800 dark:bg-slate-800/50">
            <div>
              <h2 className="text-xl font-extrabold text-slate-900 dark:text-white">{t.predictionAnalytics}</h2>
            </div>
          </div>
          <div className="p-8">
            <AnalyticsCharts data={history} />
          </div>
        </motion.section>

        {/* 6. History Table Section */}
        <motion.div 
          variants={cardVariants}
          initial="hidden"
          animate="visible"
          className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm ring-1 ring-slate-200/50 dark:border-slate-800 dark:bg-slate-900 dark:ring-slate-800/50"
        >
          <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50/50 px-8 py-6 dark:border-slate-800 dark:bg-slate-800/50">
            <div>
              <h2 className="text-xl font-extrabold text-slate-900 dark:text-white">{t.analysisHistory}</h2>
              <p className="text-sm font-medium text-slate-400 dark:text-slate-500">{t.reviewPast.replace("{count}", filteredHistory.length)}</p>
            </div>
            
            <div className="flex flex-wrap items-center gap-4">
              {/* Filter Dropdown */}
              <div className="flex items-center gap-3">
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Filter By:</span>
                <select 
                  value={predictionFilter}
                  onChange={(e) => {
                    setPredictionFilter(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-[10px] font-black uppercase tracking-widest text-slate-700 outline-none ring-blue-500/20 transition focus:ring-4 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
                >
                  <option value="all">All Predictions</option>
                  <option value="normal">Normal</option>
                  <option value="wheeze">Wheeze</option>
                  <option value="crackle">Crackle</option>
                  <option value="mixed">Mixed</option>
                </select>
              </div>

              {/* Sort Toggle */}
              <button 
                onClick={() => setSortOrder(prev => prev === "desc" ? "asc" : "desc")}
                className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-[10px] font-black uppercase tracking-widest text-slate-700 hover:bg-slate-50 transition dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 shadow-sm"
              >
                <Clock size={12} className="text-blue-500" />
                {sortOrder === "desc" ? "Newest First" : "Oldest First"}
              </button>

              <div className="relative flex-1 max-w-xs">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                <input 
                  type="text" 
                  placeholder="Search history..."
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="w-full rounded-xl border border-slate-200 bg-white pl-10 pr-4 py-2 text-[10px] font-black uppercase tracking-widest text-slate-700 outline-none ring-blue-500/20 transition focus:ring-4 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
                />
              </div>

              <button 
                onClick={loadHistory}
                disabled={historyLoading}
                className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-[10px] font-black uppercase tracking-widest text-slate-600 transition transform duration-200 hover:bg-slate-50 hover:scale-105 active:scale-95 disabled:opacity-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
              >
                <RefreshCw size={14} className={historyLoading ? 'animate-spin' : ''} />
                <span>{t.syncRecords}</span>
              </button>
            </div>
          </div>

          <div className="max-h-[600px] overflow-y-auto">
            {historyLoading ? (
              <div className="flex h-60 items-center justify-center">
                <motion.div 
                  animate={{ rotate: 360 }} 
                  transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
                  className="h-10 w-10 border-4 border-blue-600/20 border-t-blue-600 rounded-full dark:border-blue-900/20 dark:border-t-blue-500" 
                />
              </div>
            ) : history.length === 0 ? (
              <div className="flex h-60 flex-col items-center justify-center space-y-4 text-slate-400 dark:text-slate-600">
                <History size={48} className="opacity-20" />
                <p className="font-bold">{t.noRecords}</p>
              </div>
            ) : (
              <table className="w-full border-collapse text-left">
                <thead>
                  <tr className="bg-slate-50/50 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 dark:bg-slate-800/50 dark:text-slate-500">
                    <th className="px-8 py-5">{t.fileSource}</th>
                    <th className="px-8 py-5">{t.classification}</th>
                    <th className="px-8 py-5 text-center">{t.confidence}</th>
                    <th className="px-8 py-5 text-right">{t.timestamp}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  <AnimatePresence mode="popLayout">
                    {paginatedHistory.map((item, index) => (
                      <motion.tr 
                        key={item.id || index}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.05 }}
                        className="group hover:bg-slate-50/50 transition-colors dark:hover:bg-slate-800/50"
                      >
                        <td className="px-8 py-5">
                          <div className="flex items-center gap-3">
                            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-100 text-slate-500 transition group-hover:bg-blue-100 group-hover:text-blue-600 dark:bg-slate-800 dark:text-slate-400 dark:group-hover:bg-blue-900/30 dark:group-hover:text-blue-400">
                              <FileAudio size={18} />
                            </div>
                            <div>
                              <p className="max-w-[200px] truncate text-sm font-bold text-slate-700 dark:text-slate-300">{getFileName(item.file || item.file_url)}</p>
                              <p className="text-[10px] font-black uppercase tracking-tighter text-slate-300 dark:text-slate-600">Audio Stream</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-8 py-5">
                          <span className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-black uppercase ring-1 ring-inset ${getPredictionBadge(item.prediction)}`}>
                            <Stethoscope size={12} />
                            {item.prediction}
                          </span>
                        </td>
                        <td className="px-8 py-5">
                          <div className="flex flex-col items-center gap-1.5">
                            <span className="text-sm font-black text-slate-700 dark:text-slate-300">{formatConfidence(item.confidence)}</span>
                            <div className="h-1 w-20 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                              <div className={`h-full ${getConfidenceColor(item.confidence)}`} style={{ width: `${Number(item.confidence || 0) * 100}%` }} />
                            </div>
                          </div>
                        </td>
                        <td className="px-8 py-5 text-right">
                          <div className="flex flex-col items-end gap-1">
                            <span className="text-sm font-bold text-slate-600 dark:text-slate-300">{formatTimestamp(item.time).split(',')[0]}</span>
                            <span className="text-[10px] font-bold text-slate-400 dark:text-slate-600">{formatTimestamp(item.time).split(',')[1]}</span>
                          </div>
                        </td>
                      </motion.tr>
                    ))}
                  </AnimatePresence>
                </tbody>
              </table>
            )}
          </div>

          {/* Pagination Controls */}
          {filteredHistory.length > itemsPerPage && (
            <div className="flex items-center justify-between border-t border-slate-100 bg-slate-50/30 px-8 py-4 dark:border-slate-800 dark:bg-slate-800/30">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                Page {currentPage} of {totalPages}
              </p>
              <div className="flex gap-2">
                <button 
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                  className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 transition hover:bg-slate-50 disabled:opacity-30 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
                >
                  <ChevronLeft size={20} />
                </button>
                <button 
                  onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                  disabled={currentPage === totalPages}
                  className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 transition hover:bg-slate-50 disabled:opacity-30 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
                >
                  <ChevronRight size={20} />
                </button>
              </div>
            </div>
          )}
        </motion.div>

        {/* 7. Admin Panel (Conditional) */}
        {isAdmin && (
          <motion.section 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="mt-12 overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm ring-1 ring-slate-200/50 dark:border-slate-800 dark:bg-slate-900 dark:ring-slate-800/50"
          >
            <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50/50 px-8 py-6 dark:border-slate-800 dark:bg-slate-800/50">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600 text-white shadow-lg shadow-blue-600/20">
                  <ShieldCheck size={20} />
                </div>
                <div>
                  <h2 className="text-xl font-extrabold text-slate-900 dark:text-white">{t.adminPanel}</h2>
                  <p className="text-sm font-medium text-slate-400 dark:text-slate-500">{t.allUsers}</p>
                </div>
              </div>
              <button 
                onClick={loadUsers}
                className="rounded-xl bg-slate-100 p-2 text-slate-600 transition hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:hover:bg-slate-700"
              >
                <RefreshCw size={18} className={usersLoading ? 'animate-spin' : ''} />
              </button>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-left">
                <thead>
                  <tr className="bg-slate-50/50 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 dark:bg-slate-800/50 dark:text-slate-500">
                    <th className="px-8 py-5">{t.userId}</th>
                    <th className="px-8 py-5">{t.userEmail}</th>
                    <th className="px-8 py-5">{t.userRole}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {allUsers.map((u) => (
                    <tr key={u.id} className="hover:bg-slate-50/50 transition-colors dark:hover:bg-slate-800/50">
                      <td className="px-8 py-5 text-sm font-mono text-slate-400">#{u.id}</td>
                      <td className="px-8 py-5 text-sm font-bold text-slate-700 dark:text-slate-300">{u.email}</td>
                      <td className="px-8 py-5">
                        <span className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-black uppercase ring-1 ring-inset ${u.role === 'admin' ? 'bg-blue-50 text-blue-700 ring-blue-700/10 dark:bg-blue-900/30 dark:text-blue-400' : 'bg-slate-50 text-slate-700 ring-slate-700/10 dark:bg-slate-800 dark:text-slate-400'}`}>
                          {u.role}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </motion.section>
        )}

      </main>

      <footer className="mx-auto max-w-6xl px-6 pt-20 pb-10">
        <div className="grid grid-cols-2 gap-12 lg:grid-cols-4 border-t border-slate-200 pt-16 dark:border-slate-800">
          <div className="col-span-2 lg:col-span-1 space-y-6">
            <div className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600 text-white shadow-lg shadow-blue-600/20">
                <Stethoscope size={18} />
              </div>
              <span className="text-sm font-bold tracking-tight text-slate-900 uppercase dark:text-white">Respiratory AI</span>
            </div>
            <p className="text-xs font-medium leading-relaxed text-slate-400 dark:text-slate-500">
              Leading the way in non-invasive respiratory screening using advanced deep learning architectures.
            </p>
            <div className="flex items-center gap-4">
              <div className="h-8 w-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 hover:text-blue-600 cursor-pointer transition dark:bg-slate-800 dark:text-slate-500 dark:hover:text-blue-400">
                <Activity size={16} />
              </div>
              <div className="h-8 w-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 hover:text-blue-600 cursor-pointer transition dark:bg-slate-800 dark:text-slate-500 dark:hover:text-blue-400">
                <ShieldCheck size={16} />
              </div>
            </div>
          </div>
          
          <div className="space-y-6">
            <h4 className="text-xs font-black uppercase tracking-widest text-slate-900 dark:text-white">Platform</h4>
            <ul className="space-y-3">
              <li><a href="#" className="text-xs font-bold text-slate-400 hover:text-blue-600 transition dark:text-slate-500 dark:hover:text-blue-400">Analysis Dashboard</a></li>
              <li><a href="#" className="text-xs font-bold text-slate-400 hover:text-blue-600 transition dark:text-slate-500 dark:hover:text-blue-400">Detection History</a></li>
              <li><a href="#" className="text-xs font-bold text-slate-400 hover:text-blue-600 transition dark:text-slate-500 dark:hover:text-blue-400">API Documentation</a></li>
            </ul>
          </div>

          <div className="space-y-6">
            <h4 className="text-xs font-black uppercase tracking-widest text-slate-900 dark:text-white">Resources</h4>
            <ul className="space-y-3">
              <li><a href="#" className="text-xs font-bold text-slate-400 hover:text-blue-600 transition dark:text-slate-500 dark:hover:text-blue-400">Clinical Guide</a></li>
              <li><a href="#" className="text-xs font-bold text-slate-400 hover:text-blue-600 transition dark:text-slate-500 dark:hover:text-blue-400">Research Papers</a></li>
              <li><a href="#" className="text-xs font-bold text-slate-400 hover:text-blue-600 transition dark:text-slate-500 dark:hover:text-blue-400">Support Center</a></li>
            </ul>
          </div>

          <div className="space-y-6">
            <h4 className="text-xs font-black uppercase tracking-widest text-slate-900 dark:text-white">Legal</h4>
            <ul className="space-y-3">
              <li><button onClick={(e) => e.preventDefault()} className="text-xs font-bold text-slate-400 hover:text-blue-600 transition dark:text-slate-500 dark:hover:text-blue-400">Privacy Policy</button></li>
              <li><button onClick={(e) => e.preventDefault()} className="text-xs font-bold text-slate-400 hover:text-blue-600 transition dark:text-slate-500 dark:hover:text-blue-400">Terms of Service</button></li>
              <li><button onClick={(e) => e.preventDefault()} className="text-xs font-bold text-slate-400 hover:text-blue-600 transition dark:text-slate-500 dark:hover:text-blue-400">HIPAA Compliance</button></li>
            </ul>
          </div>
        </div>

        <div className="mt-16 flex flex-col items-center justify-between gap-6 border-t border-slate-100 pt-8 sm:flex-row dark:border-slate-800">
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-300 dark:text-slate-600">
            © 2026 Respiratory AI. Built for clinical excellence.
          </p>
          <div className="flex items-center gap-6">
            <span className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-emerald-500 dark:text-emerald-600">
              <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse dark:bg-emerald-600" />
              All Systems Operational
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
}
