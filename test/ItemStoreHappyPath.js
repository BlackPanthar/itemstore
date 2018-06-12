var ItemStore = artifacts.require("./ItemStore.sol");

// test suite
contract('ItemStore', function(accounts){
  var itemStoreInstance;
  var seller = accounts[1];
  var buyer = accounts[2];
  var itemName1 = "item 1";
  var itemDescription1 = "Description for item 1";
  var itemPrice1 = 10;
  var itemName2 = "item 2";
  var itemDescription2 = "Description for item 2";
  var itemPrice2 = 20;
  var sellerBalanceBeforeBuy, sellerBalanceAfterBuy;
  var buyerBalanceBeforeBuy, buyerBalanceAfterBuy;

  it("should be initialized with empty values", function() {
    return ItemStore.deployed().then(function(instance) {
      itemStoreInstance = instance;
      return itemStoreInstance.getNumberOfItems();
    }).then(function(data) {
      assert.equal(data.toNumber(), 0, "number of items must be zero");
      return itemStoreInstance.getItemsForSale();
    }).then(function(data){
      assert.equal(data.length, 0, "there shouldn't be any item for sale");
    });
  });

  // sell a first item
  it("should let us sell a first item", function() {
    return ItemStore.deployed().then(function(instance){
      itemStoreInstance = instance;
      return itemStoreInstance.sellItem(
        itemName1,
        itemDescription1,
        web3.toWei(itemPrice1, "ether"),
        {from: seller}
      );
    }).then(function(receipt){
      // check event
      assert.equal(receipt.logs.length, 1, "one event should have been triggered");
      assert.equal(receipt.logs[0].event, "LogSellItem", "event should be LogSellItem");
      assert.equal(receipt.logs[0].args._id.toNumber(), 1, "id must be 1");
      assert.equal(receipt.logs[0].args._seller, seller, "event seller must be " + seller);
      assert.equal(receipt.logs[0].args._name, itemName1, "event item name must be " + itemName1);
      assert.equal(receipt.logs[0].args._price.toNumber(), web3.toWei(itemPrice1, "ether"), "event item price must be " + web3.toWei(itemPrice1, "ether"));

      return itemStoreInstance.getNumberOfItems();
    }).then(function(data) {
      assert.equal(data, 1, "number of items must be one");

      return itemStoreInstance.getItemsForSale();
    }).then(function(data) {
      assert.equal(data.length, 1, "there must be one item for sale");
      assert.equal(data[0].toNumber(), 1, "item id must be 1");

      return itemStoreInstance.items(data[0]);
    }).then(function(data) {
      assert.equal(data[0].toNumber(), 1, "item id must be 1");
      assert.equal(data[1], seller, "seller must be " + seller);
      assert.equal(data[2], 0x0, "buyer must be empty");
      assert.equal(data[3], itemName1, "item name must be " + itemName1);
      assert.equal(data[4], itemDescription1, "item description must be " + itemDescription1);
      assert.equal(data[5].toNumber(), web3.toWei(itemPrice1, "ether"), "item price must be " + web3.toWei(itemPrice1, "ether"));
    });
  });

  // sell a second item
  it("should let us sell a second item", function() {
    return ItemStore.deployed().then(function(instance){
      itemStoreInstance = instance;
      return itemStoreInstance.sellItem(
        itemName2,
        itemDescription2,
        web3.toWei(itemPrice2, "ether"),
        {from: seller}
      );
    }).then(function(receipt){
      // check event
      assert.equal(receipt.logs.length, 1, "one event should have been triggered");
      assert.equal(receipt.logs[0].event, "LogSellItem", "event should be LogSellItem");
      assert.equal(receipt.logs[0].args._id.toNumber(), 2, "id must be 2");
      assert.equal(receipt.logs[0].args._seller, seller, "event seller must be " + seller);
      assert.equal(receipt.logs[0].args._name, itemName2, "event item name must be " + itemName2);
      assert.equal(receipt.logs[0].args._price.toNumber(), web3.toWei(itemPrice2, "ether"), "event item price must be " + web3.toWei(itemPrice2, "ether"));

      return itemStoreInstance.getNumberOfItems();
    }).then(function(data) {
      assert.equal(data, 2, "number of items must be two");

      return itemStoreInstance.getItemsForSale();
    }).then(function(data) {
      assert.equal(data.length, 2, "there must be two items for sale");
      assert.equal(data[1].toNumber(), 2, "item id must be 2");

      return itemStoreInstance.items(data[1]);
    }).then(function(data) {
      assert.equal(data[0].toNumber(), 2, "item id must be 2");
      assert.equal(data[1], seller, "seller must be " + seller);
      assert.equal(data[2], 0x0, "buyer must be empty");
      assert.equal(data[3], itemName2, "item name must be " + itemName2);
      assert.equal(data[4], itemDescription2, "item description must be " + itemDescription2);
      assert.equal(data[5].toNumber(), web3.toWei(itemPrice2, "ether"), "item price must be " + web3.toWei(itemPrice2, "ether"));
    });
  });

  // buy the first item
  it("should buy an item", function(){
    return ItemStore.deployed().then(function(instance) {
      itemStoreInstance = instance;
      // record balances of seller and buyer before the buy
      sellerBalanceBeforeBuy = web3.fromWei(web3.eth.getBalance(seller), "ether").toNumber();
      buyerBalanceBeforeBuy = web3.fromWei(web3.eth.getBalance(buyer), "ether").toNumber();
      return itemStoreInstance.buyItem(1, {
        from: buyer,
        value: web3.toWei(itemPrice1, "ether")
      });
    }).then(function(receipt){
      assert.equal(receipt.logs.length, 1, "one event should have been triggered");
      assert.equal(receipt.logs[0].event, "LogBuyItem", "event should be LogBuyItem");
      assert.equal(receipt.logs[0].args._id.toNumber(), 1, "item id must be 1");
      assert.equal(receipt.logs[0].args._seller, seller, "event seller must be " + seller);
      assert.equal(receipt.logs[0].args._buyer, buyer, "event buyer must be " + buyer);
      assert.equal(receipt.logs[0].args._name, itemName1, "event item name must be " + itemName1);
      assert.equal(receipt.logs[0].args._price.toNumber(), web3.toWei(itemPrice1, "ether"), "event item price must be " + web3.toWei(itemPrice1, "ether"));

      // record balances of buyer and seller after the buy
      sellerBalanceAfterBuy = web3.fromWei(web3.eth.getBalance(seller), "ether").toNumber();
      buyerBalanceAfterBuy = web3.fromWei(web3.eth.getBalance(buyer), "ether").toNumber();

      // check the effect of buy on balances of buyer and seller, accounting for gas
      assert(sellerBalanceAfterBuy == sellerBalanceBeforeBuy + itemPrice1, "seller should have earned " + itemPrice1 + " ETH");
      assert(buyerBalanceAfterBuy <= buyerBalanceBeforeBuy - itemPrice1, "buyer should have spent " + itemPrice1 + " ETH");

      return itemStoreInstance.getItemsForSale();
    }).then(function(data){
      assert.equal(data.length, 1, "there should now be only 1 item left for sale");
      assert.equal(data[0].toNumber(), 2, "item 2 should be the only item left for sale");

      return itemStoreInstance.getNumberOfItems();
    }).then(function(data){
      assert.equal(data.toNumber(), 2, "there should still be 2 items in total");
    });
  });
});
