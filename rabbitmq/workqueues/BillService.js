const app = require('express')();
const amqp = require('amqplib/callback_api');
const {billQueue,productQueue}=require('./config');

var channel, connection;


app.listen(8080, () => {
   
    amqp.connect('amqp://localhost', function (err, conn) {
        connection=conn;

        conn.createChannel(function (err, ch) {
            

            channel=ch;
            //Queue assertion
            ch.assertQueue(productQueue, { durable: false });
            ch.assertQueue(billQueue, { durable: false });
            
            //getting messages from billqueue
            ch.consume(billQueue, (msg) => {
                let product = msg.content.toString();
                ch.sendToQueue(productQueue, new Buffer(`this is the invoice of product${product}`));
               ch.ack(msg);
            }, { noAck: false });
        });
    });
});


//closing connection
process.on('exit', () => connection ? connection.close() : false);