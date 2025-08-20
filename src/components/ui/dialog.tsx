'use client'

import React from 'react'
import { XMarkIcon } from '@heroicons/react/24/outline'

export interface DialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  children: React.ReactNode
}

export interface DialogContentProps {
  children: React.ReactNode
  className?: string
}

export interface DialogHeaderProps {
  children: React.ReactNode
}

export interface DialogTitleProps {
  children: React.ReactNode
  className?: string
}

export interface DialogFooterProps {
  children: React.ReactNode
}

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  className?: string
}

export function Dialog({ open, onOpenChange, children }: DialogProps) {
  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* 背景遮罩 */}
      <div 
        className="fixed inset-0 bg-black/50 backdrop-blur-sm"
        onClick={() => onOpenChange(false)}
      />
      
      {/* 对话框内容 */}
      <div className="relative z-10">
        {children}
      </div>
    </div>
  )
}

export function DialogContent({ children, className = '' }: DialogContentProps) {
  return (
    <div className={`bg-background border border-border rounded-lg shadow-lg p-6 w-full max-w-md mx-4 ${className}`}>
      {children}
    </div>
  )
}

export function DialogHeader({ children }: DialogHeaderProps) {
  return (
    <div className="mb-4">
      {children}
    </div>
  )
}

export function DialogTitle({ children, className = '' }: DialogTitleProps) {
  return (
    <h2 className={`text-lg font-semibold text-foreground ${className}`}>
      {children}
    </h2>
  )
}

export function DialogFooter({ children }: DialogFooterProps) {
  return (
    <div className="flex justify-end gap-2 mt-6">
      {children}
    </div>
  )
}

export function Textarea({ className = '', ...props }: TextareaProps) {
  return (
    <textarea
      className={`
        w-full px-3 py-2 border border-border rounded-md
        bg-background text-foreground
        placeholder:text-muted-foreground
        focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent
        disabled:opacity-50 disabled:cursor-not-allowed
        ${className}
      `}
      {...props}
    />
  )
}
