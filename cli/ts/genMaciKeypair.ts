import {
    PubKey,
    PrivKey,
    Keypair,
} from 'maci-domainobjs'

import {
    passphraseToPrivKey,
    genPubKey,
} from 'maci-crypto'

const genMaciKeypair = async (args: any) => {
    const passphrase = args.passphrase
    if (passphrase && passphrase.length < 32) {
        console.error('Error: the passphrase must be at least 32 characters long.')
        process.exit(1)
    }

    let keypair

    if (passphrase) {
        keypair = new Keypair(
            new PrivKey(await passphraseToPrivKey(passphrase))
        )
    } else {
        keypair = new Keypair()
    }

    const serializedPrivKey = keypair.privKey.serialize()
    const serializedPubKey = keypair.pubKey.serialize()
    console.log('Private key:', serializedPrivKey)
    console.log('Public key: ', serializedPubKey)

    if (passphrase) {
        console.log('\nPlease store your passphrase and/or private key in a safe place and do not reveal it to anyone.')
    } else {
        console.log('\nPlease store your private key in a safe place and do not reveal it to anyone.')
    }
}

export { genMaciKeypair }
