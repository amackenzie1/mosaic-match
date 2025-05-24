import { config } from "@/lib/config";
import { ChatMessage } from "@/lib/types";
import { uploadJsonToS3 } from "@amackenzie1/mosaic-lib";
import { GoogleGenerativeAI, SchemaType } from "@google/generative-ai";
import { z } from "zod";

interface PersonalityResponse {
  song_recommendations: string[];
  gift_recommendations: string[];
  movie_recommendations: string[];
  book_recommendations: string[];
  // User profile as a single array of traits
  essence_profile: string[];
}

export interface DualPersonalityResponse {
  user1: {
    username: string;
  } & PersonalityResponse;
  user2: {
    username: string;
  } & PersonalityResponse;
}

export interface PersonalityProfile {
  [key: string]: PersonalityResponse;
}

// Define Gemini schema
const personalitySchema = {
  type: SchemaType.OBJECT,
  properties: {
    user1: {
      type: SchemaType.OBJECT,
      properties: {
        username: { type: SchemaType.STRING },
        song_recommendations: {
          type: SchemaType.ARRAY,
          items: { type: SchemaType.STRING },
        },
        gift_recommendations: {
          type: SchemaType.ARRAY,
          items: { type: SchemaType.STRING },
        },
        movie_recommendations: {
          type: SchemaType.ARRAY,
          items: { type: SchemaType.STRING },
        },
        book_recommendations: {
          type: SchemaType.ARRAY,
          items: { type: SchemaType.STRING },
        },
        // User profile as a single array
        essence_profile: {
          type: SchemaType.ARRAY,
          items: { type: SchemaType.STRING },
        }
      },
      required: [
        "username",
        "song_recommendations",
        "gift_recommendations",
        "movie_recommendations",
        "book_recommendations",
        "essence_profile"
      ],
    },
    user2: {
      type: SchemaType.OBJECT,
      properties: {
        username: { type: SchemaType.STRING },
        song_recommendations: {
          type: SchemaType.ARRAY,
          items: { type: SchemaType.STRING },
        },
        gift_recommendations: {
          type: SchemaType.ARRAY,
          items: { type: SchemaType.STRING },
        },
        movie_recommendations: {
          type: SchemaType.ARRAY,
          items: { type: SchemaType.STRING },
        },
        book_recommendations: {
          type: SchemaType.ARRAY,
          items: { type: SchemaType.STRING },
        },
        // User profile as a single array
        essence_profile: {
          type: SchemaType.ARRAY,
          items: { type: SchemaType.STRING },
        }
      },
      required: [
        "username",
        "song_recommendations",
        "gift_recommendations",
        "movie_recommendations",
        "book_recommendations",
        "essence_profile"
      ],
    },
  },
  required: ["user1", "user2"],
};

// Initialize Gemini client
const genAI = new GoogleGenerativeAI(
  process.env.NEXT_PUBLIC_GEMINI_API_KEY || ""
);
const model = genAI.getGenerativeModel({
  model: config.textModelGoogle,
  generationConfig: {
    temperature: 0.5,
    responseMimeType: "application/json",
    responseSchema: personalitySchema,
  },
});

// Zod schema for validation
const DualPersonalityResponseSchema = z.object({
  user1: z.object({
    username: z.string(),
    song_recommendations: z.array(z.string()),
    gift_recommendations: z.array(z.string()),
    movie_recommendations: z.array(z.string()),
    book_recommendations: z.array(z.string()),
    // User profile as a single array
    essence_profile: z.array(z.string())
  }),
  user2: z.object({
    username: z.string(),
    song_recommendations: z.array(z.string()),
    gift_recommendations: z.array(z.string()),
    movie_recommendations: z.array(z.string()),
    book_recommendations: z.array(z.string()),
    // User profile as a single array
    essence_profile: z.array(z.string())
  }),
});

// Add NormalizedSet class
class NormalizedSet {
  private items = new Set<string>();
  private originalCase = new Map<string, string>(); // Store original text

  add(item: string) {
    // Normalize for comparison only, but store original
    const normalized = item.toLowerCase().trim();
    this.items.add(normalized);
    this.originalCase.set(normalized, item.trim()); // Keep original case
  }

  toArray(): string[] {
    return Array.from(this.items).map(
      (item) => this.originalCase.get(item) || item
    );
  }
}

const createMessageChunks = (
  messages: ChatMessage[],
  maxTokens: number = 600000
): string[] => {
  const messageStrings = messages.map((msg) => `${msg.user}: ${msg.message}`);
  const totalTokens = messageStrings.join("\n").length / 2;

  if (totalTokens <= maxTokens) {
    return [messageStrings.join("\n")];
  }

  const chunks: string[] = [];
  let currentChunk = "";
  let currentTokens = 0;

  for (const message of messageStrings) {
    const messageTokens = (message.length + 1) / 4; // +1 for newline
    if (currentTokens + messageTokens >= maxTokens) {
      chunks.push(currentChunk.trim());
      currentChunk = message + "\n";
      currentTokens = messageTokens;
    } else {
      currentChunk += message + "\n";
      currentTokens += messageTokens;
    }
  }

  if (currentChunk) {
    chunks.push(currentChunk.trim());
  }

  return chunks;
};

const analyzeConversation = async (
  messages: ChatMessage[]
): Promise<DualPersonalityResponse> => {
  const userCounts = messages.reduce((acc, msg) => {
    acc[msg.user] = (acc[msg.user] || 0) + 1;
    return acc;
  }, {} as { [key: string]: number });

  const topUsers = Object.keys(userCounts)
    .sort((a, b) => userCounts[b] - userCounts[a])
    .slice(0, 2)
    .sort();

  const messageChunks = createMessageChunks(messages);

  const chunkPromises = messageChunks.map(async (chunk, i) => {
    const prompt = `Conversation to analyze:
${chunk}

Analyze this conversation between two people to create digital fingerprints and give them personalized recommendations. 
Note that user_1 corresponds to ${topUsers[0]} and user_2 corresponds to ${topUsers[1]}.

Your task is to identify distinctive traits, patterns, and characteristics that truly capture the ESSENCE of each person. These should collectively form a unique "digital fingerprint" that could only belong to this specific individual.

FOR THE ESSENCE PROFILE:

Create traits that form a distinctive "digital fingerprint" of each person, capturing their essence across all life domains. These traits will serve two purposes:
1) Matchmaking: Identifying compatibility with others
2) Opinion context: Providing background that explains why they hold certain views

Balance traits evenly across these spheres:
- Personal background (demographics, life stage)
- Work/career specifics
- Relationship dynamics
- Daily habits and routines
- Communication patterns
- Thinking processes
- Emotional tendencies
- Specific interests (not generic categories)
- Core values and beliefs
- Cultural/aesthetic preferences
- Social behaviors
- Decision-making approaches

Requirements:
- Each trait: 2-5 words maximum
- Highly specific and distinctive
- Include factual attributes when available
- Prioritize traits that differentiate them from others
- Avoid generic descriptors that could apply to many people
- Maintain balance between professional, personal and social aspects

These traits should collectively create a unique profile that couldn't be mistaken for anyone else, enabling both accurate matching and contextual understanding of their perspective.

FOR RECOMMENDATIONS:
- Each song/gift/movie suggestion must be unique and different from any previous recommendations
- Avoid generic suggestions
- Recommend things that align with their preferences, but which they would not already know about themselves! 

Additionally, based on their interests, hobbies, and preferences shown in the messages:
1. Provide more than 3 song recommendations that match their taste
2. Suggest more than 7 thoughtful gift ideas that align with their interests
   - Recommend some gifts based on explicitly mentioned interests or needs, however feel free to also suggest ones that the person'd likely enjoy based on the their personality
   - Include a brief justification for each gift based on chat evidence
   - Be specific rather than generic (e.g. "A vintage Star Wars poster from Episode IV" rather than just "Star Wars merchandise")
   - Be as creative as possible. As you have a minimum of 7 outputs for this category, at least some of the recommendations should be very unique
3. Recommend more than 3 movies they might enjoy 
4. Recommend more than 3 books they might enjoy 

Remember, all recommendations should be things that the users don't already have or know about! Otherwise why would they need a recommendation?`;

    try {
      const result = await model.generateContent({
        contents: [{ role: "user", parts: [{ text: prompt }] }],
      });
      const response = await result.response;
      const text = response.text();
      const data = JSON.parse(text);
      return DualPersonalityResponseSchema.parse(data);
    } catch (error) {
      console.error("Error in personality analysis:", error);
      return null;
    }
  });

  const chunkResults = (await Promise.all(chunkPromises)).filter(
    (result): result is DualPersonalityResponse => result !== null
  );

  const songsSet1 = new NormalizedSet();
  const giftsSet1 = new NormalizedSet();
  const moviesSet1 = new NormalizedSet();
  const booksSet1 = new NormalizedSet();
  const essenceProfileSet1 = new NormalizedSet();

  const songsSet2 = new NormalizedSet();
  const giftsSet2 = new NormalizedSet();
  const moviesSet2 = new NormalizedSet();
  const booksSet2 = new NormalizedSet();
  const essenceProfileSet2 = new NormalizedSet();

  chunkResults.forEach((result) => {
    // User 1
    result.user1.song_recommendations.forEach((song: string) =>
      songsSet1.add(song)
    );
    result.user1.gift_recommendations.forEach((gift: string) =>
      giftsSet1.add(gift)
    );
    result.user1.movie_recommendations.forEach((movie: string) =>
      moviesSet1.add(movie)
    );
    result.user1.book_recommendations.forEach((book: string) =>
      booksSet1.add(book)
    );

    // User 1 Profile
    result.user1.essence_profile?.forEach((trait: string) =>
      essenceProfileSet1.add(trait)
    );

    // User 2
    result.user2.song_recommendations.forEach((song: string) =>
      songsSet2.add(song)
    );
    result.user2.gift_recommendations.forEach((gift: string) =>
      giftsSet2.add(gift)
    );
    result.user2.movie_recommendations.forEach((movie: string) =>
      moviesSet2.add(movie)
    );
    result.user2.book_recommendations.forEach((book: string) =>
      booksSet2.add(book)
    );

    // User 2 Profile
    result.user2.essence_profile?.forEach((trait: string) =>
      essenceProfileSet2.add(trait)
    );
  });

  const combinedResults: DualPersonalityResponse = {
    user1: {
      username: topUsers[0],
      song_recommendations: songsSet1.toArray(),
      gift_recommendations: giftsSet1.toArray(),
      movie_recommendations: moviesSet1.toArray(),
      book_recommendations: booksSet1.toArray(),
      essence_profile: essenceProfileSet1.toArray()
    },
    user2: {
      username: topUsers[1],
      song_recommendations: songsSet2.toArray(),
      gift_recommendations: giftsSet2.toArray(),
      movie_recommendations: moviesSet2.toArray(),
      book_recommendations: booksSet2.toArray(),
      essence_profile: essenceProfileSet2.toArray()
    },
  };

  return combinedResults;
};

export const analyzePersonalities = async (
  messages: ChatMessage[]
): Promise<PersonalityProfile> => {
  const results = await analyzeConversation(messages);

  const profile = {
    [results.user1.username]: {
      song_recommendations: results.user1.song_recommendations,
      gift_recommendations: results.user1.gift_recommendations,
      movie_recommendations: results.user1.movie_recommendations,
      book_recommendations: results.user1.book_recommendations,
      // User profile data as a single array
      essence_profile: results.user1.essence_profile
    },
    [results.user2.username]: {
      song_recommendations: results.user2.song_recommendations,
      gift_recommendations: results.user2.gift_recommendations,
      movie_recommendations: results.user2.movie_recommendations,
      book_recommendations: results.user2.book_recommendations,
      // User profile data as a single array
      essence_profile: results.user2.essence_profile
    },
  };

  await uploadJsonToS3(`chat/:hash:/personality-insights.json`, profile);

  return profile;
};
