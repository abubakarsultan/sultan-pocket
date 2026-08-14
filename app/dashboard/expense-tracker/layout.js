import WalletLayout from '@/components/wallet/WalletLayout';

export const metadata = {
  robots: { index: false, follow: false },
};

export default function Layout({children}){return <WalletLayout>{children}</WalletLayout>}
