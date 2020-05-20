require('module-alias/register')
import { genTestAccounts } from '../accounts'
import { config } from 'maci-config'
import {
    hashLeftRight,
    hash5,
    hash11,
    genRandomSalt,
} from 'maci-crypto'

import * as etherlime from 'etherlime-lib'
const HasherBenchmarks = require('@maci-contracts/compiled/HasherBenchmarks.json')
const PoseidonT3 = require('@maci-contracts/compiled/PoseidonT3.json')
const PoseidonT6 = require('@maci-contracts/compiled/PoseidonT6.json')

const accounts = genTestAccounts(1)
let deployer
let hasherContract
let PoseidonT3Contract, PoseidonT6Contract

describe('HasherBenchmarks', () => {
    beforeAll(async () => {
        deployer = new etherlime.JSONRPCPrivateKeyDeployer(
            accounts[0].privateKey,
            config.get('chain.url'),
            {
                gasLimit: 8800000,
            },
        )

        console.log('Deploying Poseidon')

        PoseidonT3Contract = await deployer.deploy(PoseidonT3, {})
        PoseidonT6Contract = await deployer.deploy(PoseidonT6, {})

        console.log('Deploying HasherBenchmarks')
        hasherContract = await deployer.deploy(HasherBenchmarks, {
            PoseidonT3: PoseidonT3Contract.contractAddress,
            PoseidonT6: PoseidonT6Contract.contractAddress
        })
    })

    it('perform benchmarks', async () => {
        let tx = await hasherContract.hash2({ gasLimit: 200000 })
        let receipt = await tx.wait()
        console.log('Hash2 gas:', receipt.gasUsed.toString())

        tx = await hasherContract.hash5({ gasLimit: 200000 })
        receipt = await tx.wait()
        console.log('Hash5 gas:', receipt.gasUsed.toString())
    })

})
