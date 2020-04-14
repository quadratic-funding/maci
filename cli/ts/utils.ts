import * as prompt from 'prompt-async'
prompt.colors = false

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

export { promptPwd }
