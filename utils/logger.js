const info = (...params) => {
  if (process.env.NODE_MODE !== 'test') {
    console.log(params)
  }
}

const error = (...params) => {
  if (process.env.NODE_MODE !== 'test') {
    console.log(params)
  }
}

module.exports = { info, error }
