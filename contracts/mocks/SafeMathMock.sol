pragma solidity ^0.5.0;

import "../SafeMath.sol";


/**
 * @title SafeMathMock
 * @dev contract for testing purposes, invoking SafeMath methods
 */
contract SafeMathMock {
    /**
     * @dev multiplication of two uint a and b
     * @param a one of factors used for multiplication
     * @param b one of factors used for multiplication
     * @return uint256 a result of multiplication
     */
    function mul(uint256 a, uint256 b) external pure returns (uint256) {
        return SafeMath.mul(a, b);
    }

    /**
     * @dev division of two uint a and b
     * @param a one of factors used for division, which will be divided
     * @param b one of factors used for division, which is used to divide by
     * @return uint256 a result of division
     */
    function div(uint256 a, uint256 b) external pure returns (uint256) {
        return SafeMath.div(a, b);
    }

    /**
     * @dev substitution of two uint a and b
     * @param a one of factors used for substitution
     * @param b one of factors used for substitution
     * @return uint256 a result of substitution
     */
    function sub(uint256 a, uint256 b) external pure returns (uint256) {
        return SafeMath.sub(a, b);
    }

    /**
     * @dev addition of two uint a and b
     * @param a one of factors used for addition
     * @param b one of factors used for addition
     * @return uint256 a result of addition
     */
    function add(uint256 a, uint256 b) external pure returns (uint256) {
        return SafeMath.add(a, b);
    }

    /**
     * @dev modulo division of two uint a and b
     * @param a one of factors used for division, which will be divided
     * @param b one of factors used for division, which is used to divide by
     * @return uint256 a result of modulo division
     */
    function mod(uint256 a, uint256 b) external pure returns (uint256) {
        return SafeMath.mod(a, b);
    }
}
