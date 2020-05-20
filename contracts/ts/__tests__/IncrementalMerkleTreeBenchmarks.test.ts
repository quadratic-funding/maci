require('module-alias/register')
jest.setTimeout(60000)
import { genTestAccounts } from '../accounts'
import { config } from 'maci-config'
import {
    genRandomSalt,
    NOTHING_UP_MY_SLEEVE,
    IncrementalMerkleTree,
} from 'maci-crypto'

import * as etherlime from 'etherlime-lib'
const PoseidonT3 = require('@maci-contracts/compiled/PoseidonT3.json')

const IncrementalMerkleTreeAbi = require('@maci-contracts/compiled/IncrementalMerkleTreeBenchmarks.json')

const accounts = genTestAccounts(1)
let deployer
let mtContract
let PoseidonT3Contract

const DEPTH = 30

let tree
describe('IncrementalMerkleTree', () => {
    beforeAll(async () => {
        deployer = new etherlime.JSONRPCPrivateKeyDeployer(
            accounts[0].privateKey,
            config.get('chain.url'),
            {
                gasLimit: 8800000,
            },
        )

        console.log('Deploying PoseidonT3Contract')
        PoseidonT3Contract = await deployer.deploy(PoseidonT3, {})

        console.log('Deploying IncrementalMerkleTree')
        mtContract = await deployer.deploy(
            IncrementalMerkleTreeAbi,
            {
                PoseidonT3: PoseidonT3Contract.contractAddress,
            },
            DEPTH,
            NOTHING_UP_MY_SLEEVE.toString(),
        )

        tree = new IncrementalMerkleTree(DEPTH, NOTHING_UP_MY_SLEEVE)
    })

    it('the on-chain root should match an off-chain root after various insertions', async () => {
        expect.assertions(1)
        const leaf = genRandomSalt()

        const tx = await mtContract.insertLeaf(leaf.toString())
        await tx.wait()
        const root1 = await mtContract.root()

        tree.insert(leaf)

        expect(tree.root.toString()).toEqual(root1.toString())
    })
})
