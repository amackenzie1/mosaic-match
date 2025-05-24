import { EventMessage } from '@/components/custom/main/tiles/sentiment/SentimentChartDrillDown'
import { Button } from '@/components/ui/button'
import { DashboardUser } from '@/lib/types/users'
import { cn } from '@/lib/utils'
import { MajorEventType } from '@/lib/utils/sentimentAnalysis'
import { format } from 'date-fns'
import { ArrowLeft, ArrowUp } from 'lucide-react'
import { useEffect, useState } from 'react'

// Color mapping for different categories
const categoryColors: Record<string, { positive: string; negative: string }> = {
  friendship: {
    positive: '#B3DBFF', // Light blue
    negative: '#003399', // Rich navy blue
  },
  professional: {
    positive: '#E0E0E0', // Light gray
    negative: '#2B2B2B', // Rich dark gray
  },
  romance: {
    positive: '#FFB3B3', // Soft pastel pink
    negative: '#990000', // Rich blood red
  },
  family: {
    positive: '#B8E6B8', // Soft pastel green
    negative: '#004400', // Rich forest green
  },
  default: {
    positive: '#F5F5F5', // Light grey
    negative: '#333333', // Rich dark grey
  },
}

// Helper function to get category color with intensity
const getCategoryColor = (
  category: string,
  sentiment: number,
  majorScore: number
): string => {
  const colors = categoryColors[category] || categoryColors.default
  const baseColor = sentiment >= 0 ? colors.positive : colors.negative
  const intensity = Math.min(majorScore / 10, 1)

  if (sentiment >= 0) {
    const r = parseInt(baseColor.slice(1, 3), 16)
    const g = parseInt(baseColor.slice(3, 5), 16)
    const b = parseInt(baseColor.slice(5, 7), 16)

    const adjustedR = Math.round(255 - (255 - r) * intensity)
    const adjustedG = Math.round(255 - (255 - g) * intensity)
    const adjustedB = Math.round(255 - (255 - b) * intensity)

    return `rgb(${adjustedR}, ${adjustedG}, ${adjustedB})`
  } else {
    const r = parseInt(baseColor.slice(1, 3), 16)
    const g = parseInt(baseColor.slice(3, 5), 16)
    const b = parseInt(baseColor.slice(5, 7), 16)

    const adjustedR = Math.round(r * (1 - intensity * 0.2))
    const adjustedG = Math.round(g * (1 - intensity * 0.2))
    const adjustedB = Math.round(b * (1 - intensity * 0.2))

    return `rgb(${adjustedR}, ${adjustedG}, ${adjustedB})`
  }
}

// Helper to determine if light text should be used
const shouldUseLightText = (
  category: string,
  sentiment: number,
  majorScore: number
): boolean => {
  return sentiment < 0
}

// Helper to update user references in text
const updateUserReferences = (
  text: string | undefined,
  users: DashboardUser[]
): string => {
  if (!text) return ''

  // Define regex patterns for different mention styles
  const patterns = [
    /\{([^}]+)\}/g, // {username}
    /@(\w+)/g, // @username
    /\b(\w+)\b/g, // username as a standalone word
  ]

  let updatedText = text

  patterns.forEach((pattern) => {
    updatedText = updatedText.replace(pattern, (match: string, p1: string) => {
      const user = users.find(
        (u: DashboardUser) => u.username.toLowerCase() === p1.toLowerCase()
      )
      return user ? user.name : match
    })
  })

  return updatedText
}

interface EventCardProps {
  event: MajorEventType
  chatNames: Record<string, string>
  chatUsers: Record<string, DashboardUser[]>
  chatCategories: Record<string, string>
  onClick: (event: MajorEventType) => void
}

// Event Card Component
const EventCard = ({
  event,
  chatNames,
  chatUsers,
  chatCategories,
  onClick,
}: EventCardProps) => {
  const eventUsers =
    event.hash && chatUsers[event.hash] ? chatUsers[event.hash] : []
  const chatName = event.hash
    ? updateUserReferences(chatNames[event.hash], eventUsers)
    : 'Unknown Chat'
  const category = event.hash ? chatCategories[event.hash] : 'default'
  const sentiment = event.sentiment || 0
  const useLightText = shouldUseLightText(
    category,
    sentiment,
    event.major_score
  )

  return (
    <div
      onClick={() => onClick(event)}
      className={cn(
        'group relative p-4 rounded-lg border cursor-pointer',
        'transition-all duration-200 ease-in-out hover:translate-y-[-2px]',
        'before:absolute before:inset-0 before:rounded-lg before:transition-opacity',
        'before:bg-gradient-to-b before:from-background/10 before:to-background/5 before:backdrop-blur-sm',
        'hover:shadow-md',
        sentiment < 0 ? 'text-white' : 'text-gray-900'
      )}
      style={{
        backgroundColor: getCategoryColor(
          category,
          sentiment,
          event.major_score
        ),
      }}
    >
      <div className="relative z-10">
        <div className="flex justify-between items-center mb-2">
          <div className="flex items-center gap-1.5">
            <div
              className={cn(
                'w-2 h-2 rounded-full',
                sentiment < 0
                  ? 'bg-white/70'
                  : sentiment > 0
                  ? 'bg-green-500'
                  : 'bg-red-500'
              )}
            />
            <span
              className={cn(
                'text-xs font-medium',
                sentiment < 0 ? 'text-white/80' : 'text-gray-600'
              )}
            >
              {format(new Date(event.timestamp_range.start), 'MMM d, yyyy')}
            </span>
          </div>

          <span
            className={cn(
              'font-medium text-xs px-2 py-0.5 rounded-full',
              sentiment < 0
                ? 'bg-white/10 text-white'
                : sentiment > 0
                ? 'bg-green-100 text-green-800'
                : 'bg-red-100 text-red-800'
            )}
          >
            {sentiment > 0 ? '+' : ''}
            {sentiment.toFixed(1)}
          </span>
        </div>

        <h3 className="font-medium text-sm mb-1 line-clamp-2">
          {updateUserReferences(event.event || '', eventUsers)}
        </h3>

        <div className="flex justify-between items-center">
          <span
            className={cn(
              'text-xs',
              sentiment < 0 ? 'text-white/70' : 'text-gray-600'
            )}
          >
            {chatName}
          </span>

          <span
            className={cn(
              'text-xs font-medium',
              sentiment < 0 ? 'text-white/70' : 'text-gray-600'
            )}
          >
            Score: {event.major_score}
          </span>
        </div>
      </div>
    </div>
  )
}

interface AnalysisSectionProps {
  title: string
  content: string | undefined
  users: DashboardUser[]
}

// Analysis Section Component
const AnalysisSection = ({ title, content, users }: AnalysisSectionProps) => (
  <div className="bg-muted/30 rounded-lg p-4">
    <h2 className="text-sm font-semibold text-primary mb-2 flex items-center gap-1.5">
      <div className="w-1 h-5 bg-primary rounded-full"></div>
      {title}
    </h2>
    <p className="text-sm leading-relaxed text-foreground">
      {updateUserReferences(content || '', users)}
    </p>
  </div>
)

interface MessageItemProps {
  message: EventMessage
  users: DashboardUser[]
  hash: string | undefined
  chatUsers: Record<string, DashboardUser[]>
}

// Message Item Component
const MessageItem = ({ message, users, hash, chatUsers }: MessageItemProps) => {
  const user = hash
    ? chatUsers[hash]?.find((u: DashboardUser) => u.username === message.user)
    : undefined
  const displayName = user ? user.name : message.user
  const isContextMessage = message.isContext

  return (
    <div
      className={cn(
        'p-3 rounded-lg relative',
        'shadow-sm',
        isContextMessage
          ? 'bg-muted/30 border border-border/20'
          : 'bg-primary/5 border border-primary/20'
      )}
    >
      <div className="relative">
        <div className="flex justify-between items-center mb-2">
          <div className="flex items-center gap-2">
            {/* Small user avatar circle */}
            <div
              className={cn(
                'w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-medium',
                isContextMessage
                  ? 'bg-muted-foreground/20 text-muted-foreground'
                  : 'bg-primary/20 text-primary'
              )}
            >
              {displayName.charAt(0).toUpperCase()}
            </div>
            <span
              className={cn(
                'text-xs font-medium',
                !user && 'text-destructive',
                isContextMessage ? 'text-muted-foreground' : 'text-foreground'
              )}
            >
              {displayName}
            </span>
          </div>
          <span className="text-[10px] text-muted-foreground">
            {format(new Date(message.timestamp), 'MMM d, h:mm a')}
          </span>
        </div>
        <p
          className={cn(
            'text-xs whitespace-pre-wrap break-words leading-relaxed',
            isContextMessage ? 'text-muted-foreground' : 'text-foreground'
          )}
        >
          {updateUserReferences(
            message.message,
            hash ? chatUsers[hash] || [] : []
          )}
        </p>
      </div>
    </div>
  )
}

interface EventDetailHeaderProps {
  selectedEvent: MajorEventType
  useLightText: boolean
  sentiment: number
  category: string
  majorScore: number
  relevantUsers: DashboardUser[]
}

// Event Detail Header Component
const EventDetailHeader = ({
  selectedEvent,
  useLightText,
  sentiment,
  category,
  majorScore,
  relevantUsers,
}: EventDetailHeaderProps) => (
  <div
    className={cn(
      'relative p-4 rounded-lg mb-6 shadow-md',
      'before:absolute before:inset-0 before:rounded-lg before:transition-opacity',
      'before:bg-gradient-to-b before:from-background/10 before:to-background/5 before:backdrop-blur-sm',
      useLightText ? 'text-white' : 'text-foreground'
    )}
    style={{
      backgroundColor: getCategoryColor(category, sentiment, majorScore),
    }}
  >
    <div className="relative z-10">
      <div className="flex items-center gap-1.5 mb-2">
        <div
          className={cn(
            'w-2 h-2 rounded-full',
            sentiment < 0
              ? 'bg-white/70'
              : sentiment > 0
              ? 'bg-green-500'
              : 'bg-red-500'
          )}
        />
        <span
          className={cn(
            'text-xs font-medium',
            useLightText ? 'text-white/70' : 'text-muted-foreground'
          )}
        >
          {format(
            new Date(selectedEvent.timestamp_range.start),
            'MMMM d, yyyy'
          )}
        </span>
      </div>

      <h3 className="text-base font-semibold mb-3">
        {updateUserReferences(selectedEvent.event || '', relevantUsers)}
      </h3>

      <div className="flex gap-2">
        <span
          className={cn(
            'text-xs font-medium px-2 py-1 rounded-full',
            useLightText ? 'bg-white/10' : 'bg-background/50'
          )}
        >
          Importance: {majorScore}
        </span>
        <span
          className={cn(
            'text-xs font-medium px-2 py-1 rounded-full',
            useLightText
              ? 'bg-white/10'
              : sentiment > 0
              ? 'bg-green-100 text-green-700 dark:bg-green-500/20 dark:text-green-400'
              : 'bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-400'
          )}
        >
          Sentiment: {sentiment > 0 ? '+' : ''}
          {sentiment.toFixed(1)}
        </span>
      </div>
    </div>
  </div>
)

interface SentimentEventsSidebarProps {
  isOpen: boolean
  events: MajorEventType[]
  chatNames: Record<string, string>
  chatCategories: Record<string, string>
  dateRange: number[]
  minDate: number
  maxDate: number
  chatUsers: Record<string, DashboardUser[]>
}

// Main Component
const SentimentEventsSidebar = ({
  isOpen,
  events,
  chatNames,
  chatCategories,
  dateRange,
  minDate,
  maxDate,
  chatUsers,
}: SentimentEventsSidebarProps) => {
  const [selectedEvent, setSelectedEvent] = useState<MajorEventType | null>(
    null
  )
  const [showScrollTop, setShowScrollTop] = useState(false)
  const [isScrolling, setIsScrolling] = useState(false)
  let scrollTimeout: NodeJS.Timeout | undefined
  const [listScrollPosition, setListScrollPosition] = useState(0)

  // Handle scroll to show/hide scroll-to-top button
  const handleScroll = (event: React.UIEvent<HTMLDivElement>) => {
    const scrollTop = event.currentTarget.scrollTop
    setShowScrollTop(scrollTop > 200)

    setIsScrolling(true)
    if (scrollTimeout) clearTimeout(scrollTimeout)

    scrollTimeout = setTimeout(() => {
      setIsScrolling(false)
    }, 2000)
  }

  // Scroll to top function
  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth',
    })
  }

  // Filter and sort events
  const visibleEvents = events.filter((event: MajorEventType) => {
    const eventDate = new Date(event.timestamp_range.start).getTime()
    const percentage = ((eventDate - minDate) / (maxDate - minDate)) * 100
    return percentage >= dateRange[0] && percentage <= dateRange[1]
  })

  const sortedEvents = [...visibleEvents].sort(
    (a, b) =>
      new Date(a.timestamp_range.start).getTime() -
      new Date(b.timestamp_range.start).getTime()
  )

  const handleEventClick = (event: MajorEventType) => {
    setListScrollPosition(window.scrollY)
    setSelectedEvent(event)
  }

  const handleBackClick = () => {
    setSelectedEvent(null)
    setTimeout(() => {
      window.scrollTo(0, listScrollPosition)
    }, 0)
  }

  // Clean up the timeout when component unmounts
  useEffect(() => {
    return () => {
      if (scrollTimeout) clearTimeout(scrollTimeout)
    }
  }, [])

  // Reset scroll position when selecting an event
  useEffect(() => {
    if (selectedEvent) {
      setTimeout(() => {
        window.scrollTo(0, 0)
      }, 0)
    }
  }, [selectedEvent])

  // Render the list of events
  const renderEventList = () => (
    <div className="h-[calc(100%-52px)] overflow-auto">
      <div className="p-3 space-y-3">
        {sortedEvents.map((event, index) => (
          <EventCard
            key={index}
            event={event}
            chatNames={chatNames}
            chatUsers={chatUsers}
            chatCategories={chatCategories}
            onClick={handleEventClick}
          />
        ))}

        {sortedEvents.length === 0 && (
          <div className="flex flex-col items-center justify-center h-40 text-center p-4">
            <p className="text-muted-foreground text-sm mb-2">
              No events in selected date range
            </p>
            <p className="text-xs text-muted-foreground">
              Try adjusting the date slider to see more events
            </p>
          </div>
        )}
      </div>
    </div>
  )

  // Render the event detail view
  const renderEventDetail = () => {
    if (!selectedEvent) return null

    const category = selectedEvent.hash
      ? chatCategories[selectedEvent.hash]
      : 'default'
    const sentiment = selectedEvent.sentiment || 0
    const majorScore = selectedEvent.major_score || 0
    const useLightText = shouldUseLightText(category, sentiment, majorScore)
    const relevantUsers = selectedEvent.hash
      ? chatUsers[selectedEvent.hash] || []
      : []

    const deepDive = selectedEvent.event_deep_dive || {}

    // Analysis sections data
    const analysisSections = [
      { title: 'Event Summary', content: deepDive.event_summary },
      { title: 'Key Interactions', content: deepDive.key_interactions },
      { title: 'Emotional Impact', content: deepDive.emotional_responses },
      { title: 'Impact on Relationship', content: deepDive.potential_impact },
      {
        title: 'Psychological Analysis',
        content: deepDive.psychoanalytical_takeaway,
      },
    ]

    return (
      <div className="h-full relative overflow-auto" onScroll={handleScroll}>
        {/* Scroll to Top Button */}
        <Button
          variant="secondary"
          size="icon"
          onClick={scrollToTop}
          onMouseEnter={() => setIsScrolling(true)}
          className={cn(
            'sticky left-1/2 -translate-x-1/2 top-5 z-50 shadow-md transition-opacity duration-200',
            showScrollTop && isScrolling ? 'opacity-100' : 'opacity-0'
          )}
        >
          <ArrowUp className="h-4 w-4" />
        </Button>

        {/* Top Bar with Back Button */}
        <div className="px-4 py-3 border-b border-border/50 flex items-center justify-between sticky top-0 bg-card z-10">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleBackClick}
            className="flex items-center gap-1 text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            <span>Back</span>
          </Button>

          <h2 className="text-sm font-medium">Event Details</h2>
        </div>

        <div className="p-4">
          {/* Event Summary Card */}
          <EventDetailHeader
            selectedEvent={selectedEvent}
            useLightText={useLightText}
            sentiment={sentiment}
            category={category}
            majorScore={majorScore}
            relevantUsers={relevantUsers}
          />

          {/* Analysis Sections */}
          <div className="grid gap-5 mb-8">
            {analysisSections.map((section, index) => (
              <AnalysisSection
                key={index}
                title={section.title}
                content={section.content}
                users={relevantUsers}
              />
            ))}
          </div>

          {/* Messages Section */}
          <div className="mb-8">
            <div className="flex items-center gap-1.5 mb-4">
              <div className="w-1 h-5 bg-primary rounded-full"></div>
              <h2 className="text-sm font-semibold text-primary">
                Related Messages
              </h2>
            </div>

            <div className="flex flex-col gap-3">
              {selectedEvent.eventMessages?.map(
                (message: EventMessage, index: number) => (
                  <MessageItem
                    key={index}
                    message={message}
                    users={relevantUsers}
                    hash={selectedEvent.hash}
                    chatUsers={chatUsers}
                  />
                )
              )}

              {(!selectedEvent.eventMessages ||
                selectedEvent.eventMessages.length === 0) && (
                <div className="bg-muted/20 p-4 rounded-lg text-center">
                  <p className="text-sm text-muted-foreground">
                    No messages available for this event
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div
      className={cn(
        'overflow-hidden transition-all duration-300 ease-in-out h-full rounded-r-lg',
        isOpen ? 'w-[35%] border-l border-border/50' : 'w-0'
      )}
    >
      {isOpen && (
        <div className="h-full bg-card">
          {selectedEvent ? (
            <div className="h-full transition-opacity duration-200">
              {renderEventDetail()}
            </div>
          ) : (
            <div className="h-full">
              <div className="px-4 py-3 border-b border-border/50">
                <h2 className="text-base font-semibold">Sentiment Events</h2>
                <p className="text-xs text-muted-foreground">
                  Notable events affecting sentiment over time
                </p>
              </div>
              {renderEventList()}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default SentimentEventsSidebar
