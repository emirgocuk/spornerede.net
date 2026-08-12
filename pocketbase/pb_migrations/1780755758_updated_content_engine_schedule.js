/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("pbc_1347686609")

  // add field
  collection.fields.addAt(11, new Field({
    "help": "",
    "hidden": false,
    "id": "date1254605962",
    "max": "",
    "min": "",
    "name": "lastNewsRewriteAt",
    "presentable": false,
    "required": false,
    "system": false,
    "type": "date"
  }))

  // add field
  collection.fields.addAt(12, new Field({
    "autogeneratePattern": "",
    "help": "",
    "hidden": false,
    "id": "text3431917234",
    "max": 0,
    "min": 0,
    "name": "lastNewsRewriteMessage",
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
  collection.fields.removeById("date1254605962")

  // remove field
  collection.fields.removeById("text3431917234")

  return app.save(collection)
})
