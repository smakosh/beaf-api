const express = require('express')
const _ = require('lodash')
const { ObjectID } = require('mongodb')
const { authenticate } = require('../middleware/authenticate')
const { Post } = require('../models/post')
const { User } = require('../models/user')

const router = express.Router()

const categories = [
	'entertainment',
	'sports',
	'politics',
	'gaming',
	'movies',
	'memes',
	'automotive',
	'fashion',
	'food',
	'tech',
	'science',
	'animals',
	'photography',
	'travel'
]

router.post('/', authenticate, async (req, res) => {
	try {
		if (!categories.includes(req.body.category)) {
			return res.status(401).send({ error: 'Invalid category' })
		}

		const post = new Post({
			title: req.body.title,
			description: req.body.description,
			before_img: req.body.before_img,
			after_img: req.body.after_img,
			category: req.body.category,
			_creator: res.user._id,
			_creator_username: res.user.username,
			private: req.body.private,
			unbiased: req.body.unbiased
		})
		const doc = await post.save()

		res.status(200).json(doc)
	} catch (err) {
		res.status(400).send({ error: 'Couldn\'t create a new post!' })
	}
})

router.post('/personal', authenticate, async (_req, res) => {
	try {
		const posts = await Post.find({ _creator: res.user._id }).sort({ date: -1 })
		res.status(200).json(posts)
	} catch (err) {
		res.status(400).json({ error: 'This user has no posts added' })
	}
})


router.post('/all', async (req, res) => {
	try {
		const token = req.header('x-auth')

		if (token) {
			try {
				const user = await User.findByToken(token)
				if (user) {
					// get following posts
					const posts = await Post.find({
						_creator: {
							$in: [user._id, ...user.following]
						}
					}).sort({ date: -1 }).limit(20)
					res.status(200).json(posts)
				} else {
					const posts = await Post.find({ private: false, unbiased: false }).sort({ date: -1 }).limit(20)
					res.status(200).json(posts)
				}
			} catch (err) {
				const posts = await Post.find({ private: false, unbiased: false }).sort({ date: -1 }).limit(20)
				res.status(200).json(posts)
			}
		} else {
			const posts = await Post.find({ private: false, unbiased: false }).sort({ date: -1 }).limit(20)
			res.status(200).json(posts)
		}
	} catch (err) {
		res.status(400).json({ error: 'No posts are available' })
	}
})

router.post('/category/:category', async (req, res) => {
	try {
		const { category } = req.params
		const token = req.header('x-auth')

		if (!categories.includes(category)) {
			return res.status(401).send({ error: 'Invalid category' })
		}

		if (token) {
			try {
				const user = await User.findByToken(token)
				if (user) {
					const posts = await Post.find({ category }).sort({ date: -1 }).limit(20)
					res.status(200).json(posts)
				} else {
					const posts = await Post.find({ category, private: false }).sort({ date: -1 }).limit(20)
					res.status(200).json(posts)
				}
			} catch (err) {
				const posts = await Post.find({ category, private: false }).sort({ date: -1 }).limit(20)
				res.status(200).json(posts)
			}
		} else {
			const posts = await Post.find({ category, private: false }).sort({ date: -1 }).limit(20)
			res.status(200).json(posts)
		}
	} catch (err) {
		res.status(400).json({ error: 'that category has no posts yet' })
	}
})

router.post('/user/:user_id', async (req, res) => {
	try {
		const token = req.header('x-auth')

		if (token) {
			try {
				const user = await User.findByToken(token)
				if (user) {
					const posts = await Post.find({ _creator: req.params.user_id })
						.sort({ date: -1 }).limit(20)
					res.status(200).json(posts)
				} else {
					res.status(404).json({ error: 'Unauthorized' })
				}
			} catch (err) {
				res.status(404).json({ error: 'Unauthorized' })
			}
		} else {
			const posts = await Post.find({ _creator: req.params.user_id, private: false })
				.sort({ date: -1 }).limit(20)
			res.status(200).json(posts)
		}
	} catch (err) {
		res.status(400).json({ error: 'This user has no posts added' })
	}
})

router.post('/:id', async (req, res) => {
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
			before_votes: { $not: { $elemMatch: {  $eq: res.user._id } } },
			after_votes: { $not: { $elemMatch: {  $eq: res.user._id } } }
		}

		const update = {
			$addToSet: { before_votes: res.user._id }
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
			after_votes: { $not: { $elemMatch: {  $eq: res.user._id } } },
			before_votes: { $not: { $elemMatch: {  $eq: res.user._id } } }
		}

		const update = {
			$addToSet: { after_votes: res.user._id }
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
		const { comment, generatedID } = req.body

		const post = await Post.findById(id)
		const today = new Date()
		const newComment = {
			_id: generatedID,
			creator_id: res.user._id,
			creator_username: res.user.username,
			comment,
			date: today.toISOString()
		}

		await post.comments.unshift(newComment)
		await post.save()
		res.json(newComment)
	} catch (err) {
		res.status(404).json({ error: 'Something went wrong' })
	}
})

router.delete('/comment/:post_id/:comment_id', authenticate, async (req, res) => {
	try {
		const { post_id, comment_id } = req.params
		const post = await Post.findById(post_id)
		const removeIndex = post.comments
			.map(item => item._id.toString())
			.indexOf(comment_id)

		await post.comments.splice(removeIndex, 1)
		post.save()
		res.json({ message: 'Comment has been deleted', post: comment_id })
	} catch (err) {
		res.status(404).json({ error: 'Something went wrong' })
	}
})

module.exports = router
