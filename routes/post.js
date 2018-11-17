const express = require('express')
const _ = require('lodash')
const { ObjectID } = require('mongodb')
const { authenticate } = require('../middleware/authenticate')
const { Post } = require('../models/post')

const router = express.Router()

router.post('/', authenticate, async (req, res) => {
	try {
		const post = new Post({
			title: req.body.title,
			description: req.body.description,
			before_img: req.body.before_img,
			after_img: req.body.after_img,
			_creator: res.user._id
		})
		const doc = await post.save()

		res.status(200).json(doc)
	} catch (err) {
		res.status(400).send({ error: 'Something went wrong' })
	}
})

router.get('/personal', authenticate, async (_req, res) => {
	try {
		const posts = await Post.find({ _creator: res.user._id })

		res.status(200).json(posts)
	} catch (err) {
		res.status(400).json({ error: 'This user has no posts added' })
	}
})

router.get('/all', authenticate, async (_req, res) => {
	try {
		const posts = await Post.find()

		res.status(200).json(posts)
	} catch (err) {
		res.status(400).json({ error: 'This user has no posts added' })
	}
})

router.get('/:id', authenticate, async (req, res) => {
	try {
		const { id } = req.params

		if (!ObjectID.isValid(id)) {
			return res.status(404).json({ error: 'Invalid ID' })
		}

		const post = await Post.findOne({ _id: id, _creator: res.user._id })
		res.status(200).json(post)
	} catch (err) {
		res.status(400).json({ error: 'Unable to find that post' })
	}
})

router.delete('/:id', authenticate, async (req, res) => {
	try {
		const { id } = req.params

		if (!ObjectID.isValid(id)) {
			return res.status(404).send('Invalid ID')
		}

		const post = await Post.findOneAndRemove({ _id: id, _creator: res.user._id })

		if (!post) {
			return res.status(400).json({ error: 'Unable to delete that post' })
		}

		res.status(200).json({ error: 'Post has been removed successfully!' })
	} catch (err) {
		res.status(400).send({ error: 'Something went wrong' })
	}
})

router.patch('/:id', authenticate, async (req, res) => {
	try {
		const { id } = req.params
		const body = _.pick(req.body, ['title', 'description', 'before_img', 'after_img'])

		if (!ObjectID.isValid(id)) {
			return res.status(404).json({ error: 'Invalid ID' })
		}
		const post = await Post.findOneAndUpdate({
			_id: id,
			_creator: res.user._id
		}, { $set: body }, { new: true })

		if (!post) {
			return res.status(404).json({ error: 'Unable to update that post' })
		}

		res.status(200).json(post)
	} catch (err) {
		res.status(400).send({ error: 'Something went wrong' })
	}
})

router.patch('/vote/before/:id', authenticate, async (req, res) => {
	try {
		const { id } = req.params

		if (!ObjectID.isValid(id)) {
			return res.status(404).json({ error: 'Invalid ID' })
		}

		const data = await Post.findById(id)
		console.log(data)

		const post = await Post.findOneAndUpdate({
			_id: id
		}, {
			$set: {
				before_votes: _.isEmpty(data.before_votes)
					? [...data.before_votes, { _voter: req.body.user_id, voted: true }]
					: (data.before_votes.map(item => item._voter === req.body.user_id
						? { ...item, voted: !item.voted } : item)),
				after_votes: _.isEmpty(data.before_votes)
					? [...data.after_votes, { _voter: req.body.user_id, voted: false }]
					: (data.after_votes.map(item => item._voter === req.body.user_id
						? { ...item, voted: !item.voted } : item))
			}
		},
		{ new: true })

		if (!post) {
			return res.status(404).json({ error: 'Unable to bevote on that post' })
		}

		res.status(200).json(post)
	} catch (err) {
		res.status(400).send({ error: 'Something went wrong' })
	}
})

router.patch('/vote/after/:id', authenticate, async (req, res) => {
	try {
		const { id } = req.params

		if (!ObjectID.isValid(id)) {
			return res.status(404).json({ error: 'Invalid ID' })
		}

		const data = await Post.findById(id)

		const post = await Post.findOneAndUpdate({
			_id: id
		}, { $set: {
			after_votes: _.isEmpty(data.after_votes)
				? [...data.after_votes, { _voter: req.body.user_id, voted: true }]
				: (data.after_votes.map(item => item._voter === req.body.user_id
					? { ...item, voted: !item.voted } : item)),
			before_votes: _.isEmpty(data.before_votes)
				? [...data.before_votes, { _voter: req.body.user_id, voted: false }]
				: (data.before_votes.map(item => item._voter === req.body.user_id
					? { ...item, voted: !item.voted } : item))
		} }, { new: true })

		if (!post) {
			return res.status(404).json({ error: 'Unable to afvote on that post' })
		}

		res.status(200).json(post)
	} catch (err) {
		res.status(400).send({ error: 'Something went wrong' })
	}
})

module.exports = router
