import * as ethers from 'ethers'
import * as prompt from 'prompt-async'

prompt.colors = false
prompt.message = ''

import {
    genJsonRpcDeployer,
} from 'maci-contracts'

const calcTreeDepthFromMaxLeaves = (maxLeaves: number) => {
    return Math.ceil(Math.log(maxLeaves) / Math.log(2))
}

const promptPwd = async (name: string) => {
    prompt.start()
    const input = await prompt.get([
        {
            name,
            hidden: true,
        }
    ])

    return input[name]
}

const checkDeployerProviderConnection = async (
    sk: string,
    ethProvider: string,
) => {

    const deployer = genJsonRpcDeployer(sk, ethProvider)
    try {
        await deployer.provider.getBlockNumber()
    } catch {
        return false
    }

    return true
}

const checkEthSk = (sk: string): boolean => {
    try {
        new ethers.Wallet(sk)
    } catch {
        return false
    }
    return true
}

export {
    promptPwd,
    calcTreeDepthFromMaxLeaves,
    checkEthSk,
    checkDeployerProviderConnection
}
