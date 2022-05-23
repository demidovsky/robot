const MORE_DEALS = (process.env.MORE_DEALS === 'true');

module.exports = function MAcondition (fast, slow, isMoreDeals) {
  if (isMoreDeals || MORE_DEALS) {
    // больше срабатываний
    return Math.round(100 * fast / slow) / 100 <= 0.99;
  } else {
    return (fast / slow) < 0.99;
  }
};