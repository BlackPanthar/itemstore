// contract to be tested
var ItemStore = artifacts.require("./ItemStore.sol");

// test suite
contract("ItemStore", function(accounts){
  var itemStoreInstance;
  var seller = accounts[1];
  var buyer = accounts[2];
  var itemName = "item 1";
  var itemDescription = "Description for item 1";
  var itemPrice = 10;

  // no item for sale yet
  it("should throw an exception if you try to buy an item when there is no item for sale yet", function() {
    return ItemStore.deployed().then(function(instance) {
      itemStoreInstance = instance;
      return itemStoreInstance.buyItem(1, {
        from: buyer,
        value: web3.toWei(itemPrice, "ether")
      });
    }).then(assert.fail)
    .catch(function(error){
      assert(true);
    }).then(function() {
      return itemStoreInstance.getNumberOfItems();
    }).then(function(data) {
      assert.equal(data.toNumber(), 0, "number of items must be 0");
    });
  });

  // buy an item that does not exist
  it("should throw an exception if you try to buy an item that does not exist", function(){
    return ItemStore.deployed().then(function(instance){
      itemStoreInstance = instance;
      return itemStoreInstance.sellItem(itemName, itemDescription, web3.toWei(itemPrice, "ether"), { from: seller });
    }).then(function(receipt){
      return itemStoreInstance.buyItem(2, {from: seller, value: web3.toWei(itemPrice, "ether")});
    }).then(assert.fail)
    .catch(function(error) {
      assert(true);
    }).then(function() {
      return itemStoreInstance.items(1);
    }).then(function(data) {
      assert.equal(data[0].toNumber(), 1, "item id must be 1");
      assert.equal(data[1], seller, "seller must be " + seller);
      assert.equal(data[2], 0x0, "buyer must be empty");
      assert.equal(data[3], itemName, "item name must be " + itemName);
      assert.equal(data[4], itemDescription, "item description must be " + itemDescription);
      assert.equal(data[5].toNumber(), web3.toWei(itemPrice, "ether"), "item price must be " + web3.toWei(itemPrice, "ether"));
    });
  });

  // buying an item you are selling
  it("should throw an exception if you try to buy your own item", function() {
    return ItemStore.deployed().then(function(instance){
      itemStoreInstance = instance;

      return itemStoreInstance.buyItem(1, {from: seller, value: web3.toWei(itemPrice, "ether")});
    }).then(assert.fail)
    .catch(function(error){
      assert(true);
    }).then(function() {
      return itemStoreInstance.items(1);
    }).then(function(data) {
      assert.equal(data[0].toNumber(), 1, "item id must be 1");
      assert.equal(data[1], seller, "seller must be " + seller);
      assert.equal(data[2], 0x0, "buyer must be empty");
      assert.equal(data[3], itemName, "item name must be " + itemName);
      assert.equal(data[4], itemDescription, "item description must be " + itemDescription);
      assert.equal(data[5].toNumber(), web3.toWei(itemPrice, "ether"), "item price must be " + web3.toWei(itemPrice, "ether"));
    });
  });

  // incorrect value
  it("should throw an exception if you try to buy an item for a value different from its price", function() {
    return ItemStore.deployed().then(function(instance){
      itemStoreInstance = instance;
      return itemStoreInstance.buyItem(1, {from: buyer, value: web3.toWei(itemPrice + 1, "ether")});
    }).then(assert.fail)
    .catch(function(error){
      assert(true);
    }).then(function() {
      return itemStoreInstance.items(1);
    }).then(function(data) {
      assert.equal(data[0].toNumber(), 1, "item id must be 1");
      assert.equal(data[1], seller, "seller must be " + seller);
      assert.equal(data[2], 0x0, "buyer must be empty");
      assert.equal(data[3], itemName, "item name must be " + itemName);
      assert.equal(data[4], itemDescription, "item description must be " + itemDescription);
      assert.equal(data[5].toNumber(), web3.toWei(itemPrice, "ether"), "item price must be " + web3.toWei(itemPrice, "ether"));
    });
  });

  // item has already been sold
  it("should throw an exception if you try to buy an item that has already been sold", function() {
    return ItemStore.deployed().then(function(instance){
      itemStoreInstance = instance;
      return itemStoreInstance.buyItem(1, {from: buyer, value: web3.toWei(itemPrice, "ether")});
    }).then(function(){
      return itemStoreInstance.buyItem(1, {from: web3.eth.accounts[0], value: web3.toWei(itemPrice, "ether")});
    }).then(assert.fail)
    .catch(function(error){
      assert(true);
    }).then(function() {
      return itemStoreInstance.items(1);
    }).then(function(data) {
      assert.equal(data[0].toNumber(), 1, "item id must be 1");
      assert.equal(data[1], seller, "seller must be " + seller);
      assert.equal(data[2], buyer, "buyer must be " + buyer);
      assert.equal(data[3], itemName, "item name must be " + itemName);
      assert.equal(data[4], itemDescription, "item description must be " + itemDescription);
      assert.equal(data[5].toNumber(), web3.toWei(itemPrice, "ether"), "item price must be " + web3.toWei(itemPrice, "ether"));
    });
  });
});
