const fs = require('fs');

const backupClubs = require('../backupClubs/clubs.json');
const clubsJson = require('../clubs.json');

function resetClubs(req, res) {
  try {
    const backupData = fs.readFileSync(backupClubs);
    fs.writeFileSync(clubsJson, backupData);
    res.status(200).json({ message: 'Clubs reset successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Internal server error' });
  }
}

module.exports = { resetClubs };
