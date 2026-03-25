"use client";

import React, { useState, useRef, ChangeEvent, useEffect } from "react";
import {
  Send,
  Paperclip,
  X,
  FileText,
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  Square,
  Plus,
  Image as ImageIcon,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

// @ts-ignore
import * as pdfjsLib from "pdfjs-dist/legacy/build/pdf";

if (typeof window !== "undefined") {
  pdfjsLib.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjsLib.version}/legacy/build/pdf.worker.min.mjs`;
}

interface ChatInputProps {
  value: string;
  onChange: (value: string) => void;
  onSubmit: (content?: string, attachments?: any[]) => void;
  disabled?: boolean;
}

export default function ChatInput({
  value,
  onChange,
  onSubmit,
  disabled,
}: ChatInputProps) {
  const [attachments, setAttachments] = useState<any[]>([]);
  const [isListening, setIsListening] = useState(false);
  const [isExtracting, setIsExtracting] = useState(false);
  const [showMenu, setShowMenu] = useState(false);

  const [isVoiceInput, setIsVoiceInput] = useState(true);
  const [isAudioOutput, setIsAudioOutput] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // --- MAINTAIN ORIGINAL LOGIC: Effects for Storage & Speech ---
  useEffect(() => {
    const savedVoiceInput = localStorage.getItem("purple-voice-input");
    const savedAudioOutput = localStorage.getItem("purple-audio-output");
    if (savedVoiceInput !== null) setIsVoiceInput(JSON.parse(savedVoiceInput));
    if (savedAudioOutput !== null)
      setIsAudioOutput(JSON.parse(savedAudioOutput));

    if (typeof window !== "undefined" && window.speechSynthesis) {
      const checkSpeech = setInterval(() => {
        setIsSpeaking(window.speechSynthesis.speaking);
      }, 400);
      return () => clearInterval(checkSpeech);
    }
  }, []);

  useEffect(() => {
    localStorage.setItem("purple-voice-input", JSON.stringify(isVoiceInput));
  }, [isVoiceInput]);
  useEffect(() => {
    localStorage.setItem("purple-audio-output", JSON.stringify(isAudioOutput));
  }, [isAudioOutput]);

  // Auto-resize textarea for mobile ergonomics
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "inherit";
      const scrollHeight = textareaRef.current.scrollHeight;
      textareaRef.current.style.height = `${Math.min(scrollHeight, 120)}px`;
    }
  }, [value]);

  const stopSpeaking = () => {
    window.speechSynthesis.cancel();
    setIsSpeaking(false);
  };

  const extractTextFromPDF = async (file: File) => {
    const arrayBuffer = await file.arrayBuffer();
    const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
    const pdf = await loadingTask.promise;
    let fullText = "";
    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const textContent = await page.getTextContent();
      fullText +=
        textContent.items.map((item: any) => item.str).join(" ") + "\n";
    }
    return fullText;
  };

  const handleFileChange = async (
    e: ChangeEvent<HTMLInputElement>,
    type: "file" | "image",
  ) => {
    const files = e.target.files;
    if (!files) return;
    setIsExtracting(true);
    setShowMenu(false);
    const newAttachments = [];

    for (const file of Array.from(files)) {
      try {
        if (type === "image") {
          const reader = new FileReader();
          const base64 = await new Promise((resolve) => {
            reader.onload = () => resolve(reader.result);
            reader.readAsDataURL(file);
          });
          newAttachments.push({
            name: file.name,
            type: file.type,
            preview: base64,
            isImage: true,
            data: base64,
          });
        } else {
          let text =
            file.type === "application/pdf"
              ? await extractTextFromPDF(file)
              : await file.text();
          newAttachments.push({
            name: file.name,
            type: file.type,
            size: (file.size / 1024).toFixed(1) + " KB",
            extractedText: text,
            isImage: false,
          });
        }
      } catch (err) {
        toast.error(`Error reading ${file.name}`);
      }
    }
    setAttachments((prev) => [...prev, ...newAttachments]);
    setIsExtracting(false);
  };

  const startListening = () => {
    if (!isVoiceInput) return;
    const SpeechRecognition =
      (window as any).SpeechRecognition ||
      (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition)
      return toast.error("Browser doesn't support Voice AI");
    const recognition = new SpeechRecognition();
    recognition.onstart = () => setIsListening(true);
    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      onChange(transcript);
      onSubmit(transcript, attachments);
      setAttachments([]);
    };
    recognition.onend = () => setIsListening(false);
    recognition.start();
  };

  const handleSubmit = () => {
    if (!value.trim() && attachments.length === 0) return;
    onSubmit(value, attachments);
    setAttachments([]);
    onChange("");
  };

  return (
    <div className="p-2 md:p-4 bg-transparent relative z-20 max-w-4xl mx-auto w-full pb-[max(1rem,env(safe-area-inset-bottom))]">
      {/* 1. ADAPTIVE CONTROL BAR */}
      <div className="flex flex-wrap justify-end gap-1.5 md:gap-2 mb-2 md:mb-3 px-1">
        <AnimatePresence>
          {isSpeaking && (
            <motion.button
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={stopSpeaking}
              className="flex items-center gap-2 px-2.5 py-1.5 rounded-full text-[9px] md:text-[10px] font-bold bg-red-500 text-white shadow-lg shadow-red-500/20"
            >
              <Square size={10} fill="currentColor" /> Stop
            </motion.button>
          )}
        </AnimatePresence>
        <button
          onClick={() => setIsAudioOutput(!isAudioOutput)}
          className={cn(
            "flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-[9px] md:text-[10px] font-bold uppercase tracking-wider transition-all border",
            isAudioOutput
              ? "bg-emerald-600/10 border-emerald-500/50 text-emerald-600"
              : "bg-slate-100 dark:bg-white/5 border-slate-200 dark:border-white/10 text-slate-500",
          )}
        >
          {isAudioOutput ? <Volume2 size={10} /> : <VolumeX size={10} />}
          <span className="hidden xs:inline">
            {isAudioOutput ? "Audio On" : "Silent"}
          </span>
        </button>
        <button
          onClick={() => setIsVoiceInput(!isVoiceInput)}
          className={cn(
            "flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-[9px] md:text-[10px] font-bold uppercase tracking-wider transition-all border",
            isVoiceInput
              ? "bg-violet-600/10 border-violet-500/50 text-violet-600"
              : "bg-slate-100 dark:bg-white/5 border-slate-200 dark:border-white/10 text-slate-500",
          )}
        >
          {isVoiceInput ? <Mic size={10} /> : <MicOff size={10} />}
          <span className="hidden xs:inline">
            {isVoiceInput ? "Voice AI" : "Text"}
          </span>
        </button>
      </div>

      {/* 2. INPUT BOX */}
      <div className="relative flex flex-col gap-1 p-1.5 md:p-2 rounded-[24px] md:rounded-[28px] border border-slate-200 dark:border-white/10 bg-white/90 dark:bg-slate-900/90 backdrop-blur-2xl shadow-xl transition-all focus-within:border-violet-500/50">
        {/* PREVIEWS */}
        <AnimatePresence>
          {attachments.length > 0 && (
            <div className="flex flex-wrap gap-1.5 p-1.5 max-h-[120px] overflow-y-auto">
              {attachments.map((file, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="relative group flex items-center gap-2 px-2.5 py-1.5 bg-slate-100 dark:bg-white/5 rounded-xl border border-slate-200 dark:border-white/10"
                >
                  {file.isImage ? (
                    <img
                      src={file.preview}
                      className="h-5 w-5 rounded object-cover"
                    />
                  ) : (
                    <FileText size={12} className="text-emerald-500" />
                  )}
                  <span className="text-[11px] font-medium truncate max-w-[80px] dark:text-slate-300">
                    {file.name}
                  </span>
                  <button
                    onClick={() =>
                      setAttachments((p) => p.filter((_, idx) => idx !== i))
                    }
                    className="p-0.5 hover:text-red-500"
                  >
                    <X size={12} />
                  </button>
                </motion.div>
              ))}
            </div>
          )}
        </AnimatePresence>

        <div className="flex items-end gap-1 md:gap-2">
          {/* THE NEW PLUS MENU BUTTON */}
          <div className="relative pb-1">
            <button
              onClick={() => setShowMenu(!showMenu)}
              className={cn(
                "p-2.5 md:p-3 rounded-xl transition-all",
                showMenu
                  ? "bg-violet-600 text-white rotate-45 shadow-lg"
                  : "text-slate-500 hover:bg-slate-100 dark:hover:bg-white/5",
              )}
            >
              <Plus size={20} />
            </button>
            {showMenu && (
              <div className="absolute bottom-full left-0 mb-3 w-40 md:w-44 bg-white dark:bg-slate-800 rounded-2xl shadow-2xl border border-slate-200 dark:border-white/10 overflow-hidden z-50">
                <button
                  onClick={() => {
                    imageInputRef.current?.click();
                    setShowMenu(false);
                  }}
                  className="w-full flex items-center gap-3 px-4 py-3 text-sm hover:bg-slate-50 dark:hover:bg-white/5 text-slate-700 dark:text-slate-200"
                >
                  <ImageIcon size={16} className="text-blue-500" /> Image
                </button>
                <button
                  onClick={() => {
                    fileInputRef.current?.click();
                    setShowMenu(false);
                  }}
                  className="w-full flex items-center gap-3 px-4 py-3 text-sm hover:bg-slate-50 dark:hover:bg-white/5 border-t border-slate-100 dark:border-white/5 text-slate-700 dark:text-slate-200"
                >
                  <Paperclip size={16} className="text-emerald-500" /> File
                </button>
              </div>
            )}
          </div>

          <input
            type="file"
            ref={fileInputRef}
            onChange={(e) => handleFileChange(e, "file")}
            className="hidden"
            multiple
            accept=".pdf,.txt,.md,.js,.ts,.json"
          />
          <input
            type="file"
            ref={imageInputRef}
            onChange={(e) => handleFileChange(e, "image")}
            className="hidden"
            multiple
            accept="image/*"
          />

          <textarea
            ref={textareaRef}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onKeyDown={(e) =>
              e.key === "Enter" &&
              !e.shiftKey &&
              (e.preventDefault(), handleSubmit())
            }
            placeholder={
              isExtracting ? "Purple is reading..." : "Type or speak..."
            }
            rows={1}
            disabled={disabled || isExtracting}
            className="flex-1 bg-transparent border-none focus:ring-0 resize-none py-3 px-1 text-[15px] md:text-[16px] dark:text-slate-100 min-h-[44px] max-h-[120px] transition-all"
          />

          {/* 3. RESTORED ORIGINAL SEND & VOICE BUTTONS */}
          <div className="flex items-center gap-1.5 pr-1 pb-1">
            {isVoiceInput && (
              <button
                onMouseDown={startListening}
                onMouseUp={() => setIsListening(false)}
                className={cn(
                  "p-2.5 md:p-3 rounded-xl transition-all",
                  isListening
                    ? "bg-red-500 text-white animate-pulse"
                    : "text-slate-400 hover:bg-slate-100 dark:hover:bg-white/5",
                )}
              >
                <Mic size={20} />
              </button>
            )}
            <button
              onClick={handleSubmit}
              disabled={
                disabled ||
                isExtracting ||
                (!value.trim() && attachments.length === 0)
              }
              className={cn(
                "p-2.5 md:p-3 rounded-xl transition-all shadow-lg",
                value.trim() || attachments.length > 0
                  ? "bg-violet-600 text-white"
                  : "bg-slate-100 dark:bg-white/5 text-slate-400",
              )}
            >
              <Send size={20} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
