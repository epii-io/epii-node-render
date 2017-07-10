module.exports = async function () {
  console.log('module a')
  var result = await testAsync()
  if (result.body) {
    console.log(result.body)
  }
}

async function testAsync() {
  return { body: 'async a' }
}
