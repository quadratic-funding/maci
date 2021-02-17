import * as ethers from 'ethers'
const web3 = require('web3')
const Contract = require('web3-eth-contract')
import {
    PrivKey,
    Keypair,
    Command,
    Message,
} from 'maci-domainobjs'
import { 
    loadAB,
} from 'maci-contracts'
import * as fs from 'fs'
import {
    genMaciStateFromContractSignUpsAndVotesOnly,
} from './utils'

const maciContractAddress = '0xF334d4E7d44Be5cb2C8f1aeb99e1D712fFd76a2A'
//const rpcUrl = 'https://patient-icy-lake.xdai.quiknode.pro/98e992a05ad98b7a68505e229a795985b2cb1283/'
const rpcUrl = 'https://xdai-archive.blockscout.com/'
const provider = new ethers.providers.JsonRpcProvider(rpcUrl)

const maciSkFile = 'MACI_SK.SECRET'
const maciSkSerialised = fs.readFileSync(maciSkFile).toString()
const coordinatorKeypair = new Keypair(
    PrivKey.unserialize(maciSkSerialised)
)

const [ MaciAbi, ] = loadAB('MACI')

const main = async () => {
    const maciContract = new ethers.Contract(
        maciContractAddress,
        MaciAbi,
        provider,
    )
    const { maciState, messageBlockNums } = await genMaciStateFromContractSignUpsAndVotesOnly(
        provider,
        maciContractAddress,
        coordinatorKeypair,
    )

    const commands: Command[] = []
    let i = 0
    for (const message of maciState.messages) {
        const encPubKey = maciState.encPubKeys[i]
        const sharedKey = Keypair.genEcdhSharedKey(coordinatorKeypair.privKey, encPubKey)
        const { command, signature } = Command.decrypt(message, sharedKey)

        commands.push(command)

        i ++
    }

    const CUTOFF_BLOCK_NUM = 14517369

    let numMessagesToIgnore = 0

    const data: number[][] = []
    for (let i = 0; i < commands.length; i ++) {
        if (messageBlockNums[i] < CUTOFF_BLOCK_NUM) {
            numMessagesToIgnore ++
        }

        const d = [
            Number(messageBlockNums[i]),
            Number(commands[i].stateIndex),
            Number(commands[i].voteOptionIndex),
            Number(commands[i].newVoteWeight),
            Number(commands[i].nonce),
        ]
        data.push(d)
    }


    let csv = 'Block,State Index, Vote Option, New Vote Weight, Nonce\n'
    for (const row of data) {
        csv += `${row.join(',')}\n`
    }
    fs.writeFileSync('data.csv', csv)

    // process messsages
    for (let i = commands.length - 1; i > numMessagesToIgnore; i --) {
        maciState.processMessage(i)
    }

    const tally = maciState.computeCumulativeVoteTally(
        maciState.users.length
    )
    fs.writeFileSync('tally.json', JSON.stringify(tally.map((x) => Number(x))))

    const voTally = maciState.computeCumulativePerVOSpentVoiceCredits(
        maciState.users.length
    )
    fs.writeFileSync('voTally.json', JSON.stringify(voTally.map((x) => Number(x))))
}

const printStateRoots = async () => {
    const maciContract = new Contract(MaciAbi, maciContractAddress)
    maciContract.setProvider(rpcUrl)

    // calcSignUpDeadline
    const signupDeadline = await maciContract.methods.calcSignUpDeadline().call()
    console.log('signupDeadline', signupDeadline.toString())

    // calcVotingDeadline
    const votingDeadline = await maciContract.methods.calcVotingDeadline().call()
    console.log('votingDeadline', votingDeadline.toString())

    // The first tx
    const stateRootA = await maciContract.methods.stateRoot().call(14512064)

    // 2nd
    const stateRootB = await maciContract.methods.stateRoot().call(14519824)

    // 3rd
    const stateRootC = await maciContract.methods.stateRoot().call(14521379)

    // 4th (successful)
    const stateRootD = await maciContract.methods.stateRoot().call(14522089)

    console.log(14512064, BigInt(stateRootA).toString(16))
    console.log(14519824, BigInt(stateRootB).toString(16))
    console.log(14521379, BigInt(stateRootC).toString(16))
    console.log(14522089, BigInt(stateRootD).toString(16))
}

if (require.main === module) {
    main()
    //printStateRoots()
}

