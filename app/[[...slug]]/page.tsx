'use client';

import dynamic from 'next/dynamic';

const FixMateApp = dynamic(() => import('../../src/App'), { ssr: false });

export default function CatchAllPage() {
  return <FixMateApp />;
}
