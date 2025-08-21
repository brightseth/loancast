import { Metadata } from 'next'

export const metadata: Metadata = {
  // Override the frame metadata from root layout - blog posts are not frames
  other: {
    // Completely disable frames for blog posts
    'fc:frame': '',
    'fc:frame:image': '',
    'fc:frame:image:aspect_ratio': '',
    'fc:frame:button:1': '',
    'fc:frame:button:1:action': '',
    'fc:frame:button:1:target': '',
    'fc:frame:button:2': '',
    'fc:frame:button:2:action': '', 
    'fc:frame:button:2:target': '',
    'of:version': '',
    'of:accepts:farcaster': '',
    'of:image': '',
    'of:image:aspect_ratio': '',
  }
}

export default function BlogLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}