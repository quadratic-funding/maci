import * as argparse from 'argparse' 
import { genMaciKeypair } from './genMaciKeypair'
import { genMaciPubkey } from './genMaciPubkey'
import { create } from './create'

const main = async () => {
    const parser = new argparse.ArgumentParser({ 
        description: 'Minimal Anti-Collusion Infrastructure',
    })

    const subparsers = parser.addSubparsers({
        title: 'Subcommands',
        dest: 'subcommand',
    })

    const genMaciKeypairParser = subparsers.addParser(
        'genMaciKeypair',
        { addHelp: true },
    )

    genMaciKeypairParser.addArgument(
        ['-p', '--passphrase'],
        {
            action: 'store',
            type: 'string',
            help: 'If a passphrase is specified, this command will apply a cryptographic key-stretching algorithm to it and produce a private key. The passphrase must be at least 32 characters long. If unspecified, this command will randomly generate a private key and its associated public key.',
        }
    )

    const genMaciPubkeyParser = subparsers.addParser(
        'genMaciPubkey',
        { addHelp: true },
    )

    genMaciPubkeyParser.addArgument(
        ['-sk', '--privkey'],
        {
            required: true,
            action: 'store',
            type: 'string',
            help: 'This command will output the serialized public key associated with this serialized private key.',
        }
    )

    // Subcommand: create

    const createParser = subparsers.addParser(
        'create',
        { addHelp: true },
    )

    const deployerPrivkeyGroup = createParser.addMutuallyExclusiveGroup({ required: true })

    deployerPrivkeyGroup.addArgument(
        ['-dp', '--prompt-for-deployer-privkey'],
        {
            action: 'storeTrue',
            help: 'Whether to prompt for the deployer\'s Ethereum private key and ignore -d / --deployer-privkey',
        }
    )

    deployerPrivkeyGroup.addArgument(
        ['-d', '--deployer-privkey'],
        {
            action: 'store',
            type: 'string',
            help: 'The deployer\'s Ethereum private key',
        }
    )


    const coordinatorPrivkeyGroup = createParser.addMutuallyExclusiveGroup({ required: true })

    coordinatorPrivkeyGroup.addArgument(
        ['-dsk', '--prompt-for-maci-privkey'],
        {
            action: 'storeTrue',
            help: 'Whether to prompt for the coordinator\'s serialized MACI private key',
        }
    )

    coordinatorPrivkeyGroup.addArgument(
        ['-sk', '--privkey'],
        {
            action: 'store',
            type: 'string',
            help: 'The coordinator\'s serialized MACI private key',
        }
    )

    createParser.addArgument(
        ['-e', '--eth-provider'],
        {
            action: 'store',
            type: 'string',
            help: 'A connection string to an Ethereum provider. Default: http://localhost:8545',
        }
    )

    createParser.addArgument(
        ['-u', '--max-users'],
        {
            action: 'store',
            type: 'int',
            help: 'The maximum supported number of users. It must be one less than a power of 2. Default: 15',
        }
    )

    createParser.addArgument(
        ['-m', '--max-messages'],
        {
            action: 'store',
            type: 'int',
            help: 'The maximum supported number of messages. It must be one less than a power of 2. Default: 15',
        }
    )

    createParser.addArgument(
        ['-v', '--max-vote-options'],
        {
            action: 'store',
            type: 'int',
            help: 'The maximum supported number of vote options. It must be one less than a power of 2. Default: 15',
        }
    )

    createParser.addArgument(
        ['-s', '--signup-duration'],
        {
            action: 'store',
            type: 'int',
            help: 'The sign-up duration in seconds. Default: 3600',
        }
    )

    createParser.addArgument(
        ['-o', '--voting-duration'],
        {
            action: 'store',
            type: 'int',
            help: 'The voting duration in seconds. Default: 3600',
        }
    )

    createParser.addArgument(
        ['-bm', '--message-batch-size'],
        {
            action: 'store',
            type: 'int',
            help: 'The batch size for processing messages',
        }
    )

    createParser.addArgument(
        ['-bv', '--tally-batch-size'],
        {
            action: 'store',
            type: 'int',
            help: 'The batch size for tallying votes',
        }
    )

    const vcGroup = createParser.addMutuallyExclusiveGroup()

    vcGroup.addArgument(
        ['-c', '--initial-voice-credits'],
        {
            action: 'store',
            type: 'int',
            help: 'Each user\'s initial voice credits. Default: 100',
        }
    )

    vcGroup.addArgument(
        ['-i', '--initial-vc-proxy'],
        {
            action: 'store',
            type: 'string',
            help: 'If specified, deploys the MACI contract with this address as the initial voice credit proxy constructor argument. Otherwise, deploys a ConstantInitialVoiceCreditProxy contract with the above-specified value.',
        }
    )

    createParser.addArgument(
        ['-f', '--vote-option-label-file'],
        {
            action: 'store',
            type: 'string',
            help: 'A file with vote option labels (1 per line). Default: ./voteOptionLabels.txt',
        }
    )

    createParser.addArgument(
        ['-g', '--signup-gatekeeper'],
        {
            action: 'store',
            type: 'string',
            help: 'If specified, deploys the MACI contract with this address as the signup gatekeeper constructor argument. Otherwise, deploys a gatekeeper contract which allows any address to sign up.',
        }
    )

    const args = parser.parseArgs()

    // Execute the subcommand method
    if (args.subcommand === 'genMaciKeypair') {
        await genMaciKeypair(args)
    } else if (args.subcommand === 'genMaciPubkey') {
        await genMaciPubkey(args)
    } else if (args.subcommand === 'create') {
        await create(args)
    }
}

if (require.main === module) {
    main()
}
