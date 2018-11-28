const etherlime = require('etherlime');
const rsp = require('../build/RSP');
const ecTools = require('../build/ECTools.json');

const deploy = async (network, secret) => {

    let deployer = new etherlime.EtherlimeGanacheDeployer();
    let ecToolsInstance = await deployer.deploy(ecTools);
    await deployer.deploy(rsp, {"ECTools": ecToolsInstance.contract.address});

	// const deployer = new etherlime.EtherlimeGanacheDeployer();
	// const result = await deployer.deploy(LimeFactory);

};

module.exports = {
	deploy
};