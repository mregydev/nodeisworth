const app = require('express')();
const amqp = require('amqplib/callback_api');
const { EventEmitter } = require('events');
const { billQueue, productQueue } = require('./config');

var channel, emitter,connection;

app.get('/BuyProduct/:productName', function (req, res) {

    emitter.once("billFetched", (args) => res.send(args));
    channel.sendToQueue(billQueue, new Buffer(req.params.productName.toString()));

});

app.listen(8070, () => {

    emitter = new EventEmitter();

    amqp.connect('amqp://localhost', function (err, conn) {
        connection=conn;
        
        conn.createChannel(function (err, ch) {
            channel = ch;
            //Queue assrtion
            ch.assertQueue(productQueue, { durable: false });

            ch.assertQueue(billQueue, { durable: false });

            ch.consume(productQueue, (msg) => {
                //Fetching message
                let productBill = msg.content.toString();
                
                //Confirmation
                channel.ack(msg);

                emitter.emit("billFetched", productBill);

            }, { noAck: false });

        });


    });
});



process.on('exit', () => connection ? connection.close() : false);


