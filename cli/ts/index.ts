import * as argparse from 'argparse' 
import { genMaciKeypair } from './genMaciKeypair'
import { genMaciPubkey } from './genMaciPubkey'


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

    const args = parser.parseArgs()

    // Execute the subcommand method
    if (args.subcommand === 'genMaciKeypair') {
        await genMaciKeypair(args)
    } else if (args.subcommand === 'genMaciPubkey') {
        await genMaciPubkey(args)
    }
}

if (require.main === module) {
    main()
}
