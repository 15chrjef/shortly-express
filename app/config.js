var path = require('path');
var knex = require('knex')({
  client: 'sqlite3',
  connection: {
    filename: path.join(__dirname, '../db/shortly.sqlite')
  },
  useNullAsDefault: true
});
var db = require('bookshelf')(knex);

db.knex.schema.hasTable('urls').then(function(exists) {
  if (!exists) {
    db.knex.schema.createTable('urls', function (link) {
      link.increments('id').primary();
      link.string('url', 255);
      link.string('baseUrl', 255);
      link.string('code', 100);
      link.string('title', 255);
      link.integer('visits');
      link.timestamps();
    }).then(function (table) {
      console.log('Created Table', table);
    });
  }
});

db.knex.schema.hasTable('clicks').then(function(exists) {
  if (!exists) {
    db.knex.schema.createTable('clicks', function (click) {
      click.increments('id').primary();
      click.integer('linkId');
      click.timestamps();
    }).then(function (table) {
      console.log('Created Table', table);
    });
  }
});

/************************************************************/
// Add additional schema definitions below
/************************************************************/

db.knex.schema.hasTable('users').then(function (exists) {
  if (!exists) {
    db.knex.schema.createTable('users', function(user) {
      user.increments('id').primary();
      user.string('username', 16);
      user.string('password', 32);
      user.string('salt', 16);
    }).then(function(table) {
      console.log('Create Table', table);
    });
  }
});

// db.knex.schema.hasTable('userSessions').then(function(exists) {
//   if (!exists) {
//     db.knex.schema.createTable('userSessions', function(session) {
//       session.increments('id').primary();
//       session.integer('userId', 5);
//       session.string('sessionId', 16);
//       session.integer('maxAge', 16);
//     }).then(function(table) {
//       console.log('Create Table', table);
//     });
//   }
// });

module.exports = db;
