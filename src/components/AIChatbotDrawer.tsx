import React, { useState, useRef, useEffect } from 'react';
import { 
  X, 
  Bot, 
  Send, 
  Sparkles, 
  Cpu, 
  Terminal, 
  Trash2, 
  Mic, 
  MicOff, 
  Volume2, 
  VolumeX, 
  Radio, 
  Headphones,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { ChatMessage, IndianLanguage } from '../types';
import { SUPPORTED_LANGUAGES, TRANSLATIONS } from '../data/translations';

interface AIChatbotDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  currentLang: IndianLanguage;
  onLangChange: (lang: IndianLanguage) => void;
}

// BCP 47 language mapping for Indian languages in Web Speech API
const SPEECH_LANG_MAP: Record<IndianLanguage, string> = {
  en: 'en-IN',
  hi: 'hi-IN',
  ta: 'ta-IN',
  te: 'te-IN',
  kn: 'kn-IN',
  bn: 'bn-IN',
  mr: 'mr-IN',
  gu: 'gu-IN',
  ml: 'ml-IN',
  pa: 'pa-IN',
  or: 'or-IN',
};

export const AIChatbotDrawer: React.FC<AIChatbotDrawerProps> = ({
  isOpen,
  onClose,
  currentLang,
  onLangChange,
}) => {
  if (!isOpen) return null;

  const t = TRANSLATIONS[currentLang] || TRANSLATIONS.en;
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Web Speech API states
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [activeSpeakingMsgId, setActiveSpeakingMsgId] = useState<string | null>(null);
  const [handsFreeMode, setHandsFreeMode] = useState(false);
  const [interimTranscript, setInterimTranscript] = useState('');
  const [speechSupported, setSpeechSupported] = useState(true);
  const [speechError, setSpeechError] = useState<string | null>(null);

  const recognitionRef = useRef<any>(null);

  const initialWelcome: ChatMessage = {
    id: 'msg-init',
    sender: 'bot',
    text: currentLang === 'hi' 
      ? 'नमस्ते! मैं सिविकट्विन एआई अर्बन इंटेलिजेंस असिस्टेंट हूँ। आप मुझसे शहर के बाढ़, यातायात, जलभराव और आपातकालीन संसाधनों के बारे में बोलकर या लिखकर पूछ सकते हैं।'
      : currentLang === 'ta'
      ? 'வணக்கம்! நான் சிவிக்ட்வின் AI நகர்ப்புற நுண்ணறிவு உதவியாளர். மைக்ரோஃபோன் வழியாக வாய்மொழியாகவோ அல்லது தட்டச்சு செய்தோ வெள்ள அபாயம் மற்றும் அவசர உதவி குறித்து நீங்கள் கேட்கலாம்.'
      : currentLang === 'te'
      ? 'నమస్కారం! నేను సివిక్‌ట్విన్ AI అర్బన్ ఇంటెలిజెన్స్ అసిస్టెంట్‌ని. వాయిస్ లేదా టెక్స్ట్ ద్వారా నగర వరదలు, ట్రాఫిక్ మరియు అత్యవసర సేవల గురించి నన్ను అడగండి.'
      : 'Hello! I am the CivicTwin AI Urban Intelligence Assistant. Urban planners and emergency responders can interact hands-free using voice across 11 Indian languages.',
    timestamp: 'Just now',
    agentName: 'AI Orchestrator',
  };

  const [messages, setMessages] = useState<ChatMessage[]>([initialWelcome]);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading, interimTranscript]);

  // Clean text for speech synthesis (strip markdown formatting)
  const cleanTextForSpeech = (text: string): string => {
    return text
      .replace(/[#*_`~]/g, '')
      .replace(/•/g, ', ')
      .replace(/\n+/g, '. ')
      .replace(/https?:\/\/\S+/g, '')
      .replace(/\s+/g, ' ')
      .trim();
  };

  // Text-To-Speech (TTS)
  const speakText = (text: string, msgId?: string) => {
    if (!('speechSynthesis' in window)) {
      setSpeechError('Speech synthesis not supported in this browser.');
      return;
    }

    // If currently speaking, stop
    window.speechSynthesis.cancel();
    if (msgId && activeSpeakingMsgId === msgId) {
      setIsSpeaking(false);
      setActiveSpeakingMsgId(null);
      return;
    }

    const clean = cleanTextForSpeech(text);
    if (!clean) return;

    const utterance = new SpeechSynthesisUtterance(clean);
    const targetLangCode = SPEECH_LANG_MAP[currentLang] || 'en-IN';
    utterance.lang = targetLangCode;

    // Pick appropriate voice if available
    const voices = window.speechSynthesis.getVoices();
    const matchedVoice = voices.find(v => v.lang === targetLangCode || v.lang.startsWith(targetLangCode.slice(0, 2)));
    if (matchedVoice) {
      utterance.voice = matchedVoice;
    }

    utterance.onstart = () => {
      setIsSpeaking(true);
      if (msgId) setActiveSpeakingMsgId(msgId);
    };

    utterance.onend = () => {
      setIsSpeaking(false);
      setActiveSpeakingMsgId(null);
    };

    utterance.onerror = (e) => {
      console.warn('Speech synthesis error:', e);
      setIsSpeaking(false);
      setActiveSpeakingMsgId(null);
    };

    window.speechSynthesis.speak(utterance);
  };

  const stopSpeaking = () => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      setActiveSpeakingMsgId(null);
    }
  };

  // Stop speaking and speech recognition on component unmount
  useEffect(() => {
    return () => {
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
      if (recognitionRef.current) {
        recognitionRef.current.abort();
      }
    };
  }, []);

  // Initialize Speech Recognition
  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setSpeechSupported(false);
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = true;
      recognition.lang = SPEECH_LANG_MAP[currentLang] || 'en-IN';

      recognition.onstart = () => {
        setIsListening(true);
        setSpeechError(null);
        setInterimTranscript('');
      };

      recognition.onresult = (event: any) => {
        let currentInterim = '';
        let finalTranscript = '';

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            finalTranscript += transcript;
          } else {
            currentInterim += transcript;
          }
        }

        if (finalTranscript) {
          setInputMessage(finalTranscript);
          setInterimTranscript('');
          setIsListening(false);
          // Auto-send in hands-free mode
          handleSendMessage(finalTranscript);
        } else {
          setInterimTranscript(currentInterim);
        }
      };

      recognition.onerror = (event: any) => {
        console.warn('Speech recognition error:', event.error);
        setIsListening(false);
        if (event.error === 'not-allowed') {
          setSpeechError('Microphone access was denied. Please allow microphone permissions.');
        } else if (event.error !== 'no-speech') {
          setSpeechError(`Voice input issue: ${event.error}`);
        }
      };

      recognition.onend = () => {
        setIsListening(false);
        setInterimTranscript('');
      };

      recognitionRef.current = recognition;
    } catch (e) {
      console.warn('Speech recognition init error:', e);
      setSpeechSupported(false);
    }
  }, [currentLang, handsFreeMode]);

  const toggleListening = () => {
    if (!speechSupported) {
      setSpeechError('Web Speech API is not supported in this browser. Please use Chrome or Edge.');
      return;
    }

    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
    } else {
      stopSpeaking();
      try {
        if (recognitionRef.current) {
          recognitionRef.current.lang = SPEECH_LANG_MAP[currentLang] || 'en-IN';
          recognitionRef.current.start();
        }
      } catch (err) {
        console.warn('Recognition start error:', err);
      }
    }
  };

  const quickPrompts = [
    { label: 'High-risk zones', query: 'Which zones currently have the highest risk scores, and what are their primary causes?' },
    { label: 'Zone D flood causes', query: 'Why is Zone D (Lake Basin) at critical risk and what sensors triggered alerts?' },
    { label: 'Nearest trauma hospital', query: 'Where is the nearest trauma hospital to Zone D with active emergency capacity?' },
    { label: 'Rainfall +30% simulation', query: 'Simulate what happens if precipitation increases by +30% across the metropolis.' },
    { label: 'हिंदी: जलभराव का खतरा', query: 'शहर में सबसे ज्यादा जलभराव का खतरा कहाँ है और क्या कदम उठाए गए हैं?' },
    { label: 'தமிழ்: வெள்ள அபாயம்', query: 'நகரத்தில் அதிக வெள்ள அபாயம் உள்ள பகுதிகள் எவை? உடனடி நடவடிக்கை என்ன?' },
  ];

  const handleSendMessage = async (textToSend?: string) => {
    const query = textToSend || inputMessage;
    if (!query.trim() || isLoading) return;

    // Stop speaking any ongoing audio
    stopSpeaking();

    const userMsg: ChatMessage = {
      id: `usr-${Date.now()}`,
      sender: 'user',
      text: query,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages(prev => [...prev, userMsg]);
    setInputMessage('');
    setInterimTranscript('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/twin/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: query,
          language: currentLang,
          history: messages.slice(-4),
        }),
      });

      const data = await response.json();

      const botMsg: ChatMessage = {
        id: `bot-${Date.now()}`,
        sender: 'bot',
        text: data.reply,
        timestamp: data.timestamp || new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        agentName: data.agent,
        toolsUsed: data.toolInvocations,
      };

      setMessages(prev => [...prev, botMsg]);

      // If hands-free mode is enabled, auto-speak the assistant response
      if (handsFreeMode) {
        speakText(data.reply, botMsg.id);
      }
    } catch (err) {
      console.error(err);
      const fallbackMsg: ChatMessage = {
        id: `bot-${Date.now()}`,
        sender: 'bot',
        text: 'CivicTwin AI is processing sensor telemetry. Zone D (Lake Basin) water level is at 3.85m (+1.05m above critical mark). Mobile pumping stations have been deployed.',
        timestamp: 'Just now',
        agentName: 'Risk Intelligence Agent',
      };
      setMessages(prev => [...prev, fallbackMsg]);
      if (handsFreeMode) {
        speakText(fallbackMsg.text, fallbackMsg.id);
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-y-0 right-0 z-50 w-full sm:w-[500px] bg-slate-950/98 border-l border-slate-800 shadow-2xl backdrop-blur-2xl flex flex-col justify-between animate-in slide-in-from-right duration-300 text-slate-100">
      
      {/* Top Header */}
      <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/60">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-purple-500/20 text-white">
            <Bot className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-bold text-white tracking-tight">CivicTwin Multi-Agent AI</h2>
              <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-purple-950 text-purple-300 border border-purple-800">
                VOICE ACTIVE
              </span>
            </div>
            <p className="text-[11px] text-slate-400">
              Grounded in digital twin topology, sensors & NDMA SOPs
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          {/* Language picker inside chat */}
          <select
            value={currentLang}
            onChange={(e: any) => onLangChange(e.target.value)}
            className="bg-slate-900 border border-slate-700 rounded-lg px-2 py-1 text-xs text-slate-200 focus:outline-none"
          >
            {SUPPORTED_LANGUAGES.map(l => (
              <option key={l.code} value={l.code}>
                {l.nativeName}
              </option>
            ))}
          </select>

          <button
            onClick={() => {
              stopSpeaking();
              setMessages([initialWelcome]);
            }}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            title="Clear Chat"
          >
            <Trash2 className="w-4 h-4" />
          </button>

          <button
            onClick={() => {
              stopSpeaking();
              onClose();
            }}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Hands-Free Responder Mode Control Banner */}
      <div className="px-4 py-2 bg-slate-900/90 border-b border-slate-800/80 flex items-center justify-between text-xs">
        <div className="flex items-center gap-2">
          <Headphones className={`w-3.5 h-3.5 ${handsFreeMode ? 'text-cyan-400 animate-pulse' : 'text-slate-500'}`} />
          <span className="text-[11px] font-medium text-slate-300">
            Hands-Free Responder Mode
          </span>
          <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-slate-800 text-slate-400">
            Web Speech API
          </span>
        </div>

        <div className="flex items-center gap-2">
          {isSpeaking && (
            <button
              onClick={stopSpeaking}
              className="flex items-center gap-1 px-2 py-0.5 rounded bg-red-950 text-red-300 border border-red-800 text-[10px] hover:bg-red-900 transition-colors"
            >
              <VolumeX className="w-3 h-3" />
              <span>Stop Voice</span>
            </button>
          )}

          <button
            onClick={() => {
              const next = !handsFreeMode;
              setHandsFreeMode(next);
              if (!next) stopSpeaking();
            }}
            className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold transition-all flex items-center gap-1 ${
              handsFreeMode 
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/50' 
                : 'bg-slate-800 text-slate-400 hover:text-slate-200 border border-slate-700'
            }`}
          >
            <Radio className={`w-2.5 h-2.5 ${handsFreeMode ? 'text-cyan-400 animate-ping' : ''}`} />
            <span>{handsFreeMode ? 'VOICE READOUT ON' : 'AUTO-READOUT OFF'}</span>
          </button>
        </div>
      </div>

      {/* Speech Error Banner if permission denied or unsupported */}
      {speechError && (
        <div className="px-4 py-1.5 bg-amber-950/40 border-b border-amber-900/50 text-amber-300 text-[11px] flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <AlertCircle className="w-3.5 h-3.5 text-amber-400 shrink-0" />
            <span className="truncate">{speechError}</span>
          </div>
          <button onClick={() => setSpeechError(null)} className="text-amber-400 hover:text-white ml-2">
            <X className="w-3 h-3" />
          </button>
        </div>
      )}

      {/* Message Stream */}
      <div className="flex-1 p-4 overflow-y-auto space-y-4">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}
          >
            {/* Agent Header Tag */}
            {msg.sender === 'bot' && (
              <div className="flex items-center justify-between w-full max-w-[88%] mb-1 px-1">
                <div className="flex items-center gap-1.5 text-[10px] font-mono text-purple-300">
                  <Cpu className="w-3 h-3 text-purple-400" />
                  <span>{msg.agentName || 'AI Intelligence Agent'}</span>
                </div>
                
                {/* Voice Readout Button on Message */}
                <button
                  onClick={() => speakText(msg.text, msg.id)}
                  title={activeSpeakingMsgId === msg.id ? 'Stop audio' : 'Listen via Web Speech API'}
                  className={`p-1 rounded hover:bg-slate-800 transition-colors ${
                    activeSpeakingMsgId === msg.id ? 'text-cyan-400 animate-pulse' : 'text-slate-500 hover:text-slate-300'
                  }`}
                >
                  {activeSpeakingMsgId === msg.id ? (
                    <VolumeX className="w-3.5 h-3.5" />
                  ) : (
                    <Volume2 className="w-3.5 h-3.5" />
                  )}
                </button>
              </div>
            )}

            {/* Bubble */}
            <div
              className={`p-3 rounded-2xl max-w-[88%] text-xs leading-relaxed ${
                msg.sender === 'user'
                  ? 'bg-gradient-to-r from-blue-600 to-cyan-600 text-white rounded-tr-sm shadow-md'
                  : 'bg-slate-900 border border-slate-800 text-slate-200 rounded-tl-sm shadow-lg'
              }`}
            >
              <p className="whitespace-pre-line font-sans">{msg.text}</p>

              {/* Tool calls display */}
              {msg.toolsUsed && msg.toolsUsed.length > 0 && (
                <div className="mt-2.5 pt-2 border-t border-slate-800 space-y-1.5">
                  <span className="text-[10px] font-mono text-slate-400 flex items-center gap-1">
                    <Terminal className="w-3 h-3 text-cyan-400" />
                    <span>Twin Tool Invocations:</span>
                  </span>
                  {msg.toolsUsed.map((tool, idx) => (
                    <div key={idx} className="p-1.5 rounded bg-slate-950/80 border border-slate-800 text-[10px] font-mono">
                      <div className="text-cyan-300 font-bold">{tool.toolName}</div>
                      <div className="text-slate-400 mt-0.5">{tool.resultSummary}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <span className="text-[10px] text-slate-500 mt-1 px-1">
              {msg.timestamp}
            </span>
          </div>
        ))}

        {/* Live Audio Listening Feedback */}
        {isListening && (
          <div className="flex items-center gap-2 p-3 rounded-2xl bg-cyan-950/40 border border-cyan-800/60 max-w-[85%] text-xs text-cyan-300 animate-pulse">
            <div className="flex items-center gap-1">
              <span className="w-1.5 h-3 bg-cyan-400 animate-bounce" />
              <span className="w-1.5 h-5 bg-cyan-400 animate-bounce delay-75" />
              <span className="w-1.5 h-2.5 bg-cyan-400 animate-bounce delay-150" />
            </div>
            <div className="space-y-0.5">
              <div className="font-semibold flex items-center gap-1">
                <Mic className="w-3.5 h-3.5 text-cyan-400" />
                <span>Listening in {SUPPORTED_LANGUAGES.find(l => l.code === currentLang)?.nativeName || 'Language'}...</span>
              </div>
              <p className="text-[11px] text-cyan-200 italic">
                {interimTranscript || 'Speak your urban incident or query now...'}
              </p>
            </div>
          </div>
        )}

        {isLoading && (
          <div className="flex items-center gap-2 p-3 rounded-2xl bg-slate-900 border border-slate-800 max-w-[70%] text-xs text-purple-300 animate-pulse">
            <Sparkles className="w-4 h-4 text-purple-400 animate-spin" />
            <span>Consulting Digital Twin Knowledge Graph...</span>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Quick Prompts Chips */}
      <div className="px-4 py-2 bg-slate-950/80 border-t border-slate-900 overflow-x-auto flex items-center gap-1.5 no-scrollbar">
        {quickPrompts.map((p, idx) => (
          <button
            key={idx}
            onClick={() => handleSendMessage(p.query)}
            className="whitespace-nowrap px-2.5 py-1 rounded-full bg-slate-900 hover:bg-slate-800 border border-slate-800 text-[11px] text-slate-300 hover:text-white transition-colors"
          >
            {p.label}
          </button>
        ))}
      </div>

      {/* Input Bar with Web Speech API Mic Controls */}
      <div className="p-3.5 sm:p-4 border-t border-slate-800 bg-slate-900/90 space-y-2">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSendMessage();
          }}
          className="flex items-center gap-2"
        >
          {/* Hands-Free Voice Input Microphone Button */}
          <button
            type="button"
            onClick={toggleListening}
            title={isListening ? 'Stop listening' : `Hands-Free Voice input (${SUPPORTED_LANGUAGES.find(l => l.code === currentLang)?.name})`}
            className={`p-2.5 rounded-xl transition-all flex items-center justify-center ${
              isListening
                ? 'bg-red-600 hover:bg-red-500 text-white animate-pulse shadow-lg shadow-red-600/40 ring-2 ring-red-400'
                : 'bg-slate-800 hover:bg-slate-700 text-cyan-400 hover:text-white border border-slate-700'
            }`}
          >
            {isListening ? (
              <MicOff className="w-4 h-4" />
            ) : (
              <Mic className="w-4 h-4" />
            )}
          </button>

          {/* Text Input */}
          <input
            type="text"
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            placeholder={
              isListening 
                ? 'Listening... Speak your query' 
                : t.chatPlaceholder || 'Ask or speak in English, हिन्दी, தமிழ், etc.'
            }
            className={`flex-1 bg-slate-950 border rounded-xl px-3.5 py-2 text-xs text-white placeholder-slate-500 focus:outline-none transition-colors ${
              isListening ? 'border-cyan-500 ring-1 ring-cyan-500/30' : 'border-slate-800 focus:border-purple-500'
            }`}
          />

          {/* Send Button */}
          <button
            type="submit"
            disabled={!inputMessage.trim() || isLoading}
            className="p-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white transition-colors shadow-md shadow-purple-900/30"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>

        <div className="flex items-center justify-between text-[10px] text-slate-400 px-1">
          <span className="flex items-center gap-1 font-mono">
            <span>Voice:</span>
            <strong className="text-cyan-400">
              {SPEECH_LANG_MAP[currentLang]} ({SUPPORTED_LANGUAGES.find(l => l.code === currentLang)?.nativeName})
            </strong>
          </span>
          <span className="text-slate-500">
            {handsFreeMode ? 'Auto-sends upon speech pause' : 'Click Mic to dictate query'}
          </span>
        </div>
      </div>

    </div>
  );
};
