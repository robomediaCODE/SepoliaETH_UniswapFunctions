// scripts\\sellToken.js
require("dotenv").config({ path: '../.env' }); // Load environment variables
const { ethers } = require("hardhat");
const path = require('path');

async function main() {
    const deployer = new ethers.Wallet(process.env.DEPLOYER_PRIVATE_KEY, ethers.provider); // Use your .env variable name here
    const routerAddress = '0xC532a74256D3Db42D0Bf7a0400fEFDbad7694008'; // Working Uniswap Router at time writing
    const routerAbi = require(path.join(__dirname, '..', 'routerABI.json')).abi;
    const pairAbi = [ 
        "function getReserves() public view returns (uint112 reserve0, uint112 reserve1, uint32 blockTimestampLast)"
    ];

    // Token and WETH Token addresses
    const tokenToSellAddress = 'YOUR_TOKEN_ADDRESS_HERE'; // Your token to sell
    const WETHAddress = '0x7b79995e5f793A07Bc00c21412e50Ecae098E7f9'; // Working WETH address at time of writing

    // Setup router contract instance
    const Router = new ethers.Contract(routerAddress, routerAbi, deployer);
    const TokenToSell = await ethers.getContractAt("IERC20", tokenToSellAddress, deployer);
    const factory = await Router.factory();
    const factoryContract = new ethers.Contract(factory, ['function getPair(address,address) external view returns (address)'], deployer);
    const pairAddress = ethers.utils.getAddress(await factoryContract.getPair(tokenToSellAddress, WETHAddress));
    const Pair = new ethers.Contract(pairAddress, pairAbi, deployer);

    // Specify the amount of Token to swap
    const amountInToken = ethers.utils.parseUnits('YOUR_AMOUNT_OF_TOKEN', 'TOKEN_DECIMALS'); // e.g., specify decimals

    // Get current reserves from the Token-WETH pair
    const [reserveToken, reserveWETH] = await Pair.getReserves();
    console.log(`Reserves - Token: ${reserveToken.toString()}, WETH: ${reserveWETH.toString()}`);

    // Calculate expected output using DEX formula
    const amountInWithFee = amountInToken.mul(997);
    const numerator = amountInWithFee.mul(reserveWETH);
    const denominator = reserveToken.mul(1000).add(amountInWithFee);
    let expectedETH = numerator.div(denominator);
    console.log(`Expected ETH without slippage: ${ethers.utils.formatEther(expectedETH)}`);

    // Apply slippage tolerance
    const amountOutMinETH = expectedETH.sub(expectedETH.mul(5).div(100)); // 5% slippage tolerance
    console.log(`Using amountOutMinETH with added slippage tolerance: ${ethers.utils.formatEther(amountOutMinETH)}`);

    // Approve the router to spend your tokens
    console.log("Approving DEX Router to spend tokens...");
    await (await TokenToSell.approve(routerAddress, amountInToken)).wait();

    // Execute the swap from your Token to ETH
    console.log(`Executing swap from Token to ETH supporting fee on transfer with a minimum of ${ethers.utils.formatEther(amountOutMinETH)} ETH...`);
    const tx = await Router.swapExactTokensForETHSupportingFeeOnTransferTokens(
        amountInToken,
        amountOutMinETH,
        [tokenToSellAddress, WETHAddress], // Path from your token to ETH
        deployer.address,
        Math.floor(Date.now() / 1000) + 60 * 20, // Deadline 20 minutes from now
        { gasLimit: 500000 }
    );

    const receipt = await tx.wait();
    console.log(`Swap executed! Transaction hash: ${receipt.transactionHash}`);
}

main().catch((error) => {
    console.error(error);
    process.exit(1);
});