import "./style.css";
import { isDemo } from "./api.js";
import { $ } from "./util.js";

if (isDemo) $("#demo").classList.remove("hidden");

const params = new URLSearchParams(location.search);
if (params.has("admin") || location.hash === "#admin") {
  import("./admin.js").then((m) => m.initAdmin());
} else {
  import("./worker.js").then((m) => m.initWorker());
}
