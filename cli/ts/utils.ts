import * as prompt from 'prompt-async'
prompt.colors = false

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

export {
    promptPwd,
    calcTreeDepthFromMaxLeaves,
}
