import { App } from "@/app";
import { env } from "@/env";

const PORT = env.PORT || 3000;

const app = new App().app;
app.listen(PORT, () => {
  console.log(`Server started on  http://localhost:${PORT}`);
});
