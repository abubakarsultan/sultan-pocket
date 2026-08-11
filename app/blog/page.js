export const metadata = { title: 'Blog — Sultan Pocket' };

export default function BlogPage() {
  return (
    <main className="container" style={{ padding: '56px 24px' }}>
      <h1 style={{ fontSize: 26, fontWeight: 700, marginBottom: 10 }}>Blog</h1>
      <p style={{ fontSize: 14, color: 'var(--text-faint)' }}>No posts yet. Check back soon.</p>
    </main>
  );
}
