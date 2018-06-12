pragma solidity ^0.4.18;

import "./Ownable.sol";

contract ItemStore is Ownable {
  // custom types
  struct Item {
    uint id;
    address seller;
    address buyer;
    string name;
    string description;
    uint256 price;
  }

  // state variables
  mapping (uint => Item) public items;
  uint itemCounter;

  // events
  event LogSellItem(
    uint indexed _id,
    address indexed _seller,
    string _name,
    uint256 _price
  );
  event LogBuyItem(
    uint indexed _id,
    address indexed _seller,
    address indexed _buyer,
    string _name,
    uint256 _price
  );

  // deactivate the contract
  function kill() public onlyOwner {
    selfdestruct(owner);
  }

  // sell an item
  function sellItem(string _name, string _description, uint256 _price) public {
    // a new item
    itemCounter++;

    // store this item
    items[itemCounter] = Item (
      itemCounter,
      msg.sender,
      0x0,
      _name,
      _description,
      _price
    );

    LogSellItem(itemCounter, msg.sender, _name, _price);
  }

  // fetch the number of items in the contract
  function getNumberOfItems() public view returns (uint) {
    return itemCounter;
  }

  // fetch and return all item IDs for items still for sale
  function getItemsForSale() public view returns (uint[]) {
    // prepare output array
    uint[] memory itemIds = new uint[](itemCounter);

    uint numberOfItemsForSale = 0;
    // iterate over items
    for(uint i = 1; i <= itemCounter;  i++) {
      // keep the ID if the item is still for sale
      if(items[i].buyer == 0x0) {
        itemIds[numberOfItemsForSale] = items[i].id;
        numberOfItemsForSale++;
      }
    }

    // copy the itemIds array into a smaller forSale array
    uint[] memory forSale = new uint[](numberOfItemsForSale);
    for(uint j = 0; j < numberOfItemsForSale; j++) {
      forSale[j] = itemIds[j];
    }
    return forSale;
  }

  // buy an item
  function buyItem(uint _id) payable public {
    // we check whether there is an item for sale
    require(itemCounter > 0);

    // we check that the item exists
    require(_id > 0 && _id <= itemCounter);

    // we retrieve the item
    Item storage item = items[_id];

    // we check that the item has not been sold yet
    require(item.buyer == 0X0);

    // we don't allow the seller to buy his own item
    require(msg.sender != item.seller);

    // we check that the value sent corresponds to the price of the item
    require(msg.value == item.price);

    // keep buyer's information
    item.buyer = msg.sender;

    // the buyer can pay the seller
    item.seller.transfer(msg.value);

    // trigger the event
    LogBuyItem(_id, item.seller, item.buyer, item.name, item.price);
  }
}
