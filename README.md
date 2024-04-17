
# How to use Uniswap Sepolia Scripts

  
## 1. Download zip, extract, and Add to Directory.

- Download the zip containing the scripts and ABI files. Add them to your working hardhat environment (you will need to modify to get working in non-hardhat env).

## 2. Update Variables:

- Update the variables in each script to fit your current working environment. The Factory, Router, and WETH addresses were all working contracts at the time of writing this, so you can leave them without changing. If you do have issues with these contracts, either deploy your own, or find working contract on Sepolia that are already working. 

- You will also need to update the lpTokenABI.json file with the correct ABI data from your LP pair after it is created using the addLiquidity script. I have had a good experience using https://abidata.net/ to pull the ABI data into a clean JSON format. Example link below:

``https://abidata.net/0x7b79995e5f793A07Bc00c21412e50Ecae098E7f9?network=sepolia``

## 3. Run Each Script:

- Run in script in your terminal as needed. Commands for each are below:

> ``npx hardhat run scripts/addLiquidity.js --network ETHSepolia`` 

> ``npx hardhat run scripts/removeLiquidity.js --network ETHSepolia`` 

> ``npx hardhat run scripts/sellTokens.js --network ETHSepolia`` 

> ``npx hardhat run scripts/buyTokens.js --network ETHSepolia`` 

## Notes:

- The buy and sell scripts use the **Swap Supporting Fee On Transfer Tokens** functions in the Router contract. This *should* work for all TXs, even tokens with contracts that do not have fees on transfers. If you for some reason are having issues with the swaps and know your contract does not have Fee on Transfers coded, then try using the other swap functions within the contract.

- The buy and sell scripts use a dynamic pricing model similar to the Uniswap dApp to get the expected minimum amounts of either ETH or TOKEN. This is to ensure the TXs go through based on the current price calculations of the LP pool. A 5% slippage is currently being used as well. 
