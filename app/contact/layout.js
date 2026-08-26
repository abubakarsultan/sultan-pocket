import { getPageSeo, buildPageMetadata } from '@/lib/pageSeo';

export const revalidate = 60;
export async function generateMetadata() {
  return buildPageMetadata(await getPageSeo('/contact', { title: 'Contact — Sultan Pocket', description: 'Contact Sultan Pocket for product questions, feedback, bug reports, or feature ideas.' }));
}

export default function ContactLayout({ children }) { return children; }
