import { ethers } from "ethers";
import contractArtifact from "./contracts/UrbanIssueRegistry.json";

import { CONTRACT_ADDRESS } from "./config";

export const CONTRACT_ABI = contractArtifact.abi;

export function getContract(
  runner: ethers.ContractRunner
) {
  return new ethers.Contract(
    CONTRACT_ADDRESS,
    CONTRACT_ABI,
    runner
  );
}