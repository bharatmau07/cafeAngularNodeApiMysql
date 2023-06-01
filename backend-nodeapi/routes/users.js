const express = require('express');
const connection = require('../connection');
const router = express.Router();
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');
require('dotenv').config();

var auth = require('../services/authentication');
var checkRole = require('../services/checkRole');

// Signup Apis
router.post('/singup', (req, res) => {
   let user = req.body;
   query = "select email,password,role, status from user where email=?";
   connection.query(query, [user.email], (err, result) => {
      if (!err) {
         if (result.length <= 0) {
            query = "insert into user(name,contact_number,email,password,status,role) values(?,?,?,?,'false','user')";
            connection.query(query, [user.name, user.contact_number, user.email, user.password], (err, result) => {
               if (!err) {
                  return res.status(200).json({ message: "Successfully Registered" });
               } else {
                  return res.status(500).json(err);
               }
            })
         } else {
            return res.status(400).json({ message: "Email is already Exist." })
         }
      } else {
         return res.status(500).json(err);
      }
   })
})

// Login Apis:
router.post('/login', (req, res) => {
   const user = req.body;
   query = "select email,password,role,status from user where email=?";
   connection.query(query, [user.email], (err, result) => {
      if (!err) {
         if (result.length <= 0 || result[0].password != user.password) {
            return res.status(401).json({ message: "Incorrect Username or Password" });
         }
         else if (result[0].status == 'false') {
            return res.status(401).json({ message: "Wait for admin approval" });
         }
         else if (result[0].password == user.password) {
            const response = { email: result[0].email, role: result[0].role }
            const accessToken = jwt.sign(response, process.env.ACCESS_TOKEN, { expiresIn: '8h' })
            res.status(200).json({ token: accessToken });
         }
         else {
            return res.status(400).json({ message: "Something went wrong, Please try again later" })
         }
      }
      else {
         return res.status(500).json(err);
      }
   })
})

var transporter = nodemailer.createTransport({
   service: 'gmail',
   host: 'smtp.gmail.com',
   port: 465,
   secure: true,
   auth: {
      user: process.env.EMAIL,
      pass: process.env.PASSWORD
   }
})

router.post('/forgotPassword', (req, res) => {
   const user = req.body;
   query = "select email,password from user where email=?";
   connection.query(query, [user.email], (err, result) => {
      if (!err) {
         if (result.length <= 0) {
            return res.status(200).json({ message: "Password send successfully to your email" });
         }
         else {
            var mailOptions = {
               from: process.env.EMAIL,
               to: result[0].email,
               subject: 'Password by cafe Management System',
               html: '<p>Your Login details for Cafe Management System<b><br><b>Email:</b>' + result[0].email + '<br><b>Password:</b>' + result[0].password + '<br><a href="http://localhost:4200/">Click here to Login</a></p>'
            }
            transporter.sendMail(mailOptions, function (error, info) {
               if (error) {
                  console.log(error);
               }
               else {
                  console.log("Email sent:", +info.response);
               }
            })
         }
      }
      else {
         return res.status(500).json(err);
      }
   })
})

router.get('/get', auth.authenticationToken, (req, res) => {
   var query = "select id,name,email,contact_number,status from user where role='user'";
   connection.query(query, (err, result) => {
      if (!err) {
         return res.status(200).json(result);
      }
      else {
         return res.status(500).json(err);
      }
   })
})

router.patch('/update', auth.authenticationToken, checkRole.checkRole, (req, res) => {
   var user = req.body;
   var query = "update user set status=? where id=?";
   connection.query(query, [user.status, user.id], (err, result) => {
      if (!err) {
         if (result.affectedRows == 0) {
            return res.status(200).json({ message: "User id does not exists" });
         }
         return res.status(200).json({ message: "User Updated Successfully.." });
      }
      else {
         return res.status(500).json(err);
      }
   })
})

router.get('/checkToken', auth.authenticationToken, (req, res) => {
   return res.status(200).json({ message: "true" });
})

router.post('/changePassword',auth.authenticationToken, (req, res) => {
   const user = req.body;
   const email = res.locals.email;
   console.log(email);
   var query = "select * from user where email=? and password=?";
   connection.query(query, [email, user.oldPassword], (err, result) => {
      if (!err) {
         if (result.length <= 0) {
            return res.status(400).json({ message: "Incorrect Old Password" });
         }
         else if (result[0].password == user.oldPassword) {
            query = "update user set password=? where email=?";
            connection.query(query,[user.newPassword, email], (err, result) => {
               if (!err) {
                  return res.status(200).json({ message: "Passsword update successfully." });
               }
               else {
                  return res.status(500).json(err);
               }
            })
         }
      } else {
        return res.status(400).json({message:"Somethis went Wrong, please try again latter"});  
      }
   }) 
})

module.exports = router