import * as ethers from 'ethers'

import { MaciState } from 'maci-core'

import {
    PubKey,
    PrivKey,
    Keypair,
} from 'maci-domainobjs'

import {
    maciContractAbi,
    initialVoiceCreditProxyAbi,
    genTestAccounts,
} from 'maci-contracts'

import { genPubKey } from 'maci-crypto'

import { config } from 'maci-config'

import { exec } from './utils'

const accounts = genTestAccounts(2)

const calcTreeDepthFromMaxLeaves = (maxLeaves: number) => {
    return Math.ceil(Math.log(maxLeaves) / Math.log(2))
}

const providerUrl = config.get('chain.url')

describe('create CLI subcommand', () => {
    let maciContract

    const coordinatorKeypair = new Keypair()
    const userKeypair = new Keypair()

    beforeAll(async () => {
        const provider = new ethers.providers.JsonRpcProvider(providerUrl)
        // Fund the user's account
        const deployerWallet = new ethers.Wallet(accounts[0].privateKey, provider)
        const tx = await deployerWallet.provider.sendTransaction(
            accounts[0].sign({
                nonce: await deployerWallet.provider.getTransactionCount(accounts[0].address),
                gasPrice: ethers.utils.parseUnits('10', 'gwei'),
                gasLimit: 21000,
                to: accounts[1].address,
                value: ethers.utils.parseUnits('0.1', 'ether'),
                data: '0x'
            })
        )
        await tx.wait()
    })

    it('create should deploy a MACI contract', async () => {
        const maciPrivkey = coordinatorKeypair.privKey.serialize()
        const deployerPrivKey = accounts[0].privateKey
        const userPrivKey = accounts[1].privateKey
        const maxUsers = 2 ** 4 - 1
        const maxMessages = 2 ** 4 - 1
        const maxVoteOptions = 15
        const signupDuration = 600
        const votingDuration = 1
        const messageBatchSize = 4
        const tallyBatchSize = 4
        const initialVoiceCredits = 1000

        const createCommand = `node ../cli/build/index.js create` +
            ` -d ${deployerPrivKey} -sk ${maciPrivkey}` +
            ` -u ${maxUsers}` +
            ` -m ${maxMessages}` +
            ` -v ${maxVoteOptions}` +
            ` -e ${providerUrl}` +
            ` -s ${signupDuration}` +
            ` -o ${votingDuration}` +
            ` -bm ${messageBatchSize}` +
            ` -bv ${tallyBatchSize}` +
            ` -c ${initialVoiceCredits}`
        
        const createOutput = exec(createCommand).stdout.trim()

        const regMatch = createOutput.match(/^MACI: (0x[a-fA-F0-9]{40})$/)
        const maciAddress = regMatch[1]

        const provider = new ethers.providers.JsonRpcProvider(providerUrl)
        const maciContract = new ethers.Contract(
            maciAddress,
            maciContractAbi,
            provider,
        )
        const onChainNumSignupsBefore = await maciContract.numSignUps()

        const signupCommand = `node ../cli/build/index.js signup` +
            ` -p ${userKeypair.pubKey.serialize()}` +
            ` -d ${userPrivKey}` +
            ` -x ${maciAddress}`

        const signupOutput = exec(signupCommand).stdout.trim()

        // Check whether the transaction succeeded
        const signupRegMatch = signupOutput.match(/^Transaction hash: 0x[a-fA-F0-9]{64}$/)
        expect(signupRegMatch).toBeTruthy()

        const onChainNumSignupsAfter = await maciContract.numSignUps()

        // Check whether the signup command increased the number of signups
        expect(onChainNumSignupsBefore.toNumber()).toEqual(onChainNumSignupsAfter.toNumber() - 1)
    })
})
