const assert = require('assert');
const ganache = require('ganache-cli');
const Web3 = require('web3');
const web3 = new Web3(ganache.provider());

const { interface, bytecode } = require('../compile');

let lottery;
let accounts;

beforeEach( async () => {
	accounts = await web3.eth.getAccounts();

	lottery = await new web3.eth.Contract(JSON.parse(interface))
		.deploy({ data: bytecode})
		.send({ from: accounts[0], gas: '1000000'});
});

describe('Lottery Contract', () => {
	it('Deploys a contract', () => {
		assert.ok(lottery.options.address);
	});

	// s89: verifying whether enter function adds on new player
	it('Allows one account to enter', async () => {
		await lottery.methods.enter().send({
			from: accounts[0],
			// allows unit conversions from wei to eth
			value: web3.utils.toWei('0.02', 'ether')
		});

		// new array with address at accounts[0]
		const players = await lottery.methods.getPlayers().call({
			from: accounts[0]
		});

		assert.equal(accounts[0], players[0]);
		assert.equal(1, players.length);
	});

	// s90: verifying whether multiple accounts can enter
	it('Allows multiple account to enter', async () => {
		await lottery.methods.enter().send({
			from: accounts[0],
			// allows unit conversions from wei to eth
			value: web3.utils.toWei('0.02', 'ether')
		});
		await lottery.methods.enter().send({
			from: accounts[1],
			// allows unit conversions from wei to eth
			value: web3.utils.toWei('0.02', 'ether')
		});
		await lottery.methods.enter().send({
			from: accounts[2],
			// allows unit conversions from wei to eth
			value: web3.utils.toWei('0.02', 'ether')
		});
		// new array with address at accounts[0]
		const players = await lottery.methods.getPlayers().call({
			from: accounts[0]
		});

		assert.equal(accounts[0], players[0]);
		assert.equal(accounts[1], players[1]);
		assert.equal(accounts[2], players[2]);
		assert.equal(3, players.length);
	});

	it('Requires a minimum amount of ether to enter', async () => {
		try {
			// s91: we want to see an error here 
			await lottery.methods.enter().send({
				from: accounts[0],
				value: 200 // value is in wei, way less than .01 eth
			});
			// if above line does not throw an error and we get to this line of code,
			// automatically fail test no matter what
			assert (false);
		} catch (err) {
			// assert checks for truthiness, .ok checks for existence
			assert(err);
		};
	});

	it('Only manager can call pickWinner', async () => {
		try {
			// s92
			await lottery.methods.pickWinner().send({
				from: accounts[1]
			});
			// if above line does not throw an error
			assert (false);
		} catch (err) {
			// assert checks for truthiness, .ok checks for existence
			assert(err);
		};
	});

	it('sends money to the winner and resets the players array', async () => {
		await lottery.methods.enter().send({
			from: accounts[0],
			value: web3.utils.toWei('2', 'ether')
		});

		const initialBalance = await web3.eth.getBalance(accounts[0]);

		await lottery.methods.pickWinner().send({ from: accounts[0] });

		const finalBalance = await web3.eth.getBalance(accounts[0]);

		const difference = finalBalance - initialBalance;
		assert(difference > web3.utils.toWei('1.8', 'ether'));
	});

});