const express = require('express')
const _ = require('lodash')
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

router.get('/users/all', authenticate, async (_req, res) => {
	try {
		if (res.user.type === 'admin') {
			const users = await User.find()
			res.status(200).json(users)
		} else {
			res.status(404).json({ error: 'Unauthorized' })
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

module.exports = router
