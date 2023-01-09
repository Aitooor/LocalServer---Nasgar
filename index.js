const express = require('express')
const app = express()
const mongoose = require('mongoose')
const bcrypt = require('bcrypt')
const config = require('./config.json')
const redis = require('redis')
const redisClient = redis.createClient({
  url: config.redis,
  password: config.redisPass
})

const userModel = mongoose.model('User', new mongoose.Schema({
  username: String,
  password: String,
  uuid: String,
  lang: String,
  admin: Boolean
}))

const orderModel = mongoose.model('Order', new mongoose.Schema({
  id: { type: String, required: true },
  products: [],
  createdAt: { type: Date, required: true },
  used: Boolean,
  paid: Boolean,
  user: String
}));


mongoose.connect(config.mongodb)
redisClient.connect()

app.use(express.json())

app.delete('/:username', async (req, res) => {
  return await userModel.findOneAndDelete({ username: req.params.username }) || { user: null }
})

app.get('/:username', async (req, res) => {
  return await userModel.findOne({ username: req.params.username }) || { user: null }
})

app.post('/', async (req, res) => {
  if (!req.body || !req.body.username || !req.body.password || !req.body.uuid) {
    console.log(req.body)
    return res.json({ error: 'provide valid arguments' })
  }

  const pass = req.body.password

  const hash = await bcrypt.hash(pass, 10);

  let userInfo = await userModel.findOne({ username: req.body.username })

  if (!userInfo) {
    userInfo = await userModel.create({
      username: req.body.username,
      password: hash,
      uuid: req.body.uuid,
      admin: Boolean(req.body.isAdmin)
    })
    req.body.message = "User created successfully"
  } else {
    userInfo.password = hash
    userInfo.uuid = req.body.uuid
    userInfo.admin = Boolean(req.body.isAdmin)
    await userInfo.save()
  }
  req.body.success = true
  console.log(req.body)
  return res.json(req.body)
})

setInterval(async () => {
  const orders = await orderModel.find({ used: false, paid: true })
  const userInfo = await userModel.find({})
  const serversSet = new Map()

  await Promise.all(orders.map(async order => {

    const user = userInfo.find(u => u.username == order.user)
    const lang = user.lang ? user.lang : 'en'
    order.used = true;
    await order.save()
    order.products.forEach(product => {
      if (!serversSet.has(product[lang].serverName)) serversSet.set(product[lang].serverName, [])
      const newVal = serversSet.get(product[lang].serverName)
      product[lang].player = user.username
      newVal.push(product[lang])
      serversSet.set(product[lang].serverName, newVal)
    });
  }));


  [...serversSet.keys()].map(server => {
    redisClient.set(server, JSON.stringify(serversSet.get(server)))
  })

}, 10000);

app.listen(3080)
