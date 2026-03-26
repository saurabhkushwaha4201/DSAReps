import { twMerge } from 'tailwind-merge'
import { clsx } from 'clsx'

function Skeleton({ className, ...props }) {
    return (
        <div
            className={twMerge(clsx("animate-pulse rounded-md bg-slate-200", className))}
            {...props}
        />
    )
}

export { Skeleton }
