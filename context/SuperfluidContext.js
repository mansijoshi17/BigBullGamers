import React, { useState, createContext, useEffect, useCallback } from "react";

import { useMoralis } from "react-moralis";
import { Framework, createSkipPaging } from "@superfluid-finance/sdk-core";
import { ethers } from "ethers";

import { gql } from "graphql-request";
import { networks } from "../redux/netwrok";
import { sfSubgraph, sfApi } from "../redux/store";
import Web3 from "web3";

export const SuperfluidWeb3Context = createContext(undefined);

export const url = `https://polygon-mumbai.g.alchemy.com/v2/${process.env.NEXT_PUBLIC_ALCHEMY_API_KEY}`;
console.log(process.env.NEXT_PUBLIC_ALCHEMY_API_KEY);

export const customHttpProvider = new ethers.providers.JsonRpcProvider(url);
const USDCx = "0x42bb40bF79730451B11f6De1CbA222F17b87Afd7";

const searchByAddressDocument = gql`
  query Search($addressId: ID, $addressBytes: Bytes) {
    tokensByAddress: tokens(where: { id: $addressId, isSuperToken: true }) {
      id
      symbol
      name
      isListed
    }
    tokensByUnderlyingAddress: tokens(
      where: { isSuperToken: true, underlyingAddress: $addressBytes }
    ) {
      id
      symbol
      name
      isListed
    }
    accounts(where: { id: $addressId }) {
      id
    }
  }
`;

export const SuperfluidWeb3ContextProvider = (props) => {
  const [currentAddress, setCurrentAddress] = useState("");
  const [isLoadingcon, setIsLoaing] = useState(false);
  const [totalStreams, setTotalStreams] = useState(0);
  const [flow, setFlow] = useState();

  useEffect(() => {
    let web3 = new Web3();
    window.onunload = () => {
      // Clear the local storage
      window.Storage.clear();
    };

    if (window?.ethereum) {
      web3 = new Web3(window.ethereum);
      try {
        window.ethereum.enable().then(function (accounts) {
          setCurrentAddress(accounts[0]);
          localStorage.setItem("account", accounts[0]);
        });
        window.ethereum.on("accountsChanged", function (accounts) {
          setCurrentAddress(accounts[0]);
          localStorage.setItem("account", accounts[0]);
          // loadMyNfts();
        });
        // });
      } catch (e) {
        alert("User rejected the MetaMask connection request !");
        localStorage.setItem("account", null);
      }
    } else if (window.web3) {
      web3 = new Web3(window.web3.currentProvider);
    }
  }, [currentAddress]);

  // const queryData = networks.map((network) =>
  //   sfSubgraph.useCustomQuery({
  //     chainId: network.chainId,
  //     document: searchByAddressDocument,
  //     variables: {
  //       addressId: currentAddress.toLowerCase(),
  //       addressBytes: currentAddress.toLowerCase(),
  //     },
  //   })
  // );
  // console.log(queryData, "queryData");

  // const prefetchStreamsQuery = sfSubgraph.usePrefetch("streams");

  // prefetchStreamsQuery({
  //   chainId: networks[0].chainId,
  //   filter: {
  //     receiver: queryData[0].currentData?.accounts[0]?.id,
  //   },
  // });

  // const incomingStreamsQuery = sfSubgraph.useStreamsQuery({
  //   chainId: networks[0].chainId,
  //   filter: {
  //     receiver: currentAddress,
  //   },
  // });

  // console.log(incomingStreamsQuery);

  async function createNewFlow(recipient, flowRate) {
    const provider = new ethers.providers.Web3Provide(window?.ethereum);
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

      alert(
        "Stream for this address is already exist! or may you don't have enough DAI"
      );
      console.error(error);
    }
  }

  function calFlowRate(amt) {
    console.log(amt);
    if (typeof Number(amt) !== "number" || isNaN(Number(amt)) === true) {
      throw new Error("calculate a flowRate based on a number");
    } else if (typeof Number(amt) === "number") {
      const monthlyAmount = ethers.utils.parseEther(amt.toString());
      const calculatedFlowRate = Math.floor(monthlyAmount / 3600 / 24 / 30);
      return calculatedFlowRate;
    }
  }

  // async function listOutFlows() {
  //   setFlow(
  //     incomingStreamsQuery.data?.data[
  //       incomingStreamsQuery.data?.data.length - 1
  //     ]
  //   );
  // }

  return (
    <SuperfluidWeb3Context.Provider
      value={{
        createNewFlow,
        calFlowRate,
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
