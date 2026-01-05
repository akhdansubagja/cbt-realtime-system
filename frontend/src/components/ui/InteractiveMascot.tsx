"use client";

import { useMantineTheme } from "@mantine/core";
import { useMove } from "@mantine/hooks";
import { useEffect, useState, useRef } from "react";
import { motion } from "framer-motion";

interface InteractiveMascotProps {
  variant?: "idle" | "typing" | "success" | "thinking";
  size?: number;
}

export const InteractiveMascot = ({
  variant = "idle",
  size = 120,
}: InteractiveMascotProps) => {
  const theme = useMantineTheme();
  
  // Track mouse for eye movement
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleMouseMove = (event: MouseEvent) => {
      if (ref.current) {
        const rect = ref.current.getBoundingClientRect();
        // Calculate relative position from center of mascot
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;
        
        // Normalize range -1 to 1
        const x = (event.clientX - centerX) / (window.innerWidth / 2);
        const y = (event.clientY - centerY) / (window.innerHeight / 2);
        
        setMousePos({ 
            x: Math.max(-1, Math.min(1, x)), 
            y: Math.max(-1, Math.min(1, y)) 
        });
      }
    };

    if (variant === "idle" || variant === "success") {
        window.addEventListener("mousemove", handleMouseMove);
    }
    
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
    };
  }, [variant]);

  // Determine pupil position based on variant
  // Typing: Look down
  // Idle: Follow mouse
  const pupilX = variant === "typing" ? 0 : mousePos.x * 6;
  const pupilY = variant === "typing" ? 8 : mousePos.y * 6;

  // Colors
  const skinColor = theme.colors.violet[1];
  const faceColor = theme.colors.violet[6];
  const eyeColor = "white";
  const pupilColor = theme.colors.dark[9];

  // Blinking Logic
  const [isBlinking, setIsBlinking] = useState(false);

  useEffect(() => {
    let timeoutId: NodeJS.Timeout;

    const tick = () => {
        setIsBlinking(true);
        // Close eyes for 150ms
        setTimeout(() => {
            setIsBlinking(false);
            // Schedule next blink randomly between 2s and 5s
            timeoutId = setTimeout(tick, Math.random() * 3000 + 2000);
        }, 150);
    };

    timeoutId = setTimeout(tick, 2000);
    return () => clearTimeout(timeoutId);
  }, []);

  return (
    <motion.div
      ref={ref}
      style={{ width: size, height: size, position: 'relative' }}
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ type: "spring", stiffness: 260, damping: 20 }}
    >
      <svg
        width="100%"
        height="100%"
        viewBox="0 0 100 100"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Body/Head Background (Blob shape) */}
        <motion.circle
            cx="50" cy="55" r="40"
            fill={faceColor}
            animate={{
               y: variant === "success" ? [0, -5, 0] : 0 
            }}
            transition={{
                repeat: variant === "success" ? Infinity : 0,
                duration: 0.5
            }}
        />

        {/* Shine */}
        <circle cx="70" cy="35" r="8" fill="rgba(255,255,255,0.2)" />

        {/* Eyes Container */}
        <g transform="translate(0, 0)">
            {/* Left Eye */}
            <circle cx="35" cy="50" r="10" fill={eyeColor} />
            {/* Right Eye */}
            <circle cx="65" cy="50" r="10" fill={eyeColor} />
            
            {/* Pupils */}
            <motion.g animate={{ x: pupilX, y: pupilY }}>
                <circle cx="35" cy="50" r="4" fill={pupilColor} />
                <circle cx="65" cy="50" r="4" fill={pupilColor} />
            </motion.g>

             {/* Eyelids (Natural Blink) - Covers the eyes */}
            <motion.rect
                x="25" y="40" width="20" height="20"
                fill={faceColor}
                initial={{ scaleY: 0 }}
                animate={{ scaleY: isBlinking ? 1 : 0 }}
                style={{ originY: 0 }} // Blink from top down
                transition={{ duration: 0.1 }}
            />
             <motion.rect
                x="55" y="40" width="20" height="20"
                fill={faceColor}
                initial={{ scaleY: 0 }}
                animate={{ scaleY: isBlinking ? 1 : 0 }}
                style={{ originY: 0 }} // Blink from top down
                transition={{ duration: 0.1 }}
            />
        </g>

        {/* Mouth */}
        {variant === 'success' ? (
             <motion.path 
                d="M40 70 Q50 80 60 70" 
                stroke="white" 
                strokeWidth="3" 
                strokeLinecap="round" 
                fill="none"
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
             />
        ) : (
            <motion.path 
                d="M45 70 Q50 70 55 70" 
                stroke="white" 
                strokeWidth="3" 
                strokeLinecap="round" 
                fill="none"
                animate={{
                   d: variant === "typing" ? "M47 70 Q50 72 53 70" : "M45 70 Q50 70 55 70"
                }}
            />
        )}
      </svg>
    </motion.div>
  );
};
