# Neural Reputation Oracle - Claude Context

## What is this project?
A BCI (Brain-Computer Interface) powered trust scoring system for autonomous agent validation. It measures HOW a validator reviews an agent (attention, engagement, stress, focus, cognitive load) and converts those signals into an on-chain confidence score.

## Hackathon
- **Event**: PL_Genesis
- **Track**: Neurotechnology and Brain-Computer Interfaces

## Tech Stack
- Solidity 0.8.27 (cancun EVM) with OpenZeppelin 5.x
- Hardhat + TypeScript
- Target network: Base Sepolia

## Key Contracts (DO NOT MODIFY)
- `contracts/NeuralOracle.sol` — Core oracle. Ownable, stores NeuroScore structs per agent+validator. Functions: submitNeuroValidation, getNeuroScore, getValidators, getAverageScore, getScoreCount.
- `contracts/MockIdentityRegistry.sol` — ERC721-based agent identity. Function: register(uri) returns tokenId.
- `contracts/MockReputationRegistry.sol` — Feedback-based reputation. Function: giveFeedback, getSummary.

## Key Files (DO NOT MODIFY)
- `test/NeuralOracle.test.ts` — 10 passing tests covering all oracle functionality + integration flow.
- `agent/neural-agent.ts` — Demo agent that simulates 3 validator profiles and writes scores on-chain.

## Confidence Formula
```
score = attention * 0.30
      + engagement * 0.25
      + (100 - stress) * 0.20
      + focusNorm * 0.15
      + (100 - cognitiveLoad) * 0.10
```
Where focusNorm = min(focusDuration / 60, 1) * 100

## Classification
- HIGH: 80-100
- MEDIUM: 50-79
- LOW: 0-49

## Validator Profiles (for simulation)
- **Careful**: High attention (85-100), high engagement (80-100), low stress (5-20), long focus (35-65s), low load (20-40)
- **Rushed**: Low attention (15-40), low engagement (15-35), high stress (65-95), short focus (3-11s), high load (75-95)
- **Distracted**: Medium attention (30-70), variable engagement (25-60), medium stress (30-70), medium focus (10-30s), medium load (40-70)

## Commands
```bash
npm run compile    # Compile contracts
npm run test       # Run 10 tests
npx hardhat run agent/neural-agent.ts   # Run agent demo
```

## Architecture
```
BCI Signals -> Neural Oracle Agent -> NeuralOracle.sol -> ERC-8004 Validation Registry
```

## Documentation
- `docs/how-it-works.html` — Interactive animated visualization (open in browser)
- `docs/architecture.html` — Contract architecture explorer
- `docs/banner.svg` — Animated project banner
