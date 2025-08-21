const { JsonRpcProvider, Wallet, Contract, parseUnits } = require('ethers');
require('dotenv').config({ path: '.env.local' });

const USDC_ADDRESS = '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913';
const USDC_ABI = [
  'function transfer(address to, uint256 amount) returns (bool)',
  'function balanceOf(address account) view returns (uint256)',
  'function decimals() view returns (uint8)'
];

async function testSendUSDC() {
  // Get command line arguments
  const args = process.argv.slice(2);
  const recipientAddress = args[0];
  const amount = args[1] || '1';
  
  if (!recipientAddress) {
    console.log('Usage: node test-send-usdc.js <recipient_address> [amount]');
    console.log('Example: node test-send-usdc.js 0x123... 1');
    return;
  }

  if (!process.env.SOLIENNE_PK) {
    console.log('❌ Error: SOLIENNE_PK environment variable not set');
    console.log('Run: export SOLIENNE_PK="your-private-key"');
    return;
  }

  console.log('🧪 Test USDC Transfer');
  console.log('====================');
  
  try {
    const provider = new JsonRpcProvider('https://mainnet.base.org');
    const wallet = new Wallet(process.env.SOLIENNE_PK, provider);
    const usdc = new Contract(USDC_ADDRESS, USDC_ABI, wallet);
    
    // Check balance
    const balance = await usdc.balanceOf(wallet.address);
    const decimals = await usdc.decimals();
    const balanceFormatted = (Number(balance) / 10 ** decimals).toFixed(2);
    
    console.log(`From: ${wallet.address}`);
    console.log(`To: ${recipientAddress}`);
    console.log(`Amount: ${amount} USDC`);
    console.log(`Current Balance: ${balanceFormatted} USDC`);
    console.log('');
    
    // Send transaction
    console.log('📤 Sending transaction...');
    const amountToSend = parseUnits(amount, decimals);
    const tx = await usdc.transfer(recipientAddress, amountToSend);
    
    console.log(`Transaction hash: ${tx.hash}`);
    console.log(`View on Basescan: https://basescan.org/tx/${tx.hash}`);
    console.log('');
    
    console.log('⏳ Waiting for confirmation...');
    const receipt = await tx.wait();
    
    if (receipt.status === 1) {
      console.log(`✅ Success! Sent ${amount} USDC to ${recipientAddress}`);
    } else {
      console.log('❌ Transaction failed');
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

testSendUSDC();