import { HardhatUserConfig } from "hardhat/config";
//import "@nomicfoundation/hardhat-toolbox";
import "@nomiclabs/hardhat-waffle"

const infura_api = process.env.REACT_APP_INFURA_API;

const config: HardhatUserConfig = {
  solidity: "0.8.19",
  networks: {
    hardhat: {
      chainId: 1337,
    },
    goerli: {
      url: `https://goerli.infura.io/v3/${infura_api}`,
      chainId:5,
    }
  },
};

export default config;
