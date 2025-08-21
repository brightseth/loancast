// Simple component to add blog link to your main navigation
import Link from 'next/link';
import { BookOpen } from 'lucide-react';

export function BlogLink() {
  return (
    <Link
      href="/blog"
      className="inline-flex items-center gap-2 px-4 py-2 text-sm text-gray-400 hover:text-white transition-colors"
    >
      <BookOpen className="w-4 h-4" />
      Blog
    </Link>
  );
}