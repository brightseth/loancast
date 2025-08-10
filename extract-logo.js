const { createCanvas, loadImage } = require('canvas')
const fs = require('fs')

async function createSocialPreview() {
  try {
    // Load your brand guide image
    const brandGuide = await loadImage('./public/brand-asset-2.png')
    
    // Create a clean 1200x630 social preview canvas
    const canvas = createCanvas(1200, 630)
    const ctx = canvas.getContext('2d')
    
    // Clean light background
    const gradient = ctx.createLinearGradient(0, 0, 1200, 630)
    gradient.addColorStop(0, '#F4F4F7')
    gradient.addColorStop(1, '#E8ECEF') 
    ctx.fillStyle = gradient
    ctx.fillRect(0, 0, 1200, 630)
    
    // White card background
    ctx.fillStyle = 'white'
    ctx.shadowColor = 'rgba(0,0,0,0.1)'
    ctx.shadowBlur = 20
    ctx.shadowOffsetY = 8
    ctx.fillRect(100, 100, 1000, 430)
    ctx.shadowColor = 'transparent'
    
    // Extract the main horizontal logo from your brand guide
    // Looking at brand-asset-2, the main "LoanCast" logo appears to be in the top section
    // Let's crop that area and scale it appropriately
    const logoWidth = 400
    const logoHeight = 100
    const logoX = (1200 - logoWidth) / 2
    const logoY = (630 - logoHeight) / 2 - 50
    
    // Draw a portion of your brand guide that contains the clean horizontal logo
    // This extracts roughly the top-left area where the clean logo appears
    ctx.drawImage(
      brandGuide,
      0, 0, 600, 200,  // Source: crop from brand guide
      logoX, logoY, logoWidth, logoHeight  // Destination: centered on card
    )
    
    // Add tagline below
    ctx.fillStyle = '#0559A2'
    ctx.font = '28px Arial, sans-serif'
    ctx.textAlign = 'center'
    ctx.fillText('Trust-based lending on Farcaster', 600, logoY + logoHeight + 50)
    
    // Save the result
    const buffer = canvas.toBuffer('image/png')
    fs.writeFileSync('./public/loancast-social-preview.png', buffer)
    
    console.log('✅ Created clean social preview with extracted logo')
    
  } catch (error) {
    console.error('Error creating social preview:', error)
  }
}

createSocialPreview()