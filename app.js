//jshint esversion:6

const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");

const app = express();

app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));

mongoose.connect('mongodb://localhost:27017/todolistDB', { useNewUrlParser: true, useUnifiedTopology: true });

const itemsSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, "can't accept empty item, please try again."]
  }
});

const Item = mongoose.model("Item", itemsSchema);

const item1 = new Item({
  name: "Walk the dogs"
});

const item2 = new Item({
  name: "Clean the kitchen"
});

const item3 = new Item({
  name: "Set up gloomhaven"
});

const defaultItems = [item1, item2, item3];


// Inside this get request  we check to see if there are any errors connecting to
// mongo DB. If not it checks to see how many items. If zero, it adds our 3 default
// items to the database. Then it redirests to the home route where we display our
// todo items retrieved from the database.

app.get("/", function (req, res) {

  Item.find({}, (err, foundItems) => {
    if (err) {
      console.log(err);
    }

    else if (foundItems.length === 0) {
      Item.insertMany(defaultItems, (err) => {
        if (err) {
          console.log(err);
        } else {
          console.log("Succesfully added items to the database.");
        }
      });

      res.redirect("/");
    } else {
      res.render("list", { listTitle: "Today", foundItems: foundItems });
    }
  });

});

// **** This post request takes the new item from the form submitted ****
// **** on the list page and then adds it to the mongo DB database   ****
app.post("/", function (req, res) {

  const item = req.body.newItem;

  Item.create({ name: item });
  res.redirect("/");
});

// **** This post request watches for a checkbox to change state (checked) ****
// **** gets the _id of the item then makes a delete request from the DB   ****
app.post("/delete", (req, res) => {
  const checkedItemId = req.body.checkbox;

  Item.findByIdAndRemove({ _id: checkedItemId }, (err, deleted) => {
    if (err) {
      console.log(err);
    } else {
      console.log("Deleted record ", deleted)
    }
    res.redirect("/");
  });
});

app.get("/work", function (req, res) {
  res.render("list", { listTitle: "Work List", items: allItems });
});

app.get("/about", function (req, res) {
  res.render("about");
});

app.listen(3000, function () {
  console.log("Server started on port 3000");
});
