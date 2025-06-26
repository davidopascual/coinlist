// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

interface IERC20 {
    function transferFrom(address from, address to, uint256 amount) external returns (bool);
    function transfer(address to, uint256 amount) external returns (bool);
}

contract EscrowMarketplace {
    enum PaymentType { ETH, ERC20 }
    struct Purchase {
        address buyer;
        address seller;
        uint256 amount;
        address tokenAddress; // address(0) for ETH, ERC20 address for USDC
        bool isConfirmed;
        bool isRefunded;
    }

    mapping(uint256 => Purchase) public purchases;
    uint256 public purchaseCount;

    address public feeRecipient;
    uint256 public feePercent = 2; // 2% fee

    event Purchased(uint256 indexed purchaseId, address indexed buyer, address indexed seller, uint256 amount, address tokenAddress);
    event Confirmed(uint256 indexed purchaseId);
    event Refunded(uint256 indexed purchaseId);

    constructor(address _feeRecipient) {
        require(_feeRecipient != address(0), "Invalid fee recipient");
        feeRecipient = _feeRecipient;
    }

    function purchase(address seller, uint256 amount, address tokenAddress) external payable returns (uint256) {
        if (tokenAddress == address(0)) {
            require(msg.value == amount, "ETH sent must match amount");
        } else {
            require(msg.value == 0, "ETH not accepted for ERC20 purchase");
            require(IERC20(tokenAddress).transferFrom(msg.sender, address(this), amount), "ERC20 transfer failed");
        }
        purchaseCount++;
        purchases[purchaseCount] = Purchase({
            buyer: msg.sender,
            seller: seller,
            amount: amount,
            tokenAddress: tokenAddress,
            isConfirmed: false,
            isRefunded: false
        });
        emit Purchased(purchaseCount, msg.sender, seller, amount, tokenAddress);
        return purchaseCount;
    }

    function confirmReceipt(uint256 purchaseId) external {
        Purchase storage p = purchases[purchaseId];
        require(msg.sender == p.buyer, "Only buyer can confirm");
        require(!p.isConfirmed, "Already confirmed");
        require(!p.isRefunded, "Already refunded");
        p.isConfirmed = true;
        uint256 fee = (p.amount * feePercent) / 100;
        uint256 sellerAmount = p.amount - fee;
        if (p.tokenAddress == address(0)) {
            payable(feeRecipient).transfer(fee);
            payable(p.seller).transfer(sellerAmount);
        } else {
            IERC20(p.tokenAddress).transfer(feeRecipient, fee);
            IERC20(p.tokenAddress).transfer(p.seller, sellerAmount);
        }
        emit Confirmed(purchaseId);
    }

    function refund(uint256 purchaseId) external {
        Purchase storage p = purchases[purchaseId];
        require(msg.sender == p.seller, "Only seller can refund");
        require(!p.isConfirmed, "Already confirmed");
        require(!p.isRefunded, "Already refunded");
        p.isRefunded = true;
        if (p.tokenAddress == address(0)) {
            payable(p.buyer).transfer(p.amount);
        } else {
            IERC20(p.tokenAddress).transfer(p.buyer, p.amount);
        }
        emit Refunded(purchaseId);
    }
}
