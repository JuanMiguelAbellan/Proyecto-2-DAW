import app from "./server";

const port = 8080;

app.listen(port, () => {
  console.log(`Application started on port ${port}`);
});
