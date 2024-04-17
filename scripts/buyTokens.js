// scripts\\buyToken.js
require("dotenv").config({ path: '../.env' }); // Load environment variables
const { ethers } = require("hardhat");
const path = require('path');

async function main() {
    const deployer = new ethers.Wallet(process.env.DEPLOYER_PRIVATE_KEY, ethers.provider); // Use your .env variable name here
    const routerAddress = '0xC532a74256D3Db42D0Bf7a0400fEFDbad7694008'; // Working Uniswap Router at time writing
    const routerAbi = require(path.join(__dirname, '..', 'routerABI.json')).abi;
    const pairAbi = [ // Minimal ABI for pair contract (getReserves)
        "function getReserves() public view returns (uint112 reserve0, uint112 reserve1, uint32 blockTimestampLast)"
    ];

    // Token and WETH Token addresses
    const tokenToBuyAddress = 'YOUR_TOKEN_ADDRESS_HERE'; // Token you are buying
    const WETHAddress = '0x7b79995e5f793A07Bc00c21412e50Ecae098E7f9'; // Working WETH address at time of writing

    // Setup router contract instance
    const Router = new ethers.Contract(routerAddress, routerAbi, deployer);
    const pairAddress = ethers.utils.getAddress(await Router.factory().then(factory => new ethers.Contract(factory, ['function getPair(address,address) external view returns (address)'], deployer).getPair(WETHAddress, tokenToBuyAddress)));
    const Pair = new ethers.Contract(pairAddress, pairAbi, deployer);

    // Specify the amount of ETH to swap
    const amountInETH = ethers.utils.parseEther('AMOUNT_OF_ETH'); // e.g., '.1' for 0.1 ETH

    // Get current reserves from the Token-WETH pair
    const [reserveWETH, reserveToken] = await Pair.getReserves();
    console.log(`Reserves - WETH: ${reserveWETH.toString()}, Token: ${reserveToken.toString()}`);

    // Calculate expected output using DEX formula
    const amountInWithFee = amountInETH.mul(997);
    const numerator = amountInWithFee.mul(reserveToken);
    const denominator = reserveWETH.mul(1000).add(amountInWithFee);
    let amountOutMinToken = numerator.div(denominator);
    console.log(`Expected Token without slippage: ${ethers.utils.formatUnits(amountOutMinToken, 'TOKEN_DECIMALS')}`);

    // Apply a slippage tolerance
    amountOutMinToken = amountOutMinToken.sub(amountOutMinToken.mul(5).div(100)); // Applying 5% slippage tolerance
    console.log(`Using amountOutMinToken with added slippage tolerance: ${ethers.utils.formatUnits(amountOutMinToken, 'TOKEN_DECIMALS')}`);

    // Execute the swap from ETH to the Token
    console.log(`Executing swap from ETH to Token with a minimum of ${ethers.utils.formatUnits(amountOutMinToken, 'TOKEN_DECIMALS')} Token...`);
    const tx = await Router.swapExactETHForTokens(
        amountOutMinToken,
        [WETHAddress, tokenToBuyAddress], // Path from ETH to Token
        deployer.address,
        Math.floor(Date.now() / 1000) + 60 * 20, // Deadline 20 minutes from now
        { value: amountInETH, gasLimit: 500000 }
    );

    const receipt = await tx.wait();
    console.log(`Swap executed! Transaction hash: ${receipt.transactionHash}`);
}

main().catch((error) => {
    console.error(error);
    process.exit(1);
});