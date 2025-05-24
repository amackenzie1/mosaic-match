import { zodResponseFormat } from 'openai/helpers/zod'
import { z } from 'zod'
import { config } from '../config'
import { openaiBeta } from '@amackenzie1/mosaic-lib'
import { uploadJsonToS3 } from '@amackenzie1/mosaic-lib'
import { EventMessage } from '@/components/custom/main/tiles/sentiment/SentimentChartDrillDown'
import { ChatMessage } from '@/lib/types'

const SalientEvent = z.object({
  event: z.string(),
  salience: z.number(),
})

const QuoteWithIndex = z.object({
  index: z.number(),
})

const summaryQuote = z.object({
  index: z.number(),
})

const MajorEvent = z.object({
  impactOnLifeTrajectory: z.string(),
  event: z.string(),
  index_range: z.string(),
  timestamp_range: z.object({
    start: z.string(),
    end: z.string(),
  }),
  emojis: z.array(z.string()),
  event_deep_dive: z.object({
    event_summary: z.string(),
    key_interactions: z.string(),
    emotional_responses: z.string(),
    potential_impact: z.string(),
    psychoanalytical_takeaway: z.string(),
  }),
  subject: z.enum(['X', 'Z', 'Both']),
  major_score: z.number(),
})

export type MajorEventTypeRaw = z.infer<typeof MajorEvent>
export type MajorEventType = MajorEventTypeRaw & {
  eventMessages: EventMessage[]
  hash?: string
  sentiment?: number
}

const SentimentResponse = z.object({
  X_sentiment: z.number(),
  X_justification: z.string(),
  Z_sentiment: z.number(),
  Z_justification: z.string(),
  salient_events: z.array(SalientEvent),
  summary_quote: summaryQuote.optional(),
  major_events: z.array(MajorEvent),
})

const TopQuotesResponse = z.object({
  top_quotes: z.array(QuoteWithIndex),
})

export type SentimentResponseType = z.infer<typeof SentimentResponse> &
  z.infer<typeof TopQuotesResponse> & {
    major_events: MajorEventType[]
  }

export type SentimentResponseComplete = SentimentResponseType & {
  weekStart: string
  messageCount: number
  messageIndices: number[]
}

export type QuoteWithIndexType = z.infer<typeof QuoteWithIndex>

/**
 * Builds the user prompt for the sentiment analysis portion for a single week.
 */
function buildSentimentPrompt(
  weekMessages: ChatMessage[],
  persons: string[]
): string {
  const createMaskedConversation = (personIndex: number) => {
    return weekMessages
      .map(
        (m) =>
          `${
            m.user === persons[personIndex]
              ? personIndex === 0
                ? 'X'
                : 'Z'
              : personIndex === 0
              ? 'Z'
              : 'X'
          }: ${m.user === persons[personIndex] ? m.message : ''} [${m.index}]`
      )
      .join('\n')
  }

  const maskedConversationX = createMaskedConversation(0)
  const maskedConversationZ = createMaskedConversation(1)

  return `
    Firstly:
    Rate the sentiment on a scale from -10 (extremely negative) to 10 (extremely positive). The rating should be based solely on the individual's sentiment, do not consider the other person's score when assigning a rating. For example: Do not consider person Z's messages when assigning a score to person X.
    Feel free to use up to 3 weeks before the current week as context for the events happening when determining what score to assign (for example if in the week they are discussing returning something in a neutral tone and you observe that in the previous weeks they broke up, this would be a rather negative sentiment score as opposed to if they were returning a sweatshirt because they had a really fun night in the week before which would be a positive sentiment). 
    Here are examples of events and their scores that you should use as anchors when determining what sentiment score to assign:
    10: Person X Just got married! They're over the moon with happiness saying that this is the best day of their lives!
    8: Person X is visiting Europe and is enjoying the time. They remark how it's quite chill and they could see themselves living there
    5: Person X had a nice day. They went bowling and their language indicates general contentment with life. They are looking forward to the future.
    2: Person X had a normal day. They remark how the weather is nice and discuss their favorite football players but nothing much to indicate that they are feeling any particularly strong emotion
    0: Person X had a day like every other. They are not particularly happy or sad and their messages are flat in emotion and engagement
    -2: Person X is generally detached in the conversation, slightly pessimistic about current events in their life
    -5: Person X did not have a good day. They had an argument with a coworker or something that they were looking forward to didn't work out as they expected
    -8: Person X got their laptop stolen/broke up with their significant other and are venting their feelings of frustration/anger at the situation
    -10: Person X's family member passed away and they are feeling very depressed
    Try to assign the score completely independently of a person's mannerism of speaking. For example a person can say "aww that's so sad" in a sarcastic manner, but that might indicate engagement in the convo and humor rather than actual sadness. Take this into account when creating your score
    For each sentiment score, provide a brief justification explaining why you chose that particular score.

    Also, identify important [influencing the sentiment] events or topics from the conversation, and rate their salience on a scale from 0 to 10. 0 is completely irrelevant, 10 is a dramatic life change, like getting married, 5 is like a party.
    Aim to include events with a salience of 5 or higher. This might be a completely different number of events depending on the week. There should always be at least one salient event connected to why the sentiment is assigned the value that it is. For example if the week was assigned a low sentiment, one of the salient events should be about what caused it.
    Finally, note that this is targeted at the users themselves, so assume they have all the context and make your responses match their style. Basically they just need to be reminded of what happened. You're talking to them directly. Be casual and aim to include about 3 of these events per week.

    Secondly:
    Select ONE QUOTE that is maximally informative of what happened during the week. It should relate to what people are currently doing and be a sort of "summarizing weekly quote". Interesting quotes would relate to what the two people in the chat are currently doing,
    like if one says "I love being here in new york" it is informative of they are having fun as well as where they currently are. Aim to include quotes like this. ABSOLUTELY NO MAKING ANYTHING UP. This quote should not be one already in top_quotes. Remember to return the index of the quote instead of the quote itself.

    Thirdly:
    Identify major events in the chat. These should be big events like: first time meeting in person, passing of important person, break-ups, difficult/low points, etc.
    If you come across such events in the chat, output a header for the event (example: Break Up), the range of message indexes which involve this event (should cover the entire context of the event, not just a single message), and an overview of what happened in the event.
    For each event, specify who the event primarily concerns: Person X, Person Z, or Both.
    For the in-depth overview, structure it in blocks for readability, covering aspects such as:
    1. Event Summary: A concise overview of what happened
    2. Key Interactions: The main exchanges or actions between participants
    3. Emotional Responses: How each person reacted emotionally to the event
    4. Potential Impact on Relationship: How this event affected their relationship
    5. Psychoanalytical Takeaway: Psychological insights about each person's behavior and reactions
    Remember, it's okay not to find any such major events, in which case this field should be empty. Quality is much more important than quantity and you should be extremely judicious in what you add. 
    Also add a score (1-10) that indicates how major this event is; examples: 1 indicating an unimportant event, 5 indicating some activity occurred, 7 an important achievement, 9 a break up, 10 death of a close family member.

    Provide your answer in the following JSON format:
    {
        "X_sentiment": number,
        "X_justification": "Brief explanation for X's sentiment score",
        "Z_sentiment": number,
        "Z_justification": "Brief explanation for Z's sentiment score",
        "salient_events": [
          {
            "event": "One sentence summary of an important event or topic",
            "salience": number
          },
          ... (4 max)
        ],
        "summary_quote": {
          "index": number
        },
        "major_events": [
          {
            "impactOnLifeTrajectory": "An explanation of why this is a major event/how it might affect the life trajectory of the person.",
            "event": "Brief header of the major event",
            "index_range": "start_index:end_index",
            "emojis": [ // Two emojis that, together, best describe the event
              "emoji1",
              "emoji2"
            ],
            "event_deep_dive": {
              "event_summary": "Concise overview of what happened",
              "key_interactions": "Main exchanges or actions between participants",
              "emotional_responses": "How each person reacted emotionally",
              "potential_impact": "How this event affected their relationship",
              "psychoanalytical_takeaway": "Psychological insights about behaviors and reactions"
            },
            "subject": "X" | "Z" | "Both",
            "major_score": number
          },
          ...
        ]
    }

    Chat transcript for X:
    ${maskedConversationX}

    Chat transcript for Z:
    ${maskedConversationZ}
  `
}

/**
 * Builds the user prompt for the top quotes portion for a single week.
 */
function buildTopQuotesPrompt(
  weekMessages: ChatMessage[],
  persons: string[]
): string {
  const createMaskedConversation = (personIndex: number) => {
    return weekMessages
      .map(
        (m) =>
          `${
            m.user === persons[personIndex]
              ? personIndex === 0
                ? 'X'
                : 'Z'
              : personIndex === 0
              ? 'Z'
              : 'X'
          }: ${m.user === persons[personIndex] ? m.message : ''} [${m.index}]`
      )
      .join('\n')
  }

  const maskedConversationX = createMaskedConversation(0)
  const maskedConversationZ = createMaskedConversation(1)

  return `
    Select at most 2 quotes from each user that are either completely unhinged or incredibly sweet and heartwarming.
    NOTE! The quotes are totally unrelated to the sentiment analysis subjects. Literally just find the craziest/funniest/stupidest chats. As unique and creative and cute as possible, not just straight nsfw. (No inventing stuff though!! If there's not enough content just don't include any quotes. I repeat, no inventing.) Once you have found the quote, return its index.

    Provide your answer in the following JSON format:
    {
      "top_quotes": [
          {
            "index": number
          },
          ... (4 quotes total, 2 for each user)
        ]
    }

    Chat transcript for X:
    ${maskedConversationX}

    Chat transcript for Z:
    ${maskedConversationZ}
  `
}

/**
 * Utility to batch an array into chunks of `size`.
 */
function chunkArray<T>(arr: T[], size: number): T[][] {
  const chunks: T[][] = []
  for (let i = 0; i < arr.length; i += size) {
    chunks.push(arr.slice(i, i + size))
  }
  return chunks
}

/**
 * Replaces 'X'/'Z' placeholders with real names (the first name from persons array).
 */
function replacePersonIdentifiers(text: string, persons: string[]) {
  return text
    .replace(/\bX\b/g, persons[0].split(' ')[0])
    .replace(/\bZ\b/g, persons[1].split(' ')[0])
}

export async function fetchSentiments(
  parsedData: ChatMessage[],
  weeklyData: { data: { [key: string]: ChatMessage[] }; persons: string[] },
  hash: string
) {
  const allMajorEvents: MajorEventType[] = []

  // Prepare array of all weeks so we can batch them
  const allWeeks = Object.entries(weeklyData.data)
    .map(([weekStart, messages]) => {
      // Filter out invalid messages
      const validMessages = messages.filter((m) => {
        if (!m || typeof m !== 'object') return false
        if (!m.message || typeof m.message !== 'string') return false
        return true
      })

      const wordCount = validMessages.reduce(
        (acc, msg) => acc + msg.message.split(' ').length,
        0
      )
      // We skip weeks with very few words
      if (wordCount < 20) return null

      return {
        weekStart,
        messages: validMessages,
      }
    })
    .filter(Boolean) as { weekStart: string; messages: ChatMessage[] }[]

  // Build the request payloads for the sentiment and top-quotes calls
  const sentimentRequests = allWeeks.map((weekObj) => ({
    model: config.textModel,
    messages: [
      {
        role: 'system',
        content:
          'You are a helpful assistant that analyzes chat sentiment and identifies important events.',
      },
      {
        role: 'user',
        content: buildSentimentPrompt(weekObj.messages, weeklyData.persons),
      },
    ],
    response_format: zodResponseFormat(SentimentResponse, 'sentimentResponse'),
    temperature: 0,
  }))

  const topQuotesRequests = allWeeks.map((weekObj) => ({
    model: config.textModel,
    messages: [
      {
        role: 'system',
        content:
          'You are a model out there to find the best of humans in their natural unfiltered environment.',
      },
      {
        role: 'user',
        content: buildTopQuotesPrompt(weekObj.messages, weeklyData.persons),
      },
    ],
    response_format: zodResponseFormat(TopQuotesResponse, 'topQuotesResponse'),
    temperature: 0,
  }))

  // Helper function that calls openaiBeta in chunks of size ~25
  async function runBatchedOpenaiBeta<T>(
    requests: Parameters<typeof openaiBeta>[0][],
    batchSize = 25
  ): Promise<Awaited<ReturnType<typeof openaiBeta>>[]> {
    const results: Awaited<ReturnType<typeof openaiBeta>>[] = []
    const chunks = chunkArray(requests, batchSize)

    for (const chunk of chunks) {
      // openaiBeta can accept an array
      const chunkResult = await openaiBeta(chunk)
      // chunkResult is an array of responses
      results.push(...chunkResult)
    }
    return results
  }

  // Execute the batched calls
  const sentimentResponses = await runBatchedOpenaiBeta(sentimentRequests, 25)
  const topQuotesResponses = await runBatchedOpenaiBeta(topQuotesRequests, 25)

  // Now, we need to parse all responses
  // sentimentResponses[i] corresponds to allWeeks[i]
  // topQuotesResponses[i] corresponds to allWeeks[i]
  // We'll assemble them back together in the same order
  const sentiments: (SentimentResponseComplete | null)[] = allWeeks.map(
    (weekObj, i) => {
      const sentimentChoice =
        sentimentResponses[i].choices[0]?.message?.parsed || null
      const topQuotesChoice =
        topQuotesResponses[i].choices[0]?.message?.parsed || null

      if (!sentimentChoice) {
        return null
      }
      if (!topQuotesChoice) {
        return null
      }

      // We do the safe parse. If it fails, skip
      let parsedSentiment: z.infer<typeof SentimentResponse>
      let parsedTopQuotes: z.infer<typeof TopQuotesResponse>

      try {
        parsedSentiment = SentimentResponse.parse(sentimentChoice)
      } catch (err) {
        console.error('Could not parse sentiment response:', err)
        return null
      }

      try {
        parsedTopQuotes = TopQuotesResponse.parse(topQuotesChoice)
      } catch (err) {
        console.error('Could not parse top quotes response:', err)
        return null
      }

      // Build the final combined object
      // Step 1: Identify summary_quote if it exists
      const summaryQuoteObj = parsedSentiment.summary_quote
        ? (() => {
            const actualMessage = weekObj.messages.find(
              (m) => m.index === parsedSentiment.summary_quote!.index
            )
            if (!actualMessage) {
              return null
            }
            return {
              user: actualMessage.user,
              quote: actualMessage.message,
              index: actualMessage.index,
            }
          })()
        : null

      // Step 2: Identify the top quotes
      const quotes = parsedTopQuotes.top_quotes
        .map((quote: QuoteWithIndexType) => {
          const actualMessage = weekObj.messages.find(
            (m) => m.index === quote.index
          )
          if (!actualMessage) return null
          return {
            index: actualMessage.index,
            user: actualMessage.user,
            quote: actualMessage.message,
          }
        })
        .filter((q) => q !== null) as {
        index: number
        user: string
        quote: string
      }[]

      // Step 3: Person replacement in the justifications & events
      const replacedXJustification = replacePersonIdentifiers(
        parsedSentiment.X_justification,
        weeklyData.persons
      )
      const replacedZJustification = replacePersonIdentifiers(
        parsedSentiment.Z_justification,
        weeklyData.persons
      )

      const replacedSalientEvents = parsedSentiment.salient_events.map(
        (ev) => ({
          ...ev,
          event: replacePersonIdentifiers(ev.event, weeklyData.persons),
        })
      )

      // Step 4: Build majorEvents with context
      const majorEvents: MajorEventType[] = parsedSentiment.major_events
        .map((event) => {
          // Indices for the event
          const [weekStartIndex, weekEndIndex] = event.index_range
            .split(':')
            .map(Number)

          const startMsg = weekObj.messages.find(
            (m) => m.index === weekStartIndex
          )
          const endMsg = weekObj.messages.find((m) => m.index === weekEndIndex)

          if (!startMsg || !endMsg) {
            console.warn(
              `Warning: Could not find start/end message in week data for indices ${weekStartIndex}:${weekEndIndex}`
            )
            return null
          }

          // Now we find the same messages in the *full* parsedData array
          // so we can expand context
          const startMessageFull = parsedData.find(
            (m) =>
              m.date.getTime() === startMsg.date.getTime() &&
              m.user === startMsg.user
          )
          const endMessageFull = parsedData.find(
            (m) =>
              m.date.getTime() === endMsg.date.getTime() &&
              m.user === endMsg.user
          )

          if (!startMessageFull || !endMessageFull) {
            console.warn(
              `Warning: Could not find start/end message in full chat history for week messages at ${weekStartIndex}:${weekEndIndex}`
            )
            return null
          }

          const startIndexFull = parsedData.indexOf(startMessageFull)
          const endIndexFull = parsedData.indexOf(endMessageFull)

          // Adjust +/- 10 for context
          const contextStartIndex = Math.max(0, startIndexFull - 10)
          const contextEndIndex = Math.min(
            parsedData.length - 1,
            endIndexFull + 10
          )

          const eventMessages: EventMessage[] = parsedData
            .slice(contextStartIndex, contextEndIndex + 1)
            .map((m) => ({
              user: m.user,
              message: m.message,
              isContext:
                parsedData.indexOf(m) < startIndexFull ||
                parsedData.indexOf(m) > endIndexFull,
              isAfterContext: parsedData.indexOf(m) > endIndexFull,
              timestamp: m.date.toISOString(),
            }))

          if (eventMessages.length === 0) {
            console.warn(
              `Warning: No messages found in range ${contextStartIndex}:${contextEndIndex}`
            )
            return null
          }

          return {
            event: replacePersonIdentifiers(event.event, weeklyData.persons),
            index_range: `${startMsg.index}:${endMsg.index}`,
            timestamp_range: {
              start: startMsg.date.toISOString(),
              end: endMsg.date.toISOString(),
            },
            event_deep_dive: {
              event_summary: replacePersonIdentifiers(
                event.event_deep_dive.event_summary,
                weeklyData.persons
              ),
              key_interactions: replacePersonIdentifiers(
                event.event_deep_dive.key_interactions,
                weeklyData.persons
              ),
              emotional_responses: replacePersonIdentifiers(
                event.event_deep_dive.emotional_responses,
                weeklyData.persons
              ),
              potential_impact: replacePersonIdentifiers(
                event.event_deep_dive.potential_impact,
                weeklyData.persons
              ),
              psychoanalytical_takeaway: replacePersonIdentifiers(
                event.event_deep_dive.psychoanalytical_takeaway,
                weeklyData.persons
              ),
            },
            emojis: event.emojis,
            subject: event.subject,
            major_score: event.major_score,
            impactOnLifeTrajectory: event.impactOnLifeTrajectory,
            eventMessages,
          }
        })
        .filter((e): e is MajorEventType => e !== null)
        // Filter out major events below threshold if you only want 8+ or something
        .filter((event) => event.major_score > 7)

      // Return the final structured response for this week
      return {
        weekStart: weekObj.weekStart,
        messageCount: weekObj.messages.length,
        messageIndices: weekObj.messages.map((m) => m.index),
        X_sentiment: parsedSentiment.X_sentiment,
        X_justification: replacedXJustification,
        Z_sentiment: parsedSentiment.Z_sentiment,
        Z_justification: replacedZJustification,
        salient_events: replacedSalientEvents,
        top_quotes: quotes,
        ...(summaryQuoteObj && { summary_quote: summaryQuoteObj }),
        major_events: majorEvents,
      } as SentimentResponseComplete
    }
  )

  // Now gather all major events
  // (Filter out null sentiments first so we don't try to read .major_events of null)
  const nonNullSentiments = sentiments.filter(
    (s): s is SentimentResponseComplete => s !== null
  )
  nonNullSentiments.forEach((sentiment) => {
    if (sentiment?.major_events) {
      allMajorEvents.push(...sentiment.major_events)
    }
  })

  // Finally, upload to S3
  await uploadJsonToS3(`chat/${hash}/sentiment.json`, {
    sentiments: nonNullSentiments,
    allMajorEvents,
  })

  return {
    sentiments: nonNullSentiments,
    allMajorEvents,
  }
}

/**
 * Same volatility calculation as before
 */
export function calculateVolatility(data: number[]): number {
  if (data.length < 2) return 0
  const changes = data.slice(1).map((value, index) => value - data[index])
  const meanChange =
    changes.reduce((sum, change) => sum + change, 0) / changes.length
  const squaredDifferences = changes.map((change) =>
    Math.pow(change - meanChange, 2)
  )
  const variance =
    squaredDifferences.reduce((sum, sqDiff) => sum + sqDiff, 0) /
    (changes.length - 1)
  return Math.sqrt(variance)
}
