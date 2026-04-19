import * as React from 'react'
import { Slot } from '@radix-ui/react-slot'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

const buttonVariants = cva(
  'inline-flex items-center justify-center whitespace-nowrap text-xs font-mono font-black transition-all focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50 uppercase tracking-widest',
  {
    variants: {
      variant: {
        default: 'bg-white text-black border border-white hover:bg-transparent hover:text-white',
        destructive:
          'bg-red-600 text-white border border-red-600 hover:bg-transparent hover:text-red-600',
        outline:
          'border border-white/20 bg-transparent text-white hover:border-white hover:bg-white/5',
        secondary:
          'bg-zinc-800 text-white border border-zinc-800 hover:bg-transparent hover:text-zinc-400',
        ghost: 'hover:bg-white/5 text-zinc-400 hover:text-white',
        link: 'text-white underline-offset-4 hover:underline',
      },
      size: {
        default: 'h-12 px-6',
        sm: 'h-9 px-4',
        lg: 'h-14 px-10',
        icon: 'h-10 w-10',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : 'button'
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = 'Button'

export { Button, buttonVariants }
