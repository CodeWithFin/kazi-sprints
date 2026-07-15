export default function PageWrapper({ children, className = '' }) {
  return (
    <div className={`min-h-screen bg-white ${className}`}>
      {children}
    </div>
  );
}

export function CanvasSection({ children, className = '', dark = false }) {
  return (
    <section className={`relative overflow-hidden ${dark ? 'bg-[#07111F]' : 'bg-white'} ${className}`}>
      {dark && (
        <div className="absolute inset-0 opacity-30 pointer-events-none"
          style={{
            backgroundImage: 'linear-gradient(to right, rgba(255,255,255,0.055) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,0.055) 1px, transparent 1px)',
            backgroundSize: '48px 48px',
          }}
        />
      )}
      <div className="relative z-10">
        {children}
      </div>
    </section>
  );
}

export function CanvasCard({ children, className = '' }) {
  return (
    <div className={`rounded-xl border-2 border-black bg-white/95 p-6 shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-200 ${className}`}>
      {children}
    </div>
  );
}

export function CanvasButton({ children, primary = true, className = '', ...props }) {
  const baseClass = primary
    ? 'canvas-primary-btn'
    : 'canvas-secondary-btn';
  return (
    <button className={`${baseClass} hover:scale-105 transition-transform ${className}`} {...props}>
      {children}
    </button>
  );
}
