const app = require('express')();
const amqp = require('amqplib/callback_api');
const { EventEmitter } = require('events');
const { billQueue, productQueue } = require('./config');

var channel, emitter, connection;

app.get('/BuyProduct/:productName', function (req, res) {
    
    //handles billFetched and send the bill to the cliebt
    emitter.once("billFetched", (args) => res.send(args));

    //gets the productname from the queue and then sends through the bill queue to the bill service to generate invoice for it 
    channel.sendToQueue(productQueue, new Buffer(req.params.productName.toString()));

});

app.listen(8070, () => {

    //intialize our emitter instance
    emitter = new EventEmitter();

    //Connect to our rabbitmq server 
    amqp.connect('amqp://localhost', function (err, conn) {
        connection = conn;

        //Create a channel with our server where most of the API for getting things done resides:
        conn.createChannel(function (err, ch) {
            channel = ch;
            //Queue assrtion
            //ProductService Makes sure that productqueue and billqueue exist and if not our rabbitmq server will create them
            ch.assertQueue(productQueue, { durable: false });
            ch.assertQueue(billQueue, { durable: false });

            //ProductService handles messages comes in the billqueue
            //Theses messages are bills of products(which we passed their names before in the product queue)
            ch.consume(billQueue, (msg) => {
                //Fetching message
                let productBill = msg.content.toString();

                //it tells the rabbitmq server that ProductService received the message and handled it so server can delete it from the queue
                channel.ack(msg);

                //Tells the BuyProduct endpoint that product bill has been fetched
                emitter.emit("billFetched", productBill);

            }, { noAck: false });
            //the noAck flag means that message should be acknowleged by our billservice so that it is deleted from the queue
        });


    });
});
//closing rabbitmq server connection on application close
process.on('exit', () => connection ? connection.close() : false);
