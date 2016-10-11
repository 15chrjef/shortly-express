var db = require('../config');
var bcrypt = require('bcrypt-nodejs');
var Promise = require('bluebird');



var User = db.Model.extend({
  tableName: 'users'

  // initialize: function() {
  //   this.on('creating', () => {
  //     this.set('salt', function() {
  //       return (Math.floor(Math.random() * 100000000) * Date.now()).toString(36);
  //     });
      
  //   });

  // }

});

module.exports = User;