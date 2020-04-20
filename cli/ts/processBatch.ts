import * as assert from 'assert'
import * as ethers from 'ethers'

import { bigInt } from 'maci-crypto'

import { MaciState } from 'maci-core'

import {
    maciContractAbi,
} from 'maci-contracts'

import {
    loadPk,
    loadVk,
    compileAndLoadCircuit,
} from 'maci-circuits'

import {
    PubKey,
    PrivKey,
    Keypair,
    Message,
    Command,
    StateLeaf,
} from 'maci-domainobjs'

import {
    genProof,
    verifyProof,
    genPublicSignals,
} from 'libsemaphore'

import {
    promptPwd,
    validateEthSk,
    validateEthAddress,
    contractExists,
    genMaciStateFromContract,
    checkDeployerProviderConnection,
} from './utils'

import {
    DEFAULT_ETH_PROVIDER,
    DEFAULT_MESSAGE_BATCH_SIZE,
} from './defaults'

const configureSubparser = (subparsers: any) => {
    const parser = subparsers.addParser(
        'processBatch',
        { addHelp: true },
    )

    parser.addArgument(
        ['-e', '--eth-provider'],
        {
            action: 'store',
            type: 'string',
            help: `A connection string to an Ethereum provider. Default: ${DEFAULT_ETH_PROVIDER}`,
        }
    )

    const maciPrivkeyGroup = parser.addMutuallyExclusiveGroup({ required: true })

    maciPrivkeyGroup.addArgument(
        ['-dsk', '--prompt-for-maci-privkey'],
        {
            action: 'storeTrue',
            help: 'Whether to prompt for your serialized MACI private key',
        }
    )

    maciPrivkeyGroup.addArgument(
        ['-sk', '--privkey'],
        {
            action: 'store',
            type: 'string',
            help: 'Your serialized MACI private key',
        }
    )

    const ethPrivkeyGroup = parser.addMutuallyExclusiveGroup({ required: true })

    ethPrivkeyGroup.addArgument(
        ['-dp', '--prompt-for-eth-privkey'],
        {
            action: 'storeTrue',
            help: 'Whether to prompt for the user\'s Ethereum private key and ignore -d / --eth-privkey',
        }
    )

    ethPrivkeyGroup.addArgument(
        ['-d', '--eth-privkey'],
        {
            action: 'store',
            type: 'string',
            help: 'The deployer\'s Ethereum private key',
        }
    )

    parser.addArgument(
        ['-x', '--contract'],
        {
            required: true,
            type: 'string',
            help: 'The MACI contract address',
        }
    )
}

const processBatch = async (args: any) => {
    // MACI contract
    if (!validateEthAddress(args.contract)) {
        console.error('Error: invalid MACI contract address')
        return
    }

    let ethSk
    // The coordinator's Ethereum private key
    // The user may either enter it as a command-line option or via the
    // standard input
    if (args.prompt_for_eth_privkey) {
        ethSk = await promptPwd('Your Ethereum private key')
    } else {
        ethSk = args.eth_privkey
    }

    if (ethSk.startsWith('0x')) {
        ethSk = ethSk.slice(2)
    }

    if (!validateEthSk(ethSk)) {
        console.error('Error: invalid Ethereum private key')
        return
    }

    // Ethereum provider
    const ethProvider = args.eth_provider ? args.eth_provider : DEFAULT_ETH_PROVIDER

    if (! (await checkDeployerProviderConnection(ethSk, ethProvider))) {
        console.error('Error: unable to connect to the Ethereum provider at', ethProvider)
        return
    }

    const provider = new ethers.providers.JsonRpcProvider(ethProvider)

    const wallet = new ethers.Wallet(ethSk, provider)

    const maciAddress = args.contract

    if (! (await contractExists(provider, maciAddress))) {
        console.error('Error: there is no contract deployed at the specified address')
        return
    }

    // The coordinator's MACI private key
    // They may either enter it as a command-line option or via the
    // standard input
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

    const maciContract = new ethers.Contract(
        maciAddress,
        maciContractAbi,
        wallet,
    )

    // Check whether there are any remaining batches to process
    const currentMessageBatchIndex = await maciContract.currentMessageBatchIndex()
    const messageTreeMaxLeafIndex = await maciContract.messageTreeMaxLeafIndex()

    if (currentMessageBatchIndex === messageTreeMaxLeafIndex) {
        console.log('All messages have been processed')
        return
    }

    if (currentMessageBatchIndex > messageTreeMaxLeafIndex) {
        console.error('Error: the message batch index is invalid. This should never happen.')
    }

    // Build an off-chain representation of the MACI contract using data in the contract storage
    let maciState
    try {
        maciState = await genMaciStateFromContract(
            provider,
            maciAddress,
            coordinatorKeypair,
        )
    } catch (e) {
        console.error(e)
        return
    }

    const messageBatchSize  = await maciContract.messageBatchSize()
    const randomStateLeaf = StateLeaf.genRandomLeaf()

    const circuitInputs = maciState.genBatchUpdateStateTreeCircuitInputs(
        currentMessageBatchIndex.toNumber(),
        messageBatchSize,
        randomStateLeaf,
    )

    // Process the batch of messages
    maciState.batchProcessMessage(
        currentMessageBatchIndex.toNumber(),
        messageBatchSize,
        randomStateLeaf,
    )

    const stateRootAfter = maciState.genStateRoot()

    const circuit = await compileAndLoadCircuit('batchUpdateStateTree_test.circom')

    debugger

    // Calculate the witness
    const witness = circuit.calculateWitness(circuitInputs)
    if (!circuit.checkWitness(witness)) {
        console.error('Error: unable to compute batch update state tree witness data')
        return
    }

    // Get the circuit-generated root
    const idx = circuit.getSignalIdx('main.root')
    const circuitNewStateRoot = witness[idx].toString()
    if (!circuitNewStateRoot.toString() === stateRootAfter.toString()) {
        console.error('Error: circuit-computed root mismatch')
        return
    }
    const publicSignals = genPublicSignals(witness, circuit)

    const batchUstPk = loadPk('batchUstPk')
    const batchUstVk = loadVk('batchUstVk')

    console.log('Generating proof...')
    const proof = await genProof(witness, batchUstPk)
}

export {
    processBatch,
    configureSubparser,
}
