import WalletLayout from '@/components/wallet/WalletLayout';

export const metadata = {
  title: 'Free Expense Tracker | Sultan Pocket',
  description: 'Track income, expenses, savings, transport and personal spending with Sultan Pocket. Try the expense tracker as a guest with no sign-up required.',
  alternates: { canonical: 'https://sultanpocket.online/expense-tracker' },
  robots: { index: true, follow: true },
  openGraph: {
    title: 'Free Expense Tracker | Sultan Pocket',
    description: 'Try Sultan Pocket as a guest. Track your money without signing up.',
    url: 'https://sultanpocket.online/expense-tracker',
    siteName: 'Sultan Pocket',
    type: 'website',
  },
};

export default function Layout({children}) {
  return <WalletLayout>{children}</WalletLayout>;
}
