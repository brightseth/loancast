import { Metadata } from 'next'

export const metadata: Metadata = {
  // Override the frame metadata from root layout - blog posts are not frames
  other: {
    // Remove frame buttons to make this NOT a frame
    'fc:frame:button:1': '',
    'fc:frame:button:1:action': '',
    'fc:frame:button:1:target': '',
    'fc:frame:button:2': '',
    'fc:frame:button:2:action': '', 
    'fc:frame:button:2:target': '',
  }
}

export default function BlogLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}