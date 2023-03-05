const ListHelper = require('../utils/list_helper')

test('dummy returns one', () => {
  const blogs = []
  const results = ListHelper.dummy(blogs)
  expect(results).toBe(1)
})