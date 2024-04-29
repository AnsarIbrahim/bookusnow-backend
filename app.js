import express from "express";
import bodyParser from "body-parser";

const app = express();

app.use(bodyParser.urlencoded({ extended: false }));

app.post("/user", (req, res, next) => {
  res.send(`<h1>UserName: ${req.body.name}</h1>`);
});

app.get("/", (req, res, next) => {
  res.send(
    '<form action="/user" method="POST"><input type="text" name="name"><button type="submit">Send</button></form>'
  );
});

app.listen(5000, () => {
  console.log("Server is running on port 5000");
});
