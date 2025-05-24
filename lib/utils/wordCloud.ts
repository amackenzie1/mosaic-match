import { GoogleGenerativeAI } from '@google/generative-ai'
import { config } from '@/lib/config'
import { ChatMessage } from '@/lib/types'

export type WordItem = {
  text: string;
  value: number;
};

export type WordCloudResult = {
  people: {
    name: string;
    topWords: WordItem[];
  }[];
};

const genAI = new GoogleGenerativeAI(
  process.env.NEXT_PUBLIC_GEMINI_API_KEY || ""
);
const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash-exp" });

const processWords = async (words: WordItem[]): Promise<number[]> => {
  const wordTexts = words.map((w) => w.text);
  const prompt = `Review this indexed list of words and return ONLY a JSON array of numbers representing the indexes of words that should be removed. Be EXTREMELY selective - only remove words that are:
1. Obvious parsing errors or word cutoffs (like "ems", "ing", "th")
2. Random numbers without context
3. Common filler words like "um", "uh"
4. Words that seem like it was part of a system message such as "device", "reacted", "message", "liked", "edited"

DO NOT remove:
- Slang or informal speech
- Abbreviations that are meaningful
- Any word that could be unique to someone's speech pattern
- Most conjunctions or articles (unless they're clearly errors)
- Any word you're unsure about
- Nouns or adjectives

Words with indexes:
${wordTexts.map((word, index) => `${index}: ${word}`).join("\n")}

Return ONLY a JSON array with the of numbers for words to be removed, like this: [1, 4, 7]`;

  console.log("Processing words:", {
    totalWords: words.length,
    sampleWords: wordTexts.slice(0, 5),
  });

  try {
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    // Extract array from response
    const match = text.match(/\[[\d,\s]+\]/);
    if (!match) {
      console.warn("No valid array found in response:", text);
      return [];
    }

    const removedIndexes = JSON.parse(match[0]) as number[];
    console.log("Words marked for removal:", {
      total: removedIndexes.length,
      removedWords: removedIndexes.map((i) => wordTexts[i]),
    });

    return removedIndexes;
  } catch (error) {
    console.error("Error processing words:", error);
    return [];
  }
};

const filterWords = (
  words: WordItem[],
  indexesToRemove: Set<number>
): WordItem[] => {
  return words.filter((_, index) => !indexesToRemove.has(index));
};

export const getTopWords = async (
  messages: ChatMessage[]
): Promise<WordCloudResult> => {
  console.log("Starting word cloud generation for messages:", {
    totalMessages: messages.length,
  });

  // Get top 2 users by message count, then sort alphabetically
  const userCounts = messages.reduce((acc, msg) => {
    acc[msg.user] = (acc[msg.user] || 0) + 1;
    return acc;
  }, {} as { [key: string]: number });

  const persons = Object.entries(userCounts)
    .sort((a, b) => b[1] - a[1]) // Sort by message count descending
    .slice(0, 2) // Take top 2
    .map(([user]) => user) // Get just the usernames
    .sort(); // Sort alphabetically

  const LIMIT = 85;
  const wordRegex = /\b[a-z]+\b/gi;

  // Use a Map for faster lookups and insertions
  const count1 = new Map<string, number>();
  const count2 = new Map<string, number>();

  // Process messages in a single pass
  messages.forEach(({ message, user }) => {
    const words = message.toLowerCase().match(wordRegex) || [];
    const countMap = user === persons[0] ? count1 : count2;

    words.forEach((word) => {
      if (!/\d/.test(word)) {
        countMap.set(word, (countMap.get(word) || 0) + 1);
      }
    });
  });

  if (persons.length < 2) {
    throw new Error("Could not identify two distinct persons in the chat");
  }

  const [person1, person2] = persons;

  // Calculate ratios and sort in a single pass
  const ratios: WordItem[] = [];
  const allWords = new Set([...count1.keys(), ...count2.keys()]);

  allWords.forEach((word) => {
    const c1 = count1.get(word) || 0;
    const c2 = count2.get(word) || 0;
    ratios.push({ text: word, value: (c1 + 1) / (c2 + 1) });
  });

  ratios.sort((a, b) => b.value - a.value);
  let topAndBottom = ratios
    .slice(0, 2 * LIMIT)
    .concat(ratios.slice(-2 * LIMIT));

  console.log("Words selected for processing:", {
    totalWords: topAndBottom.length,
    sampleTopWords: topAndBottom.slice(0, 5).map((w) => w.text),
    sampleBottomWords: topAndBottom.slice(-5).map((w) => w.text),
  });

  const indexesToRemove = await processWords(topAndBottom);
  const allIndexesToRemove = new Set(indexesToRemove);

  console.log("Final filtering:", {
    totalIndexesToRemove: allIndexesToRemove.size,
    wordsBeforeFiltering: topAndBottom.length,
    wordsAfterFiltering: topAndBottom.length - allIndexesToRemove.size,
  });

  let filteredWords = filterWords(topAndBottom, allIndexesToRemove);

  let topWords1 = filteredWords.filter((w) => w.value > 1).slice(0, LIMIT);

  let topWords2 = filteredWords
    .filter((w) => w.value <= 1)
    .slice(-LIMIT)
    .map((w) => ({ ...w, value: 1 / w.value }));

  // normalize value
  const sum1 = topWords1.reduce((acc, val) => acc + val.value, 0);
  topWords1.forEach((w) => (w.value /= sum1));
  const sum2 = topWords2.reduce((acc, val) => acc + val.value, 0);
  topWords2.forEach((w) => (w.value /= sum2));

  const result = {
    people: [
      { name: person1, topWords: topWords1 },
      { name: person2, topWords: topWords2 },
    ],
  };

  console.log("Final word cloud result:", {
    person1WordCount: topWords1.length,
    person2WordCount: topWords2.length,
  });

  return result;
};
