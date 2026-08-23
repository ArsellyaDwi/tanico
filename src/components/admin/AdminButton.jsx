"use client";

import React from 'react';

export default function AdminButton({
  children,
  onClick,
  type = 'button',
  variant = 'primary', // 'primary' | 'secondary' | 'danger' | 'dangerLight' | 'outline' | 'ghost'
  size = 'md', // 'sm' (32-34px) | 'md' (38-42px) | 'lg' (44px)
  disabled = false,
  className = '',
  icon: Icon = null,
  fullWidth = false,
  title,
  ariaLabel,
  ...props
}) {
  const baseStyles = "inline-flex items-center justify-center font-semibold rounded-full transition-all duration-200 cursor-pointer select-none disabled:opacity-50 disabled:cursor-not-allowed shrink-0";

  // Compact size scale matched with TaniCo Hero "Belanja Sekarang" button (h-9 to h-10, rounded-full)
  const sizeStyles = {
    sm: "h-8 px-3.5 text-xs gap-1.5",
    md: "h-9 sm:h-10 px-4 sm:px-5 text-xs sm:text-sm gap-2",
    lg: "h-10 sm:h-11 px-5 sm:px-6 text-sm gap-2"
  }[size] || "h-9 sm:h-10 px-4 sm:px-5 text-xs sm:text-sm gap-2";

  const variantStyles = {
    primary: "bg-[#174C3C] hover:bg-[#1F5C49] active:bg-[#123A2E] text-white shadow-xs hover:shadow-sm",
    secondary: "bg-gray-100 hover:bg-gray-200 active:bg-gray-300 text-gray-700",
    danger: "bg-red-600 hover:bg-red-700 active:bg-red-800 text-white shadow-xs",
    dangerLight: "bg-red-50 hover:bg-red-100 active:bg-red-200 border border-red-200 text-red-600",
    outline: "border border-[#DDE9DF] bg-white hover:bg-gray-100 active:bg-gray-200 text-[#174C3C] hover:border-[#174C3C]/40 shadow-2xs",
    ghost: "text-gray-600 hover:bg-gray-100/80 active:bg-gray-200"
  }[variant] || "bg-[#174C3C] hover:bg-[#1F5C49] text-white shadow-xs";

  const widthStyle = fullWidth ? "w-full" : "";

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      title={title}
      aria-label={ariaLabel || (typeof children === 'string' ? children : undefined)}
      className={`${baseStyles} ${sizeStyles} ${variantStyles} ${widthStyle} ${className}`}
      {...props}
    >
      {Icon && <Icon className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" strokeWidth={1.75} />}
      {children && <span>{children}</span>}
    </button>
  );
}
