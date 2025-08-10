const sharp = require('sharp')
const fs = require('fs')

async function convertBrandAssets() {
  try {
    // Convert the social preview SVG to PNG at 1200x630
    await sharp('./public/LoanCast_Social_Preview.svg')
      .png({ quality: 95 })
      .resize(1200, 630)
      .toFile('./public/LoanCast_Social_Preview.png')
    
    console.log('✅ Created LoanCast_Social_Preview.png (1200x630)')

    // Convert logo variations
    await sharp('./public/LoanCast_Logo_Primary.svg')
      .png({ quality: 95 })
      .resize(800, 200)
      .toFile('./public/LoanCast_Logo_Primary.png')
    
    console.log('✅ Created LoanCast_Logo_Primary.png (800x200)')

    await sharp('./public/LoanCast_Icon_Square.svg')
      .png({ quality: 95 })
      .resize(512, 512)
      .toFile('./public/LoanCast_Icon_Square.png')
    
    console.log('✅ Created LoanCast_Icon_Square.png (512x512)')

    console.log('✅ All brand assets converted to PNG')
    
  } catch (error) {
    console.error('Error converting brand assets:', error)
  }
}

convertBrandAssets()