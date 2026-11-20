import React, { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  MessageSquare,
  X,
  Send,
  Sparkles,
  Bot,
  User,
  ExternalLink,
  MessageCircle,
  Bike,
  ChevronDown,
  Wrench,
  CheckCircle,
} from 'lucide-react';
import { aiChat } from '../../api/endpoints';
import { useMotor } from '../../context/MotorContext';
import { formatRupiah } from '../../utils/format';

export default function FloatingChat() {
  const [isOpen, setIsOpen] = useState(false);
  const [showBubble, setShowBubble] = useState(true);
  const { selectedMotor, motorTypes, selectMotor } = useMotor();

  const [messages, setMessages] = useState([
    {
      id: 1,
      role: 'model',
      text: 'Halo Bro! Selamat datang di PEPSO PARTS. Saya Mas Wahyu AI — asisten teknis cerdas spesialis suku cadang bekas original Kawasaki Ninja 150 2-Tak (Ninja R, RR, SS). Ada part yang lagi kamu cari atau mau konsultasi seputar mesin 2T?',
      suggested_products: [],
      quick_replies: [
        'Blok Seher Ninja RR 1855',
        'Cara rawat Super KIPS',
        'Rekomendasi oli samping',
        'Lokasi bengkel di Sentul',
      ],
      fallback_to_whatsapp: false,
    },
  ]);

  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [showMotorMenu, setShowMotorMenu] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [messages, isOpen]);

  // Listen to open-chat custom events from the homepage AI banner
  useEffect(() => {
    const handleOpenChat = (e) => {
      setIsOpen(true);
      setShowBubble(false);
      const prompt = e.detail?.prompt;
      if (prompt) {
        setTimeout(() => {
          handleSend(prompt);
        }, 300);
      }
    };

    window.addEventListener('pepso:open-chat', handleOpenChat);
    return () => window.removeEventListener('pepso:open-chat', handleOpenChat);
  }, [messages]);

  const handleSend = async (textToSend) => {
    const text = textToSend || input.trim();
    if (!text || loading) return;

    const userMsg = {
      id: Date.now(),
      role: 'user',
      text,
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const history = messages.slice(-6).map((m) => ({
        role: m.role,
        text: m.text,
      }));

      const res = await aiChat({
        message: text,
        my_motor_slug: selectedMotor?.slug || null,
        history,
      });

      // Robust extraction: handles both res = { success: true, data: {...} } and axios-style res = { data: { success: true, data: {...} } }
      const payload = res?.data?.text ? res.data : (res?.data?.data || res?.data);

      if (payload && (res?.success || res?.data?.success || payload.text)) {
        const botMsg = {
          id: Date.now() + 1,
          role: 'model',
          text: payload.text || 'Ada yang bisa saya bantu lagi seputar part Ninja 2-Tak Bro?',
          suggested_products: payload.suggested_products || [],
          quick_replies: payload.quick_replies || [],
          fallback_to_whatsapp: payload.fallback_to_whatsapp || false,
        };
        setMessages((prev) => [...prev, botMsg]);
      } else {
        throw new Error('Format respon tidak sesuai');
      }
    } catch (err) {
      console.error('Chat error:', err);
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now() + 1,
          role: 'model',
          text: 'Maaf Bro, jaringan sedang sibuk atau respons AI terhambat. Tapi jangan khawatir, kamu bisa langsung konsultasi fisik & ketersediaan part ke Mas Wahyu via WhatsApp ya!',
          suggested_products: [],
          quick_replies: ['Tanya via WhatsApp', 'Lihat Semua Katalog'],
          fallback_to_whatsapp: true,
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <>
      {/* ─── Floating Launcher Button with Proactive Bubble ─── */}
      <div className="fixed bottom-5 right-5 sm:bottom-6 sm:right-6 z-50 flex flex-col items-end">
        {!isOpen && showBubble && (
          <div className="mb-2 max-w-[280px] sm:max-w-xs bg-ink text-white text-xs p-3 rounded-md shadow-2xl border border-neutral-700 animate-in fade-in slide-in-from-bottom-2 relative group cursor-pointer"
               onClick={() => { setIsOpen(true); setShowBubble(false); }}>
            <button
              onClick={(e) => { e.stopPropagation(); setShowBubble(false); }}
              className="absolute top-1.5 right-1.5 text-neutral-400 hover:text-white text-xs p-0.5"
              aria-label="Tutup"
            >
              <X className="w-3.5 h-3.5" />
            </button>
            <div className="flex items-start gap-2.5 pr-3">
              <div className="w-7 h-7 rounded-full bg-brand/20 flex items-center justify-center flex-shrink-0 text-brand mt-0.5 border border-brand/40">
                <Sparkles className="w-4 h-4 animate-spin text-brand" />
              </div>
              <div>
                <div className="font-bold text-[11px] uppercase tracking-wider text-brand font-display flex items-center gap-1">
                  <span>Mas Wahyu AI Online</span>
                  <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></span>
                </div>
                <p className="text-neutral-200 text-[11px] leading-snug mt-0.5">
                  Bingung cari part atau setelan Ninja 2T? <strong>Klik untuk ngobrol!</strong>
                </p>
              </div>
            </div>
          </div>
        )}

        {!isOpen && (
          <button
            onClick={() => { setIsOpen(true); setShowBubble(false); }}
            className="flex items-center gap-2.5 px-4 py-3 bg-brand hover:bg-brand-dark text-white rounded-full shadow-2xl transition-all duration-300 hover:scale-105 group border-2 border-white/20 focus:outline-none"
            aria-label="Tanya AI Asisten"
          >
            <div className="relative">
              <Sparkles className="w-5 h-5 text-amber-200 animate-pulse" />
              <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-green-400 ring-2 ring-brand"></span>
            </div>
            <span className="font-display font-bold uppercase tracking-wider text-xs">
              Tanya Mas Wahyu AI
            </span>
          </button>
        )}
      </div>

      {/* ─── Chat Window Modal / Sheet ─── */}
      {isOpen && (
        <div className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 w-[95vw] sm:w-[430px] h-[600px] max-h-[85vh] bg-white border border-neutral-300 rounded-sm shadow-2xl z-50 flex flex-col overflow-hidden animate-in fade-in slide-in-from-bottom-5">
          {/* Header */}
          <div className="bg-ink text-white p-3.5 border-b border-neutral-800 flex items-center justify-between relative z-10">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded bg-brand/20 border border-brand/40 flex items-center justify-center text-brand">
                <Wrench className="w-4 h-4" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-display font-bold uppercase tracking-wider text-sm text-white">
                    PEPSO AI ASSISTANT
                  </h3>
                  <span className="px-1.5 py-0.2 bg-brand/20 text-brand text-[9px] font-mono font-bold uppercase rounded border border-brand/40">
                    Gemini 1.5
                  </span>
                </div>
                <p className="text-[10px] text-neutral-400 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse inline-block"></span>
                  Konsultan Ahli Kawasaki Ninja 2-Tak
                </p>
              </div>
            </div>

            <button
              onClick={() => setIsOpen(false)}
              className="text-neutral-400 hover:text-white p-1 rounded-sm transition-colors"
              aria-label="Tutup Obrolan"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Subheader: Motor Type Selector */}
          <div className="bg-neutral-50 px-3.5 py-2 border-b border-neutral-200 flex items-center justify-between text-xs">
            <div className="flex items-center gap-1.5 text-neutral-600 font-medium">
              <Bike className="w-3.5 h-3.5 text-brand" />
              <span>Target Motor:</span>
            </div>

            <div className="relative">
              <button
                type="button"
                onClick={() => setShowMotorMenu(!showMotorMenu)}
                className="flex items-center gap-1 font-bold text-ink hover:text-brand bg-white px-2 py-1 rounded border border-neutral-300 text-xs shadow-xs"
              >
                <span>{selectedMotor?.name || 'Pilih Ninja Kamu'}</span>
                <ChevronDown className="w-3 h-3" />
              </button>

              {showMotorMenu && (
                <div className="absolute right-0 top-full mt-1 w-44 bg-white border border-neutral-300 rounded shadow-lg z-20 py-1">
                  <button
                    onClick={() => {
                      selectMotor(null);
                      setShowMotorMenu(false);
                    }}
                    className="w-full text-left px-3 py-1.5 text-xs text-neutral-700 hover:bg-neutral-100"
                  >
                    Semua Motor Ninja
                  </button>
                  {motorTypes.map((m) => (
                    <button
                      key={m.id}
                      onClick={() => {
                        selectMotor(m);
                        setShowMotorMenu(false);
                      }}
                      className={`w-full text-left px-3 py-1.5 text-xs ${
                        selectedMotor?.slug === m.slug
                          ? 'bg-brand/10 text-brand font-bold'
                          : 'text-neutral-700 hover:bg-neutral-100'
                      }`}
                    >
                      {m.name}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Message Thread */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-neutral-100/40 text-xs">
            {messages.map((msg) => {
              const isUser = msg.role === 'user';
              return (
                <div
                  key={msg.id}
                  className={`flex gap-2.5 ${isUser ? 'justify-end' : 'justify-start'}`}
                >
                  {!isUser && (
                    <div className="w-7 h-7 rounded bg-ink text-brand flex items-center justify-center flex-shrink-0 mt-0.5 shadow-xs">
                      <Bot className="w-4 h-4" />
                    </div>
                  )}

                  <div className={`max-w-[85%] space-y-2`}>
                    <div
                      className={`p-3 rounded-sm leading-relaxed whitespace-pre-wrap ${
                        isUser
                          ? 'bg-brand text-white font-medium rounded-tr-none shadow-sm'
                          : 'bg-white text-ink border border-neutral-200 rounded-tl-none shadow-subtle'
                      }`}
                    >
                      {msg.text}
                    </div>

                    {/* Suggested Product Cards */}
                    {!isUser && msg.suggested_products && msg.suggested_products.length > 0 && (
                      <div className="space-y-1.5 pt-1">
                        <div className="text-[10px] font-display font-bold uppercase tracking-wider text-neutral-500">
                          Rekomendasi Part Terkait:
                        </div>
                        <div className="grid grid-cols-1 gap-1.5">
                          {msg.suggested_products.map((p) => (
                            <Link
                              key={p.id}
                              to={`/produk/${p.slug || p.code}`}
                              onClick={() => setIsOpen(false)}
                              className="flex items-center gap-2 p-2 bg-white border border-neutral-200 hover:border-brand rounded-sm shadow-subtle transition-all group"
                            >
                              {p.primary_image ? (
                                <img
                                  src={p.primary_image}
                                  alt={p.name}
                                  className="w-10 h-10 object-cover rounded-xs border border-neutral-100"
                                />
                              ) : (
                                <div className="w-10 h-10 bg-neutral-100 rounded-xs flex items-center justify-center text-neutral-400">
                                  <Bike className="w-5 h-5" />
                                </div>
                              )}
                              <div className="flex-1 min-w-0">
                                <div className="text-xs font-bold text-ink truncate group-hover:text-brand">
                                  {p.name}
                                </div>
                                <div className="text-[10px] text-muted-text font-mono">
                                  {p.code} • {formatRupiah(p.price)}
                                </div>
                              </div>
                              <ExternalLink className="w-3.5 h-3.5 text-neutral-400 group-hover:text-brand flex-shrink-0" />
                            </Link>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Quick Replies */}
                    {!isUser && msg.quick_replies && msg.quick_replies.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 pt-1">
                        {msg.quick_replies.map((reply, i) => (
                          <button
                            key={i}
                            type="button"
                            onClick={() => handleSend(reply)}
                            className="px-2.5 py-1 bg-white hover:bg-neutral-50 border border-neutral-300 hover:border-brand text-[11px] text-neutral-700 rounded-full transition-all text-left shadow-2xs font-medium"
                          >
                            {reply}
                          </button>
                        ))}
                      </div>
                    )}

                    {/* Fallback to WhatsApp Button */}
                    {!isUser && msg.fallback_to_whatsapp && (
                      <div className="pt-1">
                        <a
                          href="https://wa.me/6281289892024?text=Halo%20Mas%20Wahyu%2C%20saya%20mau%20konsultasi%20part%20Ninja%202T"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#25D366] hover:bg-[#1EBE5D] text-white text-[11px] font-bold rounded-sm transition-colors shadow-xs"
                        >
                          <MessageCircle className="w-3.5 h-3.5" />
                          Chat WhatsApp Mas Wahyu
                        </a>
                      </div>
                    )}
                  </div>

                  {isUser && (
                    <div className="w-7 h-7 rounded bg-brand text-white flex items-center justify-center flex-shrink-0 mt-0.5 shadow-xs">
                      <User className="w-4 h-4" />
                    </div>
                  )}
                </div>
              );
            })}

            {loading && (
              <div className="flex gap-2.5 justify-start">
                <div className="w-7 h-7 rounded bg-ink text-brand flex items-center justify-center flex-shrink-0 shadow-xs">
                  <Bot className="w-4 h-4" />
                </div>
                <div className="bg-white border border-neutral-200 p-3 rounded-sm rounded-tl-none shadow-subtle flex items-center gap-1.5 text-neutral-500">
                  <div className="w-1.5 h-1.5 rounded-full bg-brand animate-pulse"></div>
                  <div className="w-1.5 h-1.5 rounded-full bg-brand animate-pulse delay-75"></div>
                  <div className="w-1.5 h-1.5 rounded-full bg-brand animate-pulse delay-150"></div>
                  <span className="text-[11px] ml-1">Mas Wahyu AI sedang mengetik...</span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Footer */}
          <div className="p-3 bg-white border-t border-neutral-200">
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Tanyakan part, masalah KIPS, oli, atau karbu..."
                className="flex-1 px-3 py-2 text-xs border border-neutral-300 focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand rounded-sm"
                disabled={loading}
              />
              <button
                type="button"
                onClick={() => handleSend()}
                disabled={!input.trim() || loading}
                className="px-3.5 py-2 bg-brand hover:bg-brand-dark text-white rounded-sm disabled:opacity-50 transition-colors shadow-xs"
                aria-label="Kirim"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
            <div className="text-[10px] text-muted-text mt-1.5 text-center flex items-center justify-center gap-1">
              <Sparkles className="w-2.5 h-2.5 text-amber-500" />
              <span>Ditenagai AI Google Gemini & Inventaris Live PEPSO PARTS</span>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
