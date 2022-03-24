// SPDX-License-Identifier: MIT
pragma solidity ^0.8.1;

import { SignUpGatekeeper } from './SignUpGatekeeper.sol';
import { MACI } from '../MACI.sol';

contract FreeForAllGatekeeper is SignUpGatekeeper {

    function setMaciInstance(MACI _maci) public override {
    }

    /*
     * Registers the user without any restrictions.
     */
    function register(address, bytes memory) public override {
    }
}
