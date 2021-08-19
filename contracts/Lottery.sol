// linter warnings (red underline) about pragma version can igonored!
pragma solidity ^0.4.17;

// contract code will go here
contract Lottery {
    address public manager;
    address[] public players;

    function Lottery() public {
        // every time a new lottery is created, get the creator's address and assign to manager vairable
        manager = msg.sender;
    }

    function enter() public payable {
        require(msg.value > .01 ether);

        players.push(msg.sender);
    }

    function random() private view returns (uint) {
       return uint(keccak256(block.difficulty, now, players));
    }

    function pickWinner() public onlyManagerCanCall {
        uint index = random() % players.length;
        players[index].transfer(this.balance);
        players = new address[](0);
    }

    modifier onlyManagerCanCall() {
        require (msg.sender == manager);
        _;
    }

    function getPlayers() public view returns (address[]) {
        return players;
    }
}