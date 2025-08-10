// Quick revert script if the new branding looks bad
const fs = require('fs')

console.log('🔄 Reverting to simple branding...')

// Revert frame image to serve the existing loancast-og.png
const revertFrameRoute = `import { NextRequest, NextResponse } from 'next/server'
import { readFileSync } from 'fs'
import { join } from 'path'

export async function GET(request: NextRequest) {
  try {
    // Serve existing simple image
    const imagePath = join(process.cwd(), 'public', 'loancast-og.png')
    const imageBuffer = readFileSync(imagePath)
    
    return new NextResponse(imageBuffer, {
      headers: {
        'Content-Type': 'image/png',
        'Cache-Control': 'public, max-age=3600',
      },
    })
  } catch (error) {
    return new NextResponse('Error loading image', { status: 500 })
  }
}`

fs.writeFileSync('./app/api/frame/image/route.tsx', revertFrameRoute)
console.log('✅ Reverted frame image endpoint')
console.log('ℹ️  Now serving the simple loancast-og.png instead')
console.log('ℹ️  Your site will work exactly as before')