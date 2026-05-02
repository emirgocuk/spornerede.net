/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("panel_geribildirimleri");
  return app.save(collection);
}, (app) => {
  const collection = app.findCollectionByNameOrId("panel_geribildirimleri");
  return app.save(collection);
});
