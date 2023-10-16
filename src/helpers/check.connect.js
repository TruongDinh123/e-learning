"use strict";

const mongoose = require("mongoose");
const os = require("os");
const process = require("process");

const _SECONDS = 5000;
// count connection
const countConnect = () => {
  const numConnection = mongoose.connections.length;
  console.log(`Number of connections: ${numConnection}`);
};

//check over load
const checkOverload = () => {
  setInterval(() => {
    const numConnection = mongoose.connections.length;
    const numCores = os.cpus().length;
    const memoryUsage = process.memoryUsage().rss;
    // Example maxium number of connections based on number osf cores: 8 cores x 5 = 45
    const numMaxConnection = numCores * 5;
    
    if (memoryUsage > numMaxConnection) {
      console.log(`Connection: ${numConnection}`);
    }
  }, _SECONDS); //Monitor every 5 seconds
};

module.exports = {
  countConnect,
  checkOverload,
};
