// We require the Hardhat Runtime Environment explicitly here. This is optional
// but useful for running the script in a standalone fashion through `node <script>`.
//
// When running the script with `npx hardhat run <script>` you'll find the Hardhat
// Runtime Environment's members available in the global scope.

const get_weth = require ('./get_weth.js');
const { BigNumber } = require('ethers');


const owner = ethers.getSigner();
const input = 0.1*10**18
const amount = BigNumber.from(input.toString());

async function approve_erc20(amount, spender, erc20_address){
  
  console.log("Approving ERC20 token...");
  const erc20 = await ethers.getContractAt("IERC20", erc20_address);
  tx = await erc20.approve(spender, amount);

  console.log("Approved!");
}

async function get_lending_pool(){
  const lending_pool_addresses_provider = await ethers.getContractAt("ILendingPoolAddressesProvider", "0xB53C1a33016B2DC2fF3653530bfF1848a515c8c5");
  const lending_pool_address = await lending_pool_addresses_provider.getLendingPool();
  const lending_pool = await ethers.getContractAt("ILendingPool", lending_pool_address.toString());

  const lendpoolSummary = [lending_pool_address, lending_pool];
  return lendpoolSummary;
 
}

async function get_borrowable_data(lending_pool){
  const deployer = await owner;
  
  const [
    total_collateral_eth,
    total_debt_eth,
    available_borrow_eth,
    current_liquidation_threshold,
    ltv,
    health_factor,
   ] = await lending_pool.getUserAccountData(deployer.address);
   
  
   console.log(`You have ${ethers.utils.formatEther(BigNumber.from(total_collateral_eth.toString()))}worth of eth deposited`);
   console.log(`You have ${ethers.utils.formatEther(BigNumber.from(total_debt_eth.toString()))} worth of eth borrowed`);
   console.log(`You have ${ethers.utils.formatEther(BigNumber.from(available_borrow_eth.toString()))} worth of eth borrowable`);
   const eth_values_debtAndBorrowable = [total_debt_eth, available_borrow_eth ];
   return eth_values_debtAndBorrowable;
}

async function get_asset_price(){
  const dai_eth_priceFeed = await ethers.getContractAt("AggregatorV3Interface", "0x773616E4d11A78F511299002da57A0a94577F1f4");
  const roundData = await dai_eth_priceFeed.latestRoundData()
  
   const converted_latest_price = ethers.utils.formatEther(BigNumber.from(roundData[1]));

  console.log(`The DAI/ETH price is ${converted_latest_price}`);
  return converted_latest_price;

}

async function repay_all(amount, lending_pool_address, _account, lending_pool){

  await approve_erc20(amount, lending_pool_address, "0x6B175474E89094C44Da98b954EedeAC495271d0F");

  const repay_tx = lending_pool.repay("0x6B175474E89094C44Da98b954EedeAC495271d0F", amount, 1, _account.address);

  console.log("Repaid!");
}




async function main() {

  const lendpoolSummary = await get_lending_pool();
  const lending_pool = lendpoolSummary[1];
  const lending_pool_address = lendpoolSummary[0];
  

  const weth = get_weth();
  
  await approve_erc20(amount, lending_pool_address, "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2");

  console.log("Depositing...");
  const deployer = await owner;
  console.log("Owner address:", deployer.address);
   const tx = await lending_pool.deposit("0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2", amount, deployer.address, 0);

  console.log("Deposited!");

  let eth_values_debtAndBorrowable = await get_borrowable_data(lending_pool);

  console.log("Lets borrow!");

  const dai_eth_price = await get_asset_price();
  const available_borrow_eth = eth_values_debtAndBorrowable[1];
  console.log(dai_eth_price, available_borrow_eth);

  const amount_dai_to_borrow = (1/dai_eth_price)*(available_borrow_eth*0.95);
  // borrowable_eth -> borrowable_dai * 95%\
  console.log("We are going to borrow");
  console.log(amount_dai_to_borrow);
  
 const borrow_tx = await lending_pool.borrow("0x6B175474E89094C44Da98b954EedeAC495271d0F", BigNumber.from(amount_dai_to_borrow.toString()), 1 , 0, deployer.address);
  
  console.log("We borrowed some DAI!");

  eth_values_debtAndBorrowable = await get_borrowable_data(lending_pool);

  await repay_all( BigNumber.from(amount_dai_to_borrow.toString()), lending_pool_address, deployer, lending_pool);

  // await approve_erc20(BigNumber.from(amount_dai_to_borrow.toString()), lending_pool_address, "0x6B175474E89094C44Da98b954EedeAC495271d0F", lending_pool);


  eth_values_debtAndBorrowable = await get_borrowable_data(lending_pool);

  console.log("You just deposited, borrowed, and repayed with Aave, Hardhat and Chainlink!")


}



// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
