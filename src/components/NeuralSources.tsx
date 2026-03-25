import React from "react";

interface Source {
  title: string;
  url: string;
  favicon: string;
}

interface NeuralSourcesProps {
  sources: Source[];
}

const NeuralSources: React.FC<NeuralSourcesProps> = ({ sources }) => {
  if (!sources || sources.length === 0) return null;

  return (
    <div className="mt-4 pt-4 border-t border-purple-500/20">
      <div className="flex items-center gap-2 mb-3">
        <div className="w-2 h-2 bg-purple-500 rounded-full animate-pulse" />
        <span className="text-[10px] font-bold uppercase tracking-widest text-purple-400">
          Neural Context Sources
        </span>
      </div>

      <div className="flex flex-wrap gap-2">
        {sources.map((source, index) => (
          <a
            key={index}
            href={source.url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 px-3 py-1.5 bg-[#1a1a2e] border border-purple-500/30 rounded-lg 
                       hover:border-purple-400 hover:bg-purple-500/10 transition-all duration-200 group"
          >
            <img
              src={source.favicon}
              alt=""
              className="w-3.5 h-3.5 opacity-70 group-hover:opacity-100"
              onError={(e) => (e.currentTarget.style.display = "none")}
            />
            <span className="text-xs text-gray-300 group-hover:text-white truncate max-w-[120px]">
              {source.title}
            </span>
            <svg
              className="w-2.5 h-2.5 text-gray-500 group-hover:text-purple-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
              />
            </svg>
          </a>
        ))}
      </div>
    </div>
  );
};

export default NeuralSources;
