const app=require('express')();

app.get('/getInvoice/:productName',(req,res)=>
{
 res.send(`this is the invoice of product ${req.params.productName}`);
});

app.listen(8080);