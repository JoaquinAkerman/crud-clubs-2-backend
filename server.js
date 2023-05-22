const cors = require('cors');
const express = require('express');
const fs = require('fs');
const bodyParser = require('body-parser');
const multer = require('multer');
const path = require('path');
const util = require('util');
const { generateId } = require('./modules/idServices');
const clubsDataBase = require('./clubs.json');

const app = express();
const frontEndServer = 'http://localhost:3000';
app.use(cors());
const corsOptions = {
  origin: '*',
};
app.use(cors(corsOptions));
app.use(express.json());

// Setting up the middleware to process the data sent from the form
app.use(bodyParser.urlencoded({ extended: true }));

app.use((req, res, next) => {
  res.setHeader(
    'Content-Security-Policy',
    'default-src \'self\'; script-src \'self\' \'unsafe-inline\'; img-src \'self\' data:; style-src \'self\' \'unsafe-inline\'; font-src \'self\'; object-src \'none\'; base-uri \'self\';',
  );
  next();
});

// // Setting up the root route to display all clubs
app.get('/clubs', async (req, res) => {
  try {
    const data = await fs.promises.readFile('clubs.json');
    const clubs = JSON.parse(data);
    res.json({ clubs });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Setting up the route to display a particular club
app.get('/clubs/:id', (req, res) => {
  const id = parseInt(req.params.id);
  fs.readFile('clubs.json', (err, data) => {
    if (err) throw err;
    const clubs = JSON.parse(data);
    const club = clubs.find((c) => c.id === id);
    if (club) {
      res.json({ club });
    } else {
      res.status(404).json({ error: 'Club not found' });
    }
  });
});

// Setting up the route to display the images of each club

app.get('/clubs/public/static/images/:filename', async (req, res) => {
  try {
    const { filename } = req.params;
    const filePath = path.join(__dirname, 'public', 'static', 'images', filename);
    await res.sendFile(filePath);
  } catch (err) {
    const status = err.status || 500;
    const body = err.message || 'Something went wrong';
    res.status(status).send(body);
  }
});

/// ///////////////////POST////////////////////////

// Config of the route to process the creation of a new club
app.post('/clubs/new', (req, res) => {
  const frontEndLocalhost = 'http://localhost:3000';
  fs.readFile('clubs.json', (readErr, data) => {
    if (readErr) throw readErr;
    const clubs = JSON.parse(data);
    const newClub = {
      id: generateId(clubs),
      name: req.body.name,
      shortName: req.body.shortName,
      tla: req.body.tla,
      address: req.body.address,
      phone: req.body.phone,
      website: req.body.website,
      email: req.body.email,
      founded: req.body.founded,
      clubColors: req.body.clubColors,
      venue: req.body.venue,
      latitude: parseFloat(req.body.latitude),
      longitude: parseFloat(req.body.longitude),
    };
    clubs.push(newClub);
    fs.writeFile('clubs.json', JSON.stringify(clubs), (writeErr) => {
      if (writeErr) throw writeErr;
      res.redirect(frontEndLocalhost);
    });
  });
});

// Configuring the route to handle editing an existing club

// read and write files with promises
const readFileAsync = util.promisify(fs.readFile);
const writeFileAsync = util.promisify(fs.writeFile);

app.post('/clubs/edit/:id', async (req, res) => {
  const id = parseInt(req.params.id);
  try {
    const data = await readFileAsync('clubs.json');
    const clubs = JSON.parse(data);

    const club = clubs.find((c) => c.id === id);
    if (!club) {
      return res.status(404).send({ error: `Club not found id=${id}` });
    }

    // Validating the request body
    const requiredProperties = [
      'name',
      'shortName',
      'tla',
      'address',
      'phone',
      'website',
      'email',
      'founded',
      'clubColors',
      'venue',
      'latitude',
      'longitude',
    ];
    const missingProperties = requiredProperties.filter(
      (prop) => !(prop in req.body),
    );
    if (missingProperties.length > 0) {
      return res
        .status(400)
        .send({ error: `Missing properties: ${missingProperties.join(', ')}` });
    }

    // Updating the club
    Object.keys(req.body).forEach((prop) => {
      if (prop in club) {
        // setting latitud and longitud as numbers
        if (prop === 'latitud' || prop === 'longitud') {
          club[prop] = parseFloat(req.body[prop]);
        }
        // setting founded as number
        if (prop === 'founded') {
          club[prop] = parseInt(req.body[prop]);
        }
        club[prop] = req.body[prop];
      }
    });

    await writeFileAsync('clubs.json', JSON.stringify(clubs));

    // Refreshing the page
    return res.status(200).send({ message: 'Club edited successfully' });
  } catch (error) {
    return res.status(500).send('Error editing club');
  }
});

// Setting up the route to handle the deletion of an existing club
app.delete('/clubs/delete/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const clubIndex = clubsDataBase.findIndex((obj) => obj.id === id);
    if (clubIndex >= 0) {
      clubsDataBase.splice(clubIndex, 1);
      fs.writeFile('clubs.json', JSON.stringify(clubsDataBase), (err) => {
        if (err) throw err;
        res.status(200).json({ message: 'Club deleted successfully' });
      });
    } else {
      res.status(404).json({ error: `Club not found id=${id}` });
    }
  } catch (err) {
    res.status(500).json({ error: `${err} ` });
  }
});

// Process the upload of the club logo
const storagePath = multer.diskStorage({
  // set the storage path
  destination(req, file, cb) {
    cb(null, './public/static/images');
  },
  filename(req, file, cb) {
    // set the file name
    cb(null, `${req.params.id}.png`);
  },
});
const uploadImage = multer({ storage: storagePath });
app.post('/clubs/upload/:id', uploadImage.single('clubLogo'), (req, res) => {
  // Check if the image input is empty
  if (!req.file) {
    res.status(400).json({ message: 'Error, invalid or missing image file' });
  }
  // if not empty, redirect to the club page
  return res.status(200).redirect(frontEndServer);
});

// code to process the reset of the clubs
app.post('/clubs/reset-clubs', (req, res) => {
  const pathbackupClubs = './backupClubs/clubs.json';
  const pathClubsDataBase = './clubs.json';
  const logosActualesDir = './public/static/images';
  const logosBackupDir = './backupClubs/backupClubLogos';
  try {
    // Reset clubs data
    const backupData = fs.readFileSync(pathbackupClubs);
    fs.writeFileSync(pathClubsDataBase, backupData);
    // Reset club images
    const clubData = JSON.parse(backupData.toString());
    clubData.forEach((club) => {
      const logoActualPath = path.join(logosActualesDir, `${club.id}.png`);
      const logoBackupPath = path.join(logosBackupDir, `${club.id}.png`);
      // Remove current logo if exists
      if (fs.existsSync(logoActualPath)) {
        fs.unlinkSync(logoActualPath);
      }
      // Copy backup logo to current logo path
      fs.copyFileSync(logoBackupPath, logoActualPath);
    });

    res.redirect(`${frontEndServer}/clubs`);
  } catch (error) {
    res.status(500).send({ message: 'Internal server error' });
  }
});

module.exports = app; // Exporting the app to be used in the index.js file
