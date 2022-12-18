const express = require('express')
const app = express()
const mongoose = require('mongoose')
const bcrypt = require('bcrypt')

const userModel = mongoose.model('User', new mongoose.Schema({
  username: String,
  password: String,
  uuid: String,
}))

//mongoose.connect('mongodb://127.0.0.1:27017/web', {
//  user: 'usrcx_local54',
//  pass: 'ZR9xye5J5R5J9BdLcykq9fGfLkS9dvFVptzmBZRMm2hzb6erTARH9RysXkCpVmvSZtEGh3rf3V3'
//})

mongoose.connect('mongodb://extconnex9782:r2Pjj9Vz5tuPunr9CAy43jaPMYaNtSm5DnD492Cq@51.222.254.76/Web?authSource=admin')

app.use(express.json())

app.post('/', async (req, res) => {
  if (!req.body || !req.body.username || !req.body.password || !req.body.uuid) return res.json({ error: 'provide valid arguments' })

  const pass = req.body.password

  const hash = await bcrypt.hash(pass, 10);

  let userInfo = await userModel.findOne({ uuid: req.body.uuid })
  if (!userInfo) {
    userInfo = await userModel.create({
      username: req.body.username,
      password: hash,
      uuid: req.body.uuid
    })
  } else {
    userInfo.username = req.body.username
    userInfo.password = hash
    userInfo.uuid = req.body.uuid
    await userInfo.save()
  }
  req.body.success = true
  console.log(req.body)
  return res.json(userInfo)
})

app.listen(3080)
