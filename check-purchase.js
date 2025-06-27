const { ethers } = require('ethers');

// Contract addresses
const ESCROW_ADDRESS = '0xb87C071ffc8B11721EdE6b4fD6395E2Cf4b164A0';
const USDC_ADDRESS = '0x6fBf2cb78C2Aa07c679c4A9af84E03EbfB69161e';

// ABI for the events we want to listen to
const ESCROW_ABI = [
  "event Purchased(uint256 indexed purchaseId, address indexed buyer, address indexed seller, uint256 amount, address tokenAddress)",
  "event Confirmed(uint256 indexed purchaseId)",
  "event Refunded(uint256 indexed purchaseId)",
  "function purchases(uint256) view returns (address buyer, address seller, uint256 amount, address tokenAddress, bool isConfirmed, bool isRefunded)",
  "function purchaseCount() view returns (uint256)"
];

// Base Sepolia RPC URL
const RPC_URL = 'https://sepolia.base.org';

async function checkPurchase(purchaseId) {
  const provider = new ethers.JsonRpcProvider(RPC_URL);
  const contract = new ethers.Contract(ESCROW_ADDRESS, ESCROW_ABI, provider);
  
  try {
    const purchase = await contract.purchases(purchaseId);
    console.log(`\n📋 Purchase #${purchaseId} Details:`);
    console.log(`Buyer: ${purchase.buyer}`);
    console.log(`Seller: ${purchase.seller}`);
    console.log(`Amount: ${ethers.formatEther(purchase.amount)} ${purchase.tokenAddress === '0x0000000000000000000000000000000000000000' ? 'ETH' : 'USDC'}`);
    console.log(`Token Address: ${purchase.tokenAddress}`);
    console.log(`Confirmed: ${purchase.isConfirmed ? '✅ Yes' : '❌ No'}`);
    console.log(`Refunded: ${purchase.isRefunded ? '✅ Yes' : '❌ No'}`);
    
    if (purchase.isConfirmed) {
      console.log('\n🎉 Purchase has been confirmed! Funds released to seller.');
    } else if (purchase.isRefunded) {
      console.log('\n💸 Purchase has been refunded! Funds returned to buyer.');
    } else {
      console.log('\n⏳ Purchase is pending confirmation/refund.');
    }
  } catch (error) {
    console.error('Error fetching purchase:', error.message);
  }
}

async function getRecentPurchases() {
  const provider = new ethers.JsonRpcProvider(RPC_URL);
  const contract = new ethers.Contract(ESCROW_ADDRESS, ESCROW_ABI, provider);
  
  try {
    const purchaseCount = await contract.purchaseCount();
    console.log(`\n📊 Total purchases: ${purchaseCount}`);
    
    if (purchaseCount > 0) {
      console.log('\n🔍 Recent purchases:');
      const recentCount = Math.min(5, Number(purchaseCount));
      for (let i = Number(purchaseCount); i > Number(purchaseCount) - recentCount; i--) {
        await checkPurchase(i);
      }
    }
  } catch (error) {
    console.error('Error fetching purchase count:', error.message);
  }
}

// Usage examples:
// checkPurchase(1); // Check specific purchase ID
// getRecentPurchases(); // Get all recent purchases

// Uncomment one of these lines to run:
// checkPurchase(1);
getRecentPurchases(); 