App = {
  web3Provider: null,
  contracts: {},
  account: 0x0,
  loading: false,

  init: function() {
    return App.initWeb3();
  },

  initWeb3: function() {
    // initialize web3
    if(typeof web3 !== 'undefined') {
      //reuse the provider of the Web3 object injected by Metamask
      App.web3Provider = web3.currentProvider;
    } else {
      //create a new provider and plug it directly into our local node
      App.web3Provider = new Web3.providers.HttpProvider('http://localhost:7545');
    }
    web3 = new Web3(App.web3Provider);

    App.displayAccountInfo();

    return App.initContract();
  },

  displayAccountInfo: function() {
    web3.eth.getCoinbase(function(err, account) {
      if(err === null) {
        App.account = account;
        $('#account').text(account);
        web3.eth.getBalance(account, function(err, balance) {
          if(err === null) {
            $('#accountBalance').text(web3.fromWei(balance, "ether") + " ETH");
          }
        })
      }
    });
  },

  initContract: function() {
    $.getJSON('ItemStore.json', function(itemStoreArtifact) {
      // get the contract artifact file and use it to instantiate a truffle contract abstraction
      App.contracts.ItemStore = TruffleContract(itemStoreArtifact);
      // set the provider for our contracts
      App.contracts.ItemStore.setProvider(App.web3Provider);
      // listen to events
      App.listenToEvents();
      // retrieve the item from the contract
      return App.reloadItems();
    });
  },

  reloadItems: function() {
    // avoid reentry
    if(App.loading) {
      return;
    }
    App.loading = true;

    // refresh account information because the balance might have changed
    App.displayAccountInfo();

    var itemStoreInstance;

    App.contracts.ItemStore.deployed().then(function(instance) {
      itemStoreInstance = instance;
      return itemStoreInstance.getItemsForSale();
    }).then(function(itemIds) {
      // retrieve the item placeholder and clear it
      $('#itemsRow').empty();

      for(var i = 0; i < itemIds.length; i++) {
        var itemId = itemIds[i];
        itemStoreInstance.items(itemId.toNumber()).then(function(item){
          App.displayItem(item[0], item[1], item[3], item[4], item[5]);
        });
      }
      App.loading = false;
    }).catch(function(err) {
      console.error(err.message);
      App.loading = false;
    });
  },

  displayItem: function(id, seller, name, description, price) {
    var itemsRow = $('#itemsRow');

    var etherPrice = web3.fromWei(price, "ether");

    var itemTemplate = $("#itemTemplate");
    itemTemplate.find('.panel-title').text(name);
    itemTemplate.find('.item-description').text(description);
    itemTemplate.find('.item-price').text(etherPrice + " ETH");
    itemTemplate.find('.btn-buy').attr('data-id', id);
    itemTemplate.find('.btn-buy').attr('data-value', etherPrice);

    // seller
    if (seller == App.account) {
      itemTemplate.find('.item-seller').text("You");
      itemTemplate.find('.btn-buy').hide();
    } else {
      itemTemplate.find('.item-seller').text(seller);
      itemTemplate.find('.btn-buy').show();
    }

    // add this new item
    itemsRow.append(itemTemplate.html());
  },

  sellItem: function() {
    // retrieve the detail of the item
    var _item_name = $('#item_name').val();
    var _description = $('#item_description').val();
    var _price = web3.toWei(parseFloat($('#item_price').val() || 0), "ether");

    if((_item_name.trim() == '') || (_price == 0)) {
      // nothing to sell
      return false;
    }

    App.contracts.ItemStore.deployed().then(function(instance) {
      return instance.sellItem(_item_name, _description, _price, {
        from: App.account,
        gas: 500000
      });
    }).then(function(result) {

    }).catch(function(err) {
      console.error(err);
    });
  },

  // listen to events triggered by the contract
  listenToEvents: function() {
    App.contracts.ItemStore.deployed().then(function(instance) {
      instance.LogSellItem({}, {}).watch(function(error, event) {
        if (!error) {
          $("#events").append('<li class="list-group-item">' + event.args._name + ' is now for sale</li>');
        } else {
          console.error(error);
        }
        App.reloadItems();
      });

      instance.LogBuyItem({}, {}).watch(function(error, event) {
        if (!error) {
          $("#events").append('<li class="list-group-item">' + event.args._buyer + ' bought ' + event.args._name + '</li>');
        } else {
          console.error(error);
        }
        App.reloadItems();
      });
    });
  },

  buyItem: function() {
    event.preventDefault();

    // retrieve the item
    var _itemId = $(event.target).data('id');
    var _price = parseFloat($(event.target).data('value'));

    App.contracts.ItemStore.deployed().then(function(instance){
      return instance.buyItem(_itemId, {
        from: App.account,
        value: web3.toWei(_price, "ether"),
        gas: 500000
      });
    }).catch(function(error) {
      console.error(error);
    });
  }
};

$(function() {
  $(window).load(function() {
    App.init();
  });
});
