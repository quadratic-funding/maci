# maci-cli

## Public and private key format

MACI uses private keys in the BabyJub field for operations which occur within
zk-SNARKs, such as decrypting messages or signing commands. As MACI is deployed
on Ethereum, we seek to avoid confusing BabyJub private keys with Ethereum
private keys. To that end, users should pass serialized formats of public and
private keys to this CLI. We use `maci-domainobj`'s `PrivKey.serialize` and
`PubKey.serialize` functions to do so. 

Examples of serialized public and private keys:

```
Private key: macisk.e11e7e8870b6b3472e04a1ed703306ffbc9fd4ae78eff0c8b6cb552d467ef3f
Public key:  macipk.483e37f5f4a11713d1a9c9df79fc7195f0e1e303e1d3bb823822e1930e1b2aa7
```

## User stories

| Role | Action |
|-|-|
| Coordinator | Create election |
| Coordinator | Process, tally and prove outcome |
| User | Generate MACI keypair |
| User | Sign up |
| User | Change key / vote |

### Coordinator: Create election

This command deploys an instance of a MACI contract.

Fields that the coordinator has to set:

`maci-cli create <options>`

Example usage:

```
$ node build/index.js create -sk macisk.23d007423d56475d7e39dcd5053c5aa98f57a69ee85bc7813ccbf4c5e688307  -d 0xc87509a1c067bbde78beb793e6fa76530b6382a4c0241e5e4a9ec0a0f44dc0d3 -u 32768 -m 32768
```

Example output:

```
MACI: 0xE28158eCFde143e2536761c3254C7C31efd97271
```

| Option | Flags | About |
|-|-|-|
| Ethereum provider | `-e` or `--eth-provider` | A connection string to an Ethereum provider. Default: `http://localhost:8545` |
| Coordinator's MACI private key | `-sk` or `--privkey` | A serialized MACI private key. This is *not* an Ethereum private key. Its big-endian value must be below the snark field size. |
| Prompt for the coordinator's MACI private key | `-dsk` or `--prompt-for-maci-privkey` | If specified, ignores `-sk / --privkey` and prompts the user to input the coordinator's MACI private key |
| Deployer's Ethereum private key | `-d` or `--deployer-privkey` | A private key of the Ethereum account to use to deploy the MACI contract |
| Prompt for the deployer's Ethereum private key | `-dp` or `--prompt-for-deployer-privkey` | If specified, ignores `-d / --deployer-privkey` and prompts the user to input the deployer's Ethereum private key |
| Maximum number of users | `-u` or `--max-users` | Default: 15 |
| Maximum number of messages | `-m` or `--max-messages` | Default: 15 |
| Maximum number of vote options | `-v` or `--max-vote-options` | Default: 3 |
| Sign-up duration | `-s` or `--signup-duration` | The sign-up duration, in seconds. Default: 3600. |
| Voting duration | `-o` or `--voting-duration` | The voting duration, in seconds. Default: 3600. |
| Vote option label file | `-f` or `--label-file` | Default: `./voteOptionLabels.txt` |
| Initial voice credits | `-c` or `--initial-voice-credits` | Default: 100 |
| Initial voice credit proxy contract | `-i` or `--initial-vc-proxy` | If specified, deploys the MACI contract with this address as the initial voice credit proxy constructor argument. Otherwise, deploys a ConstantInitialVoiceCreditProxy contract with the above-specified value. |
| Signup gatekeeper contract | `-g` or `--signup-gatekeeper` | If specified, deploys the MACI contract with this address as the signup gatekeeper constructor argument. Otherwise, deploys a gatekeeper contract which allows any address to sign up. | 
| Batch size for processing messages | `-bm` or `--message-batch-size` | Default: 4 |
| Batch size for tallying votes | `-bv` or `--tally-batch-size` | Default: 4 |

### Process, tally and prove outcome

These three commands share the same option flags.

`maci-cli process <options>`

`maci-cli tally <options>`

`maci-cli prove <options>`

Fields that the coordinator has to set:

| Option | Flags | About |
|-|-|-|
| Ethereum provider | `-e` or `--eth-provider` | A connection string to the Ethereum provider. Default: `http://localhost:8545` |
| MACI contract address | `-x` or `--contract` | The address of the deployed MACI contract |
| Coordinator's MACI private key | `-sk` or `--privkey` | See above |
| Coordinator's Ethereum private key | `-d` or `--eth-privkey` | A private key of the Ethereum account to use to perform the transaction |
| Prompt for the coordinator's Ethereum private key | `-dp` or `--prompt-for-eth-privkey` | If specified, ignores `-d / --eth-privkey` and prompts the user to input the coordinator's Ethereum private key |

As message processing and vote tallying occurs in batches, this command should
automatically resume a job halfway done.

### User: Generate MACI keypair

`maci-cli genMaciKeypair <options>`

| Option | Flags | About |
|-|-|-|
| Passphrase | `-p` or `--passphrase` | If unspecified, this command will randomly generate a private key and its associated public key |

The output of this command is a serialised private key and serialised
public key.

If a passphrase is specified, this command will apply a cryptographic
key-stretching algorithm to it and produce a private key. For security
reasons, the passphrase must be at least 32 characters long.

### User: Generate MACI public key

`maci-cli genMaciPubkey <options>`

| Option | Flags | About |
|-|-|-|
| Passphrase | `-sk` or `--privKey` | A serialised private key |

The output of this command is a serialised public key derived from the given private key.

### User: Sign up

`maci-cli signup <options>`

Fields that the coordinator has to set:

| Option | Flags | About |
|-|-|-|
| Ethereum provider | `-e` or `--eth-provider` | A connection string to the Ethereum provider. Default: `http://localhost:8545` |
| MACI contract address | `-x` or `--contract` | The address of the deployed MACI contract |
| The user's MACI public key | `-p` or `--pubkey` | This should not be an Ethereum public key. Instead, it should be the user's serialised BabyJub public key (where the x and y values have been concatenated. |
| User's Ethereum private key | `-d` or `--eth-privkey` | A private key of the Ethereum account to use to sign up |
| Prompt for the user's Ethereum private key | `-dp` or `--prompt-for-eth-privkey` | If specified, ignores `-d / --eth-privkey` and prompts the user to input their Ethereum private key |

### User: Change key / vote

`maci-cli publish <options>`

| Option | Flags | About |
|-|-|-|
| Ethereum provider | `-e` or `--eth-provider` | A connection string to the Ethereum provider. Default: `http://localhost:8545` |
| MACI contract address | `-x` or `--contract` | The address of the deployed MACI contract |
| The user's MACI private key | `-sk` or `--pubkey` | This should not be an Ethereum private key |
| User's Ethereum private key | `-d` or `--eth-privkey` | A private key of the Ethereum account to use to perform the transaction |
| Prompt for the user's Ethereum private key | `-dp` or `--prompt-for-eth-privkey` | If specified, ignores `-d / --eth-privkey` and prompts the user to input their Ethereum private key |
| State index | `-i` or `--state-index` | The state index of the user |
| The user's new or current MACI public key | `-p` or `--pubkey` | This should be a serialised BabyJub public key |
| Vote option index | `-v` or `--vote-option-index` | The index of the option to vote for |
| New vote weight | `-w` or `--new-vote-weight` | The vote weight to assign to said vote option |
| Nonce | `-n` or `--nonce` | The nonce of the message |
| Salt | `-s` or `--salt` | The salt of the message. If unspecified, this command will randomly generate a salt |
