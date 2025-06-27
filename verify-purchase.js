const { ethers } = require('ethers');

// Contract addresses
const ESCROW_ADDRESS = '0xb87C071ffc8B11721EdE6b4fD6395E2Cf4b164A0';

// Base Sepolia RPC URL - using the official one
const RPC_URL = 'https://sepolia.base.org';

async function checkSpecificTransaction(txHash) {
  const provider = new ethers.JsonRpcProvider(RPC_URL);
  
  try {
    console.log(`\n🔍 Checking transaction: ${txHash}`);
    
    // Get transaction details
    const tx = await provider.getTransaction(txHash);
    if (!tx) {
      console.log('❌ Transaction not found');
      return;
    }
    
    console.log(`\n📋 Transaction Details:`);
    console.log(`From: ${tx.from}`);
    console.log(`To: ${tx.to}`);
    console.log(`Value: ${ethers.formatEther(tx.value)} ETH`);
    console.log(`Block Number: ${tx.blockNumber}`);
    
    // Get transaction receipt
    const receipt = await provider.getTransactionReceipt(txHash);
    console.log(`\n📊 Transaction Receipt:`);
    console.log(`Status: ${receipt.status === 1 ? '✅ Success' : '❌ Failed'}`);
    console.log(`Gas Used: ${receipt.gasUsed.toString()}`);
    console.log(`Logs: ${receipt.logs.length}`);
    
    // Check for Purchased events in the logs
    const purchasedEventTopic = ethers.id("Purchased(uint256,address,address,uint256,address)");
    const purchasedLogs = receipt.logs.filter(log => 
      log.topics[0] === purchasedEventTopic && 
      log.address.toLowerCase() === ESCROW_ADDRESS.toLowerCase()
    );
    
    if (purchasedLogs.length > 0) {
      console.log(`\n🎉 Found ${purchasedLogs.length} Purchased event(s)!`);
      
      purchasedLogs.forEach((log, index) => {
        const decoded = ethers.AbiCoder.defaultAbiCoder().decode(
          ['uint256', 'address', 'address', 'uint256', 'address'],
          log.data
        );
        console.log(`\n📦 Purchase ${index + 1}:`);
        console.log(`  Purchase ID: ${decoded[0]}`);
        console.log(`  Buyer: ${decoded[1]}`);
        console.log(`  Seller: ${decoded[2]}`);
        console.log(`  Amount: ${ethers.formatEther(decoded[3])} ${decoded[4] === '0x0000000000000000000000000000000000000000' ? 'ETH' : 'USDC'}`);
        console.log(`  Token: ${decoded[4]}`);
      });
    } else {
      console.log('\n❌ No Purchased events found in this transaction');
      console.log('This might be an approval or other transaction');
    }
    
  } catch (error) {
    console.error('Error:', error.message);
  }
}

async function checkContract() {
  const provider = new ethers.JsonRpcProvider(RPC_URL);
  
  try {
    // Check if contract exists
    const code = await provider.getCode(ESCROW_ADDRESS);
    console.log(`\n🔍 Contract Address: ${ESCROW_ADDRESS}`);
    console.log(`Contract deployed: ${code !== '0x' ? '✅ Yes' : '❌ No'}`);
    
    if (code === '0x') {
      console.log('\n❌ Contract not found at this address.');
      return;
    }
    
    // Get recent blocks to look for events
    const latestBlock = await provider.getBlockNumber();
    console.log(`\n📊 Latest block: ${latestBlock}`);
    
    // Look for Purchased events in recent blocks
    const fromBlock = latestBlock - 1000; // Check last 1000 blocks
    console.log(`\n🔍 Checking for Purchased events from block ${fromBlock} to ${latestBlock}...`);
    
    const filter = {
      address: ESCROW_ADDRESS,
      topics: [
        ethers.id("Purchased(uint256,address,address,uint256,address)")
      ],
      fromBlock: fromBlock,
      toBlock: latestBlock
    };
    
    const logs = await provider.getLogs(filter);
    console.log(`\n📋 Found ${logs.length} Purchased events:`);
    
    logs.forEach((log, index) => {
      const decoded = ethers.AbiCoder.defaultAbiCoder().decode(
        ['uint256', 'address', 'address', 'uint256', 'address'],
        log.data
      );
      console.log(`\n🎯 Event ${index + 1}:`);
      console.log(`  Purchase ID: ${decoded[0]}`);
      console.log(`  Buyer: ${decoded[1]}`);
      console.log(`  Seller: ${decoded[2]}`);
      console.log(`  Amount: ${ethers.formatEther(decoded[3])} ${decoded[4] === '0x0000000000000000000000000000000000000000' ? 'ETH' : 'USDC'}`);
      console.log(`  Token: ${decoded[4]}`);
      console.log(`  Block: ${log.blockNumber}`);
      console.log(`  Transaction: ${log.transactionHash}`);
    });
    
  } catch (error) {
    console.error('Error:', error.message);
  }
}

// Check the specific transaction you mentioned
checkSpecificTransaction('0xf1f933d424752dce95522becbd471d4cf06908bcaa1937f400fc36863e7ca28b');

// Also check for all recent purchases
checkContract(); 