import React, { useState, createContext, useEffect, useCallback } from "react";

import { useMoralis } from "react-moralis";
import { Framework, createSkipPaging } from "@superfluid-finance/sdk-core";
import { ethers } from "ethers";

import { toast } from "react-toastify";

export const SuperfluidWeb3Context = createContext(undefined);

export const url = `https://polygon-mumbai.g.alchemy.com/v2/${process.env.ALCHEMY_API_KEY}`;

export const customHttpProvider = new ethers.providers.JsonRpcProvider(url);
const USDCx = "0x42bb40bF79730451B11f6De1CbA222F17b87Afd7";

export const SuperfluidWeb3ContextProvider = (props) => {
  const [isLoadingcon, setIsLoaing] = useState(false);
  const { user } = useMoralis();
  const [totalStreams, setTotalStreams] = useState(0);
  const [flow, setFlow] = useState();

  async function createNewFlow(recipient, flowRate) {
    const provider = new ethers.providers.Web3Provider(window?.ethereum);
    const signer = provider.getSigner();
    setIsLoaing(true);

    const chainId = await window.ethereum.request({ method: "eth_chainId" });
    try {
      const sf = await Framework.create({
        chainId: Number(chainId),
        provider: provider,
      });
      const createFlowOperation = sf.cfaV1.createFlow({
        flowRate: flowRate,
        receiver: recipient,
        superToken: USDCx,
        // userData?: string
      });

      const result = await createFlowOperation.exec(signer);

      setIsLoaing(false);
      alert(`Congrats - you've just created a money stream!
      View Your Stream At: https://app.superfluid.finance/dashboard/${recipient}`);
    } catch (error) {
      setIsLoaing(false);

      toast.error(
        "Stream for this address is already exist! or may you don't have enough DAI"
      );
      console.error(error);
    }
  }

  function calculateFlowRate(amount) {
    if (typeof Number(amount) !== "number" || isNaN(Number(amount)) === true) {
      alert("You can only calculate a flowRate based on a number");
      return;
    } else if (typeof Number(amount) === "number") {
      if (Number(amount) === 0) {
        return 0;
      }
      const amountInWei = ethers.BigNumber.from(amount);
      const monthlyAmount = ethers.utils.formatEther(amountInWei.toString());
      const calculatedFlowRate = monthlyAmount * 3600 * 24 * 30;
      return calculatedFlowRate;
    }
  }

  return (
    <SuperfluidWeb3Context.Provider
      value={{
        createNewFlow,
        calculateFlowRate,
        isLoadingcon,
        totalStreams,
        flow,
      }}
      {...props}
    >
      {props.children}
    </SuperfluidWeb3Context.Provider>
  );
};
