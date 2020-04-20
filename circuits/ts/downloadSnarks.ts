import * as shell from 'shelljs'
import * as path from 'path'

const main = async () => {
    const files = [
        {
            name: 'BatchUpdateStateTreeVerifier.sol',
            url: 'https://www.dropbox.com/s/hkfmr7u1sc2or7a/BatchUpdateStateTreeVerifier.sol?dl=1',
        },
        {
            name: 'batchUstCircuit.json',
            url: 'https://www.dropbox.com/s/h9vn7mhdcxyduyx/batchUstCircuit.json?dl=1',
        },
        {
            name: 'batchUstPk.bin',
            url: 'https://www.dropbox.com/s/pp6fd7x8sxnb1h2/batchUstPk.bin?dl=1',
        },
        {
            name: 'batchUstVk.json',
            url: 'https://www.dropbox.com/s/nuftxf0tcezgx41/batchUstVk.json?dl=1',
        },
        {
            name: 'QuadVoteTallyVerifier.sol',
            url: 'https://www.dropbox.com/s/q2zi1my58pgp8ea/QuadVoteTallyVerifier.sol?dl=1',
        },
        {
            name: 'qvtCircuit.json',
            url: 'https://www.dropbox.com/s/ic4y5mzlmcvmcbr/qvtCircuit.json?dl=1',
        },
        {
            name: 'qvtPk.bin',
            url: 'https://www.dropbox.com/s/zltmeh0d1m4fu6h/qvtPk.bin?dl=1',
        },
        {
            name: 'qvtVk.json',
            url: 'https://www.dropbox.com/s/b3r6459ih2hfw54/qvtVk.json?dl=1',
        },
    ]

	for (let i = 0; i < files.length; i++) {
        const file = files[i]
        const filePath = path.join(__dirname, file.name)
        const cmd = `wget -nc --quiet ${file.url} -O ${filePath}`

        console.log('Downloading', file.name)
        await shell.exec(cmd)
	}
}

if (require.main === module) {
    try {
        main()
    } catch (err) {
        console.error(err)
    }
}
