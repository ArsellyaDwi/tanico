'use client';

import { motion, useMotionValue, useSpring, AnimatePresence } from 'motion/react';
import { useEffect, useState, useRef } from 'react';

// Custom full-color premium flat vector SVGs for vegetable and plant ecosystem
const VEGETABLE_SVGS = {
  carrot: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M16 8C17.5 6.5 18.5 4.5 18.5 4.5C18.5 4.5 16.5 5 15 6.5" stroke="#84CC16" strokeWidth="2.2" strokeLinecap="round" />
      <path d="M15 7C15.8 5.8 16 4 16 4C16 4 14.2 4.2 13 5" stroke="#4D8B55" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M15.5 6.5L17.5 8.5C18 9 14 14 10 18L5 21C5 21 6 18 8 14C12 10 15 7 15.5 6.5Z" fill="#F97316" />
      <path d="M12.5 10.5L14 12" stroke="#EA580C" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  ),
  tomato: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="12" cy="13" r="8.5" fill="#EF4444" />
      <path d="M12 5.5V2" stroke="#84CC16" strokeWidth="2" strokeLinecap="round" />
      <path d="M12 5C10 5 8 4.5 8 4.5C8 4.5 10.5 5.5 12 5.5C13.5 5.5 16 4.5 16 4.5C16 4.5 14 5 12 5Z" fill="#4D8B55" />
      <circle cx="9" cy="9.5" r="1.8" fill="white" fillOpacity="0.6" />
    </svg>
  ),
  broccoli: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M10 13H14V19C14 20.1 13.1 21 12 21C10.9 21 10 20.1 10 19V12Z" fill="#84CC16" />
      <circle cx="8.5" cy="10.5" r="4.5" fill="#174C3C" />
      <circle cx="15.5" cy="10.5" r="4.5" fill="#174C3C" />
      <circle cx="12" cy="7.5" r="5" fill="#4D8B55" />
    </svg>
  ),
  chili: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M15 5L13.5 3" stroke="#174C3C" strokeWidth="2.2" strokeLinecap="round" />
      <path d="M16 6.5C15 8.5 13.5 10.5 11.5 13.5C9.5 16.5 7 19.5 5 21C5 21 6.5 19.5 8.5 16.5C10.5 13.5 13 10.5 15 7.5C15.8 6.3 16.5 6 16 6.5Z" fill="#22C55E" />
    </svg>
  ),
  mushroom: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M10 12H14V19C14 20.1 13.1 21 12 21C10.9 21 10 20.1 10 19V12Z" fill="#E2E8F0" />
      <path d="M5 12C5 7.5 8.1 4.5 12 4.5C15.9 4.5 19 7.5 19 12H5Z" fill="#D6B38A" />
      <circle cx="8.5" cy="8.5" r="1.2" fill="white" fillOpacity="0.8" />
      <circle cx="15.5" cy="8.5" r="1.2" fill="white" fillOpacity="0.8" />
    </svg>
  ),
  lettuce: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="12" cy="12" r="8" fill="#84CC16" fillOpacity="0.25" />
      <path d="M12 4C10 4 7 6 7 11C7 15 9 19 12 20" stroke="#84CC16" strokeWidth="2" strokeLinecap="round" />
      <path d="M12 4C14 4 17 6 17 11C17 15 15 19 12 20" stroke="#84CC16" strokeWidth="2" strokeLinecap="round" />
      <path d="M12 4V20" stroke="#4D8B55" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  ),
  spinach: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M12 3C8.5 3 5.5 6.5 5.5 10.5C5.5 14.5 8.5 17.5 12 21C15.5 17.5 18.5 14.5 18.5 10.5C18.5 6.5 15.5 3 12 3Z" fill="#4D8B55" fillOpacity="0.25" />
      <path d="M12 3C8.5 3 5.5 6.5 5.5 10.5C5.5 14.5 8.5 17.5 12 21" stroke="#4D8B55" strokeWidth="2" strokeLinecap="round" />
      <path d="M12 21C15.5 17.5 18.5 14.5 18.5 10.5C18.5 6.5 15.5 3 12 3" stroke="#4D8B55" strokeWidth="2" strokeLinecap="round" />
      <path d="M12 3V21" stroke="#174C3C" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  ),
  leaf: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M12 2C12 2 4 7 4 13C4 17.5 7.5 21 12 21C16.5 21 20 17.5 20 13C20 7 12 2 12 2Z" fill="#4D8B55" fillOpacity="0.32" stroke="#174C3C" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
};

const selectRarityType = () => {
  const r = Math.random() * 100;
  if (r < 55) {
    const leafTypes = ['leaf', 'lettuce', 'spinach'];
    return leafTypes[Math.floor(Math.random() * leafTypes.length)];
  } else if (r < 75) {
    return 'carrot';
  } else if (r < 85) {
    return 'tomato';
  } else if (r < 92) {
    return 'broccoli';
  } else if (r < 97) {
    return 'chili';
  } else {
    return 'mushroom';
  }
};

export default function PremiumCursor() {
  const [isHovering, setIsHovering] = useState(false);
  const [hoverType, setHoverType] = useState('default'); // 'default' | 'cta' | 'media'
  const [activeGroup, setActiveGroup] = useState(null);

  // Framer Motion MotionValues for cursor position & visibility
  const cursorX = useMotionValue(-100);
  const cursorY = useMotionValue(-100);
  const cursorOpacity = useMotionValue(0);

  // High-fidelity spring values for core dot
  const mouseX = useSpring(cursorX, { stiffness: 450, damping: 35 });
  const mouseY = useSpring(cursorY, { stiffness: 450, damping: 35 });

  // Outer companion ring
  const ringX = useSpring(cursorX, { stiffness: 190, damping: 24 });
  const ringY = useSpring(cursorY, { stiffness: 190, damping: 24 });

  const lastSpawnTime = useRef(0);
  const lastSpawnPos = useRef({ x: 0, y: 0 });
  const idleTimerRef = useRef(null);
  const activeGroupRef = useRef(null);
  const rafMoveRef = useRef(null);
  const latestMousePos = useRef({ x: -100, y: -100 });

  useEffect(() => {
    // Disable entirely on touch devices or small screens
    if (typeof window === 'undefined') return;
    const isTouch = window.matchMedia('(pointer: coarse)').matches || window.innerWidth < 768;
    if (isTouch) return;

    const processMouseMove = () => {
      const { x, y } = latestMousePos.current;
      cursorX.set(x);
      cursorY.set(y);

      if (cursorOpacity.get() === 0) {
        cursorOpacity.set(1);
      }

      const now = Date.now();
      const distanceMoved = Math.hypot(x - lastSpawnPos.current.x, y - lastSpawnPos.current.y);

      // Spawn subtle burst when cursor moves significantly (>60px) and at least 500ms has passed
      if ((distanceMoved > 60 && (now - lastSpawnTime.current > 500)) || (!activeGroupRef.current && distanceMoved > 40 && (now - lastSpawnTime.current > 600))) {
        lastSpawnTime.current = now;
        lastSpawnPos.current = { x, y };

        const count = 2; // Lightweight 2 particles
        const items = [];

        for (let i = 0; i < count; i++) {
          const type = selectRarityType();
          const angle = Math.random() * Math.PI * 2;
          const radius = 18 + Math.random() * 14;
          const offsetX = Math.cos(angle) * radius;
          const offsetY = Math.sin(angle) * radius;

          items.push({
            id: Math.random().toString(36).substring(2, 9),
            type,
            offsetX,
            offsetY,
            scale: 0.75 + Math.random() * 0.2,
            rotate: (Math.random() - 0.5) * 30,
            driftX: (Math.random() - 0.5) * 6,
            driftY: -6 - Math.random() * 8,
          });
        }

        const newGroup = {
          id: Math.random().toString(36).substring(2, 9),
          x,
          y,
          items
        };
        activeGroupRef.current = newGroup;
        setActiveGroup(newGroup);
      }

      // Reset idle timer to hide burst when stationary
      if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
      idleTimerRef.current = setTimeout(() => {
        activeGroupRef.current = null;
        setActiveGroup(null);
      }, 300);

      rafMoveRef.current = null;
    };

    const onMouseMove = (e) => {
      latestMousePos.current = { x: e.clientX, y: e.clientY };
      if (!rafMoveRef.current) {
        rafMoveRef.current = requestAnimationFrame(processMouseMove);
      }
    };

    const handleMouseLeave = () => {
      cursorOpacity.set(0);
    };

    const handleMouseEnter = () => {
      cursorOpacity.set(1);
    };

    window.addEventListener('mousemove', onMouseMove, { passive: true });
    document.addEventListener('mouseleave', handleMouseLeave, { passive: true });
    document.addEventListener('mouseenter', handleMouseEnter, { passive: true });

    // Event delegation on document.body for hover states
    const handleMouseOver = (e) => {
      const target = e.target;
      if (!target || !(target instanceof Element)) return;

      const btn = target.closest('button, a, [role="button"], input[type="submit"], select, textarea, .cursor-hover');
      if (btn) {
        setIsHovering(true);
        if (btn.classList.contains('cta-button') || btn.tagName === 'BUTTON' || btn.classList.contains('cursor-hover-cta')) {
          setHoverType('cta');
        } else {
          setHoverType('default');
        }
        return;
      }

      const media = target.closest('img, .group, .product-card, .tilt-card, .featured-card, .category-card');
      if (media) {
        setIsHovering(true);
        setHoverType('media');
        return;
      }

      setIsHovering(false);
      setHoverType('default');
    };

    const handleMouseOut = (e) => {
      if (!e.relatedTarget) {
        setIsHovering(false);
        setHoverType('default');
      }
    };

    document.body.addEventListener('mouseover', handleMouseOver, { passive: true });
    document.body.addEventListener('mouseout', handleMouseOut, { passive: true });

    return () => {
      if (rafMoveRef.current) cancelAnimationFrame(rafMoveRef.current);
      window.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseleave', handleMouseLeave);
      document.removeEventListener('mouseenter', handleMouseEnter);
      document.body.removeEventListener('mouseover', handleMouseOver);
      document.body.removeEventListener('mouseout', handleMouseOut);
      if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
    };
  }, [cursorX, cursorY, cursorOpacity]);

  return (
    <>
      {/* 1. OUTER SLOW-FOLLOW CO-RING */}
      <motion.div
        className="pointer-events-none fixed left-0 top-0 z-[9998] hidden md:block"
        style={{
          x: ringX,
          y: ringY,
          opacity: cursorOpacity,
          translateX: '-50%',
          translateY: '-50%',
        }}
      >
        <motion.div
          animate={{
            width: hoverType === 'cta' ? 28 : hoverType === 'media' ? 24 : 16,
            height: hoverType === 'cta' ? 28 : hoverType === 'media' ? 24 : 16,
            borderColor: hoverType === 'cta' ? 'rgba(77, 139, 85, 0.65)' : 'rgba(23, 76, 60, 0.35)',
            backgroundColor: hoverType === 'cta' ? 'rgba(77, 139, 85, 0.06)' : 'rgba(23, 76, 60, 0.01)',
          }}
          transition={{
            type: 'spring',
            stiffness: 220,
            damping: 24,
          }}
          className="rounded-full border will-change-transform"
        />
      </motion.div>

      {/* 2. INNER TRANSPARENT CORE RING */}
      <motion.div
        className="pointer-events-none fixed left-0 top-0 z-[9997] hidden md:block"
        style={{
          x: ringX,
          y: ringY,
          opacity: cursorOpacity,
          translateX: '-50%',
          translateY: '-50%',
        }}
      >
        <motion.div
          animate={{
            width: hoverType === 'cta' ? 14 : hoverType === 'media' ? 11 : 7,
            height: hoverType === 'cta' ? 14 : hoverType === 'media' ? 11 : 7,
          }}
          transition={{
            type: 'spring',
            stiffness: 280,
            damping: 26,
          }}
          className="rounded-full border border-[#174C3C]/12 will-change-transform"
        />
      </motion.div>

      {/* 3. SOLID PRECISION DOT CORE */}
      <motion.div
        className="pointer-events-none fixed left-0 top-0 z-[10000] hidden md:block"
        style={{
          x: mouseX,
          y: mouseY,
          opacity: cursorOpacity,
          translateX: '-50%',
          translateY: '-50%',
        }}
      >
        <motion.div
          animate={{
            scale: isHovering ? 0.6 : 1,
            backgroundColor: hoverType === 'cta' ? '#4D8B55' : '#174C3C',
          }}
          transition={{
            type: 'spring',
            stiffness: 450,
            damping: 24,
          }}
          className="w-1.5 h-1.5 rounded-full shadow-[0_1px_4px_rgba(23,76,60,0.35)] will-change-transform"
        />
      </motion.div>

      {/* 4. PREMIUM COMPACT ORGANIC BURST EFFECT */}
      <div className="pointer-events-none fixed inset-0 z-[9999] overflow-hidden hidden md:block">
        <AnimatePresence>
          {activeGroup && (
            <div
              key={activeGroup.id}
              className="absolute inset-0 pointer-events-none"
            >
              {activeGroup.items.map((item) => {
                const itemX = activeGroup.x + item.offsetX;
                const itemY = activeGroup.y + item.offsetY;

                return (
                  <motion.div
                    key={item.id}
                    initial={{
                      opacity: 0,
                      scale: 0.8,
                      x: itemX,
                      y: itemY,
                      rotate: item.rotate
                    }}
                    animate={{
                      opacity: 0.8,
                      scale: 1.0,
                      x: itemX + item.driftX,
                      y: itemY + item.driftY,
                      rotate: item.rotate * 1.3
                    }}
                    exit={{
                      opacity: 0,
                      scale: 0.8,
                      y: itemY + item.driftY - 8,
                    }}
                    transition={{
                      duration: 0.45,
                      ease: [0.22, 1, 0.36, 1],
                    }}
                    className="absolute pointer-events-none select-none origin-center"
                    style={{
                      left: 0,
                      top: 0,
                      translateX: '-50%',
                      translateY: '-50%',
                      width: 18 * item.scale,
                      height: 18 * item.scale,
                    }}
                  >
                    <div style={{ transform: `scale(${item.scale})`, transformOrigin: 'center' }}>
                      {VEGETABLE_SVGS[item.type]}
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </AnimatePresence>
      </div>
    </>
  );
}
