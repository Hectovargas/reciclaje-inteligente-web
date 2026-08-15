// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import {ERC20Burnable} from "@openzeppelin/contracts/token/ERC20/extensions/ERC20Burnable.sol";
import {ERC20Pausable} from "@openzeppelin/contracts/token/ERC20/extensions/ERC20Pausable.sol";
import {AccessControl} from "@openzeppelin/contracts/access/AccessControl.sol";

/**
 * @title RecompensasReciclaje
 * @dev ERC-20 token for the CleanCity intelligent recycling reward platform.
 * Supports restricted single and batch minting for gas efficiency,
 * burning by token holders, pausing for emergency security, and
 * role-based access control (AccessControl).
 */
contract RecompensasReciclaje is ERC20, ERC20Burnable, ERC20Pausable, AccessControl {
    /// @dev Role identifier for addresses allowed to mint new tokens.
    bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");

    /// @dev Role identifier for addresses allowed to pause and unpause the contract.
    bytes32 public constant PAUSER_ROLE = keccak256("PAUSER_ROLE");

    /// @dev Counter for tracking sequential batch mint operations.
    uint256 public currentBatchId;

    // Custom errors for gas efficiency and clear reverts
    error ArrayLengthMismatch(uint256 recipientsLength, uint256 amountsLength);
    error EmptyBatch();
    error ZeroAddressRecipient(uint256 index);

    // Audit events
    event TokensMinted(address indexed recipient, uint256 amount, uint256 indexed batchId);
    event BatchMintExecuted(uint256 indexed batchId, uint256 totalRecipients, uint256 totalAmount);

    /**
     * @dev Initializes the contract with name "CleanCity Reciclaje" and symbol "RECI".
     * Assigns DEFAULT_ADMIN_ROLE, MINTER_ROLE, and PAUSER_ROLE to `initialAdmin`
     * (or msg.sender if initialAdmin is address(0)).
     * @param initialAdmin The address to be granted initial admin, minter, and pauser privileges.
     */
    constructor(address initialAdmin) ERC20("CleanCity Reciclaje", "RECI") {
        address admin = initialAdmin == address(0) ? _msgSender() : initialAdmin;
        _grantRole(DEFAULT_ADMIN_ROLE, admin);
        _grantRole(MINTER_ROLE, admin);
        _grantRole(PAUSER_ROLE, admin);
    }

    /**
     * @notice Mints `amount` tokens to address `to`.
     * @dev Only callable by accounts with `MINTER_ROLE` when the contract is not paused.
     * @param to The recipient address.
     * @param amount The number of tokens to mint (in base units with 18 decimals).
     */
    function mint(address to, uint256 amount) external onlyRole(MINTER_ROLE) whenNotPaused {
        _mint(to, amount);
        emit TokensMinted(to, amount, 0);
    }

    /**
     * @notice Mints multiple token allocations in a single transaction.
     * @dev Only callable by accounts with `MINTER_ROLE` when the contract is not paused.
     * Validates array lengths, non-emptiness, and rejects address(0) recipients.
     * @param recipients Array of recipient addresses.
     * @param amounts Array of token amounts corresponding to each recipient.
     * @return batchId The unique sequential ID of this batch operation.
     */
    function mintBatch(
        address[] calldata recipients,
        uint256[] calldata amounts
    ) external onlyRole(MINTER_ROLE) whenNotPaused returns (uint256 batchId) {
        uint256 recipientsLength = recipients.length;
        uint256 amountsLength = amounts.length;

        if (recipientsLength != amountsLength) {
            revert ArrayLengthMismatch(recipientsLength, amountsLength);
        }
        if (recipientsLength == 0) {
            revert EmptyBatch();
        }

        unchecked {
            currentBatchId += 1;
        }
        batchId = currentBatchId;

        uint256 totalAmount = 0;

        for (uint256 i = 0; i < recipientsLength; ) {
            address recipient = recipients[i];
            uint256 amount = amounts[i];

            if (recipient == address(0)) {
                revert ZeroAddressRecipient(i);
            }

            _mint(recipient, amount);
            emit TokensMinted(recipient, amount, batchId);

            unchecked {
                totalAmount += amount;
                ++i;
            }
        }

        emit BatchMintExecuted(batchId, recipientsLength, totalAmount);
        return batchId;
    }

    /**
     * @notice Pauses all token transfers, minting, and burning.
     * @dev Only callable by accounts with `PAUSER_ROLE`.
     */
    function pause() external onlyRole(PAUSER_ROLE) {
        _pause();
    }

    /**
     * @notice Unpauses the contract, resuming token transfers, minting, and burning.
     * @dev Only callable by accounts with `PAUSER_ROLE`.
     */
    function unpause() external onlyRole(PAUSER_ROLE) {
        _unpause();
    }

    /**
     * @dev Overrides ERC20 and ERC20Pausable _update hook to enforce pause checks on all transfers,
     * mints, and burns as required by OpenZeppelin 5.x.
     */
    function _update(
        address from,
        address to,
        uint256 value
    ) internal virtual override(ERC20, ERC20Pausable) {
        super._update(from, to, value);
    }
}
