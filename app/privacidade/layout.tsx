export default function PrivacidadeLayout({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ all: 'initial', display: 'block', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
      {children}
    </div>
  );
}
