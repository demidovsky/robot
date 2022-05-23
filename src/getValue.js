module.exports = function getValue({
  currency,
  value,
  units, // v2
  nano,  // v2
}, rubusd) {
  if (!value && !units) return 0;
  const val = value || parseFloat(`${units}.${nano}`);
  if (currency?.toLowerCase() === 'rub') {
    return Math.round(val / rubusd * 100) / 100;
  } else {
    return val;
  }
};
