// scripts\\removeLiquidity.js
require("dotenv").config({ path: '../.env' }); // Ensure the .env file is correctly located relative to this script
const { ethers } = require("hardhat");
const path = require('path');

async function main() {
    // Load ABIs from local files
    const routerAbi = require(path.join(__dirname, '..', 'routerABI.json')).abi;
    const pairAbi = [
        "function approve(address spender, uint amount) external returns (bool)",
        "function balanceOf(address owner) external view returns (uint)",
        "function transferFrom(address from, address to, uint amount) external returns (bool)"
    ];
    const wethAbi = [
        "function withdraw(uint256 wad) public",
        "function balanceOf(address account) public view returns (uint256)"
    ];

    // Addresses - Replace with actual values
    const deployer = new ethers.Wallet(process.env.DEPLOYER_PRIVATE_KEY, ethers.provider); // Use your .env variable name here
    const routerAddress = '0xC532a74256D3Db42D0Bf7a0400fEFDbad7694008'; // Working Uniswap Router at time writing
    const WETHAddress = '0x7b79995e5f793A07Bc00c21412e50Ecae098E7f9'; // Working WETH address at time of writing
    const TokenAddress = 'YOUR_TOKEN_ADDRESS_HERE'; // Token paired with WETH that was created in LP pair creation
    const factoryAddress = '0x7E0987E5b3a30e3f2828572Bb659A548460a3003'; // Working Uniswap Factory at time writing

    // Contract instances
    const Factory = new ethers.Contract(factoryAddress, [
        "function getPair(address tokenA, address tokenB) external view returns (address pair)"
    ], deployer);
    const Router = new ethers.Contract(routerAddress, routerAbi, deployer);
    const WETH = new ethers.Contract(WETHAddress, wethAbi, deployer);

    // Get pair address
    const pairAddress = await Factory.getPair(WETHAddress, TokenAddress);
    if (pairAddress === ethers.constants.AddressZero) {
        throw new Error("Pair not found");
    }
    const Pair = new ethers.Contract(pairAddress, pairAbi, deployer);

    // Get LP balance
    const liquidity = await Pair.balanceOf(deployer.address);
    console.log(`LP Token Balance: ${ethers.utils.formatEther(liquidity)}`);

    // Approve router to spend LP tokens
    console.log("Approving Router to spend LP tokens...");
    await (await Pair.approve(routerAddress, liquidity)).wait();

    // Remove liquidity
    console.log("Removing liquidity...");
    const tx = await Router.removeLiquidity(
        WETHAddress,
        TokenAddress,
        liquidity,
        0, // Minimum amount of WETH tokens desired
        0, // Minimum amount of Token tokens desired
        deployer.address,
        Math.floor(Date.now() / 1000) + 60 * 20, // Deadline 20 minutes from now
        { gasLimit: 5000000 } // Setting a higher gas limit
    );

    const receipt = await tx.wait();
    console.log(`Liquidity removed! Transaction hash: ${receipt.transactionHash}`);

    // Get WETH balance
    const wethBalance = await WETH.balanceOf(deployer.address);
    console.log(`WETH Balance: ${ethers.utils.formatEther(wethBalance)}`);

    // Withdraw WETH to ETH
    console.log("Converting WETH to ETH...");
    await (await WETH.withdraw(wethBalance)).wait();
    console.log("WETH converted to ETH successfully!");
}

main().catch((error) => {
    console.error(error);
    process.exit(1);
});