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
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
// --- NEW FEATURE: PDF SUPPORT ---
import * as pdfjsLib from "pdfjs-dist";

// Initialize PDF worker
if (typeof window !== "undefined") {
  pdfjsLib.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`;
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

  const [isVoiceInput, setIsVoiceInput] = useState(true);
  const [isAudioOutput, setIsAudioOutput] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const savedVoiceInput = localStorage.getItem("purple-voice-input");
    const savedAudioOutput = localStorage.getItem("purple-audio-output");

    if (savedVoiceInput !== null) setIsVoiceInput(JSON.parse(savedVoiceInput));
    if (savedAudioOutput !== null)
      setIsAudioOutput(JSON.parse(savedAudioOutput));

    window.speechSynthesis.getVoices();
    const handleVoicesChanged = () => window.speechSynthesis.getVoices();
    window.speechSynthesis.addEventListener(
      "voiceschanged",
      handleVoicesChanged,
    );

    const checkSpeech = setInterval(() => {
      setIsSpeaking(window.speechSynthesis.speaking);
    }, 400);

    return () => {
      clearInterval(checkSpeech);
      window.speechSynthesis.removeEventListener(
        "voiceschanged",
        handleVoicesChanged,
      );
    };
  }, []);

  useEffect(() => {
    localStorage.setItem("purple-voice-input", JSON.stringify(isVoiceInput));
  }, [isVoiceInput]);

  useEffect(() => {
    localStorage.setItem("purple-audio-output", JSON.stringify(isAudioOutput));
  }, [isAudioOutput]);

  const stopSpeaking = () => {
    window.speechSynthesis.cancel();
    setIsSpeaking(false);
  };

  // --- NEW FEATURE: PDF TEXT EXTRACTION ---
  const extractTextFromPDF = async (file: File) => {
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    let fullText = "";
    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const textContent = await page.getTextContent();
      const pageText = textContent.items.map((item: any) => item.str).join(" ");
      fullText += pageText + "\n";
    }
    return fullText;
  };

  const handleFileChange = async (e: ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    setIsExtracting(true);
    const newAttachments = [];

    for (const file of Array.from(files)) {
      try {
        let extractedText = "";
        // If PDF, extract text. If text-based, read directly.
        if (file.type === "application/pdf") {
          extractedText = await extractTextFromPDF(file);
        } else {
          extractedText = await file.text();
        }

        newAttachments.push({
          name: file.name,
          type: file.type,
          size: (file.size / 1024).toFixed(1) + " KB",
          extractedText: extractedText, // This is what ChatWindow needs!
        });
      } catch (err) {
        toast.error(`Error reading ${file.name}`);
      }
    }
    setAttachments((prev) => [...prev, ...newAttachments]);
    setIsExtracting(false);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const startListening = () => {
    if (!isVoiceInput) return;
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitRecognition;
    if (!SpeechRecognition)
      return toast.error("Browser doesn't support Voice AI");

    const recognition = new SpeechRecognition();
    recognition.lang = "en-US";
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
    <div className="p-4 bg-transparent relative z-20 max-w-4xl mx-auto w-full">
      <div className="flex justify-end gap-2 mb-3">
        <AnimatePresence>
          {isSpeaking && (
            <motion.button
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={stopSpeaking}
              className="flex items-center gap-2 px-3 py-1.5 rounded-full text-[10px] font-bold uppercase bg-red-500 text-white shadow-lg shadow-red-500/20"
            >
              <Square size={12} fill="currentColor" /> Stop Reading
            </motion.button>
          )}
        </AnimatePresence>

        <button
          onClick={() => setIsAudioOutput(!isAudioOutput)}
          className={cn(
            "flex items-center gap-2 px-3 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-wider transition-all border",
            isAudioOutput
              ? "bg-emerald-600/10 border-emerald-500/50 text-emerald-600"
              : "bg-slate-100 dark:bg-white/5 border-slate-200 dark:border-white/10 text-slate-500",
          )}
        >
          {isAudioOutput ? <Volume2 size={12} /> : <VolumeX size={12} />}
          {isAudioOutput ? "Audio On" : "Silent Mode"}
        </button>

        <button
          onClick={() => setIsVoiceInput(!isVoiceInput)}
          className={cn(
            "flex items-center gap-2 px-3 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-wider transition-all border",
            isVoiceInput
              ? "bg-violet-600/10 border-violet-500/50 text-violet-600"
              : "bg-slate-100 dark:bg-white/5 border-slate-200 dark:border-white/10 text-slate-500",
          )}
        >
          {isVoiceInput ? <Mic size={12} /> : <MicOff size={12} />}
          {isVoiceInput ? "Voice Input" : "Text Input"}
        </button>
      </div>

      <AnimatePresence>
        {isListening && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="absolute inset-x-4 bottom-24 z-50 p-6 rounded-3xl bg-violet-600/90 backdrop-blur-xl flex flex-col items-center justify-center border border-white/20 shadow-2xl text-white"
          >
            <div className="flex gap-1.5 mb-2">
              {[1, 2, 3, 4].map((i) => (
                <motion.div
                  key={i}
                  animate={{ height: [10, 25, 10] }}
                  transition={{
                    repeat: Infinity,
                    duration: 0.6,
                    delay: i * 0.1,
                  }}
                  className="w-1 bg-white rounded-full"
                />
              ))}
            </div>
            <span className="text-[10px] font-bold uppercase tracking-widest">
              Listening...
            </span>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="relative flex flex-col gap-2 p-2 rounded-[24px] border border-slate-200 dark:border-white/10 bg-white/80 dark:bg-slate-900/80 backdrop-blur-2xl shadow-2xl transition-all focus-within:border-violet-500/50">
        <AnimatePresence>
          {attachments.length > 0 && (
            <div className="flex flex-wrap gap-2 p-2 pb-0">
              {attachments.map((file, i) => (
                <div
                  key={i}
                  className="flex items-center gap-2 px-3 py-2 bg-slate-100 dark:bg-white/5 rounded-xl border border-slate-200 dark:border-white/10"
                >
                  <FileText size={14} className="text-emerald-500" />
                  <span className="text-xs font-medium truncate max-w-[120px] dark:text-slate-300">
                    {file.name}
                  </span>
                  <button
                    onClick={() =>
                      setAttachments((p) => p.filter((_, idx) => idx !== i))
                    }
                    className="p-1 hover:text-red-500"
                  >
                    <X size={12} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </AnimatePresence>

        <div className="flex items-end gap-2">
          <button
            onClick={() => fileInputRef.current?.click()}
            className="p-3 text-slate-500 hover:text-violet-600 rounded-xl transition-all"
          >
            <Paperclip size={20} />
          </button>
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            className="hidden"
            multiple
            accept=".pdf,.txt,.md,.js,.ts,.json"
          />

          <textarea
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onKeyDown={(e) =>
              e.key === "Enter" &&
              !e.shiftKey &&
              (e.preventDefault(), handleSubmit())
            }
            placeholder={
              isExtracting
                ? "Purple is reading..."
                : isVoiceInput
                  ? "Speak or type..."
                  : "Type a message..."
            }
            rows={1}
            disabled={disabled || isExtracting}
            className="flex-1 bg-transparent border-none focus:ring-0 resize-none py-3 px-1 text-[15px] dark:text-slate-100 max-h-[200px]"
          />

          <div className="flex items-center gap-2 pr-1 pb-1">
            {isVoiceInput && (
              <button
                onMouseDown={startListening}
                onMouseUp={() => setIsListening(false)}
                className={cn(
                  "p-3 rounded-xl transition-all",
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
                "p-3 rounded-xl transition-all shadow-lg",
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
