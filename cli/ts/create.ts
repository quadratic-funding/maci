import * as ethers from 'ethers'
import {
    genJsonRpcDeployer,
    deployMaci,
    deployConstantInitialVoiceCreditProxy,
    deployFreeForAllSignUpGatekeeper,
} from 'maci-contracts'

import {
    PubKey,
    PrivKey,
    Keypair,
} from 'maci-domainobjs'

import {
    genPubKey,
} from 'maci-crypto'

import { promptPwd } from './utils'

const DEFAULT_ETH_PROVIDER = 'http://localhost:8545'
const DEFAULT_MAX_USERS = 15
const DEFAULT_MAX_MESSAGES = 15
const DEFAULT_MAX_VOTE_OPTIONS = 3
const DEFAULT_SIGNUP_DURATION = 3600
const DEFAULT_VOTING_DURATION = 3600
const DEFAULT_INITIAL_VOICE_CREDITS = 100
const DEFAULT_VOTE_OPTION_LABEL_FILE = './voteOptionLabels.txt'
const DEFAULT_MESSAGE_BATCH_SIZE = 4
const DEFAULT_TALLY_BATCH_SIZE = 4

const calcTreeDepthFromMaxLeaves = (maxLeaves: number) => {
    return Math.ceil(Math.log(maxLeaves) / Math.log(2))
}

const create = async (args: any) => {

    // The deployer's Ethereum private key
    // The user may either enter it as a command-line option or via the
    // standard input
    // TODO: support hardware wallets
    let deployerPrivkey
    if (args.prompt_for_deployer_privkey) {
        deployerPrivkey = await promptPwd('Deployer\'s Ethereum private key')
    } else {
        deployerPrivkey = args.deployer_privkey
    }

    if (deployerPrivkey.startsWith('0x')) {
        deployerPrivkey = deployerPrivkey.slice(2)
    }

    try {
        new ethers.Wallet(deployerPrivkey)
    } catch {
        console.error('Error: invalid Ethereum private key')
        return
    }

    let coordinatorPrivkey
    if (args.prompt_for_maci_privkey) {
        coordinatorPrivkey = await promptPwd('Coordinator\'s MACI private key')
    } else {
        coordinatorPrivkey = args.privkey
    }

    if (!PrivKey.isValidSerializedPrivKey(coordinatorPrivkey)) {
        console.error('Error: invalid MACI private key')
        return
    }

    const unserialisedPrivkey = PrivKey.unserialize(coordinatorPrivkey)
    const coordinatorKeypair = new Keypair(unserialisedPrivkey)

    // Max users
    const maxUsers = args.max_users ? args.max_users : DEFAULT_MAX_USERS

    // Max messages
    const maxMessages = args.max_messages ? args.max_messages : DEFAULT_MAX_MESSAGES

    // Calculate the tree depths. e.g. if maxUsers is 1000, the tree depth
    // should be 10, as the closest next power of 2 is 1024 = 2 ** 1024
    const stateTreeDepth = calcTreeDepthFromMaxLeaves(maxUsers)
    const messageTreeDepth = calcTreeDepthFromMaxLeaves(maxMessages)

    // Max vote options
    const maxVoteOptions = args.max_vote_options ? args.max_vote_options : DEFAULT_MAX_VOTE_OPTIONS

    // Signup duration
    const signupDuration = args.signup_duration ? args.signup_duration : DEFAULT_SIGNUP_DURATION

    // Voting duration
    const votingDuration = args.voting_duration ? args.voting_duration : DEFAULT_VOTING_DURATION

    // Vote option label file
    const voteOptionLabelFile = args.vote_option_label_file ? args.vote_option_label_file : DEFAULT_VOTE_OPTION_LABEL_FILE

    // Message batch size
    const messageBatchSize = args.message_batch_size ? args.message_batch_size : DEFAULT_MESSAGE_BATCH_SIZE

    // Tally batch size
    const tallyBatchSize = args.tally_batch_size ? args.tally_batch_size : DEFAULT_TALLY_BATCH_SIZE

    // Initial voice credits
    const initialVoiceCredits = args.initial_voice_credits ? args.initial_voice_credits : DEFAULT_INITIAL_VOICE_CREDITS

    // Initial voice credit proxy contract 
    const initialVoiceCreditProxy = args.initial_vc_proxy

    // Whether we should deploy a ConstantInitialVoiceCreditProxy
    if (initialVoiceCreditProxy != undefined && initialVoiceCredits != undefined) {
        console.error('Error: only one of the following can be specified: the initial voice credit proxy or the amount of initial voice credits.')
    }

    // Ethereum provider
    const ethProvider = args.eth_provider ? args.eth_provider : DEFAULT_ETH_PROVIDER

    const deployer = genJsonRpcDeployer(deployerPrivkey, ethProvider)
    try {
        await deployer.provider.getBlockNumber()
    } catch {
        console.error('Error: unable to connect to the Ethereum provider at', ethProvider)
        return
    }

    let initialVoiceCreditProxyContractAddress: string = ''
    if (initialVoiceCreditProxy == undefined) {
        // Deploy a ConstantInitialVoiceCreditProxy contract
        const c = await deployConstantInitialVoiceCreditProxy(
            deployer,
            initialVoiceCredits,
            true,
        )
        initialVoiceCreditProxyContractAddress = c.contractAddress
    } else {
        initialVoiceCreditProxyContractAddress = initialVoiceCreditProxy
    }

    // Signup gatekeeper contract
    const signupGatekeeper = args.signup_gatekeeper

    let signUpGatekeeperAddress: string = ''
    if (signupGatekeeper == undefined) {
        // Deploy a FreeForAllGatekeeper contract
        const c = await deployFreeForAllSignUpGatekeeper(deployer, true)
        signUpGatekeeperAddress = c.contractAddress
    } else {
        signUpGatekeeperAddress = signupGatekeeper
    }

    const contracts = await deployMaci(
        deployer,
        signUpGatekeeperAddress,
        initialVoiceCreditProxyContractAddress,
        stateTreeDepth,
        messageTreeDepth,
        tallyBatchSize,
        messageBatchSize,
        maxVoteOptions - 1,
        signupDuration,
        votingDuration,
        coordinatorKeypair.pubKey,
        true,
    )

    console.log('MACI:', contracts.maciContract.contractAddress)
}

export { create }
