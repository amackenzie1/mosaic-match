/**
 * Nakama Client for MosaicMatch
 * 
 * This module provides a client for interacting with Nakama server
 * for real-time matching and communication between users.
 */

import { Client, Session, Socket } from '@heroiclabs/nakama-js';
import { mosaicMatchConfig } from '../config';

/**
 * Configuration for Nakama client
 */
export interface NakamaClientConfig {
  serverKey: string;
  host: string;
  port: number;
  useSSL: boolean;
  timeout?: number;
}

/**
 * Get Nakama configuration from environment variables and config
 */
export function getNakamaConfig(): NakamaClientConfig {
  const serverUrl = mosaicMatchConfig.nakama.serverUrl || 'http://localhost:7350';
  
  // Parse server URL to extract host, port, and protocol
  let url: URL;
  try {
    url = new URL(serverUrl);
  } catch (e) {
    console.error('Invalid Nakama server URL:', serverUrl);
    url = new URL('http://localhost:7350');
  }
  
  const host = url.hostname;
  const port = url.port ? parseInt(url.port) : (url.protocol === 'https:' ? 443 : 80);
  const useSSL = url.protocol === 'https:';
  
  return {
    // The server key is only used for client HTTP API calls, not for authentication
    // This is just a public identifier, not a secret
    serverKey: process.env.NEXT_PUBLIC_NAKAMA_CLIENT_KEY || 'default',
    host,
    port,
    useSSL,
    timeout: mosaicMatchConfig.nakama.timeout || 5000,
  };
}

/**
 * Validate Nakama configuration
 */
export function validateNakamaConfig(config: NakamaClientConfig): boolean {
  return !!(config.host && config.port);
}

/**
 * Initialize Nakama client
 */
export function initializeNakamaClient(): Client | null {
  // Skip on server-side to avoid issues with SSR
  if (typeof window === 'undefined') {
    return null;
  }
  
  const config = getNakamaConfig();
  
  if (!validateNakamaConfig(config)) {
    console.warn('Nakama configuration is incomplete');
    return null;
  }
  
  return new Client(
    config.serverKey,
    config.host,
    config.port,
    config.useSSL,
    config.timeout
  );
}

// Client singleton
let nakamaClientInstance: Client | null = null;
let nakamaSessionInstance: Session | null = null;
let nakamaSocketInstance: Socket | null = null;

/**
 * Get the Nakama client instance
 */
export function getNakamaClient(): Client | null {
  if (!nakamaClientInstance) {
    nakamaClientInstance = initializeNakamaClient();
  }
  return nakamaClientInstance;
}

/**
 * Get current Nakama session
 */
export function getNakamaSession(): Session | null {
  return nakamaSessionInstance;
}

/**
 * Get current Nakama socket
 */
export function getNakamaSocket(): Socket | null {
  return nakamaSocketInstance;
}

/**
 * Creates a Nakama session using a JWT token from Cognito
 * 
 * @param cognitoJwt JWT token from Cognito
 * @returns Nakama session
 */
export async function createNakamaSession(cognitoJwt: string): Promise<Session | null> {
  const client = getNakamaClient();
  if (!client) {
    console.error('Nakama client is not initialized');
    return null;
  }
  
  try {
    // Use Cognito JWT for authentication
    const session = await client.authenticateCustom(cognitoJwt, true);
    
    // Store the session
    nakamaSessionInstance = session;
    
    return session;
  } catch (error) {
    console.error('Error authenticating with Nakama:', error);
    return null;
  }
}

/**
 * Connect to Nakama real-time socket
 * 
 * @param session Nakama session (if null, uses stored session)
 * @returns Nakama socket
 */
export async function connectToNakamaSocket(session?: Session): Promise<Socket | null> {
  // Use provided session or stored session
  const useSession = session || nakamaSessionInstance;
  
  if (!useSession) {
    console.error('No valid Nakama session available');
    return null;
  }
  
  const client = getNakamaClient();
  if (!client) {
    console.error('Nakama client is not initialized');
    return null;
  }
  
  try {
    const config = getNakamaConfig();
    
    // Create socket and connect
    const socket = client.createSocket(
      config.useSSL,
      process.env.NODE_ENV === 'development'
    );
    
    await socket.connect(useSession, true);
    
    // Store the socket
    nakamaSocketInstance = socket;
    
    return socket;
  } catch (error) {
    console.error('Error connecting to Nakama socket:', error);
    return null;
  }
}

/**
 * Call a Nakama RPC function
 * 
 * @param id RPC function ID
 * @param payload Payload to send
 * @returns RPC response
 */
export async function callNakamaRpc(id: string, payload: any = {}): Promise<any> {
  const client = getNakamaClient();
  const session = getNakamaSession();
  
  if (!client || !session) {
    console.error('Nakama client or session not available');
    return null;
  }
  
  try {
    const response = await client.rpc(session, id, payload);
    return response.payload;
  } catch (error) {
    console.error(`Error calling Nakama RPC ${id}:`, error);
    return null;
  }
}

/**
 * Call MosaicMatch opt-in RPC function
 */
export async function callOptInMatchRpc(): Promise<any> {
  return callNakamaRpc('rpc_opt_in_match');
}

/**
 * Call MosaicMatch opt-out RPC function
 */
export async function callOptOutMatchRpc(): Promise<any> {
  return callNakamaRpc('rpc_opt_out_match');
}

/**
 * Call get user match status RPC function
 */
export async function callGetMatchStatusRpc(): Promise<any> {
  return callNakamaRpc('rpc_get_user_match_status');
}

/**
 * Call get current match RPC function
 */
export async function callGetCurrentMatchRpc(): Promise<any> {
  return callNakamaRpc('rpc_get_current_match');
}

/**
 * Call get user traits RPC function
 */
export async function callGetUserTraitsRpc(): Promise<any> {
  return callNakamaRpc('rpc_get_user_traits');
}