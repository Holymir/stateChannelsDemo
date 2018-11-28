pragma solidity ^0.4.24;

import "openzeppelin-solidity/contracts/math/SafeMath.sol";
import  "./lib/ECTools.sol";


contract RSP {

    using SafeMath for uint256;

    address public playerOne;
    address public playerTwo;

    address public disputePlayer;

    // TODO: deposit = uint
    mapping(address=>uint) public deposit;

    uint256 public endTime;
    uint256 public highestStateNonce;

    bool public dispute;

    modifier onlyPlayer() {
        require(msg.sender == playerOne || msg.sender == playerTwo);
        _;
    }

    modifier onlyWithinTimeLimits() {
        require(now <= endTime);
        _;
    }

    modifier onlyAfterDisputePeriod() {
        require(now > endTime);
        _;
    }

    modifier onlyNotDisputeActive() {
        require(!dispute);
        _;
    }

    modifier onlyDisputeActive() {
        require(dispute);
        _;
    }


    // TODO: constructor
    function openChannel() public payable {
        require(playerOne == address(0));
        playerOne = msg.sender;
        deposit[msg.sender] = msg.value;
    }

    function joinChannel() public payable {
        require(playerOne != address(0));
        require(msg.value == deposit[playerOne]);
        playerTwo = msg.sender;
        deposit[msg.sender] = msg.value;
    }

    function closeChannel(uint256 _playerOnePrise,
        uint256 _playerTwoPrise,
        uint256 _nonce,
        bytes _signedData) public onlyPlayer onlyNotDisputeActive {
        // TODO: describe why we will need delimiter
        bytes32 bytes32Message = keccak256(abi.encodePacked(_playerOnePrise, _playerTwoPrise, _nonce));
        address recoveredSigner = recover(bytes32Message, _signedData);

        if (msg.sender == playerOne) {
            disputePlayer = playerTwo;
        } else {
            disputePlayer = playerOne;
        }

        require(recoveredSigner == disputePlayer);

        endTime = now + 2 minutes;

        // TODO: require(deposit * 2)

        deposit[playerOne] = _playerOnePrise;
        deposit[playerTwo] = _playerTwoPrise;
        highestStateNonce = _nonce;

        dispute = true;
    }

    function closeChannelDispute(uint256 _playerOnePrise,
        uint256 _playerTwoPrise,
        uint256 _nonce,
        bytes _signedData) public onlyPlayer onlyWithinTimeLimits onlyDisputeActive {
        require(_nonce > highestStateNonce);

        bytes32 bytes32Message = keccak256(abi.encodePacked(_playerOnePrise, _playerTwoPrise, _nonce));
        address recoveredSigner = recover(bytes32Message, _signedData);

        require(recoveredSigner != disputePlayer);

        deposit[playerOne] = _playerOnePrise;
        deposit[playerTwo] = _playerTwoPrise;

        // TODO: continue dispute for other player
        endTime = now;


    }

    // TODO: closeChannelDispute within next Game

    function payPrizes() public onlyPlayer onlyAfterDisputePeriod {
        // : TODO payout > deposit
        require(deposit[msg.sender] > 0);
        uint priseForPlayer = deposit[msg.sender];
        deposit[msg.sender] = 0;
        msg.sender.transfer(priseForPlayer);

//        if (this.balance == 0) {
//            selfdestruct();
//        }
    }

    function recover(bytes32 _hash, bytes _signedDataByPlayer) internal pure returns (address) {
        return ECTools.prefixedRecover(_hash, _signedDataByPlayer);
    }

}
