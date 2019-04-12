const path = require("path");
const HDWalletProvider = require("truffle-hdwallet-provider");
const mnemonic = "frost west peanut pitch abuse slide later clock stereo science hawk snow";

module.exports = {

    //plugins: ["truffle-security"],
  	// See <http://truffleframework.com/docs/advanced/configuration>
  	// to customize your Truffle configuration!
  	contracts_build_directory: path.join(__dirname, "client/src/contracts"),
  	networks: {
  		development: {
  		    host: "127.0.0.1",     // Localhost (default: none)
  		    port: 8545,            // Standard Ethereum port (default: none)
  		    network_id: "*",       // Any network (default: none)
  	  },
      rinkeby: {
          provider: function() {
              return new HDWalletProvider(mnemonic, "https://rinkeby.infura.io/v3/6ae5878a6b9741e9bc33189aebf332e4");
          },
          network_id: 4
      },
      ropsten: {
          provider: function() {
              return new HDWalletProvider(mnemonic, "https://ropsten.infura.io/v3/caf37518201c405ca6daf30ed2783350");
          },
          network_id: 3
      },
      coverage: {
          host: "localhost",
          network_id: "*",
          port: 8555,         // <-- If you change this, also set the port option in .solcover.js.
          gas: 0xfffffffffff, // <-- Use this high gas value
          gasPrice: 0x01      // <-- Use this low gas price
      },
  	  compilers: {
          solc: {
              version: "0.5.0", // Fetch exact version from solc-bin (default: truffle's version)
              settings: { // See the solidity docs for advice about optimization and evmVersion
                  optimizer: {
                      enabled: false,
                      runs: 200
                  },
              }
          }
      }
    }
}
