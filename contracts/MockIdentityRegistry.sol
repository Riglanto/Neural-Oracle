// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {ERC721} from "@openzeppelin/contracts/token/ERC721/ERC721.sol";

contract MockIdentityRegistry is ERC721 {
    uint256 private _nextTokenId;
    mapping(uint256 => string) private _uris;

    constructor() ERC721("Agent Identity", "AGENT") {}

    function register(string calldata uri) external returns (uint256) {
        uint256 id = _nextTokenId++;
        _mint(msg.sender, id);
        _uris[id] = uri;
        return id;
    }

    function tokenURI(uint256 tokenId) public view override returns (string memory) {
        _requireOwned(tokenId);
        return _uris[tokenId];
    }
}
