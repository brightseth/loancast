import { Metadata } from 'next'

export const metadata: Metadata = {
  // Override the frame metadata from root layout - blog posts are not frames
  other: {
    // Explicitly set frame metadata to null to override root layout
    'fc:frame': undefined,
    'fc:frame:image': undefined,
    'fc:frame:image:aspect_ratio': undefined,
    'fc:frame:button:1': undefined,
    'fc:frame:button:1:action': undefined,
    'fc:frame:button:1:target': undefined,
    'fc:frame:button:2': undefined,
    'fc:frame:button:2:action': undefined, 
    'fc:frame:button:2:target': undefined,
    'of:version': undefined,
    'of:accepts:farcaster': undefined,
    'of:image': undefined,
    'of:image:aspect_ratio': undefined,
  }
}

export default function BlogLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}