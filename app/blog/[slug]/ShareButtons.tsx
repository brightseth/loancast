'use client';

import { Share2, Twitter } from 'lucide-react';

export default function ShareButtons({ url, text }: { url: string; text: string }) {
  return (
    <div className="flex gap-2">
      <button
        onClick={() => {
          navigator.clipboard.writeText(url);
          alert('Link copied!');
        }}
        className="p-2 text-gray-400 hover:text-white transition-colors"
        title="Copy link"
      >
        <Share2 className="w-4 h-4" />
      </button>
      <a
        href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`}
        target="_blank"
        rel="noopener noreferrer"
        className="p-2 text-gray-400 hover:text-white transition-colors"
        title="Share on Twitter"
      >
        <Twitter className="w-4 h-4" />
      </a>
    </div>
  );
}