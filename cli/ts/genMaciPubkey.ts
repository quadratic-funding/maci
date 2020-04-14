import {
    PubKey,
    PrivKey,
    Keypair,
} from 'maci-domainobjs'

import {
    passphraseToPrivKey,
    genPubKey,
} from 'maci-crypto'

const genMaciPubkey = async (args: any) => {
    const isValid = PrivKey.isValidSerializedPrivKey(args.privkey)
    if (!isValid) {
        console.error('Error: invalid private key')
        return
    }

    const unserialisedPrivkey = PrivKey.unserialize(args.privkey)
    const pubkey = new PubKey(genPubKey(unserialisedPrivkey.rawPrivKey))
    console.log(pubkey.serialize())
}

export { genMaciPubkey }
