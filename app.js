//jshint esversion:6

const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const _ = require("lodash");

const app = express();

app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));

mongoose.connect("mongodb://localhost:27017/todolistDB", { useNewUrlParser: true, useUnifiedTopology: true });

const itemsSchema = {
  name: String
};

const Item = mongoose.model("Item", itemsSchema);


const item1 = new Item({
  name: "Welcome to your todolist!"
});

const item2 = new Item({
  name: "Hit the + button to add a new item."
});

const item3 = new Item({
  name: "<-- Hit this to delete an item."
});

const defaultItems = [item1, item2, item3];

const listSchema = {
  name: String,
  items: [itemsSchema]
};

const List = mongoose.model("List", listSchema);

// Inside this get request  we check to see if there are any errors connecting to
// mongo DB. If not it checks to see how many items. If zero, it adds our 3 default
// items to the database. Then it redirects to the home route where we display our
// todo items retrieved from the database.

app.get("/", (req, res) => {

  Item.find({}, (err, foundItems) => {

    if (foundItems.length === 0) {
      Item.insertMany(defaultItems, (err) => {
        if (err) {
          console.log(err);
        } else {
          console.log("Successfully saved default items to DB.");
        }
      });
      res.redirect("/");
    } else {
      res.render("list", { listTitle: "Today", newListItems: foundItems });
    }
  });

});

// **** This get request checks to see if a list of customListName   ****
// **** already exists. If it doesn't find it, it creates one with   ****
// **** the default items, saves it and redirects to the customList  ****
// **** route. If it does find the customListName it directs to the  ****
// **** customList. Note the await on list.save this is because the  ****
// **** list.save will return null until the process of saving has   ****
// **** completed, so the callback in the function List.findOne has  ****
// **** to be declared as asynchronous and await the result on       ****
// **** list.save().

  app.get("/:customListName", (req, res) => {
    const customListName = _.capitalize(req.params.customListName);

    List.findOne({ name: customListName }, async (err, foundList) => {
      if (!err) {
        if (foundList) {
          res.render("list", { listTitle: foundList.name, newListItems: foundList.items });
        } else {
          const list = new List({
            name: customListName,
            items: defaultItems
          })

          await list.save((err) => {
            if (err) return `There was an error saving the list. ${err}`;
            res.redirect(`/${customListName}`);
          });
        }
      }
    })
  })


// **** This post request takes the new item from the form submitted ****
// **** on the list page, creates the new item, then checks to see   ****
// **** Which list it belongs to. If it's the "Today list" the item  ****
// **** Is saved to that list and redirected to home route, else it  ****
// **** Is added to the custom list and redirected there.            ****

app.post("/", (req, res) => {

  const itemName = req.body.newItem;
  const listName = req.body.list;

  const item = new Item({
    name: itemName
  });

  if (listName === "Today") {
    item.save();
    res.redirect("/");
  } else {
    List.findOne({ name: listName }, (err, foundList) => {
      foundList.items.push(item);
      foundList.save();
      res.redirect("/" + listName);
    });
  }
});

// **** Post request takes the checked item and list name from the submitted form ****
// **** checks if the list is "Today" and deletes the item if true. If it isn't   ****
// **** the today list it searches for the listName, then pulls the checked item  ****
// **** From that list's array of items.                                          ****
app.post("/delete", (req, res) => {
  const checkedItemId = req.body.checkbox;
  const listName = req.body.listName;

  if (listName === "Today") {
    Item.findByIdAndRemove(checkedItemId, (err) => {
      if (!err) {
        console.log("Successfully deleted checked item.");
        res.redirect("/");
      }
    });
  } else {
    List.findOneAndUpdate({ name: listName }, { $pull: { items: { _id: checkedItemId } } }, (err, foundList) => {
      if (!err) {
        res.redirect("/" + listName);
      }
    });
  }


});

app.get("/about", (req, res) => {
  res.render("about");
});

app.listen(3000, function () {
  console.log("Server started on port 3000");
});
