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
} from 'lucide-react';
import { aiChat } from '../../api/endpoints';
import { useMotor } from '../../context/MotorContext';
import { formatRupiah } from '../../utils/format';

export default function FloatingChat() {
  const [isOpen, setIsOpen] = useState(false);
  const { selectedMotor, motorTypes, selectMotor } = useMotor();

  const [messages, setMessages] = useState([
    {
      id: 1,
      role: 'model',
      text: 'Halo Bro! Selamat datang di PEPSO PARTS. Saya asisten virtual spesialis sparepart bekas original Kawasaki Ninja 2-Tak (Ninja R, RR, SS) milik Mas Wahyu. Ada part yang lagi dicari?',
      suggested_products: [],
      quick_replies: [
        'Blok Seher Ninja RR',
        'Knalpot Standar Racing',
        'Karburator Keihin PWK/PWL',
        'Cek stok ready hari ini',
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

      if (res.data && res.data.success) {
        const data = res.data.data;
        const botMsg = {
          id: Date.now() + 1,
          role: 'model',
          text: data.text,
          suggested_products: data.suggested_products || [],
          quick_replies: data.quick_replies || [],
          fallback_to_whatsapp: data.fallback_to_whatsapp || false,
        };
        setMessages((prev) => [...prev, botMsg]);
      } else {
        throw new Error('Respon tidak valid');
      }
    } catch (err) {
      console.error('Chat error:', err);
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now() + 1,
          role: 'model',
          text: 'Maaf Bro, jaringan sedang sibuk. Silakan tanyakan langsung ke Mas Wahyu melalui WhatsApp ya!',
          suggested_products: [],
          quick_replies: ['Tanya via WhatsApp'],
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
      {/* ─── Floating Launcher Button ────────────────────────────────────── */}
      <div className="fixed bottom-6 right-6 z-50">
        {!isOpen && (
          <button
            onClick={() => setIsOpen(true)}
            className="flex items-center gap-2.5 px-4 py-3 bg-brand hover:bg-brand-dark text-white rounded-full shadow-xl transition-all duration-300 hover:scale-105 group border-2 border-white/20 focus:outline-none"
            aria-label="Tanya AI Asisten"
          >
            <Sparkles className="w-5 h-5 animate-pulse text-amber-200" />
            <span className="font-display font-bold uppercase tracking-wider text-xs hidden sm:inline-block">
              Tanya AI Ninja 2T
            </span>
          </button>
        )}
      </div>

      {/* ─── Chat Window Modal / Sheet ──────────────────────────────────── */}
      {isOpen && (
        <div className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 w-[95vw] sm:w-[420px] h-[580px] max-h-[85vh] bg-white border border-neutral-300 rounded-sm shadow-2xl z-50 flex flex-col overflow-hidden animate-in fade-in slide-in-from-bottom-5">
          {/* Header */}
          <div className="bg-ink text-white p-3.5 flex items-center justify-between border-b border-neutral-800">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full bg-brand flex items-center justify-center text-white font-bold">
                <Bot className="w-4 h-4" />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <h3 className="font-display font-extrabold uppercase text-sm tracking-wider">
                    Asisten PEPSO PARTS
                  </h3>
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                </div>
                <p className="text-[10px] text-neutral-400">Katalog & Konsultasi Ninja 2-Tak</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsOpen(false)}
                className="p-1 text-neutral-400 hover:text-white transition-colors"
                aria-label="Tutup Chat"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Motor Selector Subheader */}
          <div className="bg-neutral-900 px-3.5 py-1.5 text-xs text-neutral-300 flex items-center justify-between border-b border-neutral-800 relative">
            <div className="flex items-center gap-1.5">
              <Bike className="w-3.5 h-3.5 text-brand" />
              <span className="text-[11px] text-neutral-400">Motor Anda:</span>
              <button
                onClick={() => setShowMotorMenu(!showMotorMenu)}
                className="font-bold text-white hover:text-brand flex items-center gap-1 text-[11px]"
              >
                {selectedMotor ? selectedMotor.name : 'Pilih Motor'}
                <ChevronDown className="w-3 h-3 text-neutral-400" />
              </button>
            </div>

            {selectedMotor && (
              <button
                onClick={() => selectMotor(null)}
                className="text-[10px] text-neutral-400 hover:text-red-400"
              >
                Reset
              </button>
            )}

            {/* Dropdown Menu Tipe Motor */}
            {showMotorMenu && (
              <div className="absolute top-full left-3 bg-white text-ink border border-neutral-200 rounded-sm shadow-lg py-1 z-30 w-48 mt-1">
                <button
                  type="button"
                  onClick={() => {
                    selectMotor(null);
                    setShowMotorMenu(false);
                  }}
                  className="w-full text-left px-3 py-1.5 text-xs hover:bg-neutral-100"
                >
                  Semua Tipe Motor
                </button>
                {motorTypes.map((m) => (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => {
                      selectMotor(m);
                      setShowMotorMenu(false);
                    }}
                    className={`w-full text-left px-3 py-1.5 text-xs hover:bg-neutral-100 ${
                      selectedMotor?.id === m.id ? 'font-bold text-brand bg-orange-50' : ''
                    }`}
                  >
                    {m.name}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Message Thread */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-neutral-50/70 text-xs">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex gap-2.5 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                {msg.role === 'model' && (
                  <div className="w-6 h-6 rounded-full bg-brand flex-shrink-0 flex items-center justify-center text-white mt-1">
                    <Bot className="w-3.5 h-3.5" />
                  </div>
                )}

                <div
                  className={`max-w-[85%] rounded-sm p-3 space-y-2.5 shadow-sm leading-relaxed ${
                    msg.role === 'user'
                      ? 'bg-ink text-white font-medium rounded-tr-none'
                      : 'bg-white text-ink border border-neutral-200 rounded-tl-none'
                  }`}
                >
                  <p className="whitespace-pre-line">{msg.text}</p>

                  {/* Suggested Products Cards */}
                  {msg.suggested_products && msg.suggested_products.length > 0 && (
                    <div className="pt-2 border-t border-neutral-100 space-y-2">
                      <span className="font-bold text-[10px] uppercase text-muted-text tracking-wider">
                        Rekomendasi Part:
                      </span>
                      {msg.suggested_products.map((p) => (
                        <Link
                          key={p.id}
                          to={`/produk/${p.slug || p.id}`}
                          onClick={() => setIsOpen(false)}
                          className="flex items-center gap-2.5 p-2 bg-neutral-50 hover:bg-orange-50/50 border border-neutral-200 rounded-sm transition-colors group"
                        >
                          {p.primary_image ? (
                            <img
                              src={p.primary_image}
                              alt={p.name}
                              className="w-10 h-10 object-cover rounded-sm border border-neutral-200 flex-shrink-0"
                            />
                          ) : (
                            <div className="w-10 h-10 bg-neutral-200 rounded-sm flex items-center justify-center text-[9px] text-neutral-500 flex-shrink-0">
                              Foto
                            </div>
                          )}
                          <div className="min-w-0 flex-1">
                            <span className="text-[9px] font-mono font-bold text-brand block">
                              {p.code}
                            </span>
                            <p className="font-bold text-ink truncate text-xs group-hover:text-brand">
                              {p.name}
                            </p>
                            <span className="font-mono font-bold text-neutral-900 text-[11px]">
                              {formatRupiah(p.price)}
                            </span>
                          </div>
                          <ExternalLink className="w-3.5 h-3.5 text-neutral-400 group-hover:text-brand" />
                        </Link>
                      ))}
                    </div>
                  )}

                  {/* Fallback to WhatsApp Button */}
                  {msg.fallback_to_whatsapp && (
                    <div className="pt-2">
                      <a
                        href="https://wa.me/628123456789?text=Halo%20Mas%20Wahyu%2C%20saya%20mau%20tanya%20sparepart%20Ninja%202T"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-sm text-[11px] font-bold uppercase tracking-wider"
                      >
                        <MessageCircle className="w-3.5 h-3.5" />
                        Chat WhatsApp Mas Wahyu
                      </a>
                    </div>
                  )}

                  {/* Quick Replies */}
                  {msg.quick_replies && msg.quick_replies.length > 0 && (
                    <div className="pt-2 flex flex-wrap gap-1.5">
                      {msg.quick_replies.map((reply, i) => (
                        <button
                          key={i}
                          type="button"
                          onClick={() => handleSend(reply)}
                          className="px-2.5 py-1 bg-neutral-100 hover:bg-orange-100 hover:text-brand text-neutral-700 text-[10px] font-semibold rounded-sm transition-colors border border-neutral-200"
                        >
                          {reply}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {msg.role === 'user' && (
                  <div className="w-6 h-6 rounded-full bg-neutral-300 flex-shrink-0 flex items-center justify-center text-ink mt-1">
                    <User className="w-3.5 h-3.5" />
                  </div>
                )}
              </div>
            ))}

            {loading && (
              <div className="flex gap-2.5 items-center text-muted-text text-xs italic">
                <Bot className="w-4 h-4 text-brand animate-spin" />
                <span>Asisten PEPSO sedang memeriksa stok...</span>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Bar */}
          <div className="p-3 bg-white border-t border-neutral-200 flex items-center gap-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ketik pertanyaan (cth: Blok seher 1855 ready?)..."
              disabled={loading}
              className="flex-1 text-xs h-9 px-3 border border-neutral-300 rounded-sm focus:outline-none focus:border-brand text-ink"
            />
            <button
              onClick={() => handleSend()}
              disabled={!input.trim() || loading}
              className="w-9 h-9 bg-brand hover:bg-brand-dark disabled:bg-neutral-300 text-white rounded-sm flex items-center justify-center transition-colors flex-shrink-0"
              aria-label="Kirim Pesan"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </>
  );
}
