"use client";

import React, { useState } from "react";

export function VoiceGuidance() {
  const [selectedLang, setSelectedLang] = useState<"en" | "hi" | "te">("en");
  const [isPlaying, setIsPlaying] = useState(false);

  const emergencyPhrases = {
    en: {
      title: "English Emergency Audio Guidance",
      sosAnnounce: "Emergency SOS Alert sent to TGDRF Command Center. Stay calm. Nearest rescue boat dispatched.",
      floodEvac: "Flood Warning: Move to Kotla Vijayabhaskara Reddy Indoor Stadium. Avoid Begumpet underpass.",
      firstAid: "First Aid Instruction: Apply pressure to wound using clean cloth. Elevate injured limb.",
    },
    hi: {
      title: "हिन्दी आपातकालीन आवाज निर्देश (Hindi Voice)",
      sosAnnounce: "आपातकालीन एसओएस चेतावनी तेलंगाना आपदा प्रतिक्रिया दल को भेज दी गई है। शांत रहें। निकटतम बचाव दल रवाना हो चुका है।",
      floodEvac: "बाढ़ की चेतावनी: कोटला विजयभास्कर रेड्डी इंडोर स्टेडियम में जाएँ। बेगमपेट अंडरपास से बचें।",
      firstAid: "प्राथमिक चिकित्सा निर्देश: साफ़ कपड़े से घाव पर दबाव डालें। घायल अंग को ऊपर उठाएँ।",
    },
    te: {
      title: "తెలుగు అత్యవసర వాయిస్ మార్గదర్శకాలు (Telugu Voice)",
      sosAnnounce: "అత్యవసర SOS హెచ్చరిక తెలంగాణ విపత్తు స్పందన దళానికి పంపబడింది. ప్రశాంతంగా ఉండండి. సమీప రక్షణ పడవ బయలుదేరింది.",
      floodEvac: "వరద హెచ్చరిక: కోట్ల విజయభాస్కర్ రెడ్డి ఇండోర్ స్టేడియానికి వెళ్లండి. బేగంపేట అండర్‌పాస్‌కు దూరంగా ఉండండి.",
      firstAid: "ప్రథమ చికిత్స సూచన: శుభ్రమైన గుడ్డతో గాయంపై ఒత్తిడి తీసుకోండి. దెబ్బతిన్న అవయవాన్ని పైకి లేపండి.",
    },
  };

  const speakText = (text: string, langCode: string) => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) {
      alert("Web Speech API is not supported in this browser environment.");
      return;
    }

    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = langCode === "te" ? "te-IN" : langCode === "hi" ? "hi-IN" : "en-US";
    utterance.rate = 0.9;
    utterance.pitch = 1.0;

    utterance.onstart = () => setIsPlaying(true);
    utterance.onend = () => setIsPlaying(false);
    utterance.onerror = () => setIsPlaying(false);

    window.speechSynthesis.speak(utterance);
  };

  const current = emergencyPhrases[selectedLang];

  return (
    <div className="bg-[#0c1322] border border-red-500/30 rounded-2xl p-5 shadow-2xl space-y-4">
      <div className="flex flex-wrap items-center justify-between border-b border-slate-800 pb-3 gap-3">
        <div className="flex items-center gap-3">
          <span className="text-2xl">🔊</span>
          <div>
            <h3 className="text-sm font-extrabold text-white uppercase tracking-wider font-mono">
              MULTI-LINGUAL VOICE EMERGENCY GUIDANCE (TELUGU / HINDI / ENGLISH)
            </h3>
            <p className="text-[11px] text-slate-400">Web Speech API Text-to-Speech synthesis for hands-free evacuation</p>
          </div>
        </div>

        {/* Language Switcher */}
        <div className="flex items-center gap-1.5 bg-slate-900 border border-slate-700/80 p-1 rounded-lg">
          <button
            onClick={() => setSelectedLang("en")}
            className={`px-3 py-1 text-xs font-bold rounded transition ${
              selectedLang === "en" ? "bg-red-600 text-white" : "text-slate-400 hover:text-white"
            }`}
          >
            🇬🇧 English
          </button>
          <button
            onClick={() => setSelectedLang("hi")}
            className={`px-3 py-1 text-xs font-bold rounded transition ${
              selectedLang === "hi" ? "bg-red-600 text-white" : "text-slate-400 hover:text-white"
            }`}
          >
            🇮🇳 हिन्दी (Hindi)
          </button>
          <button
            onClick={() => setSelectedLang("te")}
            className={`px-3 py-1 text-xs font-bold rounded transition ${
              selectedLang === "te" ? "bg-red-600 text-white" : "text-slate-400 hover:text-white"
            }`}
          >
            🏛️ తెలుగు (Telugu)
          </button>
        </div>
      </div>

      {/* Voice Action Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
        <div className="bg-slate-900 border border-slate-800 p-3.5 rounded-xl space-y-2 flex flex-col justify-between">
          <div>
            <span className="text-[10px] font-bold text-cyan-400 uppercase block font-mono">SOS Announcement</span>
            <p className="text-slate-200 text-xs mt-1 leading-relaxed">{current.sosAnnounce}</p>
          </div>
          <button
            onClick={() => speakText(current.sosAnnounce, selectedLang)}
            className="w-full bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs py-2 rounded transition flex items-center justify-center gap-2 mt-2"
          >
            <span>🔊</span> {isPlaying ? "Speaking..." : "Play Voice Announcement"}
          </button>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-3.5 rounded-xl space-y-2 flex flex-col justify-between">
          <div>
            <span className="text-[10px] font-bold text-amber-400 uppercase block font-mono">Flood Evacuation Guide</span>
            <p className="text-slate-200 text-xs mt-1 leading-relaxed">{current.floodEvac}</p>
          </div>
          <button
            onClick={() => speakText(current.floodEvac, selectedLang)}
            className="w-full bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs py-2 rounded transition flex items-center justify-center gap-2 mt-2"
          >
            <span>🔊</span> {isPlaying ? "Speaking..." : "Play Evacuation Guide"}
          </button>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-3.5 rounded-xl space-y-2 flex flex-col justify-between">
          <div>
            <span className="text-[10px] font-bold text-emerald-400 uppercase block font-mono">First Aid Instructions</span>
            <p className="text-slate-200 text-xs mt-1 leading-relaxed">{current.firstAid}</p>
          </div>
          <button
            onClick={() => speakText(current.firstAid, selectedLang)}
            className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs py-2 rounded transition flex items-center justify-center gap-2 mt-2"
          >
            <span>🔊</span> {isPlaying ? "Speaking..." : "Play First Aid Instructions"}
          </button>
        </div>
      </div>
    </div>
  );
}
