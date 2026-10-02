interface BrandMarkProps {
  size?: number
  className?: string
  wordmark?: boolean
}

export function BrandMark({ size = 32, className, wordmark = true }: BrandMarkProps) {
  return (
    <span className={['inline-flex items-center gap-2 font-semibold tracking-tight', className].filter(Boolean).join(' ')}>
      <svg
        width={size}
        height={size}
        viewBox="0 0 32 32"
        aria-hidden="true"
        className="shrink-0"
        style={{ width: size, height: size }}
      >
        <rect width="32" height="32" rx="8" fill="#2dd4bf" />
        <path
          d="M16 16L8.5 10.2M16 16l7.5-5.8M16 16l-6 7.4M16 16l6.8 6.2"
          stroke="#042f2e"
          strokeWidth="1.7"
          strokeLinecap="round"
        />
        <circle cx="16" cy="16" r="3.15" fill="#042f2e" />
        <circle cx="8.2" cy="10" r="2.15" fill="#ecfdf5" />
        <circle cx="24" cy="10" r="2.15" fill="#ecfdf5" />
        <circle cx="9.6" cy="23.4" r="2.15" fill="#115e59" />
        <circle cx="23.2" cy="22.6" r="2.15" fill="#115e59" />
      </svg>
      {wordmark ? <span>Nexo</span> : null}
    </span>
  )
}
