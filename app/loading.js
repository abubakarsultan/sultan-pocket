export default function Loading() {
  return (
    <main style={{ minHeight: '50vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div className="loading-spinner" role="status" aria-label="Loading">
        <span className="loading-spinner-ring" />
      </div>
    </main>
  );
}
