import { CONFIG } from "./app-config.cjs";
import { App } from "./app.cjs";

new App()
    .initialize()
    .then((app) => app.start(CONFIG.Port, 'APP-SERVER: RUNNING\n'));