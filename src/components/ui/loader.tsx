import { Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'

interface LoaderProps extends React.HTMLAttributes<HTMLDivElement> {
  size?: 'sm' | 'md' | 'lg'
}

const sizeMap = {
  sm: 'h-4 w-4',
  md: 'h-6 w-6',
  lg: 'h-8 w-8'
}

export function Loader({ size = 'md', className, ...props }: LoaderProps) {
  return (
    <div className={cn('animate-spin', className)} {...props}>
      <Loader2 className={sizeMap[size]} />
    </div>
  )
}
