"use client";

import { getMosaicMatchUserId } from "@/components/mosaic-match/config";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  AlertCircle,
  Brain,
  CheckCircle2,
  Database,
  RefreshCw,
  Users,
} from "lucide-react";
import { useEffect, useState } from "react";
import {
  findSimilarUsers,
  processAndStoreTraitEmbeddings,
  SimilarUserResponse,
} from "./embedding-api-client";

interface TraitDisplay {
  source: string; // Which chat/hash this came from
  traits: string[];
}

export default function MosaicMatchTestPage() {
  // States for trait fetching
  const [allTraits, setAllTraits] = useState<TraitDisplay[]>([]);
  const [errorMessage, setErrorMessage] = useState("");
  const [combinedTraits, setCombinedTraits] = useState<string[]>([]);

  // States for embedding visualization
  const [unifiedEmbedding, setUnifiedEmbedding] = useState<number[]>([]);

  // States for Pinecone integration
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingStep, setProcessingStep] = useState<string>("");
  const [pineconeError, setPineconeError] = useState("");
  const [pineconeSuccess, setPineconeSuccess] = useState(false);
  const [similarUsers, setSimilarUsers] = useState<SimilarUserResponse[]>([]);
  const [isLoadingSimilarUsers, setIsLoadingSimilarUsers] = useState(false);

  // Debug mode
  const [debugMode, setDebugMode] = useState(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("mosaicMatchDebugMode") === "true";
    }
    return true; // Default to true
  });

  // Update localStorage when debugMode changes
  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem("mosaicMatchDebugMode", debugMode.toString());
    }
  }, [debugMode]);

  // Main function to process all steps: fetch traits, generate embeddings, store in Pinecone
  const processAndStoreEmbedding = async () => {
    try {
      // Reset states and start processing
      setIsProcessing(true);
      setErrorMessage("");
      setPineconeError("");
      setPineconeSuccess(false);
      setSimilarUsers([]);
      setProcessingStep("Starting process...");
      
      // Import the service directly to prevent circular deps
      const { processMosaicMatchData } = await import(
        "@/components/mosaic-match/services/trait-processor"
      );

      // Process all steps via the service with UI callbacks
      const result = await processMosaicMatchData(
        {
          onStepChange: (step) => setProcessingStep(step),
          onTraitsExtracted: (traits, combined) => {
            setAllTraits(traits);
            setCombinedTraits(combined);
          },
          onEmbeddingGenerated: (embedding) => setUnifiedEmbedding(embedding),
          onPineconeSuccess: (success) => setPineconeSuccess(success),
          onError: (step, error) => {
            if (step === "Storing in Pinecone") {
              setPineconeError(error);
            } else {
              setErrorMessage(error);
            }
          },
          onDebugLog: (message) => {
            if (debugMode) console.log(message);
          },
        },
        debugMode
      );

      // Handle error if not caught by callbacks
      if (!result.success && !errorMessage && !pineconeError) {
        setErrorMessage(result.error || "An unknown error occurred");
      }
    } catch (error) {
      console.error("❌ Error in processing pipeline:", error);
      setErrorMessage(
        "Error during processing: " +
          (error instanceof Error ? error.message : String(error))
      );
    } finally {
      setIsProcessing(false);
      setProcessingStep("");
    }
  };

  // Function to find similar users
  const handleFindSimilarUsers = async () => {
    try {
      setIsLoadingSimilarUsers(true);
      setPineconeError("");
      
      const response = await findSimilarUsers(5, false);

      if (!response.success || !response.data) {
        setPineconeError(response.error || "Failed to find similar users");
        return;
      }

      setSimilarUsers(response.data.similarUsers || []);
      
      if (debugMode) {
        console.log(`Found ${response.data.similarUsers.length} similar users.`);
      }
    } catch (error) {
      setPineconeError(
        "Error finding similar users: " +
          (error instanceof Error ? error.message : String(error))
      );
    } finally {
      setIsLoadingSimilarUsers(false);
    }
  };

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-8">Mosaic Match Test Page</h1>

      <div className="mb-8">
        <p className="text-muted-foreground mb-4">
          This is a dedicated test page for the trait extraction and Pinecone
          integration, completely separate from the Nakama implementation. Use
          this page to develop and test the trait matching system.
        </p>

        <div className="flex justify-between items-center mb-4 p-2 bg-gray-50 dark:bg-gray-900 rounded-lg">
          <div className="flex items-center space-x-2">
            <Switch
              id="debug-mode"
              checked={debugMode}
              onCheckedChange={setDebugMode}
            />
            <Label htmlFor="debug-mode" className="text-sm">
              Debug Mode
            </Label>
          </div>
          <p className="text-xs text-muted-foreground">
            {debugMode ? "Showing detailed logs in console" : "Limited logging"}
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          {/* One-Click Process Button */}
          <Button
            onClick={processAndStoreEmbedding}
            disabled={isProcessing}
            className="flex items-center gap-2"
            variant="default"
          >
            {isProcessing ? (
              <RefreshCw className="h-4 w-4 animate-spin" />
            ) : (
              <Brain className="h-4 w-4" />
            )}
            {isProcessing ? "Processing..." : "Process and Store Embedding"}
          </Button>
        </div>
      </div>

      {errorMessage && (
        <div className="p-4 bg-destructive/10 text-destructive rounded-lg mb-6">
          {errorMessage}
        </div>
      )}

      {/* Processing status indicator */}
      {isProcessing && processingStep && (
        <div className="p-4 bg-primary/10 text-primary rounded-lg mb-6 flex items-center gap-3">
          <RefreshCw className="h-5 w-5 animate-spin" />
          <div>
            <p className="font-medium">Processing: {processingStep}</p>
            <p className="text-sm text-muted-foreground">
              Please wait while we complete this step...
            </p>
          </div>
        </div>
      )}

      {/* Combined traits section */}
      {combinedTraits.length > 0 && (
        <Card className="p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4">
            Combined Traits ({combinedTraits.length})
          </h2>
          <p className="text-sm text-muted-foreground mb-4">
            These are all unique traits found across all your chats. All these
            traits will be used to generate a single unified embedding vector
            for Pinecone.
          </p>
          <div className="flex flex-wrap gap-2">
            {combinedTraits.map((trait, index) => (
              <span
                key={index}
                className="px-3 py-1 bg-primary/10 text-primary rounded-full text-sm"
              >
                {trait}
              </span>
            ))}
          </div>
        </Card>
      )}

      {/* Individual chat traits */}
      {allTraits.length > 0 && (
        <div className="mb-8">
          <h2 className="text-xl font-semibold mb-4">Traits By Chat</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {allTraits.map((traitDisplay, index) => (
              <Card key={index} className="p-4">
                <h3 className="font-medium mb-2">Chat {traitDisplay.source}</h3>
                <div className="flex flex-wrap gap-2">
                  {traitDisplay.traits.map((trait, traitIndex) => (
                    <span
                      key={traitIndex}
                      className="px-2 py-1 bg-secondary/30 text-secondary-foreground rounded-full text-xs"
                    >
                      {trait}
                    </span>
                  ))}
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Embedding visualization */}
      {unifiedEmbedding.length > 0 && (
        <Card className="p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4">Unified Embedding</h2>
          <p className="text-sm text-muted-foreground mb-4">
            This is the unified embedding vector for all your traits combined.
            It contains {unifiedEmbedding.length} dimensions and will be used
            for matching in Pinecone.
          </p>

          <div className="bg-gray-50 dark:bg-gray-900 p-4 rounded-lg">
            <h3 className="text-md font-medium mb-2">
              Sample Values (first 10 of {unifiedEmbedding.length} dimensions)
            </h3>
            <pre className="text-xs overflow-x-auto p-2 bg-gray-100 dark:bg-gray-800 rounded">
              [
              {unifiedEmbedding
                .slice(0, 10)
                .map((v) => v.toFixed(6))
                .join(", ")}
              ...]
            </pre>
          </div>
        </Card>
      )}

      {/* Pinecone Integration Section */}
      <Card className="p-6 mt-8 border-dashed">
        <h2 className="text-xl font-semibold mb-4">Pinecone Integration</h2>
        <p className="text-muted-foreground mb-6">
          Once we have generated the unified trait embedding, we can store it in
          Pinecone for vector similarity matching.
        </p>

        {pineconeError && (
          <div className="p-4 bg-destructive/10 text-destructive rounded-lg mb-6 flex items-start gap-2">
            <AlertCircle className="h-5 w-5 mt-0.5 flex-shrink-0" />
            <p>{pineconeError}</p>
          </div>
        )}

        {pineconeSuccess && (
          <div className="p-4 bg-green-500/10 text-green-600 dark:text-green-400 rounded-lg mb-6 flex items-start gap-2">
            <CheckCircle2 className="h-5 w-5 mt-0.5 flex-shrink-0" />
            <p>
              Successfully stored traits in Pinecone! You can now find similar
              users.
            </p>
          </div>
        )}

        <div className="flex flex-col md:flex-row gap-4 p-6 bg-gray-50 dark:bg-gray-900 rounded-lg">
          <Button
            disabled={!pineconeSuccess || isLoadingSimilarUsers}
            variant="secondary"
            className="flex items-center gap-2"
            onClick={handleFindSimilarUsers}
          >
            {isLoadingSimilarUsers ? (
              <>
                <RefreshCw className="h-4 w-4 animate-spin" />
                <span>Searching...</span>
              </>
            ) : (
              <>
                <Users className="h-4 w-4" />
                <span>Find Similar Users</span>
              </>
            )}
          </Button>
        </div>

        {/* Similar users results */}
        {similarUsers.length > 0 && (
          <div className="mt-6">
            <h3 className="text-lg font-medium mb-3">
              Similar Users ({similarUsers.length})
            </h3>
            <div className="overflow-x-auto">
              <table className="min-w-full border-collapse">
                <thead>
                  <tr className="border-b">
                    <th className="py-2 px-4 text-left">User ID</th>
                    <th className="py-2 px-4 text-left">Similarity Score</th>
                    <th className="py-2 px-4 text-left">Matching Status</th>
                  </tr>
                </thead>
                <tbody>
                  {similarUsers.map((user, index) => (
                    <tr
                      key={index}
                      className="border-b hover:bg-gray-50 dark:hover:bg-gray-900"
                    >
                      <td className="py-2 px-4 font-mono text-xs">
                        {user.userId.substring(0, 8)}...
                      </td>
                      <td className="py-2 px-4">
                        <div className="flex items-center gap-2">
                          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5">
                            <div
                              className="bg-primary h-2.5 rounded-full"
                              style={{
                                width: `${Math.round(user.score * 100)}%`,
                              }}
                            ></div>
                          </div>
                          <span className="text-sm">
                            {(user.score * 100).toFixed(1)}%
                          </span>
                        </div>
                      </td>
                      <td className="py-2 px-4">
                        <span
                          className={`px-2 py-1 rounded-full text-xs ${
                            user.metadata?.seeking_match_status
                              ? "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300"
                              : "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300"
                          }`}
                        >
                          {user.metadata?.seeking_match_status
                            ? "Seeking Match"
                            : "Not Seeking"}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}