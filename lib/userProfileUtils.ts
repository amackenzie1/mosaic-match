// lib/userProfileUtils.ts
import { Pinecone } from "@pinecone-database/pinecone";
import OpenAI from "openai";
import { v4 as uuidv4 } from "uuid";

// --- Environment Variables ---
const PINECONE_API_KEY = process.env.PINECONE_API_KEY || "";
const INDEX_NAME = process.env.PINECONE_INDEX_NAME || "mosaic-user-traits"; // Ensure this matches your Pinecone index
const OPENAI_API_KEY =
  process.env.OPENAI_API_KEY || process.env.NEXT_PUBLIC_OPENAI_API_KEY || "";

// --- Basic Validation ---
if (!PINECONE_API_KEY)
  console.error("FATAL: PINECONE_API_KEY environment variable is not set.");
if (!INDEX_NAME)
  console.error("FATAL: PINECONE_INDEX_NAME environment variable is not set.");
if (!OPENAI_API_KEY) console.error("FATAL: No OpenAI API key available.");

// --- Clients ---
export const pinecone = new Pinecone(); // Assumes API key picked up from env
export const index = pinecone.index(INDEX_NAME);
export const openai = new OpenAI({ apiKey: OPENAI_API_KEY });

// --- Constants ---
export const EMBEDDING_MODEL = "text-embedding-3-small";
export const EMBEDDING_DIMENSIONS = 1536;
export const SIMILARITY_THRESHOLD = 0.85; // Threshold for considering traits similar
export const PINECONE_BATCH_SIZE = 100; // Safe batch size for Pinecone operations

// --- Interfaces ---
// Represents a vector stored in Pinecone (Unified Trait)
export interface UnifiedTraitVector {
  id: string; // Format: ${userId}#${traitUuid}
  values: number[];
  metadata: UnifiedTraitMetadata;
}

// Metadata for Unified Traits
export interface UnifiedTraitMetadata {
  userId: string;
  representativeTrait: string; // The canonical text for this trait
  score: number; // Confidence/Importance score (e.g., max from sources)
  chatSources: string[]; // List of chatHashes where this trait appeared
  lastUpdated: number; // Timestamp (ms)
  isUnified?: boolean; // Flag to distinguish from potentially old raw traits if needed during migration
}

// --- Type Guards ---
/**
 * Type guard to check if an object is valid UnifiedTraitMetadata
 */
export function isUnifiedTraitMetadata(
  metadata: any
): metadata is UnifiedTraitMetadata {
  return (
    metadata != null && // Check if not null/undefined
    typeof metadata.userId === "string" &&
    typeof metadata.representativeTrait === "string" &&
    typeof metadata.score === "number" &&
    Array.isArray(metadata.chatSources) &&
    // Ensure all elements in chatSources are strings (optional, but good practice)
    metadata.chatSources.every((s: any) => typeof s === "string") &&
    typeof metadata.lastUpdated === "number"
    // isUnified check is optional here, depends if you always expect it
  );
}

/**
 * Type guard to check if an object is a valid UnifiedTraitVector
 * (including checking its metadata)
 */
export function isUnifiedTraitVector(obj: any): obj is UnifiedTraitVector {
  return (
    obj != null &&
    typeof obj.id === "string" &&
    Array.isArray(obj.values) &&
    // Ensure all elements in values are numbers (optional, but good practice)
    obj.values.every((v: any) => typeof v === "number") &&
    isUnifiedTraitMetadata(obj.metadata) // Use the metadata type guard
  );
}

// --- Helper Functions ---

/**
 * Chunks an array into smaller batches.
 */
export function chunk<T>(array: T[], size: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < array.length; i += size) {
    chunks.push(array.slice(i, i + size));
  }
  return chunks;
}

/**
 * Generates embeddings for a list of traits.
 */
export async function generateEmbeddings(
  traits: string[]
): Promise<number[][]> {
  if (!traits || traits.length === 0) {
    return [];
  }
  console.log(`Generating embeddings for ${traits.length} traits...`);
  try {
    // Use OpenAI batching (max 2048 inputs per request for embeddings)
    const BATCH_SIZE = 2000; // Stay below OpenAI limit
    const batches = chunk(traits, BATCH_SIZE);
    const allEmbeddings: number[][] = [];

    for (const batch of batches) {
      const response = await openai.embeddings.create({
        model: EMBEDDING_MODEL,
        input: batch,
        dimensions: EMBEDDING_DIMENSIONS,
      });

      if (!response.data || !Array.isArray(response.data)) {
        throw new Error(
          `Invalid response from OpenAI API: ${JSON.stringify(response)}`
        );
      }
      allEmbeddings.push(...response.data.map((item) => item.embedding));
    }
    console.log(`Generated ${allEmbeddings.length} embeddings.`);
    return allEmbeddings;
  } catch (error) {
    console.error("Error generating embeddings:", error);
    throw new Error(
      `Embedding generation error: ${
        error instanceof Error ? error.message : String(error)
      }`
    );
  }
}

/**
 * Generates a unique ID for a unified trait.
 */
export function generateUnifiedTraitId(userId: string): string {
  return `${userId}#${uuidv4()}`;
}
