"use client";

import React, { useEffect, useState } from "react";

/**
 * Basic Typewriter component for a single string of text
 */
interface TypewriterProps {
  text: string;
  delay?: number;
  className?: string;
}

export const TypewriterEffect: React.FC<TypewriterProps> = ({
  text,
  delay = 50,
  className,
}) => {
  const [displayText, setDisplayText] = useState("");
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isDone, setIsDone] = useState(false);

  useEffect(() => {
    if (currentIndex < text.length) {
      const timeout = setTimeout(() => {
        setDisplayText((prev) => prev + text[currentIndex]);
        setCurrentIndex((prev) => prev + 1);
      }, delay);

      return () => clearTimeout(timeout);
    } else {
      setIsDone(true);
    }
  }, [currentIndex, delay, text]);

  return (
    <span className={className}>
      {displayText}
      {!isDone && <span className="animate-pulse">|</span>}
    </span>
  );
};

/**
 * Enhanced typewriter that can cycle through multiple messages
 */
interface TypewriterCycleProps {
  messages: string[];
  typingSpeed?: number;
  deletingSpeed?: number; 
  pauseDuration?: number;
  className?: string;
}

export const TypewriterCycle: React.FC<TypewriterCycleProps> = ({
  messages,
  typingSpeed = 50,
  deletingSpeed = 30,
  pauseDuration = 2000,
  className
}) => {
  const [displayText, setDisplayText] = useState("");
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isDeleting, setIsDeleting] = useState(false);
  const [messageIndex, setMessageIndex] = useState(0);

  useEffect(() => {
    if (!messages.length) return;
    
    const currentMessage = messages[messageIndex];

    // Typing
    if (!isDeleting && currentIndex < currentMessage.length) {
      const timeout = setTimeout(() => {
        setDisplayText(currentMessage.substring(0, currentIndex + 1));
        setCurrentIndex(currentIndex + 1);
      }, typingSpeed);
      
      return () => clearTimeout(timeout);
    } 
    // Pause when typing is complete
    else if (!isDeleting && currentIndex === currentMessage.length) {
      const timeout = setTimeout(() => {
        setIsDeleting(true);
      }, pauseDuration);
      
      return () => clearTimeout(timeout);
    }
    // Deleting
    else if (isDeleting && currentIndex > 0) {
      const timeout = setTimeout(() => {
        setDisplayText(currentMessage.substring(0, currentIndex - 1));
        setCurrentIndex(currentIndex - 1);
      }, deletingSpeed);
      
      return () => clearTimeout(timeout);
    }
    // Move to next message
    else if (isDeleting && currentIndex === 0) {
      setIsDeleting(false);
      setMessageIndex((messageIndex + 1) % messages.length);
    }
  }, [currentIndex, deletingSpeed, isDeleting, messageIndex, messages, pauseDuration, typingSpeed]);

  return (
    <span className={className}>
      {displayText}
      <span className="animate-pulse">|</span>
    </span>
  );
};

// For backward compatibility with existing code
const Typewriter = ({ messages, ...props }: any) => {
  // If messages array is provided, use TypewriterCycle
  if (Array.isArray(messages)) {
    return <TypewriterCycle messages={messages} {...props} />;
  }
  
  // Otherwise use TypewriterEffect with text prop
  return <TypewriterEffect text={props.text || ""} {...props} />;
};


export default Typewriter;