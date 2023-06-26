// SPDX-License-Identifier: MIT
pragma solidity ^0.8.18;

error Cowdfund__GoalNotMet();
error Crowdfund__NothingToWithdraw();
error Crowdfund__TransferFailed();
error Crowdfund__NotOwner();

contract Crowdfund {
  uint256 private immutable i_goal;
  bool private s_goalReached;
  uint256 private s_raised;
  address private s_crowdfundOwner;

  mapping(address => uint256) private s_addressToContribution;

  modifier onlyOwner() {
    if (msg.sender != s_crowdfundOwner) {
      revert Crowdfund__NotOwner();
    }
    _;
  }

  constructor(uint256 _goal, address _creator) {
    i_goal = _goal;
    s_goalReached = false;
    s_raised = 0;
    s_crowdfundOwner = _creator;
  }

  receive() external payable {
    donate();
  }

  fallback() external payable {
    donate();
  }

  function donate() public payable {
    s_addressToContribution[msg.sender] += msg.value;
    s_raised += msg.value;
    updateGoalStatus();
  }

  function withdraw() public onlyOwner {
    if (address(this).balance == 0) {
      revert Crowdfund__NothingToWithdraw();
    }
    (bool success, ) = payable(s_crowdfundOwner).call{value: address(this).balance}("");
    if (!success) {
      revert Crowdfund__TransferFailed();
    }
  }

  function updateGoalStatus() internal {
    if (address(this).balance < i_goal) {
      revert Cowdfund__GoalNotMet();
    }
    if (address(this).balance >= i_goal) {
      s_goalReached = true;
    }
  }

  function checkIfContributor(address _checkAddress) public view returns (bool) {
    if (s_addressToContribution[_checkAddress] > 0) {
      return true;
    } else {
      return false;
    }
  }

  /* GETTER FUNCTIONS */
  function getOwner() public view returns (address) {
    return s_crowdfundOwner;
  }

  function getBalance() public view returns (uint256) {
    return address(this).balance;
  }

  function getRaised() public view returns (uint256) {
    return s_raised;
  }

  function getGoalReached() public view returns (bool) {
    return s_goalReached;
  }

  function getContribution(address _contibutor) public view returns (uint256) {
    return s_addressToContribution[_contibutor];
  }
}
