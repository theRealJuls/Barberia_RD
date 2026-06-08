export default function Button({ children, variant = 'primary', className = '', ...props }) {
  const base = 'inline-flex items-center justify-center gap-2 rounded-md px-4 py-2 text-sm font-medium transition'
  const styles =
    variant === 'outline'
      ? 'border border-neutral-300 bg-white text-neutral-900 hover:bg-neutral-50'
      : 'bg-neutral-900 text-white hover:bg-neutral-800'

  return (
    <button className={`${base} ${styles} disabled:cursor-not-allowed disabled:opacity-60 ${className}`} {...props}>
      {children}
    </button>
  )
}
