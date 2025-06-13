import { useState, useEffect, useCallback, useRef } from 'react'

interface UseInfiniteScrollOptions {
  threshold?: number
  rootMargin?: string
}

export function useInfiniteScroll(
  callback: () => void,
  hasMore: boolean,
  loading: boolean,
  options: UseInfiniteScrollOptions = {}
) {
  const { threshold = 1.0, rootMargin = '100px' } = options
  const [isFetching, setIsFetching] = useState(false)
  const observerRef = useRef<IntersectionObserver | null>(null)
  const targetRef = useRef<HTMLDivElement | null>(null)

  const handleIntersection = useCallback(
    (entries: IntersectionObserverEntry[]) => {
      const target = entries[0]
      if (target.isIntersecting && hasMore && !loading && !isFetching) {
        setIsFetching(true)
        callback()
      }
    },
    [callback, hasMore, loading, isFetching]
  )

  useEffect(() => {
    if (targetRef.current) {
      observerRef.current = new IntersectionObserver(handleIntersection, {
        threshold,
        rootMargin,
      })
      observerRef.current.observe(targetRef.current)
    }

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect()
      }
    }
  }, [handleIntersection, threshold, rootMargin])

  useEffect(() => {
    if (!loading) {
      setIsFetching(false)
    }
  }, [loading])

  return { targetRef, isFetching }
}