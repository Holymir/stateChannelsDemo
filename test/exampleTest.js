const etherlime = require('etherlime');
const rsp = require('../build/RSP');
const ecTools = require('../build/ECTools.json');
const ethers = require('ethers');

describe('Example', () => {
    let accountNine = accounts[9];
    let deployer;

    let plOneContract;
    let plTwoContract;

    const playerOne = accounts[0];
    const playerTwo = accounts[1];

    beforeEach(async () => {
        deployer = new etherlime.EtherlimeGanacheDeployer(accountNine.secretKey);
        let ecToolsInstance = await deployer.deploy(ecTools);
        let deployedContractWrapper = await deployer.deploy(rsp, {"ECTools": ecToolsInstance.contract.address});

        playerOne.wallet = playerOne.wallet.connect(deployer.provider);
        playerTwo.wallet = playerTwo.wallet.connect(deployer.provider);

        plOneContract = await deployedContractWrapper.contract.connect(playerOne.wallet);
        plTwoContract = await deployedContractWrapper.contract.connect(playerTwo.wallet);

        await plOneContract.openChannel({value: 500});
        await plTwoContract.joinChannel({value: 500});
    });

    it('should set players addresses correctly', async () => {
        let pl1 = await plOneContract.playerOne();
        let pl2 = await plOneContract.playerTwo();
        assert.strictEqual(pl1, playerOne.wallet.address);
        assert.strictEqual(pl2, playerTwo.wallet.address);
    });

    it('should set prices correctly after closing channel', async () => {

        const hashMsg = ethers.utils.solidityKeccak256(['int', 'int', 'int'], [4, 6, 0]);
        const hashData = ethers.utils.arrayify(hashMsg);
        const signature = await playerTwo.wallet.signMessage(hashData);

        await plOneContract.closeChannel('4', '6', '0', signature);

        let prisePlayerOne = await plOneContract.addressToPrise(playerOne.wallet.address);
        let prisePlayerTwo = await plOneContract.addressToPrise(playerTwo.wallet.address);

        assert.strictEqual(prisePlayerOne.toNumber(), 4);
        assert.strictEqual(prisePlayerTwo.toNumber(), 6);

    });

    it('should not enter close dispute if dispute already activate', async () => {

        // close
        const hashMsg = ethers.utils.solidityKeccak256(['int', 'int', 'int'], [4, 6, 0]);
        const hashData = ethers.utils.arrayify(hashMsg);
        const signature = await playerTwo.wallet.signMessage(hashData);

        await plOneContract.closeChannel('4', '6', '0', signature);

        // close dispute
        const hashMsgDispute = ethers.utils.solidityKeccak256(['int', 'int', 'int'], [7, 3, 1]);
        const hashDataDispute = ethers.utils.arrayify(hashMsgDispute);
        const signatureDispute = await playerTwo.wallet.signMessage(hashDataDispute);

        await assert.revert(plTwoContract.closeChannel('7', '3', '1', signatureDispute));

    });

    it('should set prices correctly after closing channel dispute', async () => {

        // close
        const hashMsg = ethers.utils.solidityKeccak256(['int', 'int', 'int'], [4, 6, 0]);
        const hashData = ethers.utils.arrayify(hashMsg);
        const signature = await playerTwo.wallet.signMessage(hashData);

        await plOneContract.closeChannel('4', '6', '0', signature);

        // close dispute
        const hashMsgDispute = ethers.utils.solidityKeccak256(['int', 'int', 'int'], [7, 3, 1]);
        const hashDataDispute = ethers.utils.arrayify(hashMsgDispute);
        const signatureDispute = await playerOne.wallet.signMessage(hashDataDispute);

        await plTwoContract.closeChannelDispute('7', '3', '1', signatureDispute);


        let prisePlayerOne = await plOneContract.addressToPrise(playerOne.wallet.address);
        let prisePlayerTwo = await plOneContract.addressToPrise(playerTwo.wallet.address);

        assert.strictEqual(prisePlayerOne.toNumber(), 7);
        assert.strictEqual(prisePlayerTwo.toNumber(), 3);

    });

});