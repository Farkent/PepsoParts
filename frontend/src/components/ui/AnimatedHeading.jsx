import React, { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

/**
 * AnimatedHeading:
 * Memecah teks judul menjadi kata-kata (wrap tiap kata dengan span inline-block di dalam container overflow-hidden),
 * lalu menganimasikan tiap kata muncul dari bawah ke atas (y: 100% -> 0, opacity: 0 -> 1)
 * dengan efek stagger saat masuk ke viewport menggunakan GSAP ScrollTrigger.
 */
export default function AnimatedHeading({
  children,
  text,
  as: Component = 'h1',
  className = '',
  stagger = 0.06,
  duration = 0.75,
  delay = 0,
  startTrigger = 'top 88%',
  once = true,
  ...props
}) {
  const headingRef = useRef(null);
  const content = text || (typeof children === 'string' ? children : '');

  // Pecah teks menjadi kata-kata berdasarkan spasi
  const words = content ? content.trim().split(/\s+/) : [];

  useEffect(() => {
    if (!headingRef.current || words.length === 0) return;

    const ctx = gsap.context(() => {
      const wordElements = headingRef.current.querySelectorAll('.animated-word-item');

      gsap.fromTo(
        wordElements,
        {
          y: '100%',
          opacity: 0,
        },
        {
          y: '0%',
          opacity: 1,
          duration,
          delay,
          ease: 'power3.out',
          stagger,
          scrollTrigger: {
            trigger: headingRef.current,
            start: startTrigger,
            once,
          },
        }
      );
    }, headingRef);

    return () => ctx.revert();
  }, [content, duration, delay, stagger, startTrigger, once, words.length]);

  if (!content) {
    return <Component className={className} {...props}>{children}</Component>;
  }

  return (
    <Component ref={headingRef} className={className} {...props}>
      {words.map((word, index) => (
        <span
          key={index}
          className="inline-block overflow-hidden align-top mr-[0.24em] last:mr-0 leading-tight"
        >
          <span className="inline-block animated-word-item will-change-transform">
            {word}
          </span>
        </span>
      ))}
    </Component>
  );
}
