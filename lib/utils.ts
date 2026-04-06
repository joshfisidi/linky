import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDistanceToNow(date: Date, options?: { addSuffix?: boolean }): string {
  const now = new Date()
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000)

  if (diffInSeconds < 60) {
    return options?.addSuffix ? "just now" : "now"
  }

  const diffInMinutes = Math.floor(diffInSeconds / 60)
  if (diffInMinutes < 60) {
    const suffix = options?.addSuffix ? " ago" : ""
    return `${diffInMinutes}m${suffix}`
  }

  const diffInHours = Math.floor(diffInMinutes / 60)
  if (diffInHours < 24) {
    const suffix = options?.addSuffix ? " ago" : ""
    return `${diffInHours}h${suffix}`
  }

  const diffInDays = Math.floor(diffInHours / 24)
  if (diffInDays < 7) {
    const suffix = options?.addSuffix ? " ago" : ""
    return `${diffInDays}d${suffix}`
  }

  const diffInWeeks = Math.floor(diffInDays / 7)
  if (diffInWeeks < 4) {
    const suffix = options?.addSuffix ? " ago" : ""
    return `${diffInWeeks}w${suffix}`
  }

  const diffInMonths = Math.floor(diffInDays / 30)
  if (diffInMonths < 12) {
    const suffix = options?.addSuffix ? " ago" : ""
    return `${diffInMonths}mo${suffix}`
  }

  const diffInYears = Math.floor(diffInDays / 365)
  const suffix = options?.addSuffix ? " ago" : ""
  return `${diffInYears}y${suffix}`
}
