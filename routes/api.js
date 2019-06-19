/*
*
*
*       Complete the API routing below
*
*
*/

'use strict';

var expect = require('chai').expect;
var MongoClient = require('mongodb').MongoClient;
var express = require('express');
var ObjectId = require('mongodb').ObjectId;
var XMLHttpRequest = require("xmlhttprequest").XMLHttpRequest;
var request = new XMLHttpRequest();
var request1 = new XMLHttpRequest();
var request2 = new XMLHttpRequest();
const https = require('https')
var ajax = require('ajax').xmlhttprequest
const CONNECTION_STRING = process.env.DB; //MongoClient.connect(CONNECTION_STRING, function(err, db) {});


module.exports = function (app) {

  app.use(function(req, res, next){
    console.log(req.method +' '+ req.path  + ' - ' + req.ip)
    next()
  })
  app.route('/api/stock-prices')
    .get(function (req, res){
    var stock = req.query.stock,
        like = req.query.like,
        like_ip
    like==="true"?like=1:like=0;
    like===1?like_ip=req.ip:like_ip
    if (typeof(stock)==="object") {
      let stock1=stock[0],
          stock2=stock[1]
      request1.open("GET","https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol="+stock1+"&apikey="+process.env.API_KEY,true);
      request1.send();
      request1.onload=function(){
        var stockData1 = JSON.parse(request1.responseText),
            stockSymbol1 = stockData1['Global Quote']['01. symbol'],
            stockPrice1 = stockData1['Global Quote']['05. price']
      MongoClient.connect(CONNECTION_STRING, {useNewUrlParser:true}, function(err, db){
        err?console.log(err):console.log("database connection successful!")
        var dbo = db.db("stockprices");
        dbo.collection("stocks").findOneAndUpdate({stock: stockSymbol1},{$set:{price: stockPrice1}, $inc:{likes:like}, $addToSet:{likes_ip:like_ip}}, { upsert: true, returnNewDocument: true}, (err, result)=>{
          err?console.log(err):console.log("Doing something with the first comparison stock");
          db.close();
        });
       
      })
        
        request2.open("GET","https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol="+stock2+"&apikey="+process.env.API_KEY,true);
        request2.send();
        request2.onload=function(){
          var stockData2 = JSON.parse(request2.responseText),
          stockSymbol2 = stockData2['Global Quote']['01. symbol'],
          stockPrice2 = stockData2['Global Quote']['05. price']
      MongoClient.connect(CONNECTION_STRING, {useNewUrlParser:true}, function(err, db){
        err?console.log(err):console.log("database connection successful!")
        var dbo = db.db("stockprices");
        dbo.collection("stocks").findOneAndUpdate({stock: stockSymbol2},{$set:{price: stockPrice2}, $inc:{likes:like}, $addToSet:{likes_ip:like_ip}},{ upsert: true, returnNewDocument: true}, (err, result)=>{
          err?console.log(err):console.log("Doing something with the second comparison stock");
            db.close();
        });
        stockSymbol1===undefined?res.json(stock1 + " is not a valid stock symbol"):stockSymbol2===undefined?res.json(stock2 + " is not a valid stock symbol"):
        dbo.collection("stocks").find({$or:[{stock: stockSymbol1}, {stock: stockSymbol2}]}).toArray(function(err, result){
         let rel_numberOfLikes_0 = result[0].likes_ip.filter(ip=>ip).length,
             rel_numberOfLikes_1 = result[1].likes_ip.filter(ip=>ip).length,
             price0=Number.parseFloat(result[0].price).toFixed(2),
             price1=Number.parseFloat(result[1].price).toFixed(2);
         var rel_likes_0=rel_numberOfLikes_0 - rel_numberOfLikes_1,
             rel_likes_1=rel_numberOfLikes_1 - rel_numberOfLikes_0;
          
         err?console.log(err):res.send({stockData:[{stock:result[0].stock, price: price0, rel_likes:rel_likes_0}, {stock:result[1].stock, price:price1, rel_likes:rel_likes_1}]})
       })
      })
          
        }
      }
    } else {
    request.open("GET","https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol="+stock+"&apikey="+process.env.API_KEY,true);
    request.send();
    request.onload = function(){
      var stockData = JSON.parse(request.responseText),
          
          stockSymbol = stockData['Global Quote']['01. symbol'],
          stockPrice = stockData['Global Quote']['05. price']
      stockSymbol===undefined?res.json(stock + " is not a valid stock symbol"):
      MongoClient.connect(CONNECTION_STRING, {useNewUrlParser:true}, function(err, db){
        err?console.log(err):console.log("database connection successful!")
        var dbo = db.db("stockprices");
        dbo.collection("stocks").findOneAndUpdate({stock: stockSymbol},{$set:{price: stockPrice}, $inc:{likes:like}, $addToSet:{likes_ip:like_ip}}, {projection:{_id:0}, upsert: true, returnNewDocument: true}, (err, result)=>{
          err?console.log(err):console.log("Someone is looking for the price of " + stockSymbol);
          dbo.collection("stocks").findOne({stock: stockSymbol}, function(err, result){
            let numberOfLikes = result.likes_ip.filter(ip=>ip).length,
                price =  Number.parseFloat(result.price).toFixed(2);
            err?console.log(err):res.json({stockData: {stock: result.stock, price: price, likes: numberOfLikes}})
            db.close();
          })
        });
       
      })
      
    }}
    

    
    });
    
};
