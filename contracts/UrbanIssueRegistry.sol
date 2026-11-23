// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/access/Ownable.sol";

contract UrbanIssueRegistry is Ownable {

    constructor() Ownable(msg.sender) {}

    // Possible priorities of an urban issue
    enum Priority {
        Low,
        Medium,
        High
    }

    // Lifecycle of an urban issue
    enum Status {
        Reported,
        Assigned,
        InProgress,
        Resolved,
        Closed
    }



    struct Issue {
        string issueId;
        string issueType;
        string location;
        string description;
        uint256 reportDate;
        Priority priority;
        string reportedBy;
        string assignedTo;
        Status status;
    }

    // Information about each action performed on an issue
    struct HistoryEntry {
        uint256 timestamp;
        Status status;
        string action;
        string comment;
        string assignedTo;
        address actor;
    }


    // Stores all urban issues using their ID
    mapping(string => Issue) private issues;

    // Permet de vérifier si un identifiant existe déjà.
    mapping(string => bool) private issueExists;

    // Stores the history of each issue
    mapping(string => HistoryEntry[]) private issueHistory;

    string[] private issueIds;

    // Total number of registered issues
    uint256 private issueCounter;



    event IssueCreated(
        string issueId,
        address indexed reporter,
        uint256 timestamp
    );

    event TeamAssigned(
        string issueId,
        string team,
        address indexed actor,
        uint256 timestamp
    );

    event StatusUpdated(
        string issueId,
        Status oldStatus,
        Status newStatus,
        address indexed actor,
        uint256 timestamp
    );


    // CREATE ISSUE
    function createIssue(
        string memory _issueId,
        string memory _issueType,
        string memory _location,
        string memory _description,
        Priority _priority,
        string memory _reportedBy
    ) public {

        // 1. Verify that the issue ID is not empty
        require(
            bytes(_issueId).length > 0,
            "Issue ID cannot be empty"
        );

        // 2. Verify that the issue does not already exist
        require(
            !issueExists[_issueId],
            "Issue already exists"
        );

        // 3. Create and store the issue
        issues[_issueId] = Issue({
            issueId: _issueId,
            issueType: _issueType,
            location: _location,
            description: _description,
            reportDate: block.timestamp,
            priority: _priority,
            reportedBy: _reportedBy,
            assignedTo: "",
            status: Status.Reported
        });

        // 4. Mark the issue as existing
        issueExists[_issueId] = true;

        issueIds.push(_issueId);

        // 5. Increment the total issue counter
        issueCounter++;

        // 6. Add the creation action to the history
        _addHistory(
            _issueId,
            Status.Reported,
            "CREATED",
            "Issue reported",
            "",
            msg.sender
        );

        // 7. Emit event
        emit IssueCreated(
            _issueId,
            msg.sender,
            block.timestamp
        );
    }


    // GET ISSUE
    function getIssue(
        string memory _issueId
    ) public view returns (Issue memory) {

        // Verify if the issue exists
        require(
            issueExists[_issueId],
            "Issue does not exist"
        );

        // Return the complete issue
        return issues[_issueId];
    }


    // GET ISSUE COUNT
    function getIssueCount()
        public
        view
        returns (uint256)
    {
        return issueCounter;
    }


    function getAllIssues() public view returns (Issue[] memory) {
        Issue[] memory allIssues = new Issue[](issueIds.length);

        for (uint256 i = 0; i < issueIds.length; i++) {
            allIssues[i] = issues[issueIds[i]];
        }

        return allIssues;
    }


    // ASSIGN TEAM
    function assignTeam(
        string memory _issueId,
        string memory _team
    ) public onlyOwner {

        // 1. Check that the issue exists
        require(
            issueExists[_issueId],
            "Issue does not exist"
        );

        // 2. Check that the team name is not empty
        require(
            bytes(_team).length > 0,
            "Team name cannot be empty"
        );

        // 3. Check that the issue has not already been assigned
        require(
            issues[_issueId].status == Status.Reported,
            "Issue is not available for assignment"
        );

        // 4. Assign the team
        issues[_issueId].assignedTo = _team;

        // 5. Update the status
        issues[_issueId].status = Status.Assigned;

        // 6. Add the assignment to the history
        _addHistory(
            _issueId,
            Status.Assigned,
            "TEAM_ASSIGNED",
            "Team assigned",
            _team,
            msg.sender
        );

        // 7. Emit event
        emit TeamAssigned(
            _issueId,
            _team,
            msg.sender,
            block.timestamp
        );
    }


    function updateStatus(
        string memory _issueId,
        Status _newStatus,
        string memory _comment
    ) public onlyOwner {

        // 1. Check that the issue exists
        require(
            issueExists[_issueId],
            "Issue does not exist"
        );

        // 2. Get the current status
        Status currentStatus = issues[_issueId].status;

        // 3. Verify that the transition is valid
        //
        // Reported    -> Assigned     : assignTeam()
        // Assigned    -> InProgress
        // InProgress  -> Resolved
        // Resolved    -> Closed
        //
        require(
            (currentStatus == Status.Assigned &&
             _newStatus == Status.InProgress) ||

            (currentStatus == Status.InProgress &&
             _newStatus == Status.Resolved) ||

            (currentStatus == Status.Resolved &&
             _newStatus == Status.Closed),

            "Invalid status transition"
        );

        // 4. Update the status
        issues[_issueId].status = _newStatus;

        // 5. Add the status change to the history
        _addHistory(
            _issueId,
            _newStatus,
            "STATUS_UPDATED",
            _comment,
            issues[_issueId].assignedTo,
            msg.sender
        );

        // 6. Emit event
        emit StatusUpdated(
            _issueId,
            currentStatus,
            _newStatus,
            msg.sender,
            block.timestamp
        );
    }



    function getHistory(
        string memory _issueId
    ) public view returns (HistoryEntry[] memory) {

        // Check that the issue exists
        require(
            issueExists[_issueId],
            "Issue does not exist"
        );

        // Return the complete history
        return issueHistory[_issueId];
    }


    function _addHistory(
        string memory _issueId,
        Status _status,
        string memory _action,
        string memory _comment,
        string memory _assignedTo,
        address _actor
    ) private {

        issueHistory[_issueId].push(
            HistoryEntry({
                timestamp: block.timestamp,
                status: _status,
                action: _action,
                comment: _comment,
                assignedTo: _assignedTo,
                actor: _actor
            })
        );
    }
}