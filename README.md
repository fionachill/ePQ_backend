This is the accompanying backend database application for the ePQ archive. 

To use this application you will need:

* An sqlite database for users (ensure that your database is added to your ".gitignore" file).


* a .env file with the following (ensure that .env is added to your ".gitignore" file).

This application provides:

1) User functionality 
 - Register users for the ePQ archive application
 - Authorise logging in and out with json web tokens

 2) XML fetching
 - Provides data from XML data form to ePQ archive 