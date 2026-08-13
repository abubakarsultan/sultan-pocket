import Link from 'next/link';

export const metadata={title:'Terms of Service — Sultan Pocket',description:'Terms of Service for Sultan Pocket.'};

export default function TermsPage(){
 return <main className="container legal-page" style={{padding:'56px 24px 72px'}}>
  <div className="legal-wrap">
   <p className="legal-eyebrow">SULTAN POCKET</p><h1>Terms of Service</h1><p className="legal-updated">Last updated: August 13, 2026</p>
   <p>By using Sultan Pocket, you agree to use the service responsibly and to these terms.</p>
   <h2>Personal finance tool</h2><p>Sultan Pocket is a tracking and planning tool. It is not a bank, payment processor, investment adviser, accountant, or financial adviser. Information shown by the app is not professional financial advice.</p>
   <h2>Your account</h2><p>You are responsible for keeping your account credentials secure and for information you enter. Do not share your password or use another person's account without permission.</p>
   <h2>Acceptable use</h2><p>You agree not to misuse the service, attempt unauthorized access, interfere with the application, or use it for unlawful activity.</p>
   <h2>Your data</h2><p>You remain responsible for financial information you enter. Where available, you can edit, export, or delete information. Maintain your own backup of important records.</p>
   <h2>Availability</h2><p>We aim to keep Sultan Pocket reliable, but cannot guarantee uninterrupted availability or that the service will always be error-free. Features may change as the service develops.</p>
   <h2>Changes</h2><p>We may update these terms as the service evolves. Continued use after an update means you accept the revised terms.</p>
   <p className="legal-back"><Link href="/">← Back to Sultan Pocket</Link></p>
  </div>
 </main>
}
