// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract MockReputationRegistry {
    struct FeedbackEntry { address client; int128 value; bool revoked; }
    mapping(uint256 => FeedbackEntry[]) private _feedback;

    function giveFeedback(uint256 agentId, int128 value, uint8, string calldata, string calldata) external {
        _feedback[agentId].push(FeedbackEntry(msg.sender, value, false));
    }

    function getSummary(uint256 agentId) external view returns (int128 totalValue, uint256 feedbackCount, int128 averageValue) {
        FeedbackEntry[] storage entries = _feedback[agentId];
        for (uint256 i = 0; i < entries.length; i++) {
            if (!entries[i].revoked) { totalValue += entries[i].value; feedbackCount++; }
        }
        averageValue = feedbackCount > 0 ? totalValue / int128(int256(feedbackCount)) : int128(0);
    }
}
