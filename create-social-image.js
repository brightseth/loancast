const { createCanvas } = require('canvas')
const fs = require('fs')

// Create a 1200x630 social preview image matching the brand guide
const canvas = createCanvas(1200, 630)
const ctx = canvas.getContext('2d')

// Background - light gray gradient like in brand guide
const gradient = ctx.createLinearGradient(0, 0, 1200, 630)
gradient.addColorStop(0, '#F4F4F7')
gradient.addColorStop(1, '#E8ECEF')
ctx.fillStyle = gradient
ctx.fillRect(0, 0, 1200, 630)

// Center white card
ctx.fillStyle = 'white'
ctx.fillRect(150, 120, 900, 390)
ctx.shadowColor = 'rgba(0,0,0,0.1)'
ctx.shadowBlur = 20
ctx.shadowOffsetY = 10

// Blue circle for logo (like in brand guide)
ctx.fillStyle = '#005BBB'
ctx.beginPath()
ctx.arc(350, 315, 60, 0, 2 * Math.PI)
ctx.fill()

// Simple megaphone shape inside circle (white)
ctx.fillStyle = 'white'
// Megaphone cone
ctx.beginPath()
ctx.moveTo(320, 315)
ctx.lineTo(360, 295)
ctx.lineTo(360, 335)
ctx.closePath()
ctx.fill()
// Megaphone handle
ctx.fillRect(360, 305, 20, 20)
ctx.fillRect(370, 320, 8, 15)

// LoanCast text
ctx.fillStyle = '#0559A2'
ctx.font = 'bold 64px Arial'
ctx.fillText('LoanCast', 450, 330)

// Tagline
ctx.fillStyle = 'rgba(5, 89, 162, 0.8)'
ctx.font = '28px Arial'
ctx.fillText('Trust-based lending on Farcaster', 450, 370)

// Save as PNG
const buffer = canvas.toBuffer('image/png')
fs.writeFileSync('./public/loancast-og.png', buffer)

console.log('✅ Created loancast-og.png social preview image')