const assert = require('assert');
const moment = require('moment');
const _ = require('lodash');

const DB = require('./../db');
const api = require('./../api');


const INTERVALS = ['1min' , '2min' , '3min' , '5min' , '10min' , '15min' , '30min' , 'hour' , 'day' , 'week' , 'month'];
const DAYS = process.env.DAYS || 3;

/* eslint-disable complexity */
module.exports = async function renderPortfolio (req, res, next) {
  const settings = await DB.Setting.getAllSettings();

  res.render('settings', settings);


};
