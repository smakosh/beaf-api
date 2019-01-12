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
	category: {
		type: String,
		required: true,
		default: 'entertainment'
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
		default: moment().utc()
	},
	comments: [],
	_creator: {
		type: mongoose.Schema.Types.ObjectId,
		required: true
	},
	_creator_username: {
		type: String,
		required: true
	},
	private: {
		type: Boolean,
		required: true,
		default: false
	}
})

module.exports = { Post }
