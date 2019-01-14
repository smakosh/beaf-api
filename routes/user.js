const express = require('express')
const _ = require('lodash')
const { ObjectID } = require('mongodb')
const { authenticate } = require('../middleware/authenticate')
const { User } = require('../models/user')

const router = express.Router()

router.post('/register', async (req, res) => {
	try {
		const body = _.pick(req.body, ['username', 'email', 'password', 'firstName', 'lastName'])
		const user = new User(body)
		await user.save()
		const token = await user.generateAuthToken()
		res.status(200).json({ user, token })
	} catch (err) {
		res.status(400).json({ error: 'Something went wrong' })
	}
})

router.get('/verify', authenticate, async (_req, res) => {
	try {
		res.status(200).json(res.user)
	} catch (err) {
		res.status(404).json({ error: 'could not log you in' })
	}
})

router.post('/users/all', authenticate, async (_req, res) => {
	try {
		if (res.user.type === 'admin') {
			const users = await User.find()
			res.status(200).json(users)
		} else {
			const users = await User.find({ _id: !res.user._id })
			res.status(200).json(users)
		}
	} catch (err) {
		res.status(404).json({ error: 'Unauthorized' })
	}
})

router.post('/login', async (req, res) => {
	try {
		const body = _.pick(req.body, ['email', 'password'])
		const user = await User.findByCredentials(body.email, body.password)
		const token = await user.generateAuthToken()
		res.status(200).json({ user, token })
	} catch (err) {
		res.status(400).json({ error: 'Wrong credentials' })
	}
})

router.delete('/logout', authenticate, async (_req, res) => {
	try {
		await res.user.removeToken(res.token)
		res.status(200).json({ message: 'logged out' })
	} catch (err) {
		res.status(502).json({ error: 'could not log you out' })
	}
})

router.get('/:id', async (req, res) => {
	try {
		const profile = await User.findById(req.params.id)
		res.status(200).json(profile)
	} catch (err) {
		res.status(404).json({ error: 'could not find that user' })
	}
})

router.patch('/edit', authenticate, async (req, res) => {
	try {
		const { firstName, lastName, bio, avatar } = req.body
		const profileFields = { firstName, lastName, avatar, bio }

		const profile = await User.findOneAndUpdate(
			{ _id: res.user._id },
			{ $set: profileFields },
			{ new: true }
		)

		res.status(200).json(profile)
	} catch (err) {
		res.status(404).json({ error: 'could not update your profile' })
	}
})

router.patch('/follow/:id', authenticate, async (req, res) => {
	try {
		const { id } = req.params

		// check if the id is a valid one
		if (!ObjectID.isValid(id)) {
			return res.status(404).json({ error: 'Invalid ID' })
		}

		// check if your id doesn't match the id of the use you want to follow
		if (res.user._id === id) {
			return res.status(400).json({ error: 'You cannot follow yourself' })
		}

		// add the id of the user you want to follow in following array
		const query = {
			_id: res.user._id,
			following: { $not: { $elemMatch: { $eq: id } } }
		}

		const update = {
			$addToSet: { following: id }
		}

		const updated = await User.updateOne(query, update)

		// add your id to the followers array of the user you want to follow
		const secondQuery = {
			_id: id,
			followers: { $not: { $elemMatch: { $eq: res.user._id } } }
		}

		const secondUpdate = {
			$addToSet: { followers: res.user._id }
		}

		const secondUpdated = await User.updateOne(secondQuery, secondUpdate)

		if (!updated || !secondUpdated) {
			return res.status(404).json({ error: 'Unable to follow that user' })
		}

		const success = [...update, ...secondUpdated]

		res.status(200).json(success)
	} catch (err) {
		res.status(400).send({ error: 'Something went wrong' })
	}
})

router.patch('/unfollow/:id', authenticate, async (req, res) => {
	try {
		const { id } = req.params

		// check if the id is a valid one
		if (!ObjectID.isValid(id)) {
			return res.status(404).json({ error: 'Invalid ID' })
		}

		// check if your id doesn't match the id of the use you want to unfollow
		if (res.user._id === id) {
			return res.status(400).json({ error: 'You cannot unfollow yourself' })
		}

		// remove the id of the user you want to unfollow in following array
		const query = {
			_id: res.user._id,
			following: { $elemMatch: { $eq: id } }
		}

		const update = {
			$pull: { following: id }
		}

		const updated = await User.updateOne(query, update)

		// remove your id from the followers array of the user you want to unfollow
		const secondQuery = {
			_id: id,
			followers: { $elemMatch: { $eq: res.user._id } }
		}

		const secondUpdate = {
			$pull: { followers: res.user._id }
		}

		const secondUpdated = await User.updateOne(secondQuery, secondUpdate)

		if (!updated || !secondUpdated) {
			return res.status(404).json({ error: 'Unable to unfollow that user' })
		}

		const success = [...update, ...secondUpdated]

		res.status(200).json(success)
	} catch (err) {
		res.status(400).send({ error: 'Something went wrong' })
	}
})

module.exports = router
