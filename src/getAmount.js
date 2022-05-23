const AMOUNT = [
  { maxPrice: 1000, amount: 2 },
  { maxPrice: 500, amount: 2 },
  { maxPrice: 300, amount: 3 },
  { maxPrice: 250, amount: 4 },
  { maxPrice: 200, amount: 5 },
  { maxPrice: 150, amount: 7 },
  { maxPrice: 100, amount: 10 },
  { maxPrice: 70, amount: 15 },
];

module.exports = function getAmount(price, settingsAmount) {
	if (settingsAmount === null) {
		let result = 1;
	  AMOUNT.forEach(({ maxPrice, amount }) => {
	    if (price < maxPrice) result = amount;
	  });
	  return result;
	} else {
		return settingsAmount;
	}
};
