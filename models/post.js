const mongoose = require('mongoose')

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
	before_votes: [{
		_voter: {
			type: mongoose.Schema.Types.ObjectId
		},
		voted: {
			type: Boolean,
			default: false
		}
	}],
	after_votes: [{
		_voter: {
			type: mongoose.Schema.Types.ObjectId,
		},
		voted: {
			type: Boolean,
			default: false
		}
	}],
	date: {
		type: Date,
		default: Date.now()
	},
	_creator: {
		type: mongoose.Schema.Types.ObjectId,
		required: true
	}
})

module.exports = { Post }
