const express = require('express')
const uuidv1 = require('uuid/v1')
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
			_creator: res.user._id,
			_creator_username: res.user.username
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


router.get('/all', async (_req, res) => {
	try {
		const unorderedPosts = await Post.find()
		const posts = await unorderedPosts.sort((a, b) => (a.date < b.date ? 1 : -1))
		res.status(200).json(posts)
	} catch (err) {
		res.status(400).json({ error: 'This user has no posts added' })
	}
})

router.get('/user/:user_id', async (req, res) => {
	try {
		const unorderedPosts = await Post.find({ _creator: req.params.user_id })
		const posts = await unorderedPosts.sort((a, b) => (a.date < b.date ? 1 : -1))
		res.status(200).json(posts)
	} catch (err) {
		res.status(400).json({ error: 'This user has no posts added' })
	}
})

router.get('/:id', async (req, res) => {
	try {
		const { id } = req.params

		if (!ObjectID.isValid(id)) {
			return res.status(404).json({ error: 'Invalid ID' })
		}

		const post = await Post.findOne({ _id: id })
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

		const query = {
			_id: id,
			before_votes: { $not: { $elemMatch: { $eq: req.body.user_id } } },
			after_votes: { $not: { $elemMatch: { $eq: req.body.user_id } } }
		}

		const update = {
			$addToSet: { before_votes: req.body.user_id }
		}

		const updated = await Post.updateOne(query, update)

		if (!updated) {
			return res.status(404).json({ error: 'Unable to bevote on that post' })
		}

		res.status(200).json(updated)
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

		const query = {
			_id: id,
			after_votes: { $not: { $elemMatch: { $eq: req.body.user_id } } },
			before_votes: { $not: { $elemMatch: { $eq: req.body.user_id } } }
		}

		const update = {
			$addToSet: { after_votes: req.body.user_id }
		}

		const updated = await Post.updateOne(query, update)

		if (!updated) {
			return res.status(404).json({ error: 'Unable to bevote on that post' })
		}

		res.status(200).json(updated)
	} catch (err) {
		res.status(400).send({ error: 'Something went wrong' })
	}
})

router.post('/comment/:id', authenticate, async (req, res) => {
	try {
		const { id } = req.params
		const { comment } = req.body

		const post = await Post.findById(id)
		const today = new Date()
		const newComment = {
			_id: uuidv1(),
			creator_id: res.user._id,
			creator_username: res.user.username,
			comment,
			date: today.toISOString()
		}

		await post.comments.unshift(newComment)

		const resPost = await post.save()
		res.json(resPost)
	} catch (err) {
		res.status(404).json({ error: 'Something went wrong' })
	}
})

module.exports = router
