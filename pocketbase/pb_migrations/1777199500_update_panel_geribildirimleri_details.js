/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("panel_geribildirimleri");

  collection.fields.addAt(3, new Field({
    "autogeneratePattern": "",
    "hidden": false,
    "id": "text719950001",
    "max": 0,
    "min": 0,
    "name": "adSoyad",
    "pattern": "",
    "presentable": false,
    "primaryKey": false,
    "required": false,
    "system": false,
    "type": "text"
  }));

  collection.fields.addAt(4, new Field({
    "exceptDomains": null,
    "hidden": false,
    "id": "email71995002",
    "name": "kullaniciEmail",
    "onlyDomains": null,
    "presentable": false,
    "required": false,
    "system": false,
    "type": "email"
  }));

  collection.fields.addAt(6, new Field({
    "autogeneratePattern": "",
    "hidden": false,
    "id": "text719950003",
    "max": 0,
    "min": 0,
    "name": "sayfaUrl",
    "pattern": "",
    "presentable": false,
    "primaryKey": false,
    "required": false,
    "system": false,
    "type": "text"
  }));

  collection.fields.addAt(7, new Field({
    "autogeneratePattern": "",
    "hidden": false,
    "id": "text719950004",
    "max": 0,
    "min": 0,
    "name": "tarayiciBilgisi",
    "pattern": "",
    "presentable": false,
    "primaryKey": false,
    "required": false,
    "system": false,
    "type": "text"
  }));

  collection.fields.addAt(8, new Field({
    "autogeneratePattern": "",
    "hidden": false,
    "id": "text719950005",
    "max": 0,
    "min": 0,
    "name": "gorselUrl",
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
    "id": "text719950006",
    "max": 0,
    "min": 0,
    "name": "gorselDeleteUrl",
    "pattern": "",
    "presentable": false,
    "primaryKey": false,
    "required": false,
    "system": false,
    "type": "text"
  }));

  return app.save(collection);
}, (app) => {
  const collection = app.findCollectionByNameOrId("panel_geribildirimleri");
  collection.fields.removeById("text719950001");
  collection.fields.removeById("email71995002");
  collection.fields.removeById("text719950003");
  collection.fields.removeById("text719950004");
  collection.fields.removeById("text719950005");
  collection.fields.removeById("text719950006");
  return app.save(collection);
});
