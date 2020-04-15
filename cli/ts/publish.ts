import {
    maciContractAbi,
    genJsonRpcDeployer,
} from 'maci-contracts'

import {
    PubKey,
    PrivKey,
    Keypair,
    Command,
} from 'maci-domainobjs'

import {
    bigInt,
    genPubKey,
    genRandomSalt,
    passphraseToPrivKey,
    SNARK_FIELD_SIZE,
} from 'maci-crypto'

import {
    promptPwd,
    checkEthSk,
    checkDeployerProviderConnection,
} from './utils'

import * as ethers from 'ethers'

const DEFAULT_ETH_PROVIDER = 'http://localhost:8545'
const DEFAULT_SG_DATA = ethers.utils.defaultAbiCoder.encode(['uint256'], [0])
const DEFAULT_IVCP_DATA = ethers.utils.defaultAbiCoder.encode(['uint256'], [0])
const DEFAULT_SALT = genRandomSalt()

const configureSubparser = (subparsers: any) => {
    const parser = subparsers.addParser(
        'publish',
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

    parser.addArgument(
        ['-p', '--pubkey'],
        {
            required: true,
            type: 'string',
            help: 'The user\'s MACI public key',
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
        ['-i', '--state-index'],
        {
            action: 'store',
            type: 'int',
            help: 'The user\'s state index',
        }
    )

    parser.addArgument(
        ['-v', '--vote-option-index'],
        {
            required: true,
            action: 'store',
            type: 'int',
            help: 'The vote option index',
        }
    )

    parser.addArgument(
        ['-w', '--new-vote-weight'],
        {
            required: true,
            action: 'store',
            type: 'int',
            help: 'The new vote weight',
        }
    )

    parser.addArgument(
        ['-n', '--nonce'],
        {
            required: true,
            action: 'store',
            type: 'int',
            help: 'The message nonce',
        }
    )

    parser.addArgument(
        ['-s', '--salt'],
        {
            action: 'store',
            type: 'string',
            help: 'The message salt',
        }
    )
}

const publish = async (args: any) => {
    // User's MACI public key
    if (!PubKey.isValidSerializedPubKey(args.pubkey)) {
        console.error('Error: invalid MACI public key')
        return
    }

    const userMaciPubKey = PubKey.unserialize(args.pubkey)

    // MACI contract
    const regMatch = args.contract.match(/^0x[a-fA-F0-9]{40}$/)

    if (!regMatch) {
        console.error('Error: invalid MACI contract address')
        return
    }

    const maciAddress = args.contract

    // Ethereum provider
    const ethProvider = args.eth_provider ? args.eth_provider : DEFAULT_ETH_PROVIDER

    let ethSk
    // The deployer's Ethereum private key
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

    if (!checkEthSk(ethSk)) {
        console.error('Error: invalid Ethereum private key')
        return
    }

    // The user's MACI private key
    let serializedPrivkey
    if (args.prompt_for_maci_privkey) {
        serializedPrivkey = await promptPwd('Your MACI private key')
    } else {
        serializedPrivkey = args.privkey
    }

    if (!PrivKey.isValidSerializedPrivKey(serializedPrivkey)) {
        console.error('Error: invalid MACI private key')
        return
    }

    const userMaciPrivkey = PrivKey.unserialize(serializedPrivkey)
    const userKeypair = new Keypair(userMaciPrivkey)

    if (! (await checkDeployerProviderConnection(ethSk, ethProvider))) {
        console.error('Error: unable to connect to the Ethereum provider at', ethProvider)
        return
    }
    
    // State index
    const stateIndex = bigInt(args.state_index)
    if (stateIndex < 0) {
        console.error('Error: the state index must be greater than 0')
        return
    }

    const provider = new ethers.providers.JsonRpcProvider(ethProvider)
    const wallet = new ethers.Wallet(ethSk, provider)
    const maciContract = new ethers.Contract(
        maciAddress,
        maciContractAbi,
        wallet,
    )

    // Validate the state index
    const numSignUps = (await maciContract.numSignUps()).toNumber()
    if (numSignUps < stateIndex) {
        console.error('Error: the state index is invalid')
        return
    }

    // Vote option index
    const voteOptionIndex = bigInt(args.vote_option_index)

    // Validate the vote option index
    const maxVoteOptions = (await maciContract.voteOptionsMaxLeafIndex()).toNumber()
    if (maxVoteOptions < voteOptionIndex) {
        console.error('Error: the vote option index is invalid')
        return
    }

    // The new vote weight
    const newVoteWeight = bigInt(args.new_vote_weight)

    // The nonce
    const nonce = bigInt(args.nonce)

    if (nonce > 0) {
        console.error('Error: the nonce should be 0 or greater')
        return
    }

    // The salt
    let salt
    if (args.salt) {
        if (!args.salt.startsWith('0x') && !args.salt.match(/^0x[a-fA-F0-9]{64}$/)) {
            console.error('Error: the salt should be a 32-byte hexadecimal string')
            return
        }

        salt = bigInt(args.salt)

        if (salt > SNARK_FIELD_SIZE) {
            console.error('Error: the salt should less than the BabyJub field size')
            return
        }
    } else {
        salt = DEFAULT_SALT
    }

    const coordinatorPubKeyOnChain = await maciContract.coordinatorPubKey()
    const coordinatorPubKey = new PubKey([
        bigInt(coordinatorPubKeyOnChain.x.toString()),
        bigInt(coordinatorPubKeyOnChain.y.toString()),
    ])

    const encKeypair = new Keypair()

    const command = new Command(
        stateIndex,
        userMaciPubKey,
        voteOptionIndex,
        newVoteWeight,
        nonce,
        salt,
    )
    const signature = command.sign(userMaciPrivkey)
    const message = command.encrypt(
        signature,
        Keypair.genEcdhSharedKey(
            encKeypair.privKey,
            coordinatorPubKey,
        )
    )

    let tx
    try {
        tx = await maciContract.publishMessage(
            message.asContractParam(),
            encKeypair.pubKey.asContractParam(),
            { gasLimit: 1000000 }
        )

        console.log('Transaction hash:', tx.hash)
        console.log('Ephemeral private key:', encKeypair.privKey.serialize())
    } catch(e) {
        console.error('Error: the transaction failed')
        if (e.message) {
            console.error(e.message)
        }
        return
    }

    const receipt = await tx.wait()
}

export {
    publish,
    configureSubparser,
}
