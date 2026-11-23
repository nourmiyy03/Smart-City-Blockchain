
import { network } from "hardhat";

async function main() {
    // Connect to the selected Hardhat network
    const connection = await network.create();

    const ethers = connection.ethers;

    // Get the contract factory
    const RegistryFactory = await ethers.getContractFactory(
        "UrbanIssueRegistry"
    );

    // Deploy the contract
    console.log("Deploying UrbanIssueRegistry...");

    const registry = await RegistryFactory.deploy();

    // Wait for deployment confirmation
    await registry.waitForDeployment();

    // Retrieve deployed contract address
    const contractAddress = await registry.getAddress();

    console.log("UrbanIssueRegistry deployed successfully!");
    console.log("Contract address:", contractAddress);

    const issueCount = await registry.getIssueCount();

    console.log("Initial issue count:", issueCount.toString());
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
