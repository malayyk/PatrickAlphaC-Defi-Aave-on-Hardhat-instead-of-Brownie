const { BigNumber } = require('ethers');

async function get_weth() {
  const weth = await ethers.getContractAt("IWeth", "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2");

  const input = 0.1 * 10 ** 18
  const balance = BigNumber.from(input.toString());
  console.log(`${ethers.utils.formatEther(balance)} eth was converted to weth`);


  let tx = await weth.deposit({ value: balance });


}

async function main() {
  

}

module.exports = get_weth;

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});