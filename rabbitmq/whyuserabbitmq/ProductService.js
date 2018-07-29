const app = require('express')();

const { get } = require('http');

app.get('/BuyProduct/:productName', (req, res) => {
    get(`http://localhost:8080/getInvoice/${req.params.productName}`, (value) => value.pipe(res));

});

app.listen(8070);