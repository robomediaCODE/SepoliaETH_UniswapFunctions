// scripts\\addLiquidity.js
require("dotenv").config({ path: '../.env' }); // Ensure the .env file is correctly located relative to this script
const { ethers } = require("hardhat");
const path = require('path');

async function main() {
    // Load ABIs from local files
    const factoryAbi = require(path.join(__dirname, '..', 'factoryABI.json')).abi;
    const routerAbi = require(path.join(__dirname, '..', 'routerABI.json')).abi;

    // Addresses - Replace these placeholders with actual addresses
    const deployer = new ethers.Wallet(process.env.DEPLOYER_PRIVATE_KEY, ethers.provider); // Use your .env variable name here
    const factoryAddress = '0x7E0987E5b3a30e3f2828572Bb659A548460a3003'; // Working Uniswap Factory at this time
    const routerAddress = '0xC532a74256D3Db42D0Bf7a0400fEFDbad7694008';// Working Uniswap Router at this time
    const tokenAddress = 'YOUR_TOKEN_ADDRESS_HERE'; // Token you are adding liquidity with

    // Token amounts - Replace these values with the amounts you want to use
    const ETHAmount = ethers.utils.parseEther('AMOUNT_OF_ETH'); // e.g., '1' for 1 ETH
    const TokenAmount = ethers.utils.parseUnits('AMOUNT_OF_TOKEN', 'TOKEN_DECIMALS'); // e.g., '10000000000', 18 for 10 billion tokens with 18 decimals

    // Setup contract instances using local ABIs
    const Factory = new ethers.Contract(factoryAddress, factoryAbi, deployer);
    const Router = new ethers.Contract(routerAddress, routerAbi, deployer);
    const Token = await ethers.getContractAt("IERC20", tokenAddress, deployer);

    // Approve tokens
    console.log("Approving Router to spend tokens...");
    await (await Token.approve(routerAddress, TokenAmount)).wait();

    // Add liquidity
    console.log("Adding liquidity...");
    const tx = await Router.addLiquidityETH(
        tokenAddress,
        TokenAmount,
        0, // Set slippage to the minimum amount of tokens desired.
        0, // Set slippage to the minimum amount of ETH desired.
        deployer.address,
        Math.floor(Date.now() / 1000) + 60 * 10, // Deadline 10 minutes from now
        { value: ETHAmount, gasLimit: 5000000 } // Setting a higher gas limit and sending ETH
    );

    const receipt = await tx.wait();
    console.log(`Liquidity added! Transaction hash: ${receipt.transactionHash}`);
}

main().catch((error) => {
    console.error(error);
    process.exit(1);
});