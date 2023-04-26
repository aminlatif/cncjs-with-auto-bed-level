const delay = (t, v) => new Promise(resolve => {
  setTimeout(resolve.bind(null, v), t);
});

module.exports = delay;
