const axios = require('axios');
const venom = require('venom-bot');
const { db, timestamp} = require('../../firebase')
let clientReq; 

axios.defaults.headers = {
  'Content-Type': 'application/json',
  'Accept': 'application/json',
  'MerchantId': '93f1086e-4725-4edd-9c4b-87f3c1ff56d1',
  'MerchantKey': 'OSZJEORVIQOEDYIMAWILRZXGMIEZLJSLOXBSHOCK',
  'access_token': "$aact_YTU5YTE0M2M2N2I4MTliNzk0YTI5N2U5MzdjNWZmNDQ6OjAwMDAwMDAwMDAwMDAwNTM1MjM6OiRhYWNoXzNhMmIyZGFmLWRiZDMtNDE4YS1iZWZlLWMxOTQ0NDMxMGM0Nw=="
}

module.exports = app => {
const controller = app.controllers.customer;

app.get('/', (req, res) => {
  // axios.get('https://sandbox.asaas.com/api/v3/customers?email=marcelo.almeida@gmail.com')
  // .then(res => {
  //   const headerDate = res.headers && res.headers.date ? res.headers.date : 'no response date';
  //   console.log('Status Code:', res.status);
  //   console.log('Date in Response header:', headerDate);
  // })
  // .catch(err => {
  //   console.log('Error: ', err.message);
  // });
  
  res.status(200).json('API OK');
})

app.post('/notification', async (req, res) => {
  const { title, description } = req.body
  if (!description && !title) { res.status(400) }

  const notificationRef = db.collection('notifications')
  await notificationRef.add({
    title,
    description,
    createdAt: timestamp
  }).then((docRef) => {
      console.log("Document written with ID: ", docRef.id);
      res.status(201).json(docRef.id);
  })
  .catch((error) => {
    console.error("Error adding document: ", error);
    res.status(400).json(error);
  })
})
  
app.post('/sender', async (req, res) => {
  const { phone, message } = req.body
  
  if (!phone && !message) { res.status(400) }

  if (clientReq) {
    send(clientReq)
    res.status(200)
  } else {
    venom
      .create(
        'ws-sender',
        (base64Qr, asciiQR, attempts, urlCode) => {
          console.log(asciiQR); // Optional to log the QR in the terminal
          res.status(200).json({base64Qr, asciiQR, attempts, urlCode})
          var matches = base64Qr.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/),
            response = {};
    
          if (matches.length !== 3) {
            return new Error('Invalid input string');
          }
          response.type = matches[1];
          response.data = new Buffer.from(matches[2], 'base64');
          
          var imageBuffer = response;
          require('fs').writeFile(
            'out.png',
            imageBuffer['data'],
            'binary',
            function (err) {
              if (err != null) {
                console.log(err);
              }
            }
          );
        },
        undefined,
        { logQR: false }
      )
      .then((client) => { clientReq = client; send(client); })
      .catch((erro) => { res.status(500).json(erro) })
  }

  async function send(client) {
    await client
    .sendText(`${phone}@c.us`, message)
    .then((result) => { res.status(200).json(result) } )
    .catch((erro) => { res.status(500).json('Error when sending: \n'+ erro) })
  }
})
  
app.post('/customers', (req, res) => {
  const sendRequest = async (data) => {
      try {
        const resp = await axios.post('https://sandbox.asaas.com/api/v3/customers', data);
        const headerDate = resp.headers && resp.headers.date ? resp.headers.date : 'no response date';
        console.log(headerDate)
        res.status(200).json(resp.data);
      } catch (err) {
        console.error(err);
        res.status(401).json(err);
      }
  }
  sendRequest(req.body)
})
  app.get('/customers', (req, res) => {
  const sendRequest = async () => {
      try {
        const resp = await axios.get(`https://sandbox.asaas.com/api/v3/customers?email=${req.query.email}&cpfCnpj=${req.query.cpfCnpj}`);
        const headerDate = resp.headers && resp.headers.date ? resp.headers.date : 'no response date';
        console.log(headerDate)
        if (resp.data.data[0] !== undefined){
          res.status(200).json(resp.data.data[0]);
        }else {
          res.status(404).json('not found');
        }
      } catch (err) {
        console.error(err);
        res.status(401).json(err);
      }
  }
  sendRequest()
})
app.post('/payments', (req, res) => {

  const sendCard = async (data) => {
    
    // try {
    //   const resp = await axios.post('https://sandbox.asaas.com/api/v3/payments', data);
    //   const headerDate = resp.headers && resp.headers.date ? resp.headers.date : 'no response date';
    //   console.log(headerDate)
    //   res.status(200).json(resp.data);
    // } catch (err) {w
    //   //console.log(`error`,err);
    //   res.status(401).json(err);
    // }

    try {
      const resp = await axios.post('https://sandbox.asaas.com/api/v3/payments', data);
      const headerDate = resp.headers && resp.headers.date ? resp.headers.date : 'no response date';
      console.log(headerDate)
      if (data.billingType === 'BOLETO' && resp.data.id) {
        barCode(resp.data.id);
      } else if (data.billingType === 'PIX' && resp.data.id) {
        pixQrCode(resp.data.id);
      } else { 
        res.status(200).json(resp.data);
      }
    } catch (err) {
      console.error(err);
      res.status(401).json(err);
    }
  }
  
  const sendPayment = async (data) => {
    try {
      const resp = await axios.post('https://sandbox.asaas.com/api/v3/payments', data);
      const headerDate = resp.headers && resp.headers.date ? resp.headers.date : 'no response date';
      console.log(headerDate)
      console.log(data.billingType, resp.data)
      //res.status(200).json(resp.data);
      if (data.billingType === 'BOLETO' && resp.data.id) {
        barCode(resp.data);
      }

      if(data.billingType==='PIX' && resp.data.id){
        pixQrCode(resp.data);
      }

    } catch (err) {
      console.error(err);
      res.status(401).json(err);
    }
  }

  const barCode = async (value) => {
    try {
      const resp = await axios.get(`https://sandbox.asaas.com/api/v3/payments/${value.id}/identificationField`);
      const headerDate = resp.headers && resp.headers.date ? resp.headers.date : 'no response date';
      console.log(headerDate)
      console.log({...value, ...resp.data})
      res.status(200).json({...value, ...resp.data});
    } catch (err) {
      console.error(err);
      res.status(401).json(err);
    }
  }
  
  const pixQrCode = async (value) => {
    try {
      const resp = await axios.get(`https://sandbox.asaas.com/api/v3/payments/${value.id}/pixQrCode`);
      const headerDate = resp.headers && resp.headers.date ? resp.headers.date : 'no response date';
      console.log(headerDate)
      console.log({...value, ...resp.data})
      res.status(200).json({...value, ...resp.data});
    } catch (err) {
      console.error(err);
      res.status(401).json(err);
    }
  }
  
  if (req.body.billingType === 'CREDIT_CARD') { 
    sendCard(req.body)
  } else if (req.body.billingType === 'PIX' || req.body.billingType === 'BOLETO') {
    sendPayment(req.body)
  }

})
  
app.get('/payments', async (req, res) => {
    try {
      const resp = await axios.get(`https://sandbox.asaas.com/api/v3/payments/${req._parsedUrl.query}`);
      const headerDate = resp.headers && resp.headers.date ? resp.headers.date : 'no response date';
      console.log(headerDate)
      res.status(200).json(resp.data);
    } catch (err) {
      console.error(err);
      res.status(401).json(err);
    }
})
  
app.post('/sales', (req, res) => { 
  const sendRequest = async (data) => {
    try {
      const resp = await axios.post('https://apisandbox.cieloecommerce.cielo.com.br/1/sales', data);
      const headerDate = resp.headers && resp.headers.date ? resp.headers.date : 'no response date';
      console.log(headerDate)
      res.status(200).json(resp.data);
    } catch (err) {
      console.error(err);
      res.status(401).json(err);
    }
  }
  sendRequest(req.body)
})
app.route('/api/v1/customer')
  .get(controller.listCustomerWallets)
  .post(controller.saveCustomerWallets);

app.route('/api/v1/customer/:customerId')
  .delete(controller.removeCustomerWallets)
  .put(controller.updateCustomerWallets);
}