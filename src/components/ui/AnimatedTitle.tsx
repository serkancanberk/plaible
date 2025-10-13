import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useState } from "react";

interface AnimatedTitleProps {
  userName?: string;         // defaults to "visitor"
  characterName: string;     // e.g., "Victor Frankenstein"
}

export const AnimatedTitle = ({ userName = "visitor", characterName }: AnimatedTitleProps) => {
  const [step, setStep] = useState(0);
  const [variant, setVariant] = useState("");

  const lineVariants = [
    `🌕 You'll become {characterName}.`,
    `🌕 You're stepping into {characterName}.`,
    `🌕 You'll play as {characterName}.`,
    `🌕 You'll walk as {characterName}.`,
    `🌕 You'll wear the name {characterName}.`,
    `🌕 You'll answer as {characterName}.`,
    `🌕 You'll awaken as {characterName}.`,
    `🌕 You'll stand as {characterName}.`,
    `🌕 You'll move as {characterName}.`,
    `🌕 You'll embody {characterName}.`,
  ];

  useEffect(() => {
    const randomIndex = Math.floor(Math.random() * lineVariants.length);
    setVariant(lineVariants[randomIndex]);
  }, []);

  useEffect(() => {
    const interval = setInterval(() => setStep((prev) => (prev + 1) % 2), 2500);
    return () => clearInterval(interval);
  }, []);

  const messages = [
    `🌚 Hello, ${userName}.`,
    variant.replace("{characterName}", characterName),
  ];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.8, ease: "easeInOut" }}
      className="flex flex-col justify-center items-center gap-spacing-sm text-center font-serif text-heading text-accent max-w-[640px] mx-auto"
    >
      <AnimatePresence mode="wait">
        <motion.div
          key={step}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.8, ease: "easeInOut" }}
        >
          {messages[step]}
        </motion.div>
      </AnimatePresence>
    </motion.div>
  );
};
