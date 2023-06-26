// SPDX-License-Identifier: MIT
pragma solidity ^0.8.18;

import "@openzeppelin/contracts/utils/Counters.sol";
import "./Crowdfund.sol";

contract CrowdfundMarket {
  using Counters for Counters.Counter;
  Counters.Counter private _funraiserIds;

  struct CrowdfundObj {
    uint256 fundId;
    string metaUrl;
    address crowdfundContract;
    address owner;
    uint256 goal;
  }
  mapping(uint256 => CrowdfundObj) private s_idToCrowdfund;
  mapping(address => uint256) private s_addressToId;

  event CrowdfundCreated(
    uint indexed fundId,
    string indexed metaUrl,
    address indexed crowdfundContractAddress,
    address owner,
    uint256 goal
  );

  function createCrowdfund(uint _goal, string memory _metaUrl) public {
    _funraiserIds.increment();
    uint256 fundId = _funraiserIds.current();

    Crowdfund crowdfundContract = new Crowdfund(_goal, msg.sender);
    address crowdfundContractAddress = address(crowdfundContract);
    s_addressToId[crowdfundContractAddress] = fundId;

    s_idToCrowdfund[fundId] = CrowdfundObj(
      fundId,
      _metaUrl,
      crowdfundContractAddress,
      payable(msg.sender),
      _goal
    );

    emit CrowdfundCreated(fundId, _metaUrl, crowdfundContractAddress, msg.sender, _goal);
  }

  function getCrowdfund(uint256 _id) public view returns (CrowdfundObj memory) {
    return s_idToCrowdfund[_id];
  }

  function getActiveFundraisers() public view returns (CrowdfundObj[] memory) {
    uint256 fundraisersCount = _funraiserIds.current();
    uint256 fundraiserGoalsMet = 0;
    bool goalReached;
    for (uint256 i = 0; i < fundraisersCount; i++) {
      Crowdfund contractInstance = Crowdfund(payable(s_idToCrowdfund[i + 1].crowdfundContract));
      goalReached = contractInstance.getGoalReached();
      if (goalReached) fundraiserGoalsMet++;
    }

    uint256 goalNotReachedCount = _funraiserIds.current() - fundraiserGoalsMet;
    uint256 index = 0;

    CrowdfundObj[] memory fundraisers = new CrowdfundObj[](goalNotReachedCount);
    for (uint256 i = 0; i < fundraisersCount; i++) {
      Crowdfund contractInstance = Crowdfund(payable(s_idToCrowdfund[i + 1].crowdfundContract));
      goalReached = contractInstance.getGoalReached();
      if (!goalReached) {
        uint256 currentFundId = s_idToCrowdfund[i + 1].fundId;
        CrowdfundObj storage currentCrowdfund = s_idToCrowdfund[currentFundId];
        fundraisers[index] = currentCrowdfund;
        index++;
      }
    }
    return fundraisers;
  }

  function getMyFundraisers() public view returns (CrowdfundObj[] memory) {
    uint256 fundraisersCount = _funraiserIds.current();
    uint256 myFundraisersCount = 0;
    uint256 index = 0;

    for (uint256 i = 0; i < fundraisersCount; i++) {
      if (s_idToCrowdfund[i + 1].owner == msg.sender) {
        myFundraisersCount++;
      }
    }
    CrowdfundObj[] memory fundraisers = new CrowdfundObj[](myFundraisersCount);

    for (uint256 i = 0; i < fundraisersCount; i++) {
      if (s_idToCrowdfund[i + 1].owner == msg.sender) {
        uint256 currentFundId = s_idToCrowdfund[i + 1].fundId;
        CrowdfundObj storage currentCrowdfund = s_idToCrowdfund[currentFundId];
        fundraisers[index] = currentCrowdfund;
        index++;
      }
    }
    return fundraisers;
  }

  function getMyActiveFundraisers() public view returns (CrowdfundObj[] memory) {
    uint256 fundraisersCount = _funraiserIds.current();
    uint256 myActiveFundraisersCount = 0;
    bool goalReached;
    uint256 index = 0;

    for (uint256 i = 0; i < fundraisersCount; i++) {
      Crowdfund contractInstance = Crowdfund(payable(s_idToCrowdfund[i + 1].crowdfundContract));
      goalReached = contractInstance.getGoalReached();
      if (s_idToCrowdfund[i + 1].owner == msg.sender && !goalReached) {
        myActiveFundraisersCount++;
      }
    }
    CrowdfundObj[] memory fundraisers = new CrowdfundObj[](myActiveFundraisersCount);

    for (uint256 i = 0; i < fundraisersCount; i++) {
      Crowdfund contractInstance = Crowdfund(payable(s_idToCrowdfund[i + 1].crowdfundContract));
      goalReached = contractInstance.getGoalReached();
      if (s_idToCrowdfund[i + 1].owner == msg.sender && !goalReached) {
        uint256 currentFundId = s_idToCrowdfund[i + 1].fundId;
        CrowdfundObj storage currentCrowdfund = s_idToCrowdfund[currentFundId];
        fundraisers[index] = currentCrowdfund;
        index++;
      }
    }
    return fundraisers;
  }

  function getMyCompletedFundraisers() public view returns (CrowdfundObj[] memory) {
    uint256 fundraisersCount = _funraiserIds.current();
    uint256 myCompletedFundraisersCount = 0;
    bool goalReached;
    uint256 index = 0;

    for (uint256 i = 0; i < fundraisersCount; i++) {
      Crowdfund contractInstance = Crowdfund(payable(s_idToCrowdfund[i + 1].crowdfundContract));
      goalReached = contractInstance.getGoalReached();
      if (s_idToCrowdfund[i + 1].owner == msg.sender && goalReached) {
        myCompletedFundraisersCount++;
      }
    }
    CrowdfundObj[] memory fundraisers = new CrowdfundObj[](myCompletedFundraisersCount);

    for (uint256 i = 0; i < fundraisersCount; i++) {
      Crowdfund contractInstance = Crowdfund(payable(s_idToCrowdfund[i + 1].crowdfundContract));
      goalReached = contractInstance.getGoalReached();
      if (s_idToCrowdfund[i + 1].owner == msg.sender && goalReached) {
        uint256 currentFundId = s_idToCrowdfund[i + 1].fundId;
        CrowdfundObj storage currentCrowdfund = s_idToCrowdfund[currentFundId];
        fundraisers[index] = currentCrowdfund;
        index++;
      }
    }
    return fundraisers;
  }
}
