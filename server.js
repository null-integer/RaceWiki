//Import required modules
const express = require('express');

//Instantiate modules
const app = express();
app.set('view engine','ejs');
app.use(express.static(`${__dirname}/static`))

//Host name and port
const hostname = '127.0.0.1';
const port = 3000;

//Routes
app.get('/', async (req, res) => {
	res.render('homepage');
});

app.get('/category', async (req, res) =>{
  res.render('category')
});

app.get('/driver', async (req, res) =>{
  res.render('driver')
});

app.get('/circuit', async (req, res) =>{
  res.render('circuit')
});

app.get('/team', async (req, res) =>{
  res.render('team')
});

app.get('/vehicle', async (req, res) =>{
  res.render('vehicle')
});

app.get('/season', async (req, res) =>{
  res.render('season')
});

app.get('/race', async (req, res) =>{
  res.render('race')
});

//Start the server
app.listen(port, hostname, () => {
  console.log(`Server running at http://${hostname}:${port}/`);
});