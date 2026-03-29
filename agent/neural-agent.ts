/**
 * Neural Reputation Oracle Agent
 *
 * Processes simulated BCI signals → on-chain trust scores.
 * Measures HOW a validator reviewed an agent (attention, engagement, stress)
 * and converts that into a confidence score.
 *
 * Usage: npx hardhat run agent/neural-agent.ts
 */

import { ethers } from "hardhat";

interface BCISignals {
  attention: number;      // 0-100
  engagement: number;     // 0-100
  stress: number;         // 0-100
  focusDuration: number;  // seconds
  cognitiveLoad: number;  // 0-100
}

interface NeuroResult {
  score: number;
  classification: "HIGH" | "MEDIUM" | "LOW";
  signals: BCISignals;
}

const log: any[] = [];
function L(phase: string, msg: string) {
  const icons: Record<string, string> = {
    bootstrap: "🏗️  BOOT    ",
    ingest:    "📡 INGEST  ",
    analyze:   "🧠 ANALYZE ",
    classify:  "🏷️  CLASS  ",
    write:     "📝 WRITE   ",
    alert:     "⚠️  ALERT  ",
    info:      "ℹ️  INFO   ",
    summary:   "📋 SUMMARY ",
  };
  log.push({ timestamp: new Date().toISOString(), phase, message: msg });
  console.log(`${icons[phase] || phase.padEnd(11)} ${msg}`);
}

// ── BCI SIGNAL SIMULATOR ──

function simulateBCI(profile: "careful" | "rushed" | "distracted"): BCISignals {
  const r = () => Math.random();
  if (profile === "careful") {
    return { attention: 85 + r()*15, engagement: 80 + r()*20, stress: 5 + r()*15, focusDuration: 35 + r()*30, cognitiveLoad: 20 + r()*20 };
  } else if (profile === "rushed") {
    return { attention: 15 + r()*25, engagement: 15 + r()*20, stress: 65 + r()*30, focusDuration: 3 + r()*8, cognitiveLoad: 75 + r()*20 };
  } else {
    return { attention: 30 + r()*40, engagement: 25 + r()*35, stress: 30 + r()*40, focusDuration: 10 + r()*20, cognitiveLoad: 40 + r()*30 };
  }
}

// ── CONFIDENCE COMPUTATION ──

function computeConfidence(signals: BCISignals): NeuroResult {
  const { attention, engagement, stress, focusDuration, cognitiveLoad } = signals;
  const focusNorm = Math.min(focusDuration / 60, 1) * 100;

  const score = Math.round(
    attention * 0.30 +
    engagement * 0.25 +
    (100 - stress) * 0.20 +
    focusNorm * 0.15 +
    (100 - cognitiveLoad) * 0.10
  );

  const clamped = Math.max(0, Math.min(100, score));
  const classification = clamped >= 80 ? "HIGH" : clamped >= 50 ? "MEDIUM" : "LOW";

  return { score: clamped, classification, signals };
}

// ── MAIN ──

async function main() {
  console.log(`
╔══════════════════════════════════════════════════════════╗
║       NEURAL REPUTATION ORACLE                          ║
║       BCI signals → on-chain trust scores               ║
║       ingest → analyze → classify → write               ║
╚══════════════════════════════════════════════════════════╝
  `);

  const [deployer, agent1Owner, agent2Owner, agent3Owner] = await ethers.getSigners();

  L("info", "Deploying contracts...");
  const identity = await (await ethers.getContractFactory("MockIdentityRegistry")).deploy();
  const reputation = await (await ethers.getContractFactory("MockReputationRegistry")).deploy();
  const oracle = await (await ethers.getContractFactory("NeuralOracle")).deploy(deployer.address);

  L("info", `Identity: ${await identity.getAddress()}`);
  L("info", `Reputation: ${await reputation.getAddress()}`);
  L("info", `Oracle: ${await oracle.getAddress()}`);

  // ── Bootstrap: Oracle registers itself ──
  L("bootstrap", "Oracle agent registering on-chain identity...");
  await identity.register("data:application/json," + encodeURIComponent(JSON.stringify({
    name: "Neural Reputation Oracle",
    type: "neural-oracle",
    capabilities: ["bci-processing", "confidence-scoring", "validation"],
  })));
  L("bootstrap", "Registered as Agent #0");

  // ── Register test agents ──
  console.log("\n" + "─".repeat(60));
  L("info", "Registering test agents...\n");

  await identity.connect(agent1Owner).register("ipfs://QmAgent1");
  await reputation.connect(deployer).giveFeedback(1, 90, 0, "quality", "");
  L("info", "Agent #1 registered (will be reviewed carefully)");

  await identity.connect(agent2Owner).register("ipfs://QmAgent2");
  await reputation.connect(deployer).giveFeedback(2, 75, 0, "quality", "");
  L("info", "Agent #2 registered (will be reviewed hastily)");

  await identity.connect(agent3Owner).register("ipfs://QmAgent3");
  await reputation.connect(deployer).giveFeedback(3, 60, 0, "quality", "");
  L("info", "Agent #3 registered (will be reviewed distractedly)");

  // ── Process validations ──
  const validations: { agentId: number; profile: "careful" | "rushed" | "distracted"; validator: string }[] = [
    { agentId: 1, profile: "careful", validator: "Validator Alice" },
    { agentId: 2, profile: "rushed", validator: "Validator Bob" },
    { agentId: 3, profile: "distracted", validator: "Validator Charlie" },
  ];

  for (const v of validations) {
    console.log("\n" + "═".repeat(60));
    L("ingest", `${v.validator} reviewing Agent #${v.agentId} (${v.profile} reviewer)`);

    // Simulate BCI
    const signals = simulateBCI(v.profile);
    L("ingest", `Signals: attention=${signals.attention.toFixed(0)}, engagement=${signals.engagement.toFixed(0)}, stress=${signals.stress.toFixed(0)}, focus=${signals.focusDuration.toFixed(0)}s, load=${signals.cognitiveLoad.toFixed(0)}`);

    // Compute confidence
    const result = computeConfidence(signals);
    L("analyze", `Confidence = att×0.3 + eng×0.25 + (100-stress)×0.2 + focus×0.15 + (100-load)×0.1`);
    L("analyze", `Score: ${result.score}/100`);

    // Classify
    L("classify", `${result.classification} CONFIDENCE — validator was ${v.profile}`);

    if (result.classification === "LOW") {
      L("alert", `LOW confidence validation flagged — Agent #${v.agentId}'s review may be unreliable`);
    }

    // Write on-chain
    const bciHash = ethers.keccak256(ethers.toUtf8Bytes(
      `attention:${signals.attention.toFixed(0)},engagement:${signals.engagement.toFixed(0)},stress:${signals.stress.toFixed(0)}`
    ));
    await oracle.submitNeuroValidation(v.agentId, result.score, bciHash, "neural-confidence");
    L("write", `Score ${result.score} written to NeuralOracle for Agent #${v.agentId}`);
  }

  // ── Summary ──
  console.log("\n" + "═".repeat(60));
  L("summary", "Neural Oracle Results:");
  for (const v of validations) {
    const avg = await oracle.getAverageScore(v.agentId);
    const count = await oracle.getScoreCount(v.agentId);
    L("summary", `  Agent #${v.agentId}: avg=${avg}, validations=${count}`);
  }

  console.log(`\n📝 Log entries: ${log.length}`);
  console.log("═".repeat(60));
}

main().catch(console.error);
