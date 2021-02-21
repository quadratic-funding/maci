import * as ethers from 'ethers'
import * as shelljs from 'shelljs'
const Contract = require('web3-eth-contract')
import { MaciState } from 'maci-core'
import {
    PubKey,
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

const maciSkFile = 'MACI_SK.SECRET'
const maciSkSerialised = fs.readFileSync(maciSkFile).toString().trim()
const coordinatorKeypair = new Keypair(
    PrivKey.unserialize(maciSkSerialised)
)

const [ MaciAbi, ] = loadAB('MACI')

const SIGNUP_DATA_FILE = 'signupData.json'
const PUBLISH_MESSAGE_DATA_FILE = 'publishMessageData.json'
const ETH_PRIVKEY = '0xc87509a1c067bbde78beb793e6fa76530b6382a4c0241e5e4a9ec0a0f44dc0d3'
const LOCAL_RPC = 'http://localhost:8545'

const replaySignupsAndMessages = async () => {
    const provider = new ethers.providers.JsonRpcProvider(LOCAL_RPC)
    const wallet = new ethers.Wallet(ETH_PRIVKEY, provider)

    const signUpData = JSON.parse(fs.readFileSync(SIGNUP_DATA_FILE).toString())
    const publishMessageData = JSON.parse(fs.readFileSync(PUBLISH_MESSAGE_DATA_FILE).toString())

    const maciState = new MaciState(
        coordinatorKeypair,
        BigInt(8),
        BigInt(11),
        BigInt(3),
        BigInt(125),
    )

    const createCmd = `node build/index.js create ` +
        `-d ${ETH_PRIVKEY} ` +
        `-sk ${maciSkSerialised} ` +
        `-e ${LOCAL_RPC} ` +
        `-u 255 ` +
        `-m 2048 ` +
        `-v 125 ` +
        `-s 180 ` +
        `-o 0`
    const createOutput = shelljs.exec(createCmd)
    const regMatch = createOutput.stdout.match(/MACI: (0x[a-fA-F0-9]{40})/)
    const maciAddress = regMatch[1]

    const maciContract = new ethers.Contract(
        maciAddress,
        MaciAbi,
        wallet,
    )

    for (const d of signUpData) {
        const pubKey = new PubKey([
            BigInt(d[0]),
            BigInt(d[1]),
        ])
        const tx = await maciContract.signUp(
            pubKey.asContractParam(),
            d[2].toString(),
            { gasLimit: 1000000 }
        )

        await tx.wait()

        maciState.signUp(pubKey, BigInt(d[2]))
    }

    //// Check state root
    //const onChainStateRoot = await maciContract.getStateTreeRoot()
    //console.log(onChainStateRoot.toString())
    //console.log(maciState.genStateRoot())
    //return

    for (const p of publishMessageData) {
        const message = new Message(
            p[0],
            p.slice(1, 11),
        )

        const encPubKey = new PubKey(
            p.slice(11).map((x) => BigInt(x))
        )
        const tx = await maciContract.publishMessage(
            message.asContractParam(),
            encPubKey.asContractParam(),
            { gasLimit: 1000000 }
        )
        await tx.wait()
        maciState.publishMessage(message, encPubKey)
    }

    const processCmd = `node build/index.js process ` +
        `-d ${ETH_PRIVKEY} ` +
        `-sk ${maciSkSerialised} ` +
        `-e ${LOCAL_RPC} ` +
        `-x ${maciAddress} ` +
        `-r`
    //shelljs.exec(processCmd)
    console.log(processCmd)
}

const fetchProcessTally = async () => {
    const provider = new ethers.providers.JsonRpcProvider(rpcUrl)
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

    // Save signup data
    const signUpData = maciState.users.map((x) => [
        ...x.pubKey.asArray().map((x) => x.toString()),
        x.voiceCreditBalance.toString(),
    ])

    // Save message data
    const publishMessageData: string[][] = []
    for (let i = 0; i < maciState.messages.length; i ++) {
        publishMessageData.push([
            ...maciState.messages[i].asArray().map((x) => x.toString()),
            ...maciState.encPubKeys[i].asArray().map((x) => x.toString()),
        ])
    }

    fs.writeFileSync(SIGNUP_DATA_FILE, JSON.stringify(signUpData))
    fs.writeFileSync(PUBLISH_MESSAGE_DATA_FILE, JSON.stringify(publishMessageData))


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

    console.log(14512064, BigInt(stateRootA).toString())
    console.log(14519824, BigInt(stateRootB).toString())
    console.log(14521379, BigInt(stateRootC).toString())
    console.log(14522089, BigInt(stateRootD).toString())
}

if (require.main === module) {
    //fetchProcessTally()
    //printStateRoots()
    replaySignupsAndMessages()
}

