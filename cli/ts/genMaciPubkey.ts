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
    const privkey = args.privkey

    const unserialisedPrivkey = PrivKey.unserialize(args.privkey)
    const pubkey = new PubKey(genPubKey(unserialisedPrivkey.rawPrivKey))
    console.log(pubkey.serialize())
}

export { genMaciPubkey }
