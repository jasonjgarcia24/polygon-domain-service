const main = async () => {
    const [owner, superCoder] = await hre.ethers.getSigners();
    const domainContractFactory = await hre.ethers.getContractFactory('Domains');
    const domainContract = await domainContractFactory.deploy('jinja');
    await domainContract.deployed();

    console.log('Contract deployed to: ', domainContract.address);

    let tx = await domainContract.register(
        'k45w',
        { value: hre.ethers.utils.parseEther('1200') }
    );
    await tx.wait();

    const balance = await hre.ethers.provider.getBalance(domainContract.address);
    console.log('Contract balance before withdrawal: ', hre.ethers.utils.formatEther(balance));

    try {
        tx = await domainContract.connect(superCoder).withdraw();
        await tx.wait();
    }
    catch (err) {
        console.log('Could not rob the contract :)');
    }

    let ownerBalance = await hre.ethers.provider.getBalance(owner.address);
    console.log('Owner balance before withdrawal: ', hre.ethers.utils.formatEther(ownerBalance));

    tx = await domainContract.connect(owner).withdraw();
    await tx.wait();

    const contractBalance = await hre.ethers.provider.getBalance(domainContract.address);
    ownerBalance = await hre.ethers.provider.getBalance(owner.address);

    console.log('Contract balance after withdrawal: ', hre.ethers.utils.formatEther(contractBalance));
    console.log('Owner balance after withdrawal: ', hre.ethers.utils.formatEther(ownerBalance));
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
