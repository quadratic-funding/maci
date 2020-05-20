/*
 * Hasher object to abstract out hashing logic
 * to be shared between multiple files
 *
 * This file is part of maci
 */

pragma solidity ^0.5.0;

import {PoseidonT3, PoseidonT6} from "./Poseidon.sol";

import {SnarkConstants} from "./SnarkConstants.sol";


contract HasherBenchmarks is SnarkConstants {
    function benchmarkHash5() public pure returns (uint256) {
        uint256[] memory input = new uint256[](5);
        PoseidonT6.poseidon(input);
    }

    function hash2() public {
        uint256[] memory input = new uint256[](2);
        input[0] = 0;
        input[1] = 0;
        PoseidonT3.poseidon(input);
    }

    function hash5() public {
        uint256[] memory input = new uint256[](5);
        PoseidonT6.poseidon(input);
    }
}
