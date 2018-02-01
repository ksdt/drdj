var express = require('express'),
    app = express(),
    multer = require('multer'),
    bodyParser = require('body-parser'),
    fs = require('fs');
    port = process.env.PORT || 4000;

var storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'uploads');
    },
    filename: function (req, file, cb) {
        console.log(req);
        cb(null, req.params.name + '-' + req.params.row + '-' + req.params.col);
    }
});

var fileFilter = function (req, file, cb) {
    if (req.params.name == 'ksdt' && req.params.secret != 'djwebdude')
        cb(null, false);
    else
        cb(null, true);
};

var upload = multer({ storage: storage, fileFilter: fileFilter });

app.use(bodyParser.json());

app.post('/sample/:name/:row/:col/:secret?', upload.single('file'), function (req, res, next) {
    console.log(req);
    res.sendStatus(200);
});

app.post('/dsample/:name/:row/:col/:secret?', function(req, res, next) {
    if (req.params.name == 'ksdt' && req.params.secret != 'djwebdude') {
        res.sendStatus(200);
    } else {
        fs.unlink('uploads/'+req.params.name+'-'+req.params.row+'-'+req.params.col, function() {
        });
    }
});

app.post('/samplebuttons/:name/:secret?', function(req, res) {
    if (req.params.name == 'ksdt' && req.params.secret != 'djwebdude') {
        res.sendStatus(200);
    } else {
        fs.writeFile('uploads/'+req.params.name+'.json', JSON.stringify(req.body), function (err) {
            if (err) {
                console.log(err);
            }
        });
        res.sendStatus(200);
    }
});

app.get('/board/:name', function (req, res) {

});

app.get('/:name', function (req, res) {
    res.sendFile('web/index.html', {root: __dirname});
});

app.get('/', function (req, res) {
    res.redirect('/ksdt');
});

app.use('/static', express.static('web'));
app.use('/uploads', express.static('uploads'));


app.listen(port);
