/** Database setup for BizTime. */

const { Client } = require('pg');

const db = new Client();

db.connect();

module.exports = db;