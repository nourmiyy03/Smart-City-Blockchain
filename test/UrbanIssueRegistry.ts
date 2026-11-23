import { expect } from "chai";
import { network } from "hardhat";

describe("UrbanIssueRegistry", function () {

    let registry: any;
    let owner: any;
    let ethers: any;

    beforeEach(async function () {

        // Connect to the Hardhat network
        const connection = await network.create();

        // Get ethers from the Hardhat connection
        ethers = connection.ethers;

        // Get the first Hardhat account
        [owner] = await ethers.getSigners();

        // Get the contract factory
        const RegistryFactory =
            await ethers.getContractFactory("UrbanIssueRegistry");

        // Deploy the contract
        registry = await RegistryFactory.deploy();

        // Wait until deployment is completed
        await registry.waitForDeployment();
    });


    describe("Deployment", function () {

        it("should start with zero issues", async function () {

            const count = await registry.getIssueCount();

            expect(count).to.equal(0);
        });
    });


    describe("Create Issue", function () {

        it("should create an issue with correct information", async function () {

            await registry.createIssue(
                "ISSUE-001",
                "Broken Streetlight",
                "Tangier",
                "Streetlight not working",
                2, // High priority
                "Citizen 1"
            );

            const issue = await registry.getIssue("ISSUE-001");

            expect(issue.issueId).to.equal("ISSUE-001");
            expect(issue.issueType).to.equal("Broken Streetlight");
            expect(issue.location).to.equal("Tangier");
            expect(issue.description).to.equal("Streetlight not working");
            expect(issue.priority).to.equal(2);
            expect(issue.reportedBy).to.equal("Citizen 1");
            expect(issue.status).to.equal(0); // Reported
            expect(issue.assignedTo).to.equal("");

            expect(await registry.getIssueCount()).to.equal(1);
        });

        it("should reject an empty issue ID", async function () {

            await expect(
                registry.createIssue(
                    "",
                    "Broken Streetlight",
                    "Tangier",
                    "Streetlight not working",
                    2,
                    "Citizen 1"
                )
            ).to.be.revertedWith("Issue ID cannot be empty");
        });

        it("should reject duplicate issue IDs", async function () {

            await registry.createIssue(
                "ISSUE-001",
                "Broken Streetlight",
                "Tangier",
                "Streetlight not working",
                2,
                "Citizen 1"
            );

            await expect(
                registry.createIssue(
                    "ISSUE-001",
                    "Road Damage",
                    "Tangier",
                    "Damaged road",
                    1,
                    "Citizen 2"
                )
            ).to.be.revertedWith("Issue already exists");
        });
    });

    describe("Assign Team", function () {

        beforeEach(async function () {
            await registry.createIssue(
                "ISSUE-001",
                "Broken Streetlight",
                "Tangier",
                "Streetlight not working",
                2,
                "Citizen 1"
            );
        });

        it("should assign a team to an issue", async function () {

            await registry.assignTeam("ISSUE-001", "Electrical Team");

            const issue = await registry.getIssue("ISSUE-001");

            expect(issue.assignedTo).to.equal("Electrical Team");
            expect(issue.status).to.equal(1); // Assigned
        });

        it("should reject an empty team name", async function () {

            await expect(
                registry.assignTeam("ISSUE-001", "")
            ).to.be.revertedWith("Team name cannot be empty");
        });

        it("should reject assigning a team to a nonexistent issue", async function () {

            await expect(
                registry.assignTeam("UNKNOWN-001", "Electrical Team")
            ).to.be.revertedWith("Issue does not exist");
        });

        it("should reject assigning a second team", async function () {

            await registry.assignTeam("ISSUE-001", "Electrical Team");

            await expect(
                registry.assignTeam("ISSUE-001", "Road Maintenance Team")
            ).to.be.revertedWith("Issue is not available for assignment");
        });
    });


    describe("Update Status", function () {

        beforeEach(async function () {

            // Create an issue
            await registry.createIssue(
                "ISSUE-001",
                "Broken Streetlight",
                "Tangier",
                "Streetlight not working",
                2,
                "Citizen 1"
            );

            // Assign a team
            await registry.assignTeam(
                "ISSUE-001",
                "Electrical Team"
            );
        });

        it("should update status from Assigned to InProgress", async function () {

            await registry.updateStatus(
                "ISSUE-001",
                2, // InProgress
                "Team started the intervention"
            );

            const issue = await registry.getIssue("ISSUE-001");

            expect(issue.status).to.equal(2);
        });

        it("should update status from InProgress to Resolved", async function () {

            await registry.updateStatus("ISSUE-001", 2, "Intervention started");

            await registry.updateStatus(
                "ISSUE-001",
                3, // Resolved
                "Streetlight repaired"
            );

            const issue = await registry.getIssue("ISSUE-001");

            expect(issue.status).to.equal(3);
        });

        it("should update status from Resolved to Closed", async function () {

            await registry.updateStatus("ISSUE-001", 2, "Intervention started");

            await registry.updateStatus("ISSUE-001", 3, "Streetlight repaired");

            await registry.updateStatus(
                "ISSUE-001",
                4, // Closed
                "Issue verified and closed"
            );

            const issue = await registry.getIssue("ISSUE-001");

            expect(issue.status).to.equal(4);
        });

        it("should reject an invalid status transition", async function () {

            await expect(
                registry.updateStatus(
                    "ISSUE-001",
                    4, // Closed directly from Assigned
                    "Invalid transition"
                )
            ).to.be.revertedWith("Invalid status transition");
        });

        it("should reject updating a nonexistent issue", async function () {

            await expect(
                registry.updateStatus(
                    "UNKNOWN-001",
                    2,
                    "Some comment"
                )
            ).to.be.revertedWith("Issue does not exist");
        });
    });


    describe("Issue History", function () {

        beforeEach(async function () {

            // 1. Create an issue
            await registry.createIssue(
                "ISSUE-001",
                "Broken Streetlight",
                "Tangier",
                "Streetlight not working",
                2,
                "Citizen 1"
            );

        });

        it("should record the issue creation in history", async function () {

            const history = await registry.getHistory("ISSUE-001");

            expect(history.length).to.equal(1);

            expect(history[0].action).to.equal("CREATED");
            expect(history[0].status).to.equal(0);
            expect(history[0].comment).to.equal("Issue reported");
            expect(history[0].assignedTo).to.equal("");
            expect(history[0].actor).to.equal(owner.address);
        });


        it("should record team assignment in history", async function () {

            await registry.assignTeam(
                "ISSUE-001",
                "Electrical Team"
            );

            const history = await registry.getHistory("ISSUE-001");

            expect(history.length).to.equal(2);

            expect(history[1].action).to.equal("TEAM_ASSIGNED");
            expect(history[1].status).to.equal(1);
            expect(history[1].assignedTo).to.equal("Electrical Team");
        });


        it("should record status updates in history", async function () {

            await registry.assignTeam(
                "ISSUE-001",
                "Electrical Team"
            );

            await registry.updateStatus(
                "ISSUE-001",
                2,
                "Team started the intervention"
            );

            const history = await registry.getHistory("ISSUE-001");

            expect(history.length).to.equal(3);

            expect(history[2].action).to.equal("STATUS_UPDATED");
            expect(history[2].status).to.equal(2);
            expect(history[2].comment).to.equal("Team started the intervention");
            expect(history[2].assignedTo).to.equal("Electrical Team");
        });


        it("should preserve the complete history of an issue", async function () {

            await registry.assignTeam(
                "ISSUE-001",
                "Electrical Team"
            );

            await registry.updateStatus(
                "ISSUE-001",
                2,
                "Intervention started"
            );

            await registry.updateStatus(
                "ISSUE-001",
                3,
                "Streetlight repaired"
            );

            await registry.updateStatus(
                "ISSUE-001",
                4,
                "Issue verified and closed"
            );

            const history = await registry.getHistory("ISSUE-001");

            expect(history.length).to.equal(5);

            expect(history[0].action).to.equal("CREATED");
            expect(history[1].action).to.equal("TEAM_ASSIGNED");
            expect(history[2].action).to.equal("STATUS_UPDATED");
            expect(history[3].action).to.equal("STATUS_UPDATED");
            expect(history[4].action).to.equal("STATUS_UPDATED");

            expect(history[4].status).to.equal(4);
            expect(history[4].comment).to.equal("Issue verified and closed");
        });


        it("should reject history retrieval for a nonexistent issue", async function () {

            await expect(
                registry.getHistory("UNKNOWN-001")
            ).to.be.revertedWith("Issue does not exist");
        });

    });



    describe("Get All Issues", function () {

        it("Should return an empty array when no issues exist", async function () {
            const allIssues = await registry.getAllIssues();

            expect(allIssues.length).to.equal(0);
        });

        it("Should return all registered issues", async function () {

            await registry.createIssue(
                "ISSUE-001",
                "Road Damage",
                "Tangier",
                "Damaged road",
                1,
                "Citizen A"
            );

            await registry.createIssue(
                "ISSUE-002",
                "Broken Streetlight",
                "Tetouan",
                "Streetlight not working",
                2,
                "Citizen B"
            );

            await registry.createIssue(
                "ISSUE-003",
                "Water Leakage",
                "Rabat",
                "Water pipe leakage",
                0,
                "Citizen C"
            );

            const allIssues = await registry.getAllIssues();

            expect(allIssues.length).to.equal(3);

            expect(allIssues[0].issueId).to.equal("ISSUE-001");
            expect(allIssues[1].issueId).to.equal("ISSUE-002");
            expect(allIssues[2].issueId).to.equal("ISSUE-003");
        });

    });



});