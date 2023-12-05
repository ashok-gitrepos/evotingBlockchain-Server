var cors = require('cors');
var express = require('express');
var app = express();
var cookieParser = require('cookie-parser');
const driver = require('bigchaindb-driver');
const { BigchainDB, Connection, Transaction } = require('bigchaindb-driver');
const mysql = require('mysql');
const bigchaindbConnection = new Connection('http://198.209.246.80/api/v1/');
// const assetData = { key: 'value' }; // Your asset data
// const metadata = { metadataKey: 'metadataValue' };

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
    DBConnection();
    bigchainDB();
})


function DBConnection(){
    mysqlConnection.connect((err) => {
        if (err) {
            console.error('Error connecting to MySQL database:', err);
        } else {
            console.log('Connected to MySQL database');
        }
    });
}


//BigchainDB connection

function bigchainDB(){
  let connection =  bigchaindbConnection;
  console.log("BigchainDB: "+JSON.stringify(connection));
  console.log("Connected to bigchainDB")
}

app.use(cors())

app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());

app.get("/", (req,res) => {
   return res.send("connected!!!")
})

app.get("/userRegisterTransaction", (req,res) => {
    userRegisterTransaction();
    // return res.send("connected!!!")
 })

//  function transactioncheck(){
//     const assetData = { key: 'value' }; // Your asset data
//     const metadata = { metadataKey: 'metadataValue' }; // Metadata (optional)
//     const tx = Transaction.makeCreateTransaction(
//         assetData,
//         metadata,
//         [
//             Transaction.makeOutput(
//                 Transaction.makeEd25519Condition('your-public-key'),
//             )
//         ],
//         'your-public-key',
//     );


//     const txSigned = Transaction.signTransaction(tx, 'your-private-key');
            
//     bigchaindbConnection.postTransactionCommit(txSigned)
//         .then((response) => {
//             console.log('Transaction successful:', response);
//         })
//         .catch((error) => {
//             console.error('Transaction failed:', error);
//         });
//  }


 function userRegisterTransaction(payload){
    const assetData = { userId: '123', name: 'Ashok'}; // Your asset data
    const metadata = { title : 'Vote details' }; // Metadata (optional)

    let issuerKeypair = new driver.Ed25519Keypair();
    payload['public_key'] = issuerKeypair.publicKey; //123
    payload['private_key'] = issuerKeypair.privateKey;
    
    payload['assetData'] = assetData;
    payload['metadata'] = metadata;

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

    payload['tx'] = tx;
    const txSigned = Transaction.signTransaction(tx, payload['private_key']);
            
    bigchaindbConnection.postTransactionCommit(txSigned)
        .then((response) => {
            console.log('Transaction successful:');
            payload['response'] = response;
            // save data in MySql
            // insert transaction in db
            // storing public & private keys along with uid

        })
        .catch((error) => {
            console.error('Transaction failed:', error);
            payload['error'] = error;
        });
    return payload;
 }
process.on('uncaughtException', function(err) {
    console.log('Caught exception: ' + err);
});