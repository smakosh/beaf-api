const mongoose = require('mongoose')
const moment = require('moment')

const Post = mongoose.model('Post', {
	title: {
		type: String,
		required: true
	},
	description: {
		type: String,
		required: true,
		trim: true
	},
	before_img: {
		type: String,
		required: true
	},
	after_img: {
		type: String,
		required: true
	},
	before_votes: [],
	after_votes: [],
	date: {
		type: Date,
		default: moment()
	},
	comments: [],
	_creator: {
		type: mongoose.Schema.Types.ObjectId,
		required: true
	},
	_creator_username: {
		type: String,
		required: true
	}
})

module.exports = { Post }
