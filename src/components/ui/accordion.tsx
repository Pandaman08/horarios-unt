"use client"

import * as React from "react"
import { useState } from "react"
import { cn } from "@/lib/utils"
import { ChevronDown } from "lucide-react"

// Componente simple: cada Item maneja su propio estado
interface AccordionProps {
  className?: string
  children: React.ReactNode
}

function Accordion({ className, children }: AccordionProps) {
  return <div className={cn("w-full", className)}>{children}</div>
}

interface AccordionItemProps {
  className?: string
  children: React.ReactNode
  // Para compatibilidad con el uso anterior
  value?: string
}

function AccordionItem({ className, children, value }: AccordionItemProps) {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <div className={cn("border-b last:border-0", className)}>
      {React.Children.map(children, (child) => {
        if (React.isValidElement(child)) {
          // Pasamos el estado a los hijos
          return React.cloneElement(child as React.ReactElement<any>, {
            isOpen,
            setIsOpen,
          })
        }
        return child
      })}
    </div>
  )
}

interface AccordionTriggerProps {
  className?: string
  children: React.ReactNode
  isOpen?: boolean
  setIsOpen?: (open: boolean) => void
  // Para compatibilidad con el uso anterior
  onClick?: () => void
}

function AccordionTrigger({
  className,
  children,
  isOpen = false,
  setIsOpen,
  onClick,
}: AccordionTriggerProps) {
  const handleClick = () => {
    if (onClick) onClick()
    else setIsOpen?.(!isOpen)
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      className={cn(
        "flex flex-1 items-center justify-between py-4 text-sm font-medium transition-all hover:underline text-left",
        className
      )}
    >
      {children}
      <ChevronDown
        className={cn("h-4 w-4 shrink-0 transition-transform duration-200", isOpen && "rotate-180")}
      />
    </button>
  )
}

interface AccordionContentProps {
  className?: string
  children: React.ReactNode
  isOpen?: boolean
}

function AccordionContent({
  className,
  children,
  isOpen = false,
}: AccordionContentProps) {
  return (
    <div
      className={cn(
        "overflow-hidden text-sm transition-all duration-200",
        isOpen ? "max-h-[2000px] opacity-100" : "max-h-0 opacity-0",
        className
      )}
    >
      <div className="pb-4 pt-0">{children}</div>
    </div>
  )
}

export { Accordion, AccordionContent, AccordionItem, AccordionTrigger }
