const fs = require('fs');
const util = require('util');
const { generateId } = require('./modules/idServices');
const clubsDataBase = require('./clubs.json');

module.exports = async (req, res) => {
  if (req.method === 'GET') {
    if (req.url === '/clubs') {
      try {
        const clubs = await fs.promises.readFile('clubs.json');
        res.setHeader('Content-Type', 'application/json');
        res.status(200).end(clubs);
      } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Internal server error' });
      }
    } else {
      res.status(404).json({ error: 'Not found' });
    }
  } else if (req.method === 'POST') {
    if (req.url === '/clubs/new') {
      const frontEndLocalhost = 'http://localhost:3000';
      try {
        const data = await fs.promises.readFile('clubs.json');
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
        await fs.promises.writeFile('clubs.json', JSON.stringify(clubs));
        res.setHeader('Location', frontEndLocalhost);
        res.status(302).end();
      } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Internal server error' });
      }
    } else {
      res.status(404).json({ error: 'Not found' });
    }
  } else if (req.method === 'DELETE') {
    if (req.url.startsWith('/clubs/delete/')) {
      const id = parseInt(req.url.split('/').pop());
      try {
        const clubIndex = clubsDataBase.findIndex((obj) => obj.id === id);
        if (clubIndex >= 0) {
          clubsDataBase.splice(clubIndex, 1);
          await fs.promises.writeFile('clubs.json', JSON.stringify(clubsDataBase));
          res.status(200).json({ message: 'Club deleted successfully' });
        } else {
          res.status(404).json({ error: `Club not found id=${id}` });
        }
      } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Internal server error' });
      }
    } else {
      res.status(404).json({ error: 'Not found' });
    }
  } else {
    res.status(405).json({ error: 'Method not allowed' });
  }
};
