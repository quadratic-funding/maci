# maci-cli

## Public and private key format

MACI uses private keys in the BabyJub field for operations which occur within
zk-SNARKs, such as decrypting messages or signing commands. As MACI is deployed
on Ethereum, we seek to avoid confusing BabyJub private keys with Ethereum
private keys. To that end, users should pass serialized formats of public and
private keys to this CLI. We use `maci-domainobj`'s `PrivKey.serialize` and
`PubKey.serialize` functions to do so. 

## User stories

| Role | Action |
|-|-|
| Coordinator | Create election |
| Coordinator | Process, tally and prove outcome |
| User | Generate MACI keypair |
| User | Sign up |
| User | Change key / vote |

### Coordinator: Create election

Fields that the coordinator has to set:

`maci-cli create <options>`

| Option | Flags | About |
|-|-|-|
| Ethereum provider | `-e` or `--eth-provider` | A connection string to the Ethereum provider. Default: `http://localhost:8545` |
| Coordinator's MACI private key | `-sk` or `--privkey` | A hex value starting with `0x`. This is *not* an Ethereum private key. Its big-endian value must be below the snark field size. |
| Maximum number of users | `-u` or `--max-users` | Default: |
| Maximum number of messages | `-m` or `--max-messages` | Default: |
| Maximum number of vote options | `-v` or `--max-vote-options` | Default: |
| Sign-up duration | `-s` or `--signup-duration` | Default: |
| Voting duration | `-o` or `--voting-duration` | Default: |
| Initial voice credits | `-c` or `--initial-voice-creidts` | Default: 100 |
| Vote option label file | `-f` or `--label-file` | Default: `./voteOptionLabels.txt` |

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

### User: Change key / vote

`maci-cli publish <options>`

| Option | Flags | About |
|-|-|-|
| Ethereum provider | `-e` or `--eth-provider` | A connection string to the Ethereum provider. Default: `http://localhost:8545` |
| MACI contract address | `-x` or `--contract` | The address of the deployed MACI contract |
| The user's MACI private key | `-sk` or `--pubkey` | This should not be an Ethereum private key |
| State index | `-i` or `--state-index` | The state index of the user |
| The user's new or current MACI public key | `-p` or `--pubkey` | This should be a serialised BabyJub public key |
| Vote option index | `-v` or `--vote-option-index` | The index of the option to vote for |
| New vote weight | `-w` or `--new-vote-weight` | The vote weight to assign to said vote option |
| Nonce | `-n` or `--nonce` | The nonce of the message |
| Salt | `-s` or `--salt` | The salt of the message. If unspecified, this command will randomly generate a salt |
