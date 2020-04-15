jest.setTimeout(30000)
import * as ethers from 'ethers'

import { MaciState } from 'maci-core'

import { bigInt } from 'maci-crypto'
import {
    PubKey,
    PrivKey,
    Keypair,
    Command,
} from 'maci-domainobjs'

import {
    maciContractAbi,
    initialVoiceCreditProxyAbi,
    genTestAccounts,
} from 'maci-contracts'

import { genPubKey } from 'maci-crypto'

import { config } from 'maci-config'

import { exec, delay } from './utils'

const accounts = genTestAccounts(2)

const calcTreeDepthFromMaxLeaves = (maxLeaves: number) => {
    return Math.ceil(Math.log(maxLeaves) / Math.log(2))
}

let maciContract
let maciAddress: string
let maciState: MaciState
let stateIndex: string
const providerUrl = config.get('chain.url')
const coordinatorKeypair = new Keypair()
const userKeypair = new Keypair()
const maciPrivkey = coordinatorKeypair.privKey.serialize()
const deployerPrivKey = accounts[0].privateKey
const userPrivKey = accounts[1].privateKey
const maxUsers = 2 ** 4 - 1
const maxMessages = 2 ** 4 - 1
const maxVoteOptions = 15
const signupDuration = 5
const votingDuration = 3600
const messageBatchSize = 4
const tallyBatchSize = 4
const initialVoiceCredits = 1000

describe('signup and publish CLI subcommands', () => {
    let maciContract

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

        console.log(createOutput)

        const regMatch = createOutput.match(/^MACI: (0x[a-fA-F0-9]{40})$/)
        maciAddress = regMatch[1]

        const stateTreeDepth = calcTreeDepthFromMaxLeaves(maxUsers)
        const messageTreeDepth = calcTreeDepthFromMaxLeaves(maxMessages)
        const voteOptionTreeDepth = calcTreeDepthFromMaxLeaves(maxVoteOptions)
        maciState = new MaciState(
            coordinatorKeypair,
            stateTreeDepth,
            messageTreeDepth,
            voteOptionTreeDepth,
            maxVoteOptions,
        )
    })

    it('The signup subcommand should sign a user up', async () => {

        const provider = new ethers.providers.JsonRpcProvider(providerUrl)
        maciContract = new ethers.Contract(
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
        console.log(signupOutput)

        // Check whether the transaction succeeded
        const signupRegMatch = signupOutput.match(/^Transaction hash: (0x[a-fA-F0-9]{64})\nState index: (\d+)$/)
        expect(signupRegMatch).toBeTruthy()

        // Get the state tree index from the event log
        const txHash = signupRegMatch[1]
        const indexFromCli = signupRegMatch[2]
        const iface = new ethers.utils.Interface(maciContract.interface.abi)

        const receipt = await provider.getTransactionReceipt(txHash)
        if (receipt && receipt.logs) {
            stateIndex = iface.parseLog(receipt.logs[1]).values._stateIndex.toString()
            expect(stateIndex).toEqual(indexFromCli)
        } else {
            console.error('Error: unable to retrieve the transaction receipt')
        }

        // Check whether the signup command increased the number of signups
        const onChainNumSignupsAfter = await maciContract.numSignUps()
        expect(onChainNumSignupsBefore.toNumber()).toEqual(onChainNumSignupsAfter.toNumber() - 1)

        maciState.signUp(
            userKeypair.pubKey, 
            bigInt(initialVoiceCredits),
        )

        const root = await maciContract.getStateTreeRoot()
        expect(root.toString()).toEqual(maciState.genStateRoot().toString())
    })

    it('The publish subcommand should publish a message', async () => {
        const coordinatorPubKeyOnChain = await maciContract.coordinatorPubKey()
        const coordinatorPubKey = new PubKey([
            bigInt(coordinatorPubKeyOnChain.x.toString()),
            bigInt(coordinatorPubKeyOnChain.y.toString()),
        ])

        const voteOptionIndex = 0
        const newVoteWeight = 9
        const nonce = 0
        const salt = '0x0333333333333333333333333333333333333333333333333333333333333333'

        await delay(1000 * signupDuration)

        const publishCommand = `node ../cli/build/index.js publish` +
            ` -sk ${userKeypair.privKey.serialize()}` +
            ` -p ${userKeypair.pubKey.serialize()}` +
            ` -d ${userPrivKey}` +
            ` -x ${maciAddress}` +
            ` -i ${stateIndex}` +
            ` -v ${voteOptionIndex}` +
            ` -w ${newVoteWeight}` +
            ` -n ${nonce}` +
            ` -s ${salt}`

        const publishOutput = await exec(publishCommand).stdout.trim()
        //console.log(publishCommand)
        //console.log(publishOutput)

        const publishRegMatch = publishOutput.match(
            /^Transaction hash: (0x[a-fA-F0-9]{64})\nEphemeral private key: (macisk.[a-f0-9]+)$/)
        expect(publishRegMatch).toBeTruthy()

        const command = new Command(
            bigInt(stateIndex),
            userKeypair.pubKey,
            bigInt(voteOptionIndex),
            bigInt(newVoteWeight),
            bigInt(nonce),
            bigInt(salt),
        )

        const encPrivKey = PrivKey.unserialize(publishRegMatch[2])
        const encPubKey = new PubKey(genPubKey(encPrivKey.rawPrivKey))

        const signature = command.sign(userKeypair.privKey)

        const message = command.encrypt(
            signature,
            Keypair.genEcdhSharedKey(
                encPrivKey,
                coordinatorPubKey,
            )
        )

        maciState.publishMessage(
            message,
            encPubKey,
        )

        const onChainMessageRoot = await maciContract.getMessageTreeRoot()
        expect(maciState.genMessageRoot().toString()).toEqual(onChainMessageRoot.toString())

        // TODO: test failure modes (e.g. invalid salt)
    })
})
