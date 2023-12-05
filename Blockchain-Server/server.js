var express = require('express');
const axios = require('axios');
const driver = require('bigchaindb-driver');
var url = require("url");
var express = require("express");
var app = express();
var cors = require("cors");
app.use(cors());
app.use(express.json());
const bodyparser = require("body-parser");
app.use(bodyparser.urlencoded({ extended: true }));
var cookieParser = require('cookie-parser');
const {  Connection, Transaction } = require('bigchaindb-driver');
const mysql = require('mysql');
const { count } = require('console');
const { size } = require('lodash');
const endpoint = "http://198.209.246.80/api/v1/";
const bigchaindbConnection = new Connection(endpoint);

// MySQL connection
const mysqlConnection = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'votesystem'
});

const port = 3002;
app.listen(port, async() => {
    console.log("🟢 server is up and running at "+ port);
    bigchainDB();
})

function bigchainDB(){
   let connection =  bigchaindbConnection;
   console.log("BigchainDB: "+JSON.stringify(connection));
}

app.get("/", (req,res) => {
   return res.send("connected!!!")
})

app.post("/register", function(req,res) {
    var payload = {};
    var data = {};
    const assetData = req.body; // Your asset data
    const metadata = { title : 'Register voter' }; // Metadata (optional)
    let issuerKeypair = new driver.Ed25519Keypair();
    payload['public_key'] = issuerKeypair.publicKey; //123
    payload['private_key'] = issuerKeypair.privateKey;
    
    const tx = Transaction.makeCreateTransaction(
        assetData,
        metadata,
        [
            Transaction.makeOutput(
                Transaction.makeEd25519Condition(payload['public_key']),
            )
        ],
        payload['public_key'],
    );

    const txSigned = Transaction.signTransaction(tx, payload['private_key']);

    bigchaindbConnection.postTransactionCommit(txSigned)
        .then((response) => {
            console.log('Transaction successful:'+JSON.stringify(response));
            response.payload = payload;
            res.send(response);
        })
        .catch((error) => {
            console.error('Transaction failed:', error);
            res.send(error);
        });
})

app.post("/create-election", function(req,res) {
    var payload = {};
    var data = {};
    const assetData = req.body; // Your asset data
    const metadata = { title : 'New election' }; // Metadata (optional)
    let issuerKeypair = new driver.Ed25519Keypair();
    payload['public_key'] = issuerKeypair.publicKey; 
    payload['private_key'] = issuerKeypair.privateKey;
    
    const tx = Transaction.makeCreateTransaction(
        assetData,
        metadata,
        [
            Transaction.makeOutput(
                Transaction.makeEd25519Condition(payload['public_key']),
            )
        ],
        payload['public_key'],
    );
    const txSigned = Transaction.signTransaction(tx, payload['private_key']);
    
    bigchaindbConnection.postTransactionCommit(txSigned)
        .then((response) => {
            console.log('Transaction successful:'+JSON.stringify(response));
            response.payload = payload;
            res.send(response);
        })
        .catch((error) => {
            console.error('Transaction failed:', error);
            res.send(error);
        });
})

app.post("/add-candidate", function(req,res) {
    var payload = {};
    var data = {};
    const assetData = req.body; // Your asset data
    const metadata = { election_id : assetData.election_id }; // Metadata (optional)
    // payload['public_key'] = assetData.publicKey;
    // payload['private_key'] = assetData.privateKey;
    let issuerKeypair = new driver.Ed25519Keypair();
    payload['public_key'] = issuerKeypair.publicKey;
    payload['private_key'] = issuerKeypair.privateKey;
    
    data.firstName = assetData.firstName; 
    data.lastName = assetData.lastName;
    data.information = assetData.information;
    const tx = Transaction.makeCreateTransaction(
        data,
        metadata,
        [
            Transaction.makeOutput(
                Transaction.makeEd25519Condition(payload['public_key']),
            )
        ],
        payload['public_key'],
    );
    
    const txSigned = Transaction.signTransaction(tx, payload['private_key']);

    bigchaindbConnection.postTransactionCommit(txSigned)
        .then((response) => {
            console.log('Transaction successful:'+JSON.stringify(response));
            response.payload = payload;
            res.send(response);
        })
        .catch((error) => {
            console.error('Transaction failed:', error);
            res.send(error);
        });
})

app.post("/cast-vote", function(req,res) {
    var payload = {};
    var data = {};
    const candidate  = req.body.person;
    const election_id = req.body.election_id;
    const election_address = req.body.election_address;
    const public_key = req.body.public_key;
    const private_key = req.body.private_key;
    const metadata = { 
        key : 'cast_vote',
        from : public_key, //user
        election_id : election_id
     };
    const assetData = { 
        from: public_key, 
        vote: candidate,
        election_address : election_address
    };
    payload['public_key'] = public_key;
    payload['private_key'] = private_key;
    
    const tx = Transaction.makeCreateTransaction(
        assetData,
        metadata,
        [
            Transaction.makeOutput(
                Transaction.makeEd25519Condition(payload['public_key']),
            )
        ],
        payload['public_key'],
    );
    
    const txSigned = Transaction.signTransaction(tx, payload['private_key']);

    bigchaindbConnection.postTransactionCommit(txSigned)
        .then((response) => {
            console.log('Vote cast successful:'+JSON.stringify(response));
            res.send(response);
        })
        .catch((error) => {
            console.error('Vote cast failed:', error);
            res.send(error);
        });
})

app.get('/get-vote', function (req, res) {
    bigchaindbConnection.listOutputs(req.query.id, false)
    .then((outputs) => {
      res.send(outputs);
    return;
      const tally = {};
      outputs.forEach((output) => {
        res.send("ass"+output.data);
        if (output.data.vote) {
          const candidate = output.data.vote;
          tally[candidate] = (tally[candidate] || 0) + 1;
        }
      });

    //   res.status(200).json(tally);
    })
    .catch((error) => {
      console.error('Error getting tally:', error);
      res.status(500).send('Error getting tally.');
    });
});

app.post('/cast-vote-old', (req, res) => {
    const { candidate } = req.body.person;
    const election_id = req.body.election_id;
    const public_key = req.body.public_key;
    const private_key = req.body.private_key;
    const metadata = { from: public_key };
    const assetData = { vote: candidate };

    bigchaindbConnection.getTransaction(election_id).then((result) => {
      console.log('getTransaction as callback: ', result)
      const newTransfer = Transaction.makeTransferTransaction(
        [
            {
                tx: result, 
                output_index: 0
            }
        ],
        // outputs
        [
            Transaction.makeOutput(Transaction.makeEd25519Condition(result.outputs[0].public_keys[0]))
        ],
        // metadata
        {  from: public_key }
    );

    const txSigned = Transaction.signTransaction(newTransfer, private_key);
    bigchaindbConnection.postTransactionCommit(txSigned)
        .then((response) => {
            res.send('Vote cast successfully.');
        })
        .catch((error) => {
            console.error('Error casting vote:', error);
            res.send('Error casting vote.');
        });
        return;
    });

    return;
    //////////////


    // Create a transfer transaction
    const transferTransaction = Transaction.makeTransferTransaction(
    [{ tx: election_id, output_index: 0 }],
    [Transaction.makeOutput(Transaction.makeEd25519Condition(public_key))],
        assetData,
        metadata
    );
    
    // Sign the transfer transaction with the sender's private key
    const signedTransferTransaction = Connection.Transaction.signTransaction(transferTransaction, private_key);
    
    // Send the transfer transaction to BigchainDB
    conn.postTransactionCommit(signedTransferTransaction)
    .then((response) => {
        console.log('Transfer Transaction Sent:', response);
    })
    .catch((error) => {
        console.error('Error:', error);
    });
    return;

    ////-----old-----/////
    const tx = Transaction.makeTransferTransaction(
        [{ tx: election_id} ],
        [
            Transaction.makeOutput(
                Transaction.makeEd25519Condition(public_key),
            )
        ],
        public_key,
    );

    const txSigned = Transaction.signTransaction(tx, private_key);
    bigchaindbConnection.postTransactionCommit(txSigned)
        .then((response) => {
            res.send('Vote cast successfully.');
        })
        .catch((error) => {
            console.error('Error casting vote:', error);
            res.send('Error casting vote.');
        });
        return;
    
    // ******************
    const voteTransaction = Transaction.makeTransferTransaction(
      [{ tx: election_id },null],
      [Transaction.makeOutput(Transaction.makeEd25519Condition(public_key))],
      { vote: candidate },
    );
    
    const signedTransaction = Transaction.signTransaction(voteTransaction, private_key);
    
    conn.postTransactionCommit(signedTransaction)
      .then(() => {
        res.send('Vote cast successfully.');
      })
      .catch((error) => {
        console.error('Error casting vote:', error);
        res.send('Error casting vote.');
      });
  });
  
 app.get("/search", function(req,res) {
    let search = req.query.keyword;
    let url = endpoint+`assets/?search=${search}&limit=1`;

    axios({
        method:'get',
        url
    })
    .then(function (response) {
        res.send(JSON.stringify(response.data));
    })
    .catch(function (error) {
        console.log(error);
        res.send(error);
    });
 })

 app.get("/meta-search", function(req,res) {
    let search = req.query.keyword;
    let url = endpoint+`metadata/?search=${search}`;
    axios({
        method:'get',
        url
    })
    .then(function (response) {
        res.send(JSON.stringify(response.data));
    })
    .catch(function (error) {
        console.log(error);
        res.send([]);
    });
 })

 app.get("/transactions", function(req,res) {
    let search = req.query.asset_id;
    let url = endpoint+`transactions/${search}`;
    axios({
        method:'get',
        url
    })
    .then(function (response) {
        res.send(JSON.stringify(response.data));
    })
    .catch(function (error) {
        console.log(error);
        res.send([]);
    });
 })
 app.get("/vote-count", function(req,res) {
    let search = req.query.public_key;
    let url = endpoint+`assets/?search=${search}`;

    axios({
        method:'get',
        url
    })
    .then(function (response) {
        // res.send(JSON.stringify(response.data));
        // response = JSON.parse(response.data)
        // console.log(size(response.data[1]))
        // res.send(response.data[1])
        const tally = {};
        response.data.forEach((output) => {
            if (output.data.vote) {
              const candidate = output.data.vote;
              tally[candidate] = (tally[candidate] || 0) + 1;
            }
        })
        res.send(tally);
    })
    .catch(function (error) {
        console.log(error);
        res.send(error);
    });
 })
process.on('uncaughtException', function(err) {
    console.log('Caught exception: ' + err);
});