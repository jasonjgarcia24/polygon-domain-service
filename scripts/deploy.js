const main = async () => {
    const domainContractFactory = await hre.ethers.getContractFactory('Domains');
    const domainContract = await domainContractFactory.deploy('jinja');
    await domainContract.deployed();

    console.log('Contract deployed to: ', domainContract.address);

    let tx = await domainContract.register(
        'bott',
        { value: hre.ethers.utils.parseEther('0.3') }
    );
    await tx.wait();
    console.log('Minted domain bott.jinja.');

    tx = await domainContract.setRecord('bott', 'I am a jinja.');
    await tx.wait();
    console.log('Set record for bott.jinja.');

    const owner = await domainContract.getAddress('bott');
    console.log('Owner of domain bott: ', owner);

    const balance = await hre.ethers.provider.getBalance(domainContract.address);
    console.log('Contract balance: ', hre.ethers.utils.formatEther(balance));
};

const runMain = async () => {
    try {
        await main();
        process.exit(0);
    }
    catch (err) {
        console.log(err);
        process.exit(1);
    }
};

runMain();
