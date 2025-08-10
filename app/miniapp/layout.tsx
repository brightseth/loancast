import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'LoanCast Mini App',
  description: 'Borrow from friends directly in Farcaster',
  viewport: 'width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no',
}

export default function MiniAppLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-gray-50">
      {children}
      
      {/* Add Farcaster SDK script */}
      <script 
        type="module" 
        dangerouslySetInnerHTML={{
          __html: `
            import { sdk } from 'https://esm.sh/@farcaster/miniapp-sdk'
            window.farcasterSDK = sdk
          `
        }}
      />
    </div>
  )
}