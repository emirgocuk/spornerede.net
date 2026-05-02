/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("pbc_959969506");
  const slugIndex = "CREATE INDEX `idx_haberler_slug` ON `haberler` (`slug`)";
  collection.indexes = Array.from(new Set([...(collection.indexes || []), slugIndex]));

  return app.save(collection);
}, (app) => {
  const collection = app.findCollectionByNameOrId("pbc_959969506");
  collection.indexes = (collection.indexes || []).filter((index) => !index.includes("idx_haberler_slug"));

  return app.save(collection);
});
