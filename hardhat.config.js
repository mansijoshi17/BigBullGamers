require("@nomiclabs/hardhat-waffle");
require("dotenv").config();

const fs = require("fs");
const privateKey = process.env.PRIVATE_KEY;
const ALCHEMY_API_KEY = process.env.NEXT_PUBLIC_ALCHEMY_API_KEY;
const projectId = process.env.PROJECT_ID;

module.exports = {
  solidity: "0.8.4",
  networks: {
    matic: {
      url: `https://polygon-mumbai.g.alchemy.com/v2/${ALCHEMY_API_KEY}`,
      accounts: [privateKey],
      gas: 2100000,
      gasPrice: 8000000000,
    },
  },
};
