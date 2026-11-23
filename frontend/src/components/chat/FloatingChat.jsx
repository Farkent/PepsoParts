import React, { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  X,
  Send,
  Sparkles,
  Bot,
  User,
  ExternalLink,
  MessageCircle,
  Bike,
  ChevronDown,
  ArrowUp,
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
      text: 'Halo Bro! 🏍️ Saya Mas Wahyu AI — asisten teknis cerdas spesialis suku cadang original Kawasaki Ninja 150 2-Tak (Ninja R, RR, SS). Ada part yang lagi kamu cari atau mau konsultasi seputar mesin 2T?',
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
          text: 'Maaf Bro, respons AI terhambat. Tapi jangan khawatir, kamu bisa langsung konsultasi fisik & ketersediaan part ke Mas Wahyu via WhatsApp ya!',
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
      {/* ─── Chat Window Modal / Sheet ─── */}
      {isOpen && (
        <div className="fixed bottom-20 sm:bottom-24 right-4 sm:right-6 w-[92vw] sm:w-[410px] h-[560px] max-h-[76vh] bg-white border border-neutral-200 rounded-2xl shadow-2xl z-50 flex flex-col overflow-hidden animate-in fade-in zoom-in-95 slide-in-from-bottom-5 duration-200">
          {/* Header Hijau seperti Referensi Gambar */}
          <div className="bg-[#1B6B38] text-white p-3.5 flex items-center justify-between relative z-10 shadow-sm">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full bg-white/20 border border-white/30 flex items-center justify-center text-white font-bold text-xs">
                <Bot className="w-4 h-4" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-display font-bold uppercase tracking-wider text-sm text-white">
                    Mas Wahyu - AI Advisor
                  </h3>
                  <span className="px-1.5 py-0.5 bg-white/20 text-white text-[9px] font-mono font-bold uppercase rounded">
                    Ninja 2T
                  </span>
                </div>
                <p className="text-[10px] text-white/80 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-green-300 animate-pulse inline-block"></span>
                  Konsultan Ahli Kawasaki Ninja 2-Tak
                </p>
              </div>
            </div>

            <button
              onClick={() => setIsOpen(false)}
              className="text-white/80 hover:text-white p-1.5 rounded-full hover:bg-white/10 transition-colors"
              aria-label="Tutup Obrolan"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Subheader: Target Motor Selector */}
          <div className="bg-neutral-50 px-3.5 py-2 border-b border-neutral-200 flex items-center justify-between text-xs">
            <div className="flex items-center gap-1.5 text-neutral-600 font-medium">
              <Bike className="w-3.5 h-3.5 text-[#1B6B38]" />
              <span>Target Motor:</span>
            </div>

            <div className="relative">
              <button
                type="button"
                onClick={() => setShowMotorMenu(!showMotorMenu)}
                className="flex items-center gap-1 font-bold text-ink hover:text-[#1B6B38] bg-white px-2 py-1 rounded border border-neutral-300 text-xs shadow-2xs"
              >
                <span>{selectedMotor?.name || 'Pilih Ninja Kamu'}</span>
                <ChevronDown className="w-3 h-3" />
              </button>

              {showMotorMenu && (
                <div className="absolute right-0 top-full mt-1 w-44 bg-white border border-neutral-300 rounded-md shadow-lg z-20 py-1">
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
                          ? 'bg-[#1B6B38]/10 text-[#1B6B38] font-bold'
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
                    <div className="w-7 h-7 rounded-full bg-[#1B6B38] text-white flex items-center justify-center flex-shrink-0 mt-0.5 shadow-xs">
                      <Bot className="w-3.5 h-3.5" />
                    </div>
                  )}

                  <div className="max-w-[85%] space-y-2">
                    <div
                      className={`p-3.5 rounded-2xl leading-relaxed whitespace-pre-wrap ${
                        isUser
                          ? 'bg-[#1B6B38] text-white font-medium rounded-tr-xs shadow-xs'
                          : 'bg-white text-ink border border-neutral-200 rounded-tl-xs shadow-xs'
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
                              className="flex items-center gap-2 p-2 bg-white border border-neutral-200 hover:border-[#1B6B38] rounded-xl shadow-xs transition-all group"
                            >
                              {p.primary_image ? (
                                <img
                                  src={p.primary_image}
                                  alt={p.name}
                                  className="w-10 h-10 object-cover rounded-md border border-neutral-100"
                                />
                              ) : (
                                <div className="w-10 h-10 bg-neutral-100 rounded-md flex items-center justify-center text-neutral-400">
                                  <Bike className="w-5 h-5" />
                                </div>
                              )}
                              <div className="flex-1 min-w-0">
                                <div className="text-xs font-bold text-ink truncate group-hover:text-[#1B6B38]">
                                  {p.name}
                                </div>
                                <div className="text-[10px] text-muted-text font-mono">
                                  {p.code} • {formatRupiah(p.price)}
                                </div>
                              </div>
                              <ExternalLink className="w-3.5 h-3.5 text-neutral-400 group-hover:text-[#1B6B38] flex-shrink-0" />
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
                            className="px-3 py-1 bg-white hover:bg-neutral-50 border border-neutral-300 hover:border-[#1B6B38] text-[11px] text-neutral-700 rounded-full transition-all text-left shadow-2xs font-medium"
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
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#25D366] hover:bg-[#1EBE5D] text-white text-[11px] font-bold rounded-full transition-colors shadow-xs"
                        >
                          <MessageCircle className="w-3.5 h-3.5" />
                          Chat WhatsApp Mas Wahyu
                        </a>
                      </div>
                    )}
                  </div>

                  {isUser && (
                    <div className="w-7 h-7 rounded-full bg-neutral-800 text-white flex items-center justify-center flex-shrink-0 mt-0.5 shadow-xs">
                      <User className="w-4 h-4" />
                    </div>
                  )}
                </div>
              );
            })}

            {loading && (
              <div className="flex gap-2.5 justify-start">
                <div className="w-7 h-7 rounded-full bg-[#1B6B38] text-white flex items-center justify-center flex-shrink-0 shadow-xs">
                  <Bot className="w-3.5 h-3.5" />
                </div>
                <div className="bg-white border border-neutral-200 p-3 rounded-2xl rounded-tl-xs shadow-xs flex items-center gap-1.5 text-neutral-500">
                  <div className="w-1.5 h-1.5 rounded-full bg-[#1B6B38] animate-pulse"></div>
                  <div className="w-1.5 h-1.5 rounded-full bg-[#1B6B38] animate-pulse delay-75"></div>
                  <div className="w-1.5 h-1.5 rounded-full bg-[#1B6B38] animate-pulse delay-150"></div>
                  <span className="text-[11px] ml-1">Mas Wahyu AI sedang mengetik...</span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Footer seperti Gambar Referensi */}
          <div className="p-3 bg-white border-t border-neutral-200">
            <div className="flex items-center gap-2 bg-neutral-100 rounded-2xl px-3 py-1.5 border border-neutral-200 focus-within:border-[#1B6B38] focus-within:ring-1 focus-within:ring-[#1B6B38]">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Tulis pesanmu..."
                className="flex-1 bg-transparent py-1.5 text-xs text-ink placeholder:text-neutral-400 focus:outline-none"
                disabled={loading}
              />
              <button
                type="button"
                onClick={() => handleSend()}
                disabled={!input.trim() || loading}
                className="w-8 h-8 rounded-full bg-[#1B6B38] hover:bg-[#155d30] disabled:bg-neutral-300 text-white flex items-center justify-center transition-all disabled:cursor-not-allowed shadow-xs"
                aria-label="Kirim"
              >
                <ArrowUp className="w-4 h-4 stroke-[2.5]" />
              </button>
            </div>
            <div className="text-[10px] text-muted-text mt-1.5 text-center flex items-center justify-center gap-1">
              <Sparkles className="w-2.5 h-2.5 text-[#1B6B38]" />
              <span>Ditenagai AI Google Gemini · Mas Wahyu AI</span>
            </div>
          </div>
        </div>
      )}

      {/* ─── Floating Launcher Button with Rotating Morph Animation ─── */}
      <div className="fixed bottom-5 right-5 sm:bottom-6 sm:right-6 z-50 flex flex-col items-end">
        {/* Proactive Bubble saat Chat Ditutup */}
        {!isOpen && showBubble && (
          <div
            className="mb-3 max-w-[280px] sm:max-w-xs bg-ink text-white text-xs p-3 rounded-xl shadow-2xl border border-neutral-700 animate-in fade-in slide-in-from-bottom-2 relative group cursor-pointer"
            onClick={() => {
              setIsOpen(true);
              setShowBubble(false);
            }}
          >
            <button
              onClick={(e) => {
                e.stopPropagation();
                setShowBubble(false);
              }}
              className="absolute top-1.5 right-1.5 text-neutral-400 hover:text-white text-xs p-0.5"
              aria-label="Tutup"
            >
              <X className="w-3.5 h-3.5" />
            </button>
            <div className="flex items-start gap-2.5 pr-3">
              <div className="w-7 h-7 rounded-full bg-green-500/20 flex items-center justify-center flex-shrink-0 text-green-400 mt-0.5 border border-green-500/40">
                <Sparkles className="w-4 h-4 animate-spin text-green-400" />
              </div>
              <div>
                <div className="font-bold text-[11px] uppercase tracking-wider text-green-400 font-display flex items-center gap-1">
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

        {/* Tombol Bundar Hijau (Berganti ke 'X' dengan Animasi Putar & Skala) */}
        <button
          onClick={() => {
            setIsOpen((prev) => !prev);
            if (!isOpen) setShowBubble(false);
          }}
          className="relative w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-[#1B6B38] hover:bg-[#155d30] text-white flex items-center justify-center shadow-[0_8px_25px_rgba(27,107,56,0.45)] hover:shadow-[0_12px_32px_rgba(27,107,56,0.6)] hover:scale-105 active:scale-95 transition-all duration-300 focus:outline-none z-50 cursor-pointer overflow-hidden"
          aria-label={isOpen ? 'Tutup chat asisten' : 'Buka chat asisten'}
        >
          {/* 1. Ikon Chat Bag (Tampil saat chat ditutup) */}
          <div
            className={`absolute inset-0 flex items-center justify-center transition-all duration-300 ease-out transform ${
              isOpen
                ? 'rotate-90 scale-0 opacity-0 pointer-events-none'
                : 'rotate-0 scale-100 opacity-100'
            }`}
          >
            {/* Bentuk bubble tas belanja persis seperti gambar yang diunggah */}
            <svg
              viewBox="0 0 36 36"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              className="w-7 h-7 sm:w-8 sm:h-8 drop-shadow-xs"
            >
              {/* Gelembung chat putih dengan ekor di kanan bawah */}
              <path
                d="M7 6C5.34315 6 4 7.34315 4 9V20C4 21.6569 5.34315 23 7 23H22.5L27 27V9C27 7.34315 25.6569 6 24 6H7Z"
                fill="white"
              />
              {/* Handle tas U shape berwarna hijau senada */}
              <path
                d="M12.5 10.5V13C12.5 14.933 14.067 16.5 16 16.5C17.933 16.5 19.5 14.933 19.5 13V10.5"
                stroke="#1B6B38"
                strokeWidth="2.4"
                strokeLinecap="round"
              />
            </svg>
          </div>

          {/* 2. Ikon 'X' (Tampil saat chat terbuka dengan animasi putar balik) */}
          <div
            className={`absolute inset-0 flex items-center justify-center transition-all duration-300 ease-out transform ${
              isOpen
                ? 'rotate-0 scale-100 opacity-100'
                : '-rotate-90 scale-0 opacity-0 pointer-events-none'
            }`}
          >
            <X className="w-7 h-7 sm:w-8 sm:h-8 text-white stroke-[2.8]" />
          </div>
        </button>
      </div>
    </>
  );
}
