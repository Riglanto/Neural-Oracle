// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";

/// @title NeuralOracle
/// @notice Converts simulated BCI signals into on-chain trust/validation scores.
///         Only the oracle agent can submit scores. Anyone can query.
contract NeuralOracle is Ownable {
    struct NeuroScore {
        uint8 confidenceScore;    // 0-100
        bytes32 bciDataHash;      // hash of raw BCI data (stored off-chain)
        uint256 timestamp;
        string tag;               // e.g. "neural-confidence", "attention-verified"
        bool exists;
    }

    // agentId => validator => score
    mapping(uint256 => mapping(address => NeuroScore)) public scores;
    // agentId => list of validators
    mapping(uint256 => address[]) public validators;
    // agentId => aggregate
    mapping(uint256 => uint256) public totalScore;
    mapping(uint256 => uint256) public scoreCount;

    event NeuroValidationSubmitted(
        uint256 indexed agentId,
        address indexed validator,
        uint8 confidenceScore,
        string tag
    );

    constructor(address _owner) Ownable(_owner) {}

    /// @notice Submit a neural confidence score for an agent validation
    function submitNeuroValidation(
        uint256 agentId,
        uint8 confidenceScore,
        bytes32 bciDataHash,
        string calldata tag
    ) external onlyOwner {
        require(confidenceScore <= 100, "Score must be 0-100");

        bool isNew = !scores[agentId][msg.sender].exists;

        // Update aggregate (subtract old if updating)
        if (!isNew) {
            totalScore[agentId] -= scores[agentId][msg.sender].confidenceScore;
        } else {
            validators[agentId].push(msg.sender);
            scoreCount[agentId]++;
        }

        scores[agentId][msg.sender] = NeuroScore({
            confidenceScore: confidenceScore,
            bciDataHash: bciDataHash,
            timestamp: block.timestamp,
            tag: tag,
            exists: true
        });

        totalScore[agentId] += confidenceScore;

        emit NeuroValidationSubmitted(agentId, msg.sender, confidenceScore, tag);
    }

    /// @notice Get neural score for a specific agent + validator
    function getNeuroScore(uint256 agentId, address validator)
        external view returns (uint8 confidenceScore, bytes32 bciDataHash, uint256 timestamp, string memory tag)
    {
        NeuroScore storage s = scores[agentId][validator];
        return (s.confidenceScore, s.bciDataHash, s.timestamp, s.tag);
    }

    /// @notice Get all validators who scored an agent
    function getValidators(uint256 agentId) external view returns (address[] memory) {
        return validators[agentId];
    }

    /// @notice Get average neural confidence for an agent
    function getAverageScore(uint256 agentId) external view returns (uint8) {
        if (scoreCount[agentId] == 0) return 0;
        return uint8(totalScore[agentId] / scoreCount[agentId]);
    }

    /// @notice Get score count for an agent
    function getScoreCount(uint256 agentId) external view returns (uint256) {
        return scoreCount[agentId];
    }
}
