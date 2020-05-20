require('module-alias/register')
jest.setTimeout(60000)
import { genTestAccounts } from '../accounts'
import { config } from 'maci-config'
import {
    genRandomSalt,
    NOTHING_UP_MY_SLEEVE,
    IncrementalQuadTree,
} from 'maci-crypto'

import * as etherlime from 'etherlime-lib'
const PoseidonT6 = require('@maci-contracts/compiled/PoseidonT6.json')

const IncrementalQuinTreeAbi = require('@maci-contracts/compiled/IncrementalQuinTreeBenchmarks.json')

const accounts = genTestAccounts(1)
let deployer
let mtContract
let PoseidonT6Contract

const DEPTH = 16

let tree
describe('IncrementalQuinTree', () => {
    beforeAll(async () => {
        deployer = new etherlime.JSONRPCPrivateKeyDeployer(
            accounts[0].privateKey,
            config.get('chain.url'),
            {
                gasLimit: 10000000,
            },
        )

        PoseidonT6Contract = await deployer.deploy(PoseidonT6, {})

        console.log('Deploying IncrementalQuinTree')
        mtContract = await deployer.deploy(
            IncrementalQuinTreeAbi,
            {
                PoseidonT6: PoseidonT6Contract.contractAddress
            },
            DEPTH,
            NOTHING_UP_MY_SLEEVE.toString(),
        )

        tree = new IncrementalQuadTree(DEPTH, NOTHING_UP_MY_SLEEVE)
    })

    it('the on-chain root should match an off-chain root after various insertions', async () => {
        expect.assertions(1)
        const leaf = genRandomSalt()

        tree.insert(leaf)
        const tx = await mtContract.insertLeaf(leaf.toString())
        await tx.wait()
        const root1 = (await mtContract.root()).toString()

        expect(tree.root.toString()).toEqual(root1)
    })
})
