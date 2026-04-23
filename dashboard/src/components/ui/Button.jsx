import * as React from "react"
import { cva } from "class-variance-authority"
import { twMerge } from 'tailwind-merge'
import { clsx } from 'clsx'
import { motion } from 'framer-motion'

const buttonVariants = cva(
    "inline-flex items-center justify-center rounded-lg text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600 focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none ring-offset-white",
    {
        variants: {
            variant: {
                default: "bg-indigo-600 text-white hover:bg-indigo-700 shadow-sm border border-transparent",
                destructive: "bg-red-500 text-white hover:bg-red-600",
                outline: "border border-slate-200 hover:bg-slate-100 hover:text-slate-900",
                secondary: "bg-slate-100 text-slate-900 hover:bg-slate-200",
                ghost: "hover:bg-slate-100 hover:text-slate-900",
                link: "underline-offset-4 hover:underline text-indigo-600",
            },
            size: {
                default: "h-10 py-2 px-4",
                sm: "h-9 px-3 rounded-md",
                lg: "h-11 px-8 rounded-md",
                icon: "h-10 w-10",
            },
        },
        defaultVariants: {
            variant: "default",
            size: "default",
        },
    }
)

const composeRefs = (...refs) => (node) => {
    refs.forEach((ref) => {
        if (!ref) return
        if (typeof ref === 'function') {
            ref(node)
            return
        }
        ref.current = node
    })
}

const Button = React.forwardRef(({ className, variant, size, asChild = false, ...props }, ref) => {
    if (asChild && React.isValidElement(props.children)) {
        const child = React.Children.only(props.children)
        return React.cloneElement(child, {
            ...props,
            className: twMerge(clsx(buttonVariants({ variant, size, className }), child.props.className)),
            ref: composeRefs(ref, child.ref),
        })
    }

    return (
        <motion.button
            whileTap={{ scale: 0.95 }}
            className={twMerge(clsx(buttonVariants({ variant, size, className })))}
            ref={ref}
            {...props}
        />
    )
})
Button.displayName = "Button"

export { Button, buttonVariants }
