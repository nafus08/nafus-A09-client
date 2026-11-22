import type { Metadata } from 'next';
import '../src/index.css';

export const metadata: Metadata = {
  title: 'FixMate - Trusted Repair Services',
  description: 'Connect with trusted local repair technicians.',
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
