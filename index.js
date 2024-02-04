require('dotenv').config();
const express = require('express'),
cors = require('cors'),
bodyParser = require("body-parser"),
dns = require('dns'),
mongoose = require('mongoose');

mongoose.connect(process.env.MONGO_URI);

const urlShortenerShema = new mongoose.Schema({
  originalUrl: { type: String, required: true },
  shortUrl: { type: Number, required: true }
});

let UrlShortener = mongoose.model('Shortener', urlShortenerShema);

const app = express();
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

// Basic Configuration
const port = process.env.PORT || 3001;

app.use(cors());

app.use('/public', express.static(`${process.cwd()}/public`));

app.get('/', function (req, res) {
  res.sendFile(process.cwd() + '/views/index.html');
});

// Your first API endpoint
app.get('/api/hello', function (req, res) {
  res.json({ greeting: 'hello API' });
});

app.post('/api/shorturl', function (req, res) {

  let url = req.body.url;

  if (url && URL.canParse('', url)) {
    const { hostname } = new URL(url,);
    dns.lookup(hostname, (err, address, family) => {

      if (err) {
        res.json({ error: "Invalid Hostname" });
      } else {
        if (isNaN(url)) {

          addUrl(url, (element, err) => {
            if (err){
              res.json({ message: 'Ups!!' });
            }
            else if (element) {
              res.json({ original_url: element.originalUrl, short_url: element.shortUrl });
            }
            else {
              res.json({ message: 'Ups!!' })
            }
          })

        }
      }
    })
  }
  else {
    res.json({ error: "Invalid URL" });
  }
});

app.get('/api/shorturl/:id', function (req, res) {
  let id = req.params.id;
  if (id && !isNaN(id)) {
    UrlShortener.findOne({ shortUrl: id }).then((element) => {
      if (element) {
        res.redirect(element.originalUrl);
      }
      else { res.json({ error: "No short URL found for the given input" }) };
    }, (err) => {
      res.json({ message: 'Ups!!' })
    });
  } else {
    res.json({ error: "Wrong format" });
  }
});

app.listen(port, function () {
  console.log(`Listening on port ${port}`);
});

function addUrl(url, fn) {
  UrlShortener.findOne({ originalUrl: url }).then((element) => {
    if (element) {
      fn(element, null)
    }
    else {
      UrlShortener.findOne().sort('-shortUrl').then(lastelement => {

        let short = lastelement ? lastelement.shortUrl + 1 : 1;
        const ne = new UrlShortener({ originalUrl: url, shortUrl: short });
        ne.save().then(data => {
          fn(data, null)
        },
          (err) => {
            fn(null, err)
          })

      },
        (err) => {
          fn(null, err)
        })
    }
  },
    (err) => {
      fn(null, err)
    });

}