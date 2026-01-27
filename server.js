import "dotenv/config"; // MUST be first

import app from "./app.js";

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`process.env.PORT ${process.env.PORT}`);
  console.log(`API running on port ${PORT}`);
});
