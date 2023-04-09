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

//Start the server
app.listen(port, hostname, () => {
  console.log(`Server running at http://${hostname}:${port}/`);
});