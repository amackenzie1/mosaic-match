'use client'

import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { useS3Fetcher } from '@/lib/utils/fetcher'
import { calculateAllMetrics } from '@/lib/utils/metrics'
import { AnimatePresence, motion } from 'framer-motion'
import { ChevronDown } from 'lucide-react'
import React, { useEffect, useMemo, useState } from 'react'

const MetricSwitcher: React.FC = () => {
  const [currentMetricIndex, setCurrentMetricIndex] = useState(0)
  const [isOpen, setIsOpen] = useState(false)

  const { data: raw_metrics } = useS3Fetcher<string[]>({
    generator: calculateAllMetrics,
    cachePath: 'chat/:hash:/metrics.json',
  })
  const metrics = useMemo(() => raw_metrics || [], [raw_metrics])

  useEffect(() => {
    if (metrics.length > 0 && !isOpen) {
      const intervalId = setInterval(() => {
        setCurrentMetricIndex((prevIndex) => (prevIndex + 1) % metrics.length)
      }, 5000)
      return () => clearInterval(intervalId)
    }
  }, [metrics, isOpen])

  if (metrics.length === 0) {
    return (
      <div className="flex items-center justify-center h-16 text-sm text-muted-foreground">
        Loading metrics...
      </div>
    )
  }

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <button className="w-full group outline-none">
          <div className="flex items-center justify-center gap-2 py-2">
            <AnimatePresence mode="wait">
              <motion.div
                key={currentMetricIndex}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.3 }}
                className="text-[10px] xs:text-xs sm:text-sm md:text-base font-medium text-muted-foreground line-clamp-1 max-w-[130px] sm:max-w-full"
              >
                {metrics[currentMetricIndex]}
              </motion.div>
            </AnimatePresence>
            <ChevronDown
              className={`h-3 w-3 text-muted-foreground/50 transition-transform duration-200 ${
                isOpen ? 'rotate-180' : ''
              }`}
            />
          </div>
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-[260px] p-0" align="center">
        <motion.div
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2 }}
        >
          <div className="grid divide-y divide-border">
            {metrics.map((metric, index) => (
              <motion.button
                key={index}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: index * 0.05 }}
                className={`text-xs sm:text-sm py-2 px-3 text-center transition-colors hover:bg-accent line-clamp-2 ${
                  index === currentMetricIndex
                    ? 'text-foreground font-medium bg-accent'
                    : 'text-muted-foreground'
                }`}
                onClick={() => {
                  setCurrentMetricIndex(index)
                  setIsOpen(false)
                }}
              >
                {metric}
              </motion.button>
            ))}
          </div>
        </motion.div>
      </PopoverContent>
    </Popover>
  )
}

export default MetricSwitcher
