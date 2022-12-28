module.exports = {
  networks: {
    ganache: {
      host: "127.0.0.1",
      //host: "10.10.10.20",
      port: 7545,
      network_id: "*", // Match any network id
      gas: 5000000,
    },
    dev: {
      host: "10.10.10.20",
      port: 7545,
      network_id: "*", // Match any network id
      gas: 5000000,
    },
  },
  compilers: {
    solc: {
      version: "0.8.10",
      settings: {
        optimizer: {
          enabled: true, // Default: false
          runs: 200, // Default: 200
        },
      },
    },
  },
  migrations_directory: "migrations_test",
};
