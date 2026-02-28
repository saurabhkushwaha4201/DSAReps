import * as React from "react"
import { cva } from "class-variance-authority"
import { cn } from "../../utils/cn"

const badgeVariants = cva(
    "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-slate-950 focus:ring-offset-2",
    {
        variants: {
            variant: {
                default:
                    "border-transparent bg-slate-900 text-slate-50 hover:bg-slate-900/80",
                secondary:
                    "border-transparent bg-slate-100 text-slate-900 hover:bg-slate-100/80",
                destructive:
                    "border-transparent bg-red-500 text-slate-50 hover:bg-red-500/80",
                outline: "text-slate-950",
                easy: "border-transparent bg-emerald-100 text-emerald-700 hover:bg-emerald-200",
                medium: "border-transparent bg-amber-100 text-amber-700 hover:bg-amber-200",
                hard: "border-transparent bg-rose-100 text-rose-700 hover:bg-rose-200",
            },
        },
        defaultVariants: {
            variant: "default",
        },
    }
)

function Badge({ className, variant, ...props }) {
    return (
        <div className={cn(badgeVariants({ variant }), className)} {...props} />
    )
}

export { Badge, badgeVariants }
