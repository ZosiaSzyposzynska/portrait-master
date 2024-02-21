const Photo = require('../models/photo.model');
import Voter from '../models/Voter.model';
const requestIp = require('request-ip');
const sanitizeHtml = require('sanitize-html');

/****** SUBMIT PHOTO ********/

exports.add = async (req, res) => {

  try {
    const { title, author, email } = req.fields;
    const file = req.files.file;

    if(title && author && email && file) { 


      const sanitizeTitle = sanitizeHtml(title);
      const sanitizeAuthor = sanitizeHtml(author);
      
      const fileName = file.path.split('/').slice(-1)[0];
      const fileExt = fileName.split('.').slice(-1)[0];

      if(fileExt != 'jpg' || fileExt != 'jpeg') {

        throw new Error('Bad extension');

      }

      if (sanitizeTitle.length > 25) {
        throw new Error('Title must be equal or less than 25 char');
      }

      if(sanitizeAuthor.length > 50) {
        throw new Error('Author must be equal or less than 50 char')
      }

      const newPhoto = new Photo({ sanitizeTitle, sanitizeAuthor, email, src: fileName, votes: 0 });
      await newPhoto.save();
      res.json(newPhoto);

    } else {
      throw new Error('Wrong input!');
    }

  } catch(err) {
    res.status(500).json(err);
  }

};

/****** LOAD ALL PHOTOS ********/

exports.loadAll = async (req, res) => {

  try {
    res.json(await Photo.find());
  } catch(err) {
    res.status(500).json(err);
  }

};

/****** VOTE FOR PHOTO ********/

exports.vote = async (req, res) => {
  
  try {

    const ipAddress = requestIp.getClientIp(req);
    let voter = await Voter.findOne({ user: ipAddress });
    const updatePhoto = await Photo.findOne({ _id: req.params.id });

    if (!voter) {
   
      const newvoter = new Voter({
        user: ipAddress,
        votes: [updatePhoto._id]
      });
      await newvoter.save();

    } else {
     
      if (voter.votes.includes(updatePhoto._id)) {
        return res.status(500).json({ error: 'You have already voted.' });
      }
    
      voter.votes.push(updatePhoto._id);
      await voter.save();
    }
    updatePhoto.votes = updatePhoto.votes + 1;
    updatePhoto.save();

    res.status(200).json({ message: 'ok' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error' });
  }

};
