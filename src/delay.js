module.exports = async function delay (sec) {
  return new Promise(resolve => {
    setTimeout(resolve, sec * 1000);
  });
};