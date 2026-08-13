import Link from 'next/link';

export const metadata={title:'Privacy Policy — Sultan Pocket',description:'Privacy Policy for Sultan Pocket.'};

export default function PrivacyPage(){
 return <main className="container legal-page" style={{padding:'56px 24px 72px'}}>
  <div className="legal-wrap">
   <p className="legal-eyebrow">SULTAN POCKET</p><h1>Privacy Policy</h1><p className="legal-updated">Last updated: August 13, 2026</p>
   <p>We designed Sultan Pocket to help you manage personal finances. This policy explains what information the service stores and how it is used.</p>
   <h2>Information we collect</h2><p>When you create an account, we may store your email address and account identifier through our authentication provider. Your profile may include a username, name, profile image, and preferences. Wallet information you enter, including transactions, categories, savings, debt records, budgets, and notes, is stored so requested features can work.</p>
   <h2>How we use information</h2><p>We use account and wallet information to authenticate you, provide finance tools, save preferences, maintain security, and improve reliability. We do not need your financial data for advertising.</p>
   <h2>Data security</h2><p>Account and wallet data is protected with authentication and database access policies. Use a strong, unique password and keep your login details private.</p>
   <h2>Your choices</h2><p>You can update supported profile information, export available data, or request deletion of your account and associated data.</p>
   <h2>Third-party services</h2><p>Sultan Pocket may use infrastructure providers such as Supabase and Vercel for authentication, database, hosting, and application delivery.</p>
   <h2>Changes</h2><p>We may update this policy as the service changes. The updated date above indicates the latest version.</p>
   <p className="legal-back"><Link href="/">← Back to Sultan Pocket</Link></p>
  </div>
 </main>
}
