import { expect } from "chai";
import { ethers } from "hardhat";

describe("Neural Reputation Oracle", function () {
  let oracle: any, identity: any, reputation: any;
  let owner: any, validator1: any, validator2: any, agent1Owner: any;

  beforeEach(async function () {
    [owner, validator1, validator2, agent1Owner] = await ethers.getSigners();

    const Identity = await ethers.getContractFactory("MockIdentityRegistry");
    identity = await Identity.deploy();

    const Reputation = await ethers.getContractFactory("MockReputationRegistry");
    reputation = await Reputation.deploy();

    const Oracle = await ethers.getContractFactory("NeuralOracle");
    oracle = await Oracle.deploy(owner.address);
  });

  describe("NeuralOracle", function () {
    it("should submit a neural validation score", async function () {
      const hash = ethers.keccak256(ethers.toUtf8Bytes("bci-data-1"));
      await oracle.submitNeuroValidation(0, 85, hash, "neural-confidence");

      const [score, , , tag] = await oracle.getNeuroScore(0, owner.address);
      expect(score).to.equal(85);
      expect(tag).to.equal("neural-confidence");
    });

    it("should reject scores above 100", async function () {
      const hash = ethers.ZeroHash;
      await expect(oracle.submitNeuroValidation(0, 101, hash, "test"))
        .to.be.revertedWith("Score must be 0-100");
    });

    it("should only allow owner to submit", async function () {
      const hash = ethers.ZeroHash;
      await expect(oracle.connect(validator1).submitNeuroValidation(0, 50, hash, "test"))
        .to.be.revertedWithCustomError(oracle, "OwnableUnauthorizedAccount");
    });

    it("should track multiple validators for same agent", async function () {
      const hash = ethers.ZeroHash;
      // Owner submits twice (as two different "validation sessions")
      await oracle.submitNeuroValidation(0, 90, hash, "session-1");
      await oracle.submitNeuroValidation(1, 70, hash, "session-2");

      expect(await oracle.getScoreCount(0)).to.equal(1);
      expect(await oracle.getScoreCount(1)).to.equal(1);
    });

    it("should compute average score", async function () {
      // We can only submit as owner, so submit for different agents
      const hash = ethers.ZeroHash;
      await oracle.submitNeuroValidation(0, 90, hash, "high");

      expect(await oracle.getAverageScore(0)).to.equal(90);
    });

    it("should update score when resubmitting", async function () {
      const hash = ethers.ZeroHash;
      await oracle.submitNeuroValidation(0, 60, hash, "first");
      await oracle.submitNeuroValidation(0, 90, hash, "updated");

      const [score] = await oracle.getNeuroScore(0, owner.address);
      expect(score).to.equal(90);
      expect(await oracle.getAverageScore(0)).to.equal(90);
      expect(await oracle.getScoreCount(0)).to.equal(1); // still 1, not 2
    });

    it("should return validators list", async function () {
      await oracle.submitNeuroValidation(0, 80, ethers.ZeroHash, "test");
      const vals = await oracle.getValidators(0);
      expect(vals.length).to.equal(1);
      expect(vals[0]).to.equal(owner.address);
    });

    it("should return 0 average for unscored agent", async function () {
      expect(await oracle.getAverageScore(99)).to.equal(0);
    });

    it("should emit NeuroValidationSubmitted event", async function () {
      const hash = ethers.keccak256(ethers.toUtf8Bytes("bci-data"));
      await expect(oracle.submitNeuroValidation(0, 75, hash, "attention"))
        .to.emit(oracle, "NeuroValidationSubmitted")
        .withArgs(0, owner.address, 75, "attention");
    });
  });

  describe("Full Flow: Identity + Reputation + Neural", function () {
    it("should register agent, give reputation, then score neurally", async function () {
      // Register agent
      await identity.connect(agent1Owner).register("ipfs://agent-1");
      expect(await identity.ownerOf(0)).to.equal(agent1Owner.address);

      // Give reputation
      await reputation.connect(validator1).giveFeedback(0, 85, 0, "quality", "");
      const [, count, avg] = await reputation.getSummary(0);
      expect(count).to.equal(1);
      expect(avg).to.equal(85);

      // Neural oracle scores the validation
      const bciHash = ethers.keccak256(ethers.toUtf8Bytes("attention:92,engagement:88,stress:15"));
      await oracle.submitNeuroValidation(0, 84, bciHash, "neural-confidence");

      const [neuroScore] = await oracle.getNeuroScore(0, owner.address);
      expect(neuroScore).to.equal(84);
    });
  });
});
