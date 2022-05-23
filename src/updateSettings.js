const DB = require('./db');

module.exports = async function updateSettings (req, res, next) {
  for (const key in req.body) {
    let value = req.body[key];
    if (value) {
      if (value === 'on') value = true;
      if (value === 'off') value = false;
      await DB.Setting.updateSetting(key, value);
    } else {
      await DB.Setting.clearSetting(key);
    }
  }

  res.send(req.body);
};
