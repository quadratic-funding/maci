import {
    PubKey,
    PrivKey,
} from 'maci-domainobjs'

import { genPubKey } from 'maci-crypto'

import { exec } from './utils'

describe('genMaciKeypair CLI subcommand', () => {
    it('genMaciKeypair should output a random private key and public key', async () => {
        const command = 'node ../cli/build/index.js genMaciKeypair'
        const output = exec(command).stdout
        const output2 = exec(command).stdout

        const lines = output.split('\n')
        const lines2 = output2.split('\n')

        // Invoking the same command twice should result in different private
        // keys
        expect(lines[0]).not.toEqual(lines2[0])

        const sk = PrivKey.unserialize(lines[0].split(' ')[2])
        expect(sk instanceof PrivKey).toBeTruthy()

        const pk = PubKey.unserialize(lines[1].split(' ')[3])
        expect(pk instanceof PubKey).toBeTruthy()

        const pk2 = genPubKey(sk.rawPrivKey)
        expect(pk.rawPubKey[0].toString()).toEqual(pk2[0].toString())
        expect(pk.rawPubKey[1].toString()).toEqual(pk2[1].toString())
        debugger
    })

    it('genMaciKeypair with -p should output a deterministic private key and public key', async () => {
        const passphrase = '01234567890123456789012345678901'
        const command = 'node ../cli/build/index.js genMaciKeypair -p ' + passphrase
        const output = exec(command).stdout
        const output2 = exec(command).stdout

        expect(output).toEqual(output2)

        const lines = output.split('\n')
        const sk = PrivKey.unserialize(lines[0].split(' ')[2])
        expect(sk instanceof PrivKey).toBeTruthy()

        expect(sk.rawPrivKey.toString(16)).toEqual('13b39ce311c9e463c833355f2ec8964cf83be4dbb480f2e6326494700c252c55')
    })
})
