const app = require('express')();
const amqp = require('amqplib/callback_api');
const {billQueue,productQueue}=require('./config');

var  connection;


app.listen(8080, () => {
   
    //Connect to our rabbitmq server 
    amqp.connect('amqp://localhost', function (err, conn) {
        connection=conn;

        //Create a channel with our server where most of the API for getting things done resides:
        conn.createChannel(function (err, ch) {
            
            //Queue assertion
            //BillService Makes sure that productqueue and billqueue exist and if not our rabbitmq server will create them
            ch.assertQueue(productQueue, { durable: false });
            ch.assertQueue(billQueue, { durable: false });
            
            //handling messages from billqueue and theses messages are pushed by our product service 
            ch.consume(productQueue, (msg) => {
                //each message represents productname
                let product = msgfrom.content.toString();

                //After getting productname it pushes or send the bill of the product through a new message in the bill queue 
                ch.sendToQueue(billQueue, new Buffer(`this is the invoice of product${product}`));

                //it tells the rabbitmq server that BillService received the message and handled it so server can delete it from the queue
               ch.ack(msg);
            }, { noAck: false });
            //the noAck flag means that message should be acknowleged by our billservice so that it is deleted from the queue
        });
    });
});


//closing rabbitmq server connection on application close
process.on('exit', () => connection ? connection.close() : false);
