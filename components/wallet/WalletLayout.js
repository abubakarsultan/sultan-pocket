'use client';
import {WalletProvider} from './WalletProvider';
import WalletShell from './WalletShell';
import WalletModal from './WalletModal';
export default function WalletLayout({children,title}){return <WalletProvider><WalletShell title={title}>{children}</WalletShell><WalletModal/></WalletProvider>}
