const mongoose = require('mongoose')
const uniqueValidator = require('mongoose-unique-validator')

const userScheme = new mongoose.Schema({
  blogs: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Blog',
    },
  ],
  username: {
    type: String,
    required: true,
    unique: true,
    minlength: 3,
  },
  name: String,
  passwordHash: String,
})

userScheme.plugin(uniqueValidator)

userScheme.set('toJSON', {
  transform: (document, returnedObject) => {
    returnedObject.id = returnedObject._id.toString()
    delete returnedObject._id
    delete returnedObject.__v
    delete returnedObject.passwordHash
  },
})

module.exports = mongoose.model('User', userScheme)
