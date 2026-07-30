
// GoldBean v8.0 Plugin: /api/routes + /debug
// This should be loaded via require in the startup section

const ROUTES_API_TOKEN = process.env.ROUTES_API_TOKEN || "";
const ENABLE_ROUTES_API = process.env.ENABLE_ROUTES_API === "true" || (process.env.NODE_ENV || "development") !== "production";
const ENABLE_DEBUG_PAGE = process.env.ENABLE_DEBUG_PAGE === "true" || (process.env.NODE_ENV || "development") !== "production";

function getAllRoutes() {
  const allRoutes = [];
  function extractRoutes(stack, prefix) {
    if (!stack) return;
    prefix = prefix || "";
    stack.forEach(layer => {
      if (layer.route) {
        const m = Object.keys(layer.route.methods).map(x => x.toUpperCase()).join(",");
        allRoutes.push({method:m,path:prefix+layer.route.path,type:prefix.startsWith("/paid")?"paid":(prefix.startsWith("/api")?"public":"system")});
      } else if (layer.name==="router" && layer.handle && layer.handle.stack) {
        const re = layer.regexp.toString();
        const mm = re.match(/\\^\\\\\/([^\\\\/?#]+)/);
        let mp = prefix;
        if (mm) mp = "/" + mm[1].replace(/\\\\\//g,"/");
        extractRoutes(layer.handle.stack, mp.replace(/\/$/,""));
      } else if (layer.handle && layer.handle.stack) extractRoutes(layer.handle.stack, prefix);
    });
  }
  try {
    const a = require("express")._app || global.__app;
    if (a && a._router && a._router.stack) extractRoutes(a._router.stack);
  } catch(e){}
  return {timestamp:Date.now(),environment:process.env.NODE_ENV||"development",total:allRoutes.length,groups:{system:allRoutes.filter(r=>r.type==="system"),public:allRoutes.filter(r=>r.type==="public"),paid:allRoutes.filter(r=>r.type==="paid")}};
}

module.exports = { getAllRoutes };
