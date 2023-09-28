const fs = require('fs')
const axios = require('axios')
const venom = require('venom-bot')
const qrcode = require('qrcode-terminal')
const {
  Client,
  LocalAuth,
  LegacySessionAuth,
  MessageMedia
} = require('whatsapp-web.js')
const { db, timestamp, messaging } = require('../../firebase')
let clientReq

axios.defaults.headers = {
  'Content-Type': 'application/json',
  Accept: 'application/json',
  MerchantId: '93f1086e-4725-4edd-9c4b-87f3c1ff56d1',
  MerchantKey: 'OSZJEORVIQOEDYIMAWILRZXGMIEZLJSLOXBSHOCK',
  access_token:
    '$aact_YTU5YTE0M2M2N2I4MTliNzk0YTI5N2U5MzdjNWZmNDQ6OjAwMDAwMDAwMDAwMDAwNjYxNjc6OiRhYWNoXzhlYjIzMDY2LTZkZjktNDk1Zi04NTVkLTE4ZGM0ZDkxMWIzOA=='
}

module.exports = app => {
  const controller = app.controllers.customer

  app.get('/', (req, res) => {
    res.status(200).json('API OK')
  })

  app.post('/customers', (req, res) => {
    const sendRequest = async data => {
      try {
        const resp = await axios.post(
          'https://sandbox.asaas.com/api/v3/customers',
          data
        )
        const headerDate =
          resp.headers && resp.headers.date
            ? resp.headers.date
            : 'no response date'
        console.log(headerDate)
        res.status(200).json(resp.data)
      } catch (err) {
        console.error(err)
        res.status(401).json(err)
      }
    }
    sendRequest(req.body)
  })
  app.get('/customers', (req, res) => {
    const sendRequest = async () => {
      try {
        const resp = await axios.get(
          `https://sandbox.asaas.com/api/v3/customers?email=${req.query.email}&cpfCnpj=${req.query.cpfCnpj}`
        )
        const headerDate =
          resp.headers && resp.headers.date
            ? resp.headers.date
            : 'no response date'
        if (resp.data.data[0] !== undefined) {
          res.status(200).json(resp.data.data[0])
        } else {
          res.status(404).json({ status: 404, message: 'customer not found' })
        }
      } catch (err) {
        console.error(err)
        res.status(401).json(err)
      }
    }
    sendRequest()
  })
  app.post('/subscriptions', async (req, res) => {
    try {
      const resp = await axios.post(
        'https://sandbox.asaas.com/api/v3/subscriptions',
        req.body
      )
      const headerDate =
        resp.headers && resp.headers.date
          ? resp.headers.date
          : 'no response date'

      res.status(200).json(resp.data)
      return true
    } catch (err) {
      console.error(err)
      res.status(401).json(err)
    }
  })
  app.post('/payments', (req, res) => {
    const sendCard = async data => {
      try {
        const resp = await axios.post(
          'https://sandbox.asaas.com/api/v3/payments',
          data
        )
        const headerDate =
          resp.headers && resp.headers.date
            ? resp.headers.date
            : 'no response date'

        if (data.billingType === 'BOLETO' && resp.data.id) {
          barCode(resp.data.id)
        } else if (data.billingType === 'PIX' && resp.data.id) {
          pixQrCode(resp.data.id)
        } else {
          res.status(200).json(resp.data)
        }

        console.log(`headers`, axios.defaults.headers)
        console.log(`payments`, data)
        return true
      } catch (err) {
        console.error(err)
        res.status(401).json(err)
      }
    }

    const sendPayment = async data => {
      try {
        const resp = await axios.post(
          'https://sandbox.asaas.com/api/v3/payments',
          data
        )
        const headerDate =
          resp.headers && resp.headers.date
            ? resp.headers.date
            : 'no response date'

        if (data.billingType === 'BOLETO' && resp.data.id) {
          barCode(resp.data)
        }

        if (data.billingType === 'PIX' && resp.data.id) {
          pixQrCode(resp.data)
        }
      } catch (err) {
        console.error(err)
        res.status(401).json(err)
      }
    }

    const barCode = async value => {
      try {
        const resp = await axios.get(
          `https://sandbox.asaas.com/api/v3/payments/${value.id}/identificationField`
        )
        const headerDate =
          resp.headers && resp.headers.date
            ? resp.headers.date
            : 'no response date'
        console.log(headerDate)
        console.log({ ...value, ...resp.data })
        res.status(200).json({ ...value, ...resp.data })
      } catch (err) {
        console.error(err)
        res.status(401).json(err)
      }
    }

    const pixQrCode = async value => {
      try {
        const resp = await axios.get(
          `https://sandbox.asaas.com/api/v3/payments/${value.id}/pixQrCode`
        )
        const headerDate =
          resp.headers && resp.headers.date
            ? resp.headers.date
            : 'no response date'
        console.log(headerDate)
        console.log({ ...value, ...resp.data })
        res.status(200).json({ ...value, ...resp.data })
      } catch (err) {
        console.error(err)
        res.status(401).json(err)
      }
    }

    if (req.body.billingType === 'CREDIT_CARD') {
      sendCard(req.body)
    } else if (
      req.body.billingType === 'PIX' ||
      req.body.billingType === 'BOLETO'
    ) {
      sendPayment(req.body)
    }
  })

  app.get('/payments', async (req, res) => {
    try {
      const resp = await axios.get(
        `https://sandbox.asaas.com/api/v3/payments/${req._parsedUrl.query}`
      )
      const headerDate =
        resp.headers && resp.headers.date
          ? resp.headers.date
          : 'no response date'
      console.log(headerDate)
      res.status(200).json(resp.data)
    } catch (err) {
      console.error(err)
      res.status(401).json(err)
    }
  })

  app.post('/sales', (req, res) => {
    const sendRequest = async data => {
      try {
        const resp = await axios.post(
          'https://apicieloecommerce.cielo.com.br/1/sales',
          data
        )
        const headerDate =
          resp.headers && resp.headers.date
            ? resp.headers.date
            : 'no response date'
        console.log(headerDate)
        res.status(200).json(resp.data)
      } catch (err) {
        console.error(err)
        res.status(401).json(err)
      }
    }
    sendRequest(req.body)
  })
  app
    .route('/api/v1/customer')
    .get(controller.listCustomerWallets)
    .post(controller.saveCustomerWallets)

  app
    .route('/api/v1/customer/:customerId')
    .delete(controller.removeCustomerWallets)
    .put(controller.updateCustomerWallets)
}
