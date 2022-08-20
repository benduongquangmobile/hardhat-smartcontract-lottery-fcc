// SPDX-License-Identifier: MIT
pragma solidity ^0.8.7;
import "@chainlink/contracts/src/v0.8/VRFConsumerBaseV2.sol";
import "@chainlink/contracts/src/v0.8/interfaces/VRFCoordinatorV2Interface.sol";
import "@chainlink/contracts/src/v0.8/KeeperCompatible.sol";
import "hardhat/console.sol";

error Raffle__NotEnoughETHEntered();
error Raffle__TransactionFailed();
error Raffle__NotOpen();
error Raffle__UpkeepNotNeeded(
  uint256 currentBalance,
  uint256 numPlayer,
  uint256 raffleState
);

contract Raffle is VRFConsumerBaseV2, KeeperCompatibleInterface {
  enum RaffleState {
    OPEN,
    CALCULATING
  }

  uint256 private immutable i_entranceFee;
  VRFCoordinatorV2Interface private immutable i_vrfCoodinator;
  address payable[] private s_players;
  bytes32 private immutable i_gaslane;
  uint64 private immutable i_subscriptionId;
  uint32 private immutable i_callbackGasLimit;
  uint16 private constant REQUEST_CONFIRMATION = 3;
  uint32 private constant NUM_WORDS = 1;
  uint256 private immutable i_internval;

  address private s_recentWinner;
  RaffleState private s_raffleState;
  uint256 private s_lastTimeStamp;

  event RaffleEnter(address indexed player);
  event RequestedRaffleWinner(uint256 indexed requestId);
  event WinnerPicked(address indexed winner);

  constructor(
    address vtfCoordinatorV2,
    uint256 entranceFee,
    bytes32 gasLane,
    uint64 subscriptionId,
    uint32 callbackGasLimit,
    uint256 interval
  ) VRFConsumerBaseV2(vtfCoordinatorV2) {
    i_entranceFee = entranceFee;
    i_vrfCoodinator = VRFCoordinatorV2Interface(vtfCoordinatorV2);
    i_gaslane = gasLane;
    i_subscriptionId = subscriptionId;
    i_callbackGasLimit = callbackGasLimit;
    s_raffleState = RaffleState.OPEN;
    i_internval = interval;
  }

  function enterFaffle() public payable {
    // enter the raffle
    if (msg.value < i_entranceFee) {
      revert Raffle__NotEnoughETHEntered();
    }
    s_players.push(payable(msg.sender));
    emit RaffleEnter(msg.sender);
  }

  function requestRandomWinner() public {
    // pick a winner
    s_raffleState = RaffleState.CALCULATING;
    uint256 requestId = i_vrfCoodinator.requestRandomWords(
      i_gaslane,
      i_subscriptionId,
      REQUEST_CONFIRMATION,
      i_callbackGasLimit,
      NUM_WORDS
    );
    emit RequestedRaffleWinner(requestId);
  }

  function pickRandomWinner() external {}

  function fulfillRandomWords(uint256, uint256[] memory randomWords)
    internal
    override
  {
    uint256 indexOfWinner = randomWords[0] % s_players.length;
    console.log(" ----------------------------");
    console.log("indexOfWinner", indexOfWinner);
    console.log(" ----------------------------");
    address payable recentWinner = s_players[indexOfWinner];
    s_recentWinner = recentWinner;
    s_raffleState = RaffleState.OPEN;
    s_players = new address payable[](0);
    s_lastTimeStamp = block.timestamp;
    (bool success, ) = recentWinner.call{value: address(this).balance}("");
    if (!success) {
      revert Raffle__TransactionFailed();
    }
    if (s_raffleState != RaffleState.OPEN) {
      revert Raffle__NotOpen();
    }
    emit WinnerPicked(recentWinner);
  }

  function checkUpkeep(bytes memory checkData)
    public
    override
    returns (bool isUpkeepNeeded, bytes memory)
  {
    bool isOpen = s_raffleState == RaffleState.OPEN;
    bool timePassed = ((block.timestamp - s_lastTimeStamp) > i_internval);
    bool hasPlayers = (s_players.length > 0);
    bool hasBalance = address(this).balance > 0;
    isUpkeepNeeded = isOpen && timePassed && hasPlayers && hasBalance;
    if (isUpkeepNeeded) {
      s_lastTimeStamp = block.timestamp;
      return (true, checkData);
    } else {
      return (false, checkData);
    }
  }

  function performUpkeep(bytes calldata) external override {
    (bool upCheckUpkeep, ) = this.checkUpkeep("");
    if (!upCheckUpkeep) {
      revert Raffle__UpkeepNotNeeded(
        address(this).balance,
        s_players.length,
        uint256(s_raffleState)
      );
    }
  }

  function getEntranceFee() public view returns (uint256) {
    return i_entranceFee;
  }

  function getPlayer(uint256 index) public view returns (address) {
    return s_players[index];
  }

  function getRecentWinner() public view returns (address) {
    return s_recentWinner;
  }

  function getRaffleState() public view returns (RaffleState) {
    return s_raffleState;
  }

  function getNumsWords() public pure returns (uint32) {
    return NUM_WORDS;
  }
}
