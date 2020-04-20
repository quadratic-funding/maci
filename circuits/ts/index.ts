import * as fs from 'fs'
import * as path from 'path'
import { Circuit } from 'snarkjs'
const compiler = require('circom')

import {
    SnarkProvingKey,
    SnarkVerifyingKey,
    parseVerifyingKeyJson,
} from 'libsemaphore'

import {
    hash,
    SnarkBigInt,
    stringifyBigInts,
    IncrementalMerkleTree,
} from 'maci-crypto'

import {
    Keypair,
    PubKey,
    Message,
    StateLeaf,
} from 'maci-domainobjs'

import {
    genNewResultsCommitment,
    genResultCommitmentVerifierCircuitInputs,
} from 'maci-core'

const compileAndLoadCircuit = async (
    circuitFilename: string
) => {
    const circuitDef = await compiler(path.join(
        __dirname,
        'circuits',
        `../../circom/test/${circuitFilename}`,
    ))
    return new Circuit(circuitDef)
}

const loadPk = (binName: string): SnarkProvingKey => {
    const p = path.join(__dirname, '../circuits/build/' + binName + '.bin')
    return fs.readFileSync(p)
}

const loadVk = (jsonName: string): SnarkVerifyingKey => {
    const p = path.join(__dirname, '../circuits/build/' + jsonName + '.json')
    return parseVerifyingKeyJson(fs.readFileSync(p).toString())
}

export {
    compileAndLoadCircuit,
    loadPk,
    loadVk,
}
