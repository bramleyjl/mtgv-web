import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Utility function for responsive card grid classes
export function getCardGridClasses(columns: number = 4) {
  return {
    grid: `grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-${columns} xl:grid-cols-${columns + 1} 2xl:grid-cols-${columns + 2}`,
    gap: 'gap-4 md:gap-6',
  }
}

// Utility function for card container classes
export function getCardContainerClasses() {
  return cn(
    'max-w-card mx-auto',
    'rounded-lg overflow-hidden',
    'border-2 border-gray-200',
    'transition-all duration-200',
    'hover:card-hover',
    'focus:outline-none focus:ring-2 focus:ring-primary-500'
  )
}

// Utility function for responsive text classes
export function getResponsiveTextClasses(size: 'sm' | 'base' | 'lg' | 'xl' = 'base') {
  const sizes = {
    sm: 'text-xs sm:text-sm',
    base: 'text-sm sm:text-base',
    lg: 'text-base sm:text-lg',
    xl: 'text-lg sm:text-xl',
  }
  return sizes[size]
} 