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

// Get the smart contract administrator's address
export async function getContractOwner(
  provider: ethers.Provider
): Promise<string> {
  const contract = getContract(provider);
  const ownerAddress: string = await contract.owner();

  return ownerAddress;
}
