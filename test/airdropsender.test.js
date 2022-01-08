const { expect } = require("chai");
const { BigNumber, utils } = require('ethers');
const { MerkleTree } = require('./helpers/merkleTree.js');
const { RawData } = require('./helpers/rawData.js');
let recipients// = require('./helpers/recipients.json');

// let recipients;
getRecipients = async () => {
  let rawData = new RawData();
  let holders = await rawData.getHolderDataFromLockTao();
  holders = JSON.parse(holders);
  let temp = [];
  for(let i=0; i<holders.length; i++) {

    let air_amount = 0;
    const a = BigNumber.from(holders[i].amount);
    air_amount = a.div(10**holders[i].decimals);
    temp.push({account: utils.getAddress(holders[i].account), amount: Number(BigNumber.from(air_amount)) });

    if(i > 50) {
      return JSON.stringify(temp);
    }
  }
  // recipients = holders.map((item, i) => {
  //   let air_amount = 0;
  //   const a = BigNumber.from(item.amount);
  //   // if(a.div(10**recipient.decimals).toNumber() > 10**3) {
  //   //   air_amount = 20;
  //   // }
  //   air_amount = a.div(10**item.decimals).toNumber();
  //   return {
  //     account: utils.getAddress(item.account),
  //     amount: BigNumber.from(air_amount)
  //   }
  // });
}

describe("Airdrop tokens to a recipient", async function() {
  let root;
  let token;
  let proofs;
  let merkleTree;
  let airdropSender; 

  recipients = await getRecipients();
  recipients = JSON.parse(recipients);
  // recipients = recipients.map((recipient) => ({
  //   account: utils.getAddress(recipient.account),
  //   amount: BigNumber.from(recipient.amount)
  // }));

  before(async () => {
    const ERC20Token = await ethers.getContractFactory("AirdropToken");
    token = await ERC20Token.deploy("AirdropToken", "ADT", 1000000000);

    merkleTree = new MerkleTree(recipients);
    root = merkleTree.getHexRoot();
    // console.log("===root::", root);
    proofs = recipients.map((item, i) =>
        merkleTree.getHexProof(i, item.account, item.amount)
    );

    const AirdropSender = await ethers.getContractFactory("AirdropSender");
    airdropSender = await AirdropSender.deploy(token.address, root) ;
    await token.setBalance(airdropSender.address, 10000);
    await airdropSender.deployed();    
  });


  it('should return false for an unclaimed airdrop', async () => {
    const index = 0;
    expect(await airdropSender.isClaimed(index)).to.equal(false);
  });

  it('should revert when any of the send input is invalid', async() => {
    const index = 0;
    const proof = proofs[0];
    const recipient = recipients[0];

    const invalidAmount = 15;
    await expect(airdropSender.send(index, recipient.account, invalidAmount, proof))
        .to.be.revertedWith("AirdropSender: Invalid proof");

    const invalidAccount = recipients[1].account;
    await expect(airdropSender.send(index, invalidAccount, invalidAmount, proof))
        .to.be.revertedWith("AirdropSender: Invalid proof");

    const invalidIndex = 6;
    await expect(airdropSender.send(invalidIndex, recipient.account, recipient.amount, proof))
        .to.be.revertedWith("AirdropSender: Invalid proof");
  });

  it('should not air drop tokens from an invalid address', async() => {
    const invalidSigner = (await ethers.getSigners())[2];

    const index = 0;
    const recipient = recipients[0];
    const proof = proofs[0];
    expect(await airdropSender.isClaimed(index)).to.equal(false);

    await expect( airdropSender.connect(invalidSigner)
        .send(index, recipient.account, recipient.amount, proof
    )).to.be.revertedWith("Ownable: caller is not the owner");
  })

  it('should air drop tokens to a recipient', async() => {
    const index = 2;
    const recipient = recipients[2];
    const proof = proofs[2];
    expect(await airdropSender.isClaimed(index)).to.equal(false);
    // console.log("==proof, recipient::", proof, recipient.account, recipient.amount);
    expect(await airdropSender.send(index, recipient.account, recipient.amount, proof))
        .to
        .emit(airdropSender, 'AirdropSent')
        .withArgs(index, recipient.account, recipient.amount);
  })

  it('should return true for a claimed airdrop', async () => {
    const index = 2;
    expect(await airdropSender.isClaimed(index)).to.equal(true);
  });

  it('should ensure that recipient received correct airdrop amount', async () => {
    const recipient = recipients[2];
    expect((await token.balanceOf(recipient.account)).toNumber()).to.equal(recipient.amount);
  });
});

describe("Airdrop tokens to many recipients", function() {
  let root;
  let token;
  let proofs;
  let merkleTree;
  let airdropSender;

  // recipients = getRecipients();
  // recipients = recipients.map((recipient) => ({
  //   account: utils.getAddress(recipient.account),
  //   amount: BigNumber.from(recipient.amount)
  // }));

  before(async () => {
    const ERC20Token = await ethers.getContractFactory("AirdropToken");
    token = await ERC20Token.deploy("AirdropToken", "ADT", 1000000000);

    merkleTree = new MerkleTree(recipients);
    root = merkleTree.getHexRoot();

    proofs = recipients.map((recipient, index) =>
        merkleTree.getHexProof(index, recipient.account, recipient.amount)
    );

    const AirdropSender = await ethers.getContractFactory("AirdropSender");
    airdropSender = await AirdropSender.deploy(token.address, root) ;
    await token.setBalance(airdropSender.address, 100000000);
    await airdropSender.deployed();
    
    console.log("==token-balance::", 
    Number(BigNumber.from(await token.balanceOf(airdropSender.address))), 
    await token.decimals(), Number(BigNumber.from(await token.totalSupply())));
  });

  it('should not airdrop tokens if total airdrop amount is greater than token balance', async() => {

    const accounts = recipients.map((recipient) => recipient.account);
    const amounts = recipients.map((recipient) => recipient.amount * 1000);
    await expect(airdropSender.sendToMany(accounts, amounts, proofs))
        .to.be.revertedWith("total amount should not be greater than balance");
  });

  it('should not airdrop tokens if singer is invalid', async() => {
    const invalidSigner = (await ethers.getSigners())[2];

    const accounts = recipients.map((recipient) => recipient.account);
    const amounts = recipients.map((recipient) => recipient.amount);
    await expect(airdropSender.connect(invalidSigner).sendToMany(accounts, amounts, proofs))
        .to.be.revertedWith("Ownable: caller is not the owner");
  });

  it('should airdrop tokens to many recipients', async() => {
    const accounts = recipients.map((recipient) => recipient.account);
    const amounts = recipients.map((recipient) => recipient.amount);
    console.log("===amounts::", JSON.stringify(amounts))
    expect(await airdropSender.sendToMany(accounts, amounts, proofs))
        .to
        .emit(airdropSender, 'AirdropSentToMany')
        .withArgs(accounts, amounts);

        
    console.log("==after airdrop, balance::", 
    Number(BigNumber.from(await token.balanceOf(airdropSender.address))), 
    Number(BigNumber.from(await token.balanceOf(accounts[0]))), 
    Number(BigNumber.from(await token.balanceOf(accounts[1]))));
  });
});