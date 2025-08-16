#!/usr/bin/env node

/**
 * Run multiple bots simultaneously to generate live activity
 */

const { spawn } = require('child_process');
const path = require('path');

console.log('🚀 LAUNCHING DEMO BOTS...\n');

// Bot configurations
const bots = [
  {
    name: 'Yield Farmer',
    script: path.join(__dirname, '../bots/yield-farmer-bot.js'),
    icon: '🌾'
  },
  {
    name: 'LP Provider',
    script: path.join(__dirname, '../bots/lp-provider-bot.js'),
    icon: '💧'
  }
];

const processes = [];

// Launch each bot
bots.forEach(bot => {
  console.log(`${bot.icon} Starting ${bot.name}...`);
  
  const proc = spawn('node', [bot.script], {
    env: process.env,
    stdio: ['inherit', 'pipe', 'pipe']
  });
  
  // Prefix output with bot name
  proc.stdout.on('data', (data) => {
    const lines = data.toString().split('\n').filter(l => l);
    lines.forEach(line => {
      console.log(`[${bot.name}] ${line}`);
    });
  });
  
  proc.stderr.on('data', (data) => {
    console.error(`[${bot.name}] ERROR: ${data}`);
  });
  
  proc.on('close', (code) => {
    console.log(`[${bot.name}] Exited with code ${code}`);
  });
  
  processes.push(proc);
});

console.log('\n✅ All bots launched!\n');
console.log('Press Ctrl+C to stop all bots\n');

// Handle shutdown
process.on('SIGINT', () => {
  console.log('\n\n🛑 Shutting down all bots...');
  
  processes.forEach(proc => {
    proc.kill('SIGINT');
  });
  
  setTimeout(() => {
    console.log('👋 All bots stopped. Goodbye!');
    process.exit(0);
  }, 1000);
});