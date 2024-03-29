const { initializeApp, cert } = require('firebase-admin/app')
const { getFirestore, Timestamp } = require('firebase-admin/firestore')
const { getMessaging } = require('firebase-admin/messaging')
const serviceAccount = require('./85e75920eb.json')

initializeApp({
    credential: cert(serviceAccount)
})

const db = getFirestore()
const messaging = getMessaging();

const timestamp = Timestamp.fromDate(new Date())
module.exports = { db,  timestamp, messaging}