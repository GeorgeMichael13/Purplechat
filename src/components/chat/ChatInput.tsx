"use client";

import { useState, useRef, useEffect } from "react";
import { Mic, MicOff, Send, Paperclip, X, ImageIcon, FileText, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

interface ChatInputProps {
  value: string;
  onChange: (val: string) => void;
  onSubmit: (text: string, attachments?: any[]) => void;
  disabled?: boolean;
}

export default function ChatInput({ value, onChange, onSubmit, disabled }: ChatInputProps) {
  const [isListening, setIsListening] = useState(false);
  const [attachments, setAttachments] = useState<any[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const recognitionRef = useRef<any>(null);

  // --- Voice Recognition Logic ---
  useEffect(() => {
    const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
    if (SpeechRecognition) {
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = true;
      recognitionRef.current.interimResults = true;
      
      recognitionRef.current.onresult = (event: any) => {
        let transcript = "";
        for (let i = event.resultIndex; i < event.results.length; i++) {
          transcript += event.results[i][0].transcript;
        }
        onChange(transcript);
      };
      
      recognitionRef.current.onend = () => setIsListening(false);
    }
  }, [onChange]);

  const toggleListening = () => {
    if (isListening) {
      recognitionRef.current?.stop();
    } else {
      recognitionRef.current?.start();
      setIsListening(true);
    }
  };

  // --- File Handling ---
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    setIsUploading(true);
    const newAttachments = await Promise.all(
      files.map(async (file) => {
        return new Promise((resolve) => {
          const reader = new FileReader();
          reader.onloadend = () => {
            const base64 = reader.result?.toString().split(",")[1];
            resolve({
              name: file.name,
              mimeType: file.type,
              data: base64,
              preview: URL.createObjectURL(file),
            });
          };
          reader.readAsDataURL(file);
        });
      })
    );

    setAttachments((prev) => [...prev, ...newAttachments]);
    setIsUploading(false);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const removeAttachment = (index: number) => {
    setAttachments((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSend = () => {
    if (!value.trim() && attachments.length === 0) return;
    
    // Pass text and file data to the parent onSubmit
    onSubmit(value, attachments);
    
    // Clear state
    onChange("");
    setAttachments([]);
  };

  return (
    <footer className="p-4 bg-transparent relative z-20">
      <div className="max-w-4xl mx-auto">
        
        {/* Attachment Previews */}
        <AnimatePresence>
          {attachments.length > 0 && (
            <motion.div 
              initial={{ opacity: 0, y: 10 }} 
              animate={{ opacity: 1, y: 0 }} 
              exit={{ opacity: 0, y: 10 }}
              className="flex gap-2 mb-3 overflow-x-auto p-2"
            >
              {attachments.map((file, i) => (
                <div key={i} className="relative group flex items-center gap-2 p-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm">
                  {file.mimeType.startsWith("image/") ? (
                    <img src={file.preview} alt="preview" className="w-10 h-10 object-cover rounded-lg" />
                  ) : (
                    <FileText className="text-violet-500" size={20} />
                  )}
                  <div className="flex flex-col pr-6">
                    <span className="text-xs font-medium truncate max-w-[100px] dark:text-slate-300">{file.name}</span>
                  </div>
                  <button 
                    onClick={() => removeAttachment(i)}
                    className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 shadow-md hover:bg-red-600 transition-colors"
                  >
                    <X size={12} />
                  </button>
                </div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        <div className="relative flex items-end gap-2 p-2 rounded-[2rem] bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 focus-within:border-violet-500/50 transition-all shadow-lg">
          
          <button 
            onClick={() => fileInputRef.current?.click()}
            className="p-3 rounded-2xl text-slate-500 hover:bg-white dark:hover:bg-slate-800 transition-colors"
          >
            {isUploading ? <Loader2 className="animate-spin" size={20} /> : <Paperclip size={20} />}
          </button>
          <input type="file" ref={fileInputRef} onChange={handleFileChange} multiple className="hidden" />

          <textarea
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && (e.preventDefault(), handleSend())}
            placeholder={isListening ? "Listening..." : "Ask PurpleChat..."}
            rows={1}
            className="flex-1 bg-transparent border-none focus:ring-0 py-3 text-slate-800 dark:text-slate-200 resize-none max-h-40"
          />

          <button
            onClick={toggleListening}
            className={cn(
              "p-3 rounded-2xl transition-all",
              isListening ? "bg-red-500 text-white animate-pulse" : "text-slate-500 hover:bg-white dark:hover:bg-slate-800"
            )}
          >
            {isListening ? <MicOff size={20} /> : <Mic size={20} />}
          </button>

          <button
            onClick={handleSend}
            disabled={disabled || (!value.trim() && attachments.length === 0)}
            className="p-3 rounded-2xl bg-violet-600 text-white hover:bg-violet-700 disabled:opacity-50 transition-all shadow-md"
          >
            <Send size={20} />
          </button>
        </div>
      </div>
    </footer>
  );
}