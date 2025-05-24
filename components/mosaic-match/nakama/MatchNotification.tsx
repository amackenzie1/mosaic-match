"use client";

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Bell, X, Users, ArrowRight } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useNakama } from './NakamaProvider';

export interface MatchNotificationProps {
  onView?: () => void;
  soundEnabled?: boolean;
}

/**
 * Component that displays a notification when a match is found
 * Listens to Nakama notifications via the NakamaProvider
 */
export const MatchNotification: React.FC<MatchNotificationProps> = ({
  onView,
  soundEnabled = true
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [matchData, setMatchData] = useState<any>(null);
  const [hasNotified, setHasNotified] = useState<Record<string, boolean>>({});
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const router = useRouter();
  const { socket, isConnected } = useNakama();

  useEffect(() => {
    // Initialize audio element
    if (typeof window !== 'undefined' && soundEnabled) {
      audioRef.current = new Audio('/sounds/match_ping.wav');
    }

    // Setup notification handler if socket is connected
    if (socket && isConnected) {
      const handleNotification = (notification: any) => {
        // Process match notification
        if (notification.subject === 'match_found') {
          try {
            const content = typeof notification.content === 'string' 
              ? JSON.parse(notification.content) 
              : notification.content;
              
            // Check if we've already processed this notification (client-side deduplication)
            const notificationId = `${content.cycle_id}:${content.partner_id}`;
            
            if (!hasNotified[notificationId]) {
              console.log('New match notification:', content);
              
              // Play sound if enabled
              if (audioRef.current && soundEnabled) {
                audioRef.current.play().catch(err => {
                  console.warn('Error playing notification sound:', err);
                });
              }
              
              // Store match data and show notification
              setMatchData(content);
              setIsVisible(true);
              
              // Mark this notification as processed
              setHasNotified(prev => ({
                ...prev,
                [notificationId]: true
              }));
            } else {
              console.log('Ignoring duplicate notification:', notificationId);
            }
          } catch (e) {
            console.error('Error processing match notification:', e);
          }
        }
      };

      // Add notification listener
      socket.onnotification = handleNotification;

      // Cleanup
      return () => {
        if (socket) {
          socket.onnotification = () => {}; // Remove listener
        }
      };
    }
  }, [socket, isConnected, hasNotified, soundEnabled]);

  const handleClose = () => {
    setIsVisible(false);
  };

  const handleView = () => {
    if (onView) {
      onView();
    }
    
    // Navigate to match detail page
    if (matchData?.channel_id) {
      router.push(`/match/${matchData.channel_id}`);
    }
    
    setIsVisible(false);
  };

  return (
    <AnimatePresence>
      {isVisible && matchData && (
        <motion.div
          className="fixed bottom-6 right-6 z-50 max-w-sm"
          initial={{ opacity: 0, y: 50, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 20, scale: 0.9 }}
          transition={{ type: 'spring', stiffness: 350, damping: 25 }}
        >
          <div className="bg-card dark:bg-card border border-border shadow-lg rounded-lg overflow-hidden">
            <div className="p-4 bg-primary/10 dark:bg-primary/20 border-b border-border flex items-center justify-between">
              <div className="flex items-center gap-2 font-medium">
                <Bell className="h-5 w-5 text-primary dark:text-primary-foreground" />
                <span>Match Found!</span>
              </div>
              <button 
                onClick={handleClose}
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="p-4">
              <div className="flex items-center gap-3 mb-3">
                <div className="size-10 rounded-full bg-primary/10 dark:bg-primary/20 flex items-center justify-center text-primary dark:text-primary-foreground">
                  <Users className="h-5 w-5" />
                </div>
                <div className="flex-1">
                  <h3 className="font-medium">Compatible Match Partner</h3>
                  <p className="text-sm text-muted-foreground">Based on your communication patterns</p>
                </div>
              </div>
              
              {matchData.score && (
                <div className="mb-3 px-3 py-2 bg-background dark:bg-background rounded text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Match Score</span>
                    <span className="font-medium">{Math.round(matchData.score * 100)}%</span>
                  </div>
                </div>
              )}
              
              <Button 
                onClick={handleView} 
                className="w-full mt-1 gap-2 group"
              >
                View Match Details
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default MatchNotification;