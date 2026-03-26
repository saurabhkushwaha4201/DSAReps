import * as React from "react"
import { twMerge } from 'tailwind-merge'
import { clsx } from 'clsx'

const Card = React.forwardRef(({ className, ...props }, ref) => (
    <div
        ref={ref}
        className={twMerge(clsx(
            "rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-950 dark:text-slate-100 shadow-sm transition-all duration-300 hover:shadow-md hover:-translate-y-0.5",
            className
        ))}
        {...props}
    />
))
Card.displayName = "Card"

const CardHeader = React.forwardRef(({ className, ...props }, ref) => (
    <div
        ref={ref}
        className={twMerge(clsx("flex flex-col space-y-1.5 p-6", className))}
        {...props}
    />
))
CardHeader.displayName = "CardHeader"

const CardTitle = React.forwardRef(({ className, ...props }, ref) => (
    <h3
        ref={ref}
        className={twMerge(clsx(
            "text-2xl font-semibold leading-none tracking-tight",
            className
        ))}
        {...props}
    />
))
CardTitle.displayName = "CardTitle"

const CardDescription = React.forwardRef(({ className, ...props }, ref) => (
    <p
        ref={ref}
        className={twMerge(clsx("text-sm text-slate-500", className))}
        {...props}
    />
))
CardDescription.displayName = "CardDescription"

const CardContent = React.forwardRef(({ className, ...props }, ref) => (
    <div ref={ref} className={twMerge(clsx("p-6 pt-0", className))} {...props} />
))
CardContent.displayName = "CardContent"

const CardFooter = React.forwardRef(({ className, ...props }, ref) => (
    <div
        ref={ref}
        className={cn("flex items-center p-6 pt-0", className)}
        {...props}
    />
))
CardFooter.displayName = "CardFooter"

export { Card, CardHeader, CardFooter, CardTitle, CardDescription, CardContent }
