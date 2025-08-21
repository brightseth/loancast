import { Metadata } from 'next'

export const metadata: Metadata = {
  // Override the frame metadata from root layout - blog posts are not frames
  other: {
    // Remove all frame-related metadata for blog pages
  }
}

export default function BlogLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}