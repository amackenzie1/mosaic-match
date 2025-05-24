"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Session, Socket } from '@heroiclabs/nakama-js';
import { 
  getNakamaClient, 
  createNakamaSession, 
  connectToNakamaSocket,
  getNakamaSession,
  getNakamaSocket 
} from '@/components/mosaic-match/services/nakama-client';
import { fetchAuthSession } from 'aws-amplify/auth';

// Context interface
interface NakamaContextType {
  isConnected: boolean;
  isConnecting: boolean;
  isAuthenticated: boolean;
  error: string | null;
  session: Session | null;
  socket: Socket | null;
  connect: () => Promise<boolean>;
  disconnect: () => void;
  reconnect: () => Promise<boolean>;
}

// Default context state
const defaultContext: NakamaContextType = {
  isConnected: false,
  isConnecting: false,
  isAuthenticated: false,
  error: null,
  session: null,
  socket: null,
  connect: async () => false,
  disconnect: () => {},
  reconnect: async () => false,
};

// Create context
const NakamaContext = createContext<NakamaContextType>(defaultContext);

// Provider props
interface NakamaProviderProps {
  children: ReactNode;
  autoConnect?: boolean;
}

/**
 * Provider component for Nakama integration
 * Manages Nakama client, session, and socket connections
 * 
 * @param {ReactNode} children - Child components
 * @param {boolean} autoConnect - Whether to connect automatically on mount (default: true)
 */
export const NakamaProvider: React.FC<NakamaProviderProps> = ({ 
  children,
  autoConnect = true
}) => {
  // Connection state
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Initialize client and session state
  const [session, setSession] = useState<Session | null>(getNakamaSession());
  const [socket, setSocket] = useState<Socket | null>(getNakamaSocket());
  
  // Connect to Nakama
  const connect = async (): Promise<boolean> => {
    if (isConnected || isConnecting) return true;
    
    setIsConnecting(true);
    setError(null);
    
    try {
      // Get Cognito token
      const { tokens } = await fetchAuthSession();
      
      if (!tokens?.accessToken?.toString()) {
        throw new Error('No valid auth token available');
      }
      
      // Use the Cognito token for Nakama authentication
      const token = tokens.accessToken.toString();
      
      // Create session
      const newSession = await createNakamaSession(token);
      if (!newSession) {
        throw new Error('Failed to create Nakama session');
      }
      
      setSession(newSession);
      setIsAuthenticated(true);
      
      // Connect socket
      const newSocket = await connectToNakamaSocket(newSession);
      if (!newSocket) {
        throw new Error('Failed to connect to Nakama socket');
      }
      
      setSocket(newSocket);
      setIsConnected(true);
      setIsConnecting(false);
      
      // Set up socket event listeners
      setupSocketListeners(newSocket);
      
      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      console.error('Error connecting to Nakama:', errorMessage);
      setError(errorMessage);
      setIsConnecting(false);
      return false;
    }
  };
  
  // Disconnect from Nakama
  const disconnect = () => {
    if (socket) {
      socket.disconnect();
      setSocket(null);
    }
    
    setIsConnected(false);
    setSession(null);
    setIsAuthenticated(false);
  };
  
  // Reconnect to Nakama
  const reconnect = async (): Promise<boolean> => {
    disconnect();
    return connect();
  };
  
  // Set up socket event listeners
  const setupSocketListeners = (socket: Socket) => {
    // Handle disconnects
    socket.onclose = () => {
      setIsConnected(false);
      console.log('Nakama socket closed');
    };
    
    // Handle socket errors
    socket.onerror = (evt) => {
      console.error('Nakama socket error:', evt);
      setError('Socket connection error');
    };
    
    // Handle notifications (match notifications will be processed here)
    socket.onnotification = (notification) => {
      console.log('Nakama notification received:', notification);
      
      // Process match notification here
      if (notification.subject === 'match_found') {
        // Handle match notification
        // We can parse the content and trigger UI updates
        try {
          const content = JSON.parse(notification.content);
          console.log('New match notification:', content);
          
          // TODO: Dispatch match notification event
        } catch (e) {
          console.error('Error parsing notification content:', e);
        }
      }
    };
  };
  
  // Auto-connect if enabled
  useEffect(() => {
    if (autoConnect && !isConnected && !isConnecting) {
      connect();
    }
    
    // Cleanup on unmount
    return () => {
      if (socket) {
        socket.disconnect();
      }
    };
  }, [autoConnect]); // eslint-disable-line react-hooks/exhaustive-deps
  
  // Context value
  const contextValue: NakamaContextType = {
    isConnected,
    isConnecting,
    isAuthenticated,
    error,
    session,
    socket,
    connect,
    disconnect,
    reconnect,
  };
  
  return (
    <NakamaContext.Provider value={contextValue}>
      {children}
    </NakamaContext.Provider>
  );
};

/**
 * Hook to use Nakama context
 * @returns NakamaContextType
 */
export const useNakama = (): NakamaContextType => {
  const context = useContext(NakamaContext);
  
  if (context === undefined) {
    throw new Error('useNakama must be used within a NakamaProvider');
  }
  
  return context;
};

export default NakamaProvider;