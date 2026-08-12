/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("pbc_1347686609")

  // add field
  collection.fields.addAt(9, new Field({
    "help": "",
    "hidden": false,
    "id": "date1685778265",
    "max": "",
    "min": "",
    "name": "lastKeywordSyncAt",
    "presentable": false,
    "required": false,
    "system": false,
    "type": "date"
  }))

  // add field
  collection.fields.addAt(10, new Field({
    "autogeneratePattern": "",
    "help": "",
    "hidden": false,
    "id": "text3010047851",
    "max": 0,
    "min": 0,
    "name": "lastKeywordSyncMessage",
    "pattern": "",
    "presentable": false,
    "primaryKey": false,
    "required": false,
    "system": false,
    "type": "text"
  }))

  return app.save(collection)
}, (app) => {
  const collection = app.findCollectionByNameOrId("pbc_1347686609")

  // remove field
  collection.fields.removeById("date1685778265")

  // remove field
  collection.fields.removeById("text3010047851")

  return app.save(collection)
})
