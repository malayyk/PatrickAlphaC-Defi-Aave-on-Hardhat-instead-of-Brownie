//SPDX-License-Identifier: MIT

pragma solidity ^0.6.0;

interface ILendingPoolAddressProvider {
    function getLendingPool() external view returns (address);
}
