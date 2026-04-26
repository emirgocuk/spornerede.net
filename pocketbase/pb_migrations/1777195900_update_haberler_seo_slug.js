/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("pbc_959969506");

  collection.fields.addAt(8, new Field({
    "autogeneratePattern": "",
    "hidden": false,
    "id": "text3984021001",
    "max": 0,
    "min": 0,
    "name": "slug",
    "pattern": "",
    "presentable": false,
    "primaryKey": false,
    "required": false,
    "system": false,
    "type": "text"
  }));

  collection.fields.addAt(9, new Field({
    "autogeneratePattern": "",
    "hidden": false,
    "id": "text1532458750",
    "max": 0,
    "min": 0,
    "name": "seoTitle",
    "pattern": "",
    "presentable": false,
    "primaryKey": false,
    "required": false,
    "system": false,
    "type": "text"
  }));

  collection.fields.addAt(10, new Field({
    "autogeneratePattern": "",
    "hidden": false,
    "id": "text2550052212",
    "max": 0,
    "min": 0,
    "name": "seoDescription",
    "pattern": "",
    "presentable": false,
    "primaryKey": false,
    "required": false,
    "system": false,
    "type": "text"
  }));

  collection.indexes = [
    "CREATE UNIQUE INDEX `idx_haberler_slug` ON `haberler` (`slug`)"
  ];

  return app.save(collection);
}, (app) => {
  const collection = app.findCollectionByNameOrId("pbc_959969506");

  collection.fields.removeById("text3984021001");
  collection.fields.removeById("text1532458750");
  collection.fields.removeById("text2550052212");
  collection.indexes = [];

  return app.save(collection);
});
